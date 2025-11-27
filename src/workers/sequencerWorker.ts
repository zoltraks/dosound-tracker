// Web Worker for precise sequencer timing
let intervalId: ReturnType<typeof setTimeout> | null = null;
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

interface WorkerStartMessage {
  type: 'start';
  data?: {
    pattern?: number;
    line?: number;
    tick?: number;
    patternLoop?: boolean;
  };
}

interface WorkerUpdateMessage {
  type: 'update';
  data?: {
    pattern: number;
    line: number;
    tick: number;
  };
}

interface WorkerSetParamsMessage {
  type: 'setParams';
  data?: {
    ticksPerRow?: number;
    patternLength?: number;
    tickInterval?: number;
  };
}

interface WorkerStopMessage {
  type: 'stop';
  data?: unknown;
}

type WorkerIncomingMessage =
  | WorkerStartMessage
  | WorkerUpdateMessage
  | WorkerSetParamsMessage
  | WorkerStopMessage;

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
  });
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
  intervalId = setTimeout(tickLoop, delay);
}

function startSequencer() {
  if (intervalId !== null) {
    clearTimeout(intervalId);
  }
  
  isPlaying = true;
  lastTickTime = 0;
  nextTickTime = 0;
  intervalId = setTimeout(tickLoop, tickInterval);
}

function stopSequencer() {
  if (intervalId !== null) {
    clearTimeout(intervalId);
    intervalId = null;
  }

  isPlaying = false;
  isPatternLoop = false;
  currentTick = 0;

  self.postMessage({
    type: 'stop',
    data: {
      isPlaying: false,
      currentPattern,
      currentLine,
      currentTick,
    },
  });
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
  });
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
self.addEventListener('message', (event: MessageEvent<WorkerIncomingMessage>) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'start':
      if (data) {
        const { pattern, line, tick, patternLoop } = data;
        currentPattern = pattern ?? 0;
        currentLine = line ?? 0;
        currentTick = tick ?? 0;
        isPatternLoop = !!patternLoop;
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
