export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export const LogCategory = {
  AUDIO: 'audio',
  MIDI: 'midi',
  UI: 'ui',
  STORAGE: 'storage',
  EXPORT: 'export',
  SEQUENCER: 'sequencer',
  SYSTEM: 'system',
  DEBUG: 'debug'
} as const;

export type LogCategory = typeof LogCategory[keyof typeof LogCategory];

export interface LogEntry {
  time: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: Record<string, unknown>;
  source?: string;
  duration?: number;
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;
  private debugMode: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      this.level = LogLevel.DEBUG;
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.debugMode && this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = Logger.getInstance();
