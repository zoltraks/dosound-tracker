/**
 * YM2149 AudioWorklet Processor
 * 
 * This processor runs on the audio thread, completely isolated from the main thread.
 * It handles:
 * - YM2149 sound chip emulation (3 square wave channels + noise)
 * - Sequencer timing (sample-accurate, no jitter from main thread)
 * - Envelope processing
 */

// YM2149 constants
const YM_CLOCK = 2000000; // 2 MHz clock frequency

// AY/YM style logarithmic volume table (16 levels)
const YM_LOG_VOLUME_TABLE = [
  0.0,    // 0: silence
  0.0078, // 1
  0.0110, // 2
  0.0157, // 3
  0.0221, // 4
  0.0313, // 5
  0.0442, // 6
  0.0625, // 7
  0.0884, // 8
  0.1250, // 9
  0.1768, // 10
  0.2500, // 11
  0.3536, // 12
  0.5000, // 13
  0.7071, // 14
  1.0000  // 15: max
];

// Note frequencies (A4 = 440Hz standard tuning)
const NOTE_FREQUENCIES = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88
};
const NOTE_BASE_OCTAVE = 4;

class YM2149Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // YM2149 registers (0-15)
    this.registers = new Array(16).fill(0);
    
    // Initialize with default values (matching original YM2149 setup)
    this.registers[8] = 0x0F;  // Channel A volume max
    this.registers[9] = 0x0F;  // Channel B volume max
    this.registers[10] = 0x0F; // Channel C volume max
    this.registers[7] = 0x38;  // Tone enabled for all channels, noise disabled
    
    // Channel oscillator state
    this.channelPhase = [0, 0, 0];
    this.channelOutput = [0, 0, 0];
    
    // Noise generator state (17-bit LFSR)
    this.noiseLfsr = 0x1FFFF;
    this.noisePhase = 0;
    this.noiseOutput = 0;
    
    // Sequencer state
    this.isPlaying = false;
    this.isPatternLoop = false;
    this.currentPattern = 0;
    this.currentLine = 0;
    this.currentTick = 0;
    this.ticksPerRow = 4; // Default speed 4
    
    // Timing
    this.samplesPerTick = Math.floor(sampleRate / 50); // 50Hz VBLANK
    this.sampleCounter = 0;
    this.lastReportedLine = -1;
    this.lastReportedPattern = -1;
    
    // Song data
    this.song = null;
    this.instrumentsById = new Map();
    
    // Channel playback state
    this.channelStates = [
      this.createEmptyChannelState(),
      this.createEmptyChannelState(),
      this.createEmptyChannelState()
    ];
    
    // Channel mutes
    this.channelMutes = [false, false, false];
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  createEmptyChannelState() {
    return {
      note: null,
      octave: 0,
      instrumentId: null,
      envelopeStep: 0,
      subTick: 0,
      sustainIndex: null,
      released: false,
      lastNote: null,
      currentVolume: 0x0F,
      currentToneEnabled: true,
      currentNoiseEnabled: false,
      currentNoisePeriod: 0
    };
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'start': {
        const data = message.data || {};
        this.currentPattern = data.pattern ?? 0;
        this.currentLine = data.line ?? 0;
        this.currentTick = 0;
        this.isPatternLoop = data.patternLoop ?? false;
        this.isPlaying = true;
        this.sampleCounter = 0;
        this.lastReportedLine = -1;
        this.lastReportedPattern = -1;
        
        // Reset channel states
        for (let i = 0; i < 3; i++) {
          this.channelStates[i] = this.createEmptyChannelState();
        }
        
        // Process first tick immediately
        this.processTick();
        break;
      }
      
      case 'stop':
        this.isPlaying = false;
        this.silenceAll();
        this.port.postMessage({
          type: 'stopped',
          data: {
            currentPattern: this.currentPattern,
            currentLine: this.currentLine
          }
        });
        break;
        
      case 'setPosition': {
        const data = message.data;
        this.currentPattern = data.pattern;
        this.currentLine = data.line;
        this.currentTick = data.tick ?? 0;
        break;
      }
      
      case 'setSong': {
        const data = message.data;
        this.song = data;
        this.ticksPerRow = data.speed || 4;
        
        // Build instrument lookup
        this.instrumentsById.clear();
        for (const inst of data.instruments) {
          this.instrumentsById.set(inst.id.toUpperCase(), inst);
        }
        break;
      }
      
      case 'writeRegister': {
        const data = message.data;
        this.writeRegister(data.register, data.value);
        break;
      }
      
      case 'setMutes': {
        this.channelMutes = message.data;
        break;
      }
    }
  }
  
  writeRegister(register, value) {
    if (register < 0 || register >= 16) return;
    this.registers[register] = value & 0xFF;
  }
  
  silenceAll() {
    this.registers[8] = 0;
    this.registers[9] = 0;
    this.registers[10] = 0;
  }
  
  processTick() {
    if (!this.song) return;
    
    const playlist = this.song.playlist;
    if (playlist.length === 0) return;
    
    // Bounds check
    if (this.currentPattern >= playlist.length) {
      if (typeof this.song.loop === 'number') {
        this.currentPattern = Math.max(0, Math.min(this.song.loop, playlist.length - 1));
        this.currentLine = 0;
        this.currentTick = 0;
      } else {
        this.isPlaying = false;
        this.silenceAll();
        return;
      }
    }
    
    const entry = playlist[this.currentPattern];
    const patterns = [
      this.song.patterns.find(p => p.id === entry.trackA),
      this.song.patterns.find(p => p.id === entry.trackB),
      this.song.patterns.find(p => p.id === entry.trackC)
    ];
    
    // Process each channel
    for (let ch = 0; ch < 3; ch++) {
      if (this.channelMutes[ch]) {
        this.registers[8 + ch] = 0;
        continue;
      }
      
      const pattern = patterns[ch];
      const state = this.channelStates[ch];
      
      if (!pattern) continue;
      
      const line = pattern.lines[this.currentLine];
      if (!line) continue;
      
      const noteOnRow = line.trackA;
      
      // Handle note-off
      if (this.currentTick === 0 && noteOnRow && noteOnRow.note === '===') {
        state.released = true;
        state.envelopeStep = 0;
        state.subTick = 0;
      }
      
      // Handle new note
      if (this.currentTick === 0 && noteOnRow && noteOnRow.note !== '===' && noteOnRow.note) {
        state.note = noteOnRow.note;
        state.octave = noteOnRow.octave;
        state.instrumentId = noteOnRow.instrument;
        state.envelopeStep = 0;
        state.subTick = 0;
        state.released = false;
        state.lastNote = noteOnRow;
        
        const inst = this.instrumentsById.get((noteOnRow.instrument || '').toUpperCase());
        if (inst) {
          const volEnv = inst.volumeEnvelope || [];
          state.sustainIndex = volEnv.indexOf(0x80);
          if (state.sustainIndex === -1) state.sustainIndex = null;
        }
      }
      
      // Process envelope
      this.processChannelEnvelope(ch);
    }
    
    // Report position to main thread (only on line changes)
    if (this.currentLine !== this.lastReportedLine || 
        this.currentPattern !== this.lastReportedPattern) {
      this.lastReportedLine = this.currentLine;
      this.lastReportedPattern = this.currentPattern;
      this.port.postMessage({
        type: 'position',
        data: {
          currentPattern: this.currentPattern,
          currentLine: this.currentLine,
          currentTick: this.currentTick,
          isPlaying: this.isPlaying
        }
      });
    }
  }
  
  processChannelEnvelope(ch) {
    const state = this.channelStates[ch];
    if (!state.instrumentId) {
      // Ensure default values when no instrument
      state.currentVolume = 0x0F;
      state.currentToneEnabled = true;
      state.currentNoiseEnabled = false;
      return;
    }
    
    const inst = this.instrumentsById.get(state.instrumentId.toUpperCase());
    if (!inst) return;
    
    const volEnv = inst.volumeEnvelope || [];
    const arpEnv = inst.arpeggioEnvelope || [];
    const pitchEnv = inst.pitchEnvelope || [];
    const noiseEnv = inst.noiseEnvelope || [];
    const modeEnv = inst.modeEnvelope || [];
    
    let step = state.envelopeStep;
    
    // Handle sustain
    if (state.sustainIndex !== null && step >= state.sustainIndex && !state.released) {
      step = state.sustainIndex;
    }
    
    // Get envelope values
    let volume = 0;
    if (step < volEnv.length) {
      const v = volEnv[step];
      volume = (v === 0x80) ? (volEnv[step - 1] ?? 0x0F) : (v & 0x0F);
    }
    
    let arpOffset = 0;
    if (step < arpEnv.length) {
      const a = arpEnv[step];
      arpOffset = (a === 0x80) ? 0 : (a > 127 ? a - 256 : a);
    }
    
    let pitchOffset = 0;
    if (step < pitchEnv.length) {
      const p = pitchEnv[step];
      pitchOffset = (p === 0x80) ? 0 : (p > 127 ? p - 256 : p);
    }
    
    let noisePeriod = 0;
    if (step < noiseEnv.length) {
      const n = noiseEnv[step];
      noisePeriod = (n === 0x80) ? 0 : (n & 0x1F);
    }
    
    let mode = 0;
    if (step < modeEnv.length) {
      const m = modeEnv[step];
      mode = (m === 0x80) ? 0 : (m & 0x03);
    }
    
    // Calculate frequency
    if (state.note && state.note !== '===') {
      const baseFreq = NOTE_FREQUENCIES[state.note] || 440;
      const octaveShift = state.octave - NOTE_BASE_OCTAVE;
      let freq = baseFreq * Math.pow(2, octaveShift);
      
      if (arpOffset !== 0) {
        freq *= Math.pow(2, arpOffset / 12);
      }
      
      freq += pitchOffset;
      
      const period = Math.round(YM_CLOCK / (16 * freq));
      const clampedPeriod = Math.max(1, Math.min(4095, period));
      
      const toneRegLow = ch * 2;
      const toneRegHigh = ch * 2 + 1;
      this.registers[toneRegLow] = clampedPeriod & 0xFF;
      this.registers[toneRegHigh] = (clampedPeriod >> 8) & 0x0F;
    }
    
    // Store envelope values in channel state instead of registers
    // This avoids race conditions with audio generation
    state.currentVolume = volume & 0x0F;
    state.currentToneEnabled = !(mode & 0x01);
    state.currentNoiseEnabled = !(mode & 0x02);
    
    if (noisePeriod > 0) {
      state.currentNoisePeriod = noisePeriod & 0x1F;
    }
    
    state.subTick++;
    if (state.subTick >= 1) {
      state.subTick = 0;
      state.envelopeStep++;
    }
  }
  
  advanceSequencer() {
    this.currentTick++;
    
    if (this.currentTick >= this.ticksPerRow) {
      this.currentTick = 0;
      this.currentLine++;
      
      if (this.currentLine >= (this.song?.patternLength || 64)) {
        this.currentLine = 0;
        
        if (!this.isPatternLoop) {
          this.currentPattern++;
          
          if (this.song && this.currentPattern >= this.song.playlist.length) {
            if (typeof this.song.loop === 'number') {
              this.currentPattern = Math.max(0, Math.min(this.song.loop, this.song.playlist.length - 1));
            } else {
              this.isPlaying = false;
              this.silenceAll();
              this.port.postMessage({ type: 'stopped', data: {} });
              return;
            }
          }
        }
      }
    }
    
    this.processTick();
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;
    
    const leftChannel = output[0];
    const rightChannel = output[1] || leftChannel;
    
    for (let i = 0; i < leftChannel.length; i++) {
      // Advance sequencer timing
      if (this.isPlaying) {
        this.sampleCounter++;
        if (this.sampleCounter >= this.samplesPerTick) {
          this.sampleCounter = 0;
          this.advanceSequencer();
        }
      }
      
      // Generate audio
      let sample = 0;
      
      // Update noise generator first (needed for channels that use noise)
      const noisePeriod = (this.registers[6] & 0x1F) || 1;
      const noiseFreq = YM_CLOCK / (16 * noisePeriod);
      const noisePhaseInc = noiseFreq / sampleRate;
      
      this.noisePhase += noisePhaseInc;
      if (this.noisePhase >= 1) {
        this.noisePhase -= Math.floor(this.noisePhase);
        const bit0 = this.noiseLfsr & 1;
        const bit3 = (this.noiseLfsr >> 3) & 1;
        const newBit = bit0 ^ bit3;
        this.noiseLfsr = ((this.noiseLfsr >> 1) | (newBit << 16)) & 0x1FFFF;
        this.noiseOutput = (this.noiseLfsr & 1) ? 1 : -1;
      }
      
      // Process each tone channel
      for (let ch = 0; ch < 3; ch++) {
        const periodLow = this.registers[ch * 2];
        const periodHigh = this.registers[ch * 2 + 1] & 0x0F;
        const period = (periodHigh << 8) | periodLow;
        
        // Get envelope values from channel state (or registers for direct writes)
        const state = this.channelStates[ch];
        const volume = state.currentVolume ?? (this.registers[8 + ch] & 0x0F);
        const toneEnabled = state.currentToneEnabled ?? !((this.registers[7] >> ch) & 1);
        const noiseEnabled = state.currentNoiseEnabled ?? !((this.registers[7] >> (ch + 3)) & 1);
        
        if (period > 0 && volume > 0) {
          const freq = YM_CLOCK / (16 * period);
          const phaseInc = freq / sampleRate;
          
          this.channelPhase[ch] += phaseInc;
          if (this.channelPhase[ch] >= 1) {
            this.channelPhase[ch] -= 1;
            this.channelOutput[ch] = this.channelOutput[ch] ? 0 : 1;
          }
          
          let channelSample = 0;
          
          // Mix tone and noise properly (not averaging)
          if (toneEnabled) {
            channelSample += this.channelOutput[ch] ? 1 : -1;
          }
          
          if (noiseEnabled) {
            channelSample += this.noiseOutput;
          }
          
          // Apply volume scaling per channel (matching original YM2149)
          sample += (channelSample * YM_LOG_VOLUME_TABLE[volume] * 0.3);
        }
      }
      
      // Output the mixed sample (no additional scaling since we already scaled per channel)
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }
    
    return true;
  }
}

registerProcessor('ym2149-processor', YM2149Processor);
