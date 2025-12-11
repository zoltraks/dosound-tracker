import { describe, it, expect } from 'vitest';
import { parseAssemblyToBinary } from '../../src/exports/bin';

describe('parseAssemblyToBinary', () => {
  it('parses DOSOUND assembly dc.b lines into correct byte sequence', () => {
    const assembly = [
      'music:',
      '',
      '\t; START',
      '',
      '\tdc.b $7,$38        ; MX T+T+T',
      '\tdc.b $1,$1,$0,$1C  ; TA A-4',
      '\tdc.b $8,$F         ; VA 15',
      '\tdc.b $9,$0         ; VB 0',
      '\tdc.b $A,$0         ; VC 0',
      '\tdc.b $6,$0         ; NS 0',
      '\tdc.b $FF,$1        ; DL 2',
      '\tdc.b $8,$0         ; VA 0',
      '\tdc.b $FF,$1        ; DL 2',
      '\tdc.b $FF,$1        ; DL 2',
      '\tdc.b $FF,$1        ; DL 2',
      '',
      '\t; END',
      '',
      '\tdc.b $8,$0         ; VA 0',
      '\tdc.b $9,$0         ; VB 0',
      '\tdc.b $A,$0         ; VC 0',
      '',
      '\tdc.b $FF,$0        ; STOP',
      '',
    ].join('\n');

    const bytes = parseAssemblyToBinary(assembly);

    const expected = [
      0x07, 0x38, 0x01, 0x01, 0x00, 0x1c, 0x08, 0x0f,
      0x09, 0x00, 0x0a, 0x00, 0x06, 0x00, 0xff, 0x01,
      0x08, 0x00, 0xff, 0x01, 0xff, 0x01, 0xff, 0x01,
      0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0xff, 0x00,
    ];

    expect(Array.from(bytes)).toEqual(expected);
  });
});
