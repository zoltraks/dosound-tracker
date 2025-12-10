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
let nextTickTime = 0;
let playlistLength = 0;
let loopIndex = 0;
let hasLoop = false;

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

  // Emit the current position first so that each row begins at
  // tick 0 and then advances through 1..ticksPerRow-1, matching
  // the offline playback and export simulations.
  self.postMessage({
    type: 'tick',
    data: {
      isPlaying: true,
      currentPattern,
      currentLine,
      currentTick
    }
  });

  // Advance to the next tick/row for the following callback.
  let nextTick = currentTick + 1;
  let nextLine = currentLine;
  let nextPattern = currentPattern;

  // Check if we need to advance to the next line
  if (nextTick >= ticksPerRow) {
    nextTick = 0;
    nextLine++;

    if (nextLine >= patternLength) {
      nextLine = 0;
      // In song mode, advance to the next playlist position when the pattern wraps.
      // In pattern-loop mode, stay on the same playlist position and just wrap rows.
      if (!isPatternLoop) {
        if (playlistLength > 0) {
          const lastIndex = playlistLength - 1;
          if (nextPattern >= lastIndex && hasLoop) {
            // Wrap to loop index when we step past the last playlist entry
            // and a valid loop position is defined.
            nextPattern = loopIndex;
          } else {
            nextPattern++;
          }
        } else {
          nextPattern++;
        }
      }
    }
  }

  currentTick = nextTick;
  currentLine = nextLine;
  currentPattern = nextPattern;
}

function tickLoop() {
  if (!isPlaying) {
    return;
  }

  const now = performance.now();

  if (!nextTickTime) {
    nextTickTime = now + tickInterval;
  }

  // Catch up on any ticks that were missed due to timer jitter or clamping
  while (isPlaying && now >= nextTickTime) {
    scheduleTick();
    nextTickTime += tickInterval;
  }

  const delay = Math.max(0, nextTickTime - now);
  intervalId = setTimeout(tickLoop, delay);
}

function startSequencer() {
  if (intervalId !== null) {
    clearTimeout(intervalId);
  }
  
  isPlaying = true;
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
