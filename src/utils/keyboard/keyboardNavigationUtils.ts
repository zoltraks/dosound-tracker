import type { NavigationSection } from '../../constants/navigation.ts';

export type TrackNavigationSection = Extract<NavigationSection, `track${string}`>;

export const isTrackNavigationSection = (
  section: NavigationSection,
): section is TrackNavigationSection => section.startsWith('track');

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
