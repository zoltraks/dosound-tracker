/**
 * YM2149Worklet - Main thread wrapper for the YM2149 AudioWorklet
 * 
 * This class provides the same interface as the original YM2149 class
 * but delegates all audio processing to an AudioWorklet running on
 * a separate thread.
 */

import type { Instrument } from './SoundDriver';

export interface YMChannel {
  tonePeriod: number;
  toneEnabled: boolean;
  noiseEnabled: boolean;
  volume: number;
  envelopeEnabled: boolean;
}

export interface YMRegisters {
  [key: number]: number;
}

export interface YMState {
  channels: YMChannel[];
  noisePeriod: number;
  envelopeShape: number;
  envelopeEnabled: boolean;
}

interface Note {
  note: string;
  octave: number;
  instrument: string;
}

interface PatternLine {
  trackA: Note | null;
  trackB: Note | null;
  trackC: Note | null;
  volume?: number;
}

interface Pattern {
  id: string;
  lines: PatternLine[];
}

interface PlaylistEntry {
  trackA: string;
  trackB: string;
  trackC: string;
}

interface SongData {
  patterns: Pattern[];
  playlist: PlaylistEntry[];
  instruments: Instrument[];
  speed: number;
  patternLength: number;
  loop?: number;
}

export type PositionCallback = (data: {
  currentPattern: number;
  currentLine: number;
  currentTick: number;
  isPlaying: boolean;
}) => void;

export type StopCallback = (data: {
  currentPattern: number;
  currentLine: number;
}) => void;

export class YM2149Worklet {
  private audioContext: AudioContext;
  private workletNode: AudioWorkletNode | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  
  // Local register cache for getRegisters()
  private registers: number[] = new Array(16).fill(0);
  
  // Callbacks
  private onPosition: PositionCallback | null = null;
  private onStop: StopCallback | null = null;
  
  // Current state for compatibility
  private state: YMState = {
    channels: [
      { tonePeriod: 0, toneEnabled: true, noiseEnabled: false, volume: 0, envelopeEnabled: false },
      { tonePeriod: 0, toneEnabled: true, noiseEnabled: false, volume: 0, envelopeEnabled: false },
      { tonePeriod: 0, toneEnabled: true, noiseEnabled: false, volume: 0, envelopeEnabled: false }
    ],
    noisePeriod: 0,
    envelopeShape: 0,
    envelopeEnabled: false
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.initPromise = this.initialize();
  }
  
  private async initialize(): Promise<void> {
    try {
      // Load the AudioWorklet module from public folder
      await this.audioContext.audioWorklet.addModule('/js/ym2149-processor.js');
      
      // Create the worklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'ym2149-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
      
      // Connect to destination
      this.workletNode.connect(this.audioContext.destination);
      
      // Listen for messages from the processor
      this.workletNode.port.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      this.isInitialized = true;
      console.log('YM2149 AudioWorklet initialized');
    } catch (error) {
      console.error('Failed to initialize YM2149 AudioWorklet:', error);
      throw error;
    }
  }
  
  private handleMessage(message: { type: string; data?: unknown }): void {
    switch (message.type) {
      case 'position':
        if (this.onPosition) {
          this.onPosition(message.data as {
            currentPattern: number;
            currentLine: number;
            currentTick: number;
            isPlaying: boolean;
          });
        }
        break;
        
      case 'stopped':
        if (this.onStop) {
          this.onStop(message.data as {
            currentPattern: number;
            currentLine: number;
          });
        }
        break;
    }
  }
  
  async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }
  
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Set callbacks for position updates and stop events
  setPositionCallback(callback: PositionCallback): void {
    this.onPosition = callback;
  }
  
  setStopCallback(callback: StopCallback): void {
    this.onStop = callback;
  }
  
  // Send song data to the worklet
  setSong(song: SongData): void {
    if (!this.workletNode) return;
    
    this.workletNode.port.postMessage({
      type: 'setSong',
      data: song
    });
  }
  
  // Start playback
  start(options?: { pattern?: number; line?: number; patternLoop?: boolean }): void {
    if (!this.workletNode) return;
    
    this.workletNode.port.postMessage({
      type: 'start',
      data: options || {}
    });
  }
  
  // Stop playback
  stop(): void {
    if (!this.workletNode) return;
    
    this.workletNode.port.postMessage({
      type: 'stop'
    });
  }
  
  // Set position
  setPosition(pattern: number, line: number, tick?: number): void {
    if (!this.workletNode) return;
    
    this.workletNode.port.postMessage({
      type: 'setPosition',
      data: { pattern, line, tick: tick ?? 0 }
    });
  }
  
  // Set channel mutes
  setMutes(mutes: boolean[]): void {
    if (!this.workletNode) return;
    
    this.workletNode.port.postMessage({
      type: 'setMutes',
      data: mutes
    });
  }
  
  // Write a register value (for preview notes, etc.)
  writeRegister(register: number, value: number): void {
    if (register < 0 || register >= 16) return;
    
    const masked = value & 0xFF;
    this.registers[register] = masked;
    this.updateState();
    
    if (!this.workletNode) return;
    
    this.workletNode.port.postMessage({
      type: 'writeRegister',
      data: { register, value: masked }
    });
  }
  
  private updateState(): void {
    // Update local state cache (for getState() compatibility)
    this.state.channels[0].tonePeriod = (this.registers[1] & 0x0F) << 8 | this.registers[0];
    this.state.channels[0].toneEnabled = !(this.registers[7] & 0x01);
    this.state.channels[0].noiseEnabled = !(this.registers[7] & 0x08);
    this.state.channels[0].volume = this.registers[8] & 0x0F;
    this.state.channels[0].envelopeEnabled = !!(this.registers[8] & 0x10);

    this.state.channels[1].tonePeriod = (this.registers[3] & 0x0F) << 8 | this.registers[2];
    this.state.channels[1].toneEnabled = !(this.registers[7] & 0x02);
    this.state.channels[1].noiseEnabled = !(this.registers[7] & 0x10);
    this.state.channels[1].volume = this.registers[9] & 0x0F;
    this.state.channels[1].envelopeEnabled = !!(this.registers[9] & 0x10);

    this.state.channels[2].tonePeriod = (this.registers[5] & 0x0F) << 8 | this.registers[4];
    this.state.channels[2].toneEnabled = !(this.registers[7] & 0x04);
    this.state.channels[2].noiseEnabled = !(this.registers[7] & 0x20);
    this.state.channels[2].volume = this.registers[10] & 0x0F;
    this.state.channels[2].envelopeEnabled = !!(this.registers[10] & 0x10);

    this.state.noisePeriod = this.registers[6] & 0x1F;
    this.state.envelopeShape = this.registers[13] & 0x0F;
    this.state.envelopeEnabled = !!(this.registers[13] & 0x10);
  }
  
  getRegisters(): YMRegisters {
    return { ...this.registers };
  }
  
  getRegistersArray(): number[] {
    return [...this.registers];
  }
  
  getState(): YMState {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  reset(): void {
    for (let i = 0; i < 16; i++) {
      this.registers[i] = 0;
    }
    this.updateState();
    this.silenceAll();
  }
  
  silenceAll(): void {
    this.writeRegister(8, 0);
    this.writeRegister(9, 0);
    this.writeRegister(10, 0);
  }
  
  dispose(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    this.isInitialized = false;
  }
}
