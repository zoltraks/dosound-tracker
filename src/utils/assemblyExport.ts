import type { Song } from '../synth/SoundDriver';
import { DosoundDriver } from '../synth/SoundDriver';

/**
 * Converts a song to DOSOUND XBIOS assembly format
 * @param song The song to export
 * @returns Assembly formatted string
 */
export function exportToAssembly(song: Song): string {
  const driver = new DosoundDriver(null as any); // We only need the conversion logic
  const events = driver.convertSongToDosoundEvents(song);
  
  let assembly = '';
  let currentLine = 0;
  let currentPart = 0;
  
  // Add header
  assembly += `; DOSOUND XBIOS Assembly Export\n`;
  assembly += `; Title: ${song.title}\n`;
  assembly += `; Author: ${song.author}\n`;
  assembly += `; Year: ${song.year}\n`;
  assembly += `; Speed: ${song.speed}\n\n`;
  assembly += `music:\n\n`;
  
  // Process events and add section comments
  let eventIndex = 0;
  while (eventIndex < events.length) {
    // Add line comment every 16 events (approximately)
    if (eventIndex % 16 === 0) {
      assembly += `    ; === LINE ${currentLine.toString(16).toUpperCase().padStart(2, '0')} ===\n\n`;
      currentLine++;
    }
    
    // Add part comment every 8 events
    if (eventIndex % 8 === 0) {
      assembly += `    ; --- PART ${currentPart.toString(16).toUpperCase().padStart(2, '0')} ---\n`;
      currentPart++;
    }
    
    const event = events[eventIndex];
    
    if (event.type === 'register' && event.register !== undefined && event.value !== undefined) {
      // Format register write as dc.b $XX,$YY
      assembly += `    dc.b $${event.register.toString(16).toUpperCase().padStart(2, '0')},$${event.value.toString(16).toUpperCase().padStart(2, '0')}`;
      
      // Add comment for common registers
      const registerComment = getRegisterComment(event.register, event.value);
      if (registerComment) {
        assembly += `       ; ${registerComment}`;
      }
      assembly += '\n';
      
    } else if (event.type === 'delay' && event.delay !== undefined) {
      // Format delay as dc.b $FF, <delay>
      if (event.delay === 0) {
        assembly += `    dc.b $ff,$00       ; END MARKER\n`;
      } else {
        assembly += `    dc.b $ff,${event.delay}       ; DL ${event.delay + 1}\n`;
      }
    }
    
    eventIndex++;
  }
  
  return assembly;
}

/**
 * Gets a descriptive comment for common register writes
 */
function getRegisterComment(register: number, value: number): string {
  switch (register) {
    case 0x07: // Mixer
      let comment = 'MX ';
      if (!(value & 0x01)) comment += 'T+';
      if (!(value & 0x02)) comment += 'T+';
      if (!(value & 0x04)) comment += 'T+';
      if (!(value & 0x08)) comment += 'N+';
      if (!(value & 0x10)) comment += 'N+';
      if (!(value & 0x20)) comment += 'N+';
      if (comment === 'MX ') comment += 'T+T+N'; // Default
      return comment;
      
    case 0x08: // Volume A
      return `VA ${value.toString(16).toUpperCase()}`;
    case 0x09: // Volume B  
      return `VB ${value.toString(16).toUpperCase()}`;
    case 0x0A: // Volume C
      return `VC ${value.toString(16).toUpperCase()}`;
      
    case 0x00: // Tone A fine
    case 0x01: // Tone A coarse
    case 0x02: // Tone B fine
    case 0x03: // Tone B coarse
    case 0x04: // Tone C fine
    case 0x05: // Tone C coarse
      // These are handled together in the actual export
      return '';
      
    case 0x06: // Noise period
      return `NP ${value.toString(16).toUpperCase()}`;
      
    default:
      return '';
  }
}

/**
 * Downloads the assembly content as a .s file
 */
export function downloadAssemblyFile(content: string, filename: string = 'music.s'): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}
