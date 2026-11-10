# Correct MAX format export with ZX0 compression

**Type:** Fix

## Summary

The current MAX export produces files that do not conform to the MAX format specification. The export must be rewritten to produce spec-compliant REG7 streams with ZX0 compression using a 1024-byte buffer.

## Description

The existing `src/exports/max.ts` implementation has five correctness issues when compared against `MAX.md` and the reference `csharp-max` converter.

**Missing envelope registers**

The AY/YM register map in `MAX.md` defines 14 sound registers (R0 through R13). The current export only captures 11 registers (R0 through R10), omitting the envelope period and shape registers (R11, R12, R13). The MAX frame must include all 14 registers.

**Incorrect REG7 frame delimiter encoding**

The current code emits a two-byte end-of-frame marker (`0x80, 0x80`). The REG7 format uses a single delimiter byte with the high bit set: `$80` means one frame delay, `$81` means two frames delay, up to `$FF` for 128 frames delay. Idle frames must be accumulated and emitted as a single delimiter byte, with runs longer than 128 frames split across multiple delimiters.

**No stream compression**

The current export always writes `compression = 0x00` (RAW). The export must apply ZX0 compression with a 1024-byte buffer, which corresponds to a maximum back-reference offset of 1023 bytes. The ZX0 algorithm is the optimal parser by Einar Saukas, BSD 3-Clause licensed, compatible with this project's MIT license.

**Incorrect frame rate**

The current export captures register states every two simulation ticks (half speed). The MAX format defines one frame per VBLANK interrupt (20 ms at 50 Hz). The export must capture every simulation tick to produce one frame per VBLANK.

**Missing stream size in stream definition chunk**

When a stream is compressed, `MAX.md` requires the stream definition chunk to include the uncompressed stream size as a 3-byte big-endian integer. The current export omits this field entirely.

## Use Cases

- When a user exports a song to MAX format, the resulting file must be playable by any MAX-compliant player, including the ST-MAX hardware device and the `csharp-max` converter.
- When a user exports a song to MAX format, the stream data must be ZX0-compressed with a 1024-byte buffer so it can be decompressed by a ring-buffer player with a 1024-byte window.
- When a user exports an instrument to MAX format, the same correctness rules apply to the instrument preview song.

## Hints

- The `pet-lab` project contains a working TypeScript ZX0 compressor and decompressor at `src/utils/zx0.ts`. It is a port of Einar Saukas's Salvador reference, BSD 3-Clause licensed. The attribution must be preserved when porting.
- The `csharp-max` project contains the reference MAX serializer at `converter/src/BigBytes.MAX.Library/Format/MAX.cs` and the REG7 stream encoder at `converter/src/BigBytes.MAX.Library/Utility/StreamEncoder.cs`.
- The `energy-core` project contains a C# ZX0 implementation at `Energy.Core/Base/Compression.cs` for cross-reference.
- The buffer size to max offset mapping is `maxOffset = bufferSize - 1`, clamped to 32640. For a 1024-byte buffer, `maxOffset = 1023`.
- The simulation in `src/utils/playbackSimulation.ts` already produces one register state per VBLANK tick. The MAX export should capture every tick, not every second tick.
- The simulation does not currently set envelope registers (R11, R12, R13). They default to 0, which is valid. In REG7 format they will be written once in the first frame (diffed against the all-zero initial state) and then never again.

## Out of Scope

- Adding hardware envelope generator simulation to `applyInstrumentToRegisters`. The envelope registers will remain 0 in the exported stream. This is a separate feature.
- Supporting LZ4, LZSS, or REG7N formats. Only REG7 with ZX0 compression is in scope.
- Supporting multi-chip or multi-stream MAX files. The export targets a single YM2149 chip.
- Changing the export strategy parameter. The strategies (simple, complex, optimized) will map to RAW8, REG7, and REG7 with delay optimization respectively, all with ZX0 compression applied.
