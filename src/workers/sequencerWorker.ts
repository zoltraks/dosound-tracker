// Web Worker for precise sequencer timing
let intervalId: number | null = null;
let tickInterval = 20; // 50Hz = 20ms
let isPlaying = false;
let isPatternLoop = false;
let currentTick = 0;
let currentLine = 0;
let currentPattern = 0;
let ticksPerRow = 3;
let patternLength = 64;
let lastTickTime = 0;
let nextTickTime = 0;

interface WorkerMessage {
  type: 'start' | 'stop' | 'update' | 'tick' | 'setParams';
  data?: any;
};

function scheduleTick() {
  if (!isPlaying) return;

  let newTick = currentTick + 1;
  let newLine = currentLine;
  let newPattern = currentPattern;

  // Check if we need to advance to next line
  if (newTick >= ticksPerRow) {
    newTick = 0;
    newLine++;

    if (newLine >= patternLength) {
      newLine = 0;
      // In song mode, advance to the next playlist position when the pattern wraps.
      // In pattern-loop mode, stay on the same playlist position and just wrap rows.
      if (!isPatternLoop) {
        newPattern++;
      }
    }
  }

  currentTick = newTick;
  currentLine = newLine;
  currentPattern = newPattern;

  // Send tick message to main thread
  self.postMessage({
    type: 'tick',
    data: {
      isPlaying: true,
      currentPattern,
      currentLine,
      currentTick
    }
  } as WorkerMessage);
}

function tickLoop() {
  if (!isPlaying) {
    return;
  }

  const now = performance.now();

  if (!lastTickTime) {
    lastTickTime = now;
    nextTickTime = now + tickInterval;
  }

  // Catch up on any ticks that were missed due to timer jitter or clamping
  while (isPlaying && now >= nextTickTime) {
    scheduleTick();
    nextTickTime += tickInterval;
  }

  const delay = Math.max(0, nextTickTime - performance.now());
  intervalId = setTimeout(tickLoop, delay) as any;
}

function startSequencer() {
  if (intervalId !== null) {
    clearTimeout(intervalId);
  }
  
  isPlaying = true;
  lastTickTime = 0;
  nextTickTime = 0;
  intervalId = setTimeout(tickLoop, tickInterval) as any;
}

function stopSequencer() {
  isPlaying = false;
  isPatternLoop = false;
  if (intervalId !== null) {
    clearTimeout(intervalId);
    intervalId = null;
  }
  lastTickTime = 0;
  nextTickTime = 0;
  
  // Reset position
  currentTick = 0;
  currentLine = 0;
  currentPattern = 0;
  
  self.postMessage({
    type: 'stop',
    data: {
      isPlaying: false,
      currentPattern: 0,
      currentLine: 0,
      currentTick: 0
    }
  } as WorkerMessage);
}

function updatePosition(pattern: number, line: number, tick: number) {
  currentPattern = pattern;
  currentLine = line;
  currentTick = tick;
  
  self.postMessage({
    type: 'update',
    data: {
      isPlaying,
      currentPattern,
      currentLine,
      currentTick
    }
  } as WorkerMessage);
}

function setParams(params: { ticksPerRow?: number; patternLength?: number; tickInterval?: number }) {
  if (params.ticksPerRow !== undefined) {
    ticksPerRow = params.ticksPerRow;
  }
  if (params.patternLength !== undefined) {
    patternLength = params.patternLength;
  }
  if (params.tickInterval !== undefined) {
    tickInterval = params.tickInterval;
    // Restart sequencer with new interval if playing
    if (isPlaying) {
      stopSequencer();
      startSequencer();
    }
  }
}

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'start':
      if (data) {
        currentPattern = data.pattern || 0;
        currentLine = data.line || 0;
        currentTick = data.tick || 0;
        isPatternLoop = !!(data as any).patternLoop;
      }
      startSequencer();
      break;
      
    case 'stop':
      stopSequencer();
      break;
      
    case 'update':
      if (data) {
        updatePosition(data.pattern, data.line, data.tick);
      }
      break;
      
    case 'setParams':
      if (data) {
        setParams(data);
      }
      break;
  }
});
