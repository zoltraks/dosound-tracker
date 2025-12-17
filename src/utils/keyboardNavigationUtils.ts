import type { NavigationSection } from '../constants/navigation';

export type TrackNavigationSection = 'trackA' | 'trackB' | 'trackC';

export function getNextNavigationSection(
  activeSection: NavigationSection,
  lastTrackSection: TrackNavigationSection,
  navigationOrder: readonly NavigationSection[]
): NavigationSection {
  if (activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC') {
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
  navigationOrder: readonly NavigationSection[]
): NavigationSection {
  if (activeSection === 'trackA' || activeSection === 'trackB' || activeSection === 'trackC') {
    return 'commands';
  }

  if (activeSection === 'mode') {
    return lastTrackSection;
  }

  const currentIndex = navigationOrder.indexOf(activeSection);
  const previousIndex = currentIndex === 0 ? navigationOrder.length - 1 : currentIndex - 1;
  return navigationOrder[previousIndex];
}
