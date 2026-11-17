import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useResponsivePanels } from '../../../src/hooks/ui/useResponsivePanels.ts';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true,
    configurable: true,
  });
};

const fireResize = () => {
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('useResponsivePanels', () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    setViewport(originalWidth, originalHeight);
    localStorage.clear();
  });

  it('reports a desktop viewport with the command panel expanded', () => {
    setViewport(1440, 900);
    const { result } = renderHook(() => useResponsivePanels());

    expect(result.current.isMobileViewport).toBe(false);
    expect(result.current.isCommandPanelMobileCollapsed).toBe(false);
  });

  it('collapses the command panel by default on a mobile viewport', () => {
    setViewport(500, 800);
    const { result } = renderHook(() => useResponsivePanels());

    expect(result.current.isMobileViewport).toBe(true);
    expect(result.current.isCommandPanelMobileCollapsed).toBe(true);
  });

  it('restores an expanded command panel from storage on mobile', () => {
    setViewport(500, 800);
    localStorage.setItem(StorageKeys.COMMAND_PANEL_MOBILE, 'expanded');
    const { result } = renderHook(() => useResponsivePanels());

    expect(result.current.isCommandPanelMobileCollapsed).toBe(false);
  });

  it('updates on resize and expands the panel when leaving the mobile viewport', () => {
    setViewport(500, 800);
    const { result } = renderHook(() => useResponsivePanels());
    expect(result.current.isMobileViewport).toBe(true);

    act(() => {
      result.current.setIsCommandPanelMobileCollapsed(false);
    });
    expect(result.current.isCommandPanelMobileCollapsed).toBe(false);

    setViewport(1440, 900);
    fireResize();

    expect(result.current.isMobileViewport).toBe(false);
    expect(result.current.isCommandPanelMobileCollapsed).toBe(false);
  });

  it('persists the collapsed state while on a mobile viewport', () => {
    setViewport(500, 800);
    const { result } = renderHook(() => useResponsivePanels());

    act(() => {
      result.current.setIsCommandPanelMobileCollapsed(false);
    });
    expect(localStorage.getItem(StorageKeys.COMMAND_PANEL_MOBILE)).toBe('expanded');

    act(() => {
      result.current.setIsCommandPanelMobileCollapsed(true);
    });
    expect(localStorage.getItem(StorageKeys.COMMAND_PANEL_MOBILE)).toBe('collapsed');
  });

  it('does not write the mobile preference while on a desktop viewport', () => {
    setViewport(1440, 900);
    const { result } = renderHook(() => useResponsivePanels());

    act(() => {
      result.current.setIsCommandPanelMobileCollapsed(true);
    });

    expect(localStorage.getItem(StorageKeys.COMMAND_PANEL_MOBILE)).toBeNull();
  });
});
