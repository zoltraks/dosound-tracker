import type { NavigationSection } from '../../constants/navigation.ts';
import type { SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';
import { CHIP1_TRACK_IDS } from '../song/visibleTracks.ts';

export type TrackNavigationSection = Extract<NavigationSection, `track${string}`>;

export const isTrackNavigationSection = (
  section: NavigationSection,
): section is TrackNavigationSection => section.startsWith('track');

// Track sections keyboard navigation may land on: A-C on a single-chip
// song, A-F on a two-chip song.
export const navigableTrackSections = (twoChip: boolean): TrackNavigationSection[] => {
  const ids: readonly SongChannelId[] = twoChip ? SONG_CHANNEL_IDS : CHIP1_TRACK_IDS;
  return ids.map((id): TrackNavigationSection => `track${id}`);
};

export function getNextNavigationSection(
  activeSection: NavigationSection,
  lastTrackSection: TrackNavigationSection,
  navigationOrder: readonly NavigationSection[],
): NavigationSection {
  if (isTrackNavigationSection(activeSection)) {
    return 'mode';
  }

  if (activeSection === 'commands') {
    return lastTrackSection;
  }

  const currentIndex = navigationOrder.indexOf(activeSection);
  const nextIndex = (currentIndex + 1) % navigationOrder.length;
  return navigationOrder[nextIndex];
}

export function getPreviousNavigationSection(
  activeSection: NavigationSection,
  lastTrackSection: TrackNavigationSection,
  navigationOrder: readonly NavigationSection[],
): NavigationSection {
  if (isTrackNavigationSection(activeSection)) {
    return 'commands';
  }

  if (activeSection === 'mode') {
    return lastTrackSection;
  }

  const currentIndex = navigationOrder.indexOf(activeSection);
  const previousIndex = currentIndex === 0 ? navigationOrder.length - 1 : currentIndex - 1;
  return navigationOrder[previousIndex];
}
