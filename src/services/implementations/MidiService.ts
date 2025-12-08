import type { IMidiService } from '../interfaces/IMidiService';

export class MidiService implements IMidiService {
  sendNoteOn(channel: number, noteNumber: number, velocity: number): void {
    void channel;
    void noteNumber;
    void velocity;
  }

  sendNoteOff(channel: number, noteNumber: number, velocity?: number): void {
    void channel;
    void noteNumber;
    void velocity;
  }

  sendProgramChange(channel: number, program: number): void {
    void channel;
    void program;
  }

  sendSystemReset(): void {}
}
