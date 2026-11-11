import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AppLayout } from '../../src/components/AppLayout.tsx';

afterEach(() => cleanup());

const renderLayout = (overrides: Partial<Parameters<typeof AppLayout>[0]> = {}) =>
  render(
    <AppLayout
      theme="dark"
      textScale="100"
      header={<div>header</div>}
      commandPanel={<div>commands</div>}
      trackerSection={<div>tracker</div>}
      envelopeSection={<div>envelope</div>}
      songSection={<div>song</div>}
      pianoKeyboard={<div>piano</div>}
      fileInputs={<div>inputs</div>}
      modals={<div>modals</div>}
      {...overrides}
    />,
  );

describe('AppLayout', () => {
  it('exposes a main landmark around the workspace columns', () => {
    renderLayout();
    const main = screen.getByRole('main');
    try {
      expect(main.className).toBe('main-content');
      expect(main.textContent).toContain('tracker');
      expect(main.textContent).toContain('envelope');
      expect(main.textContent).toContain('song');
    } catch (error) {
      console.log('main landmark:', main.outerHTML);
      throw error;
    }
  });

  it('composes the theme and scale classes on the app shell', () => {
    const { container } = renderLayout({ theme: 'contrast', textScale: '125' });
    const app = container.querySelector('.app') as HTMLElement;
    try {
      expect(app.className).toBe('app contrast app-scale-125');
      expect(app.querySelector('.app-initial-overlay-dark')).toBeTruthy();
    } catch (error) {
      console.log('app classes:', app.className);
      throw error;
    }
  });

  it('omits the scale class at the default 100 step', () => {
    const { container } = renderLayout({ theme: 'light', textScale: '100' });
    const app = container.querySelector('.app') as HTMLElement;
    try {
      expect(app.className).toBe('app light');
      expect(app.querySelector('.app-initial-overlay-light')).toBeTruthy();
    } catch (error) {
      console.log('app classes:', app.className);
      throw error;
    }
  });
});
