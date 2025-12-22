import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger, LogLevel, logger } from '../../src/utils/logger';

describe('Logger', () => {
  let loggerInstance: Logger;

  beforeEach(() => {
    loggerInstance = Logger.getInstance();
    loggerInstance.setLogLevel(LogLevel.DEBUG);
    loggerInstance.setDebugMode(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export the singleton instance', () => {
      expect(logger).toBe(Logger.getInstance());
    });
  });

  describe('log level filtering', () => {
    it('should filter messages based on log level', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      loggerInstance.setLogLevel(LogLevel.ERROR);
      loggerInstance.error('Error message');
      loggerInstance.warn('Warn message');
      loggerInstance.info('Info message');
      loggerInstance.debug('Debug message');

      expect(errorSpy).toHaveBeenCalledWith('[ERROR] Error message');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('should show all messages at DEBUG level', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      loggerInstance.setLogLevel(LogLevel.DEBUG);
      loggerInstance.setDebugMode(true);

      loggerInstance.error('Error message');
      loggerInstance.warn('Warn message');
      loggerInstance.info('Info message');
      loggerInstance.debug('Debug message');

      expect(errorSpy).toHaveBeenCalledWith('[ERROR] Error message');
      expect(warnSpy).toHaveBeenCalledWith('[WARN] Warn message');
      expect(infoSpy).toHaveBeenCalledWith('[INFO] Info message');
      expect(debugSpy).toHaveBeenCalledWith('[DEBUG] Debug message');
    });
  });

  describe('debug mode', () => {
    it('should respect debug mode for debug messages', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      loggerInstance.setDebugMode(false);
      loggerInstance.debug('Should not appear');
      expect(debugSpy).not.toHaveBeenCalled();

      loggerInstance.setDebugMode(true);
      loggerInstance.debug('Should appear');
      expect(debugSpy).toHaveBeenCalledWith('[DEBUG] Should appear');
    });

    it('should set log level to DEBUG when debug mode enabled', () => {
      loggerInstance.setLogLevel(LogLevel.ERROR);
      loggerInstance.setDebugMode(true);
      expect(loggerInstance['level']).toBe(LogLevel.DEBUG);
    });
  });

  describe('message formatting', () => {
    it('should handle multiple arguments', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const obj = { key: 'value' };
      const arr = [1, 2, 3];

      loggerInstance.setLogLevel(LogLevel.ERROR);
      loggerInstance.error('Error with multiple args', obj, arr, 123);

      expect(errorSpy).toHaveBeenCalledWith('[ERROR] Error with multiple args', obj, arr, 123);
    });

    it('should handle empty messages', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      loggerInstance.setLogLevel(LogLevel.INFO);
      loggerInstance.info('');

      expect(infoSpy).toHaveBeenCalledWith('[INFO] ');
    });
  });

  describe('log level methods', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('should call console.error for error method', () => {
      loggerInstance.setLogLevel(LogLevel.ERROR);
      loggerInstance.error('test');
      expect(console.error).toHaveBeenCalledWith('[ERROR] test');
    });

    it('should call console.warn for warn method', () => {
      loggerInstance.setLogLevel(LogLevel.WARN);
      loggerInstance.warn('test');
      expect(console.warn).toHaveBeenCalledWith('[WARN] test');
    });

    it('should call console.info for info method', () => {
      loggerInstance.setLogLevel(LogLevel.INFO);
      loggerInstance.info('test');
      expect(console.info).toHaveBeenCalledWith('[INFO] test');
    });

    it('should call console.debug for debug method when enabled', () => {
      loggerInstance.setLogLevel(LogLevel.DEBUG);
      loggerInstance.setDebugMode(true);
      loggerInstance.debug('test');
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] test');
    });
  });
});
