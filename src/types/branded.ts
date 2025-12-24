type Brand<T, Name extends string> = T & { readonly __brand: Name };

/**
 * Branded identifier types to prevent mixing critical IDs.
 */
export type InstrumentId = Brand<string, 'InstrumentId'>;
export type PatternId = Brand<string, 'PatternId'>;
export type TrackId = Brand<string, 'TrackId'>;
export type PlaylistPatternId = Brand<string, 'PlaylistPatternId'>;

export const asInstrumentId = (value: string): InstrumentId => value as InstrumentId;
export const asPatternId = (value: string): PatternId => value as PatternId;
export const asTrackId = (value: string): TrackId => value as TrackId;
export const asPlaylistPatternId = (value: string): PlaylistPatternId => value as PlaylistPatternId;
