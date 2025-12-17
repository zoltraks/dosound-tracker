import { useState, useCallback } from 'react';
import { ENVELOPE_LENGTH, VOLUME_MAX, NOISE_MAX, SHIFT_MIN, SHIFT_MAX, PITCH_MIN, PITCH_MAX } from '../constants/music';

export interface EnvelopeValueHandlingOptions {
  type: 'volume' | 'shift' | 'pitch' | 'noise' | 'mode';
  data?: number[];
  onChange?: (data: number[]) => void;
}

export interface EnvelopeValueHandlingActions {
  envelopeData: number[];
  currentPosition: number;
  setCurrentPosition: (position: number) => void;
  handleValueChange: (delta: number) => void;
  clampEnvelopeValue: (value: number) => number;
  formatValue: (value: number) => string;
  getBarHeight: (value: number) => number;
  getCenteredBarPosition: (value: number) => number;
  getFullEnvelope: (input: number[]) => number[];
  updateData: (newData: number[]) => void;
}

export const useEnvelopeValueHandling = (options: EnvelopeValueHandlingOptions): EnvelopeValueHandlingActions => {
  const { type, data, onChange } = options;
  
  const [currentPosition, setCurrentPosition] = useState(0);
  const [envelopeData, setEnvelopeData] = useState<number[]>(
    data || Array(ENVELOPE_LENGTH).fill(0)
  );

  const clampEnvelopeValue = useCallback((value: number) => {
    switch (type) {
      case 'volume':
        return Math.max(0, Math.min(VOLUME_MAX, value));
      case 'noise':
        return Math.max(0, Math.min(NOISE_MAX, value));
      case 'shift':
        return Math.max(SHIFT_MIN, Math.min(SHIFT_MAX, value));
      case 'pitch':
        return Math.max(PITCH_MIN, Math.min(PITCH_MAX, value));
      case 'mode':
        return Math.max(0, Math.min(2, value));
      default:
        return value;
    }
  }, [type]);

  const handleValueChange = useCallback((delta: number) => {
    if (!onChange) return;

    const newData = [...envelopeData];
    const currentValue = newData[currentPosition];
    let newValue = currentValue;

    switch (type) {
      case 'volume':
        newValue = Math.max(0, Math.min(VOLUME_MAX, currentValue + delta));
        break;
      case 'noise':
        newValue = Math.max(0, Math.min(NOISE_MAX, currentValue + delta));
        break;
      case 'shift':
        newValue = Math.max(SHIFT_MIN, Math.min(SHIFT_MAX, currentValue + delta));
        break;
      case 'pitch':
        newValue = Math.max(PITCH_MIN, Math.min(PITCH_MAX, currentValue + delta));
        break;
      case 'mode':
        // Clamp between 0 (tone), 1 (noise) and 2 (tone+noise)
        newValue = Math.max(0, Math.min(2, currentValue + delta));
        break;
    }

    newData[currentPosition] = newValue;
    setEnvelopeData(newData);
    onChange(newData);
  }, [envelopeData, currentPosition, type, onChange]);

  const getFullEnvelope = useCallback((input: number[]) => {
    const trimmed = input.slice(0, ENVELOPE_LENGTH);
    if (trimmed.length === 0) {
      return Array(ENVELOPE_LENGTH).fill(0);
    }
    const last = trimmed[trimmed.length - 1];
    while (trimmed.length < ENVELOPE_LENGTH) {
      trimmed.push(last);
    }
    return trimmed;
  }, []);

  const formatValue = useCallback((value: number) => {
    switch (type) {
      case 'volume':
        return value.toString(16).toUpperCase();
      case 'noise':
        return value.toString(16).toUpperCase();
      case 'shift':
        return value >= 0 ? `+${value}` : value.toString();
      case 'pitch':
        return value >= 0 ? `+${value}` : value.toString();
      case 'mode':
        if (value === 0) return 'TONE';
        if (value === 1) return 'NOISE';
        return 'BOTH';
      default:
        return value.toString();
    }
  }, [type]);

  const getBarHeight = useCallback((value: number) => {
    switch (type) {
      case 'volume':
        return (value / VOLUME_MAX) * 100;
      case 'noise':
        return (value / NOISE_MAX) * 100;
      case 'shift':
        return Math.abs(value) / Math.max(Math.abs(SHIFT_MIN), SHIFT_MAX) * 100;
      case 'pitch':
        return Math.abs(value) / Math.max(Math.abs(PITCH_MIN), PITCH_MAX) * 100;
      case 'mode':
        return value * 100;
      default:
        return 0;
    }
  }, [type]);

  const getCenteredBarPosition = useCallback((value: number) => {
    switch (type) {
      case 'shift':
        // Position: 50% for 0, less for positive (go up), more for negative (go down)
        return 50 - (value / SHIFT_MAX) * 50;
      case 'pitch':
        // Position: 50% for 0, less for positive (go up), more for negative (go down)
        return 50 - (value / PITCH_MAX) * 50;
      default:
        return 50;
    }
  }, [type]);

  const updateData = useCallback((newData: number[]) => {
    setEnvelopeData(newData);
  }, []);

  return {
    envelopeData,
    currentPosition,
    setCurrentPosition,
    handleValueChange,
    clampEnvelopeValue,
    formatValue,
    getBarHeight,
    getCenteredBarPosition,
    getFullEnvelope,
    updateData
  };
};
