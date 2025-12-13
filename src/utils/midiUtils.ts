export function formatMidiTime(now: Date = new Date()): string {
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function resolveMidiDeviceName(
  devices: { inputs: Array<{ id: string; name: string }>; outputs: Array<{ id: string; name: string }> },
  id: string | null,
  fallback: string
): string {
  if (!id) return fallback;
  const all = [...devices.inputs, ...devices.outputs];
  const found = all.find((d) => d.id === id);
  return found?.name || fallback;
}

export function bytesToHex(bytes: number[] | Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => (byte | 0).toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

export function formatMidiChannelHex(channel: number): string {
  const safe = Math.max(1, Math.min(16, channel | 0));
  return safe.toString(16).toUpperCase().padStart(2, '0');
}

export function midiNoteNumberToLabel(noteNumber: number): {
  noteName: string;
  octave: number;
  label: string;
} {
  const safeNote = Math.max(0, Math.min(127, noteNumber | 0));
  const octave = Math.floor(safeNote / 12) - 1;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteName = noteNames[safeNote % 12] || 'C';
  const base = noteName.length === 1 ? `${noteName}-` : noteName;
  return {
    noteName,
    octave,
    label: `${base}${octave}`,
  };
}
