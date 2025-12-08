export interface IMidiService {
  sendNoteOn(channel: number, noteNumber: number, velocity: number): void;
  sendNoteOff(channel: number, noteNumber: number, velocity?: number): void;
  sendProgramChange(channel: number, program: number): void;
  sendSystemReset(): void;
}
