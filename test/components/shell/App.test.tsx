import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../../../src/App.tsx';
import { StorageKeys } from '../../../src/utils/storage/storageKeys.ts';

vi.mock('../../../src/hooks/audio/useAudioContext.ts', () => ({
  useAudioContext: () => ({ audioContext: null, error: null }),
}));

beforeEach(() => {
  vi.stubGlobal('innerWidth', 1440);
  vi.stubGlobal('innerHeight', 900);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('', { status: 404 })),
  );
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

function clickCommand(name: string) {
  const commands = screen.getByRole('region', { name: 'Commands' });
  fireEvent.click(within(commands).getByRole('button', { name }));
}

it('opens and closes Settings from the tracker workspace', async () => {
  localStorage.setItem(StorageKeys.STARTUP_TONE, 'off');
  render(<App />);

  expect(screen.getByLabelText('Song title')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
  const dialog = await screen.findByRole('dialog', { name: 'Settings' });

  fireEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
  expect(dialog.isConnected).toBe(false);
});

it('edits song metadata and undoes and redoes the edit', () => {
  render(<App />);
  const title = screen.getByLabelText<HTMLInputElement>('Song title');
  const original = title.value;
  fireEvent.click(title);
  fireEvent.change(title, { target: { value: 'Coverage Song' } });
  expect(title.value).toBe('Coverage Song');
  clickCommand('UNDO');
  expect(title.value).toBe(original);
  clickCommand('REDO');
  expect(title.value).toBe('Coverage Song');
});

it.each([
  ['NEW SONG', 'Create new song?'],
  ['OPTIMIZE', 'Optimize song?'],
  ['RENUMBER', 'Renumber song?'],
  ['RESET', 'Reset application?'],
])('cancels %s without changing the current song', (command, heading) => {
  render(<App />);
  const title = screen.getByLabelText<HTMLInputElement>('Song title');
  const original = title.value;
  clickCommand(command);
  const dialog = screen.getByRole('dialog', { name: heading });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(dialog.isConnected).toBe(false);
  expect(title.value).toBe(original);
});

it('clones the selected instrument and lets the new slot be renamed', () => {
  render(<App />);
  const instruments = screen.getByRole('group', { name: 'Instrument list' });
  const currentName = within(instruments).getByRole<HTMLInputElement>('textbox');
  const original = currentName.value;
  clickCommand('CLONE INST');
  const cloned = within(instruments).getByRole<HTMLInputElement>('textbox');
  expect(cloned.value).toContain(original);
  fireEvent.change(cloned, { target: { value: 'Independent clone' } });
  expect(cloned.value).toBe('Independent clone');
  expect(within(instruments).getByText(original)).toBeTruthy();
});
