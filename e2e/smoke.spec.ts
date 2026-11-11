import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  clickAndDownload,
  commandButton,
  gotoApp,
  openExportModal,
  openSettings,
  uploadSongFile,
} from './helpers';

test('first launch shows the bundled song with the default instrument selected', async ({
  page,
}) => {
  await gotoApp(page);
  await expect(page.locator('.app')).toHaveClass(/dark/);
  const firstNote = page.locator('.track-panel.track-a .track-line .note-text').first();
  await expect(firstNote).not.toHaveText('---');
  await expect(page.locator('.instrument-item .instrument-number').first()).toHaveText('00');
});

test('enters a note in track A and plays the song', async ({ page }) => {
  await gotoApp(page);
  const cell = page.locator('.track-panel.track-a .track-line .note-text').first();
  await cell.click();
  await page.keyboard.press('z');
  await expect(cell).toHaveText(/^C-\d 00$/);
  await commandButton(page, 'PLAY SONG').click();
  await expect(page.locator('.play-song-button')).toHaveClass(/playing/);
  await expect(page.locator('.position-number.current')).not.toHaveText('00', {
    timeout: 10_000,
  });
  await commandButton(page, 'STOP').click();
  await expect(page.locator('.play-song-button')).not.toHaveClass(/playing/);
});

test('undoes and redoes a note entry', async ({ page }) => {
  await gotoApp(page);
  const cell = page.locator('.track-panel.track-a .track-line .note-text').nth(1);
  await expect(cell).toHaveText('---');
  await cell.click();
  await page.keyboard.press('z');
  await expect(cell).toHaveText(/^C-\d/);
  await page.keyboard.press('Control+z');
  await expect(cell).toHaveText('---');
  await page.keyboard.press('Control+y');
  await expect(cell).toHaveText(/^C-\d/);
  await page.keyboard.press('Control+z');
  await expect(cell).toHaveText('---');
  await page.keyboard.press('Control+Shift+z');
  await expect(cell).toHaveText(/^C-\d/);
});

test('creates an instrument, edits the envelope, and previews', async ({ page }) => {
  await gotoApp(page);
  const instrumentNumbers = page.locator('.instrument-item .instrument-number');
  const countBefore = await instrumentNumbers.count();
  await commandButton(page, 'ADD INST').click();
  await expect(instrumentNumbers).toHaveCount(countBefore + 1);
  await expect(instrumentNumbers.last()).toHaveText(
    countBefore.toString(16).toUpperCase().padStart(2, '0'),
  );
  const volumeStep = page.locator('.envelope-panel.volume .envelope-value').nth(4);
  const before = await volumeStep.textContent();
  await page.locator('.envelope-panel.volume .envelope-bar').nth(4).click();
  await page.keyboard.press(before?.trim() === '00' ? 'ArrowUp' : 'ArrowDown');
  await expect(volumeStep).not.toHaveText(before ?? '');
  await commandButton(page, 'PLAY INST').click();
  await expect(page.locator('.modal-dialog')).toHaveCount(0);
});

test('exports the song as DOSOUND assembly', async ({ page }) => {
  await gotoApp(page);
  const cell = page.locator('.track-panel.track-a .track-line .note-text').first();
  await cell.click();
  await page.keyboard.press('z');
  await commandButton(page, 'EXPORT').click();
  await expect(page.locator('.export-modal')).toBeVisible();
  const download = await clickAndDownload(page, () =>
    page.locator('.export-modal').getByRole('button', { name: 'DATA' }).click(),
  );
  expect(download.suggestedFilename()).toMatch(/\.s$/);
  const path = await download.path();
  const content = await readFile(path, 'utf8');
  expect(content).toContain('music:');
  expect(content).toContain('dc.b');
});

test('saves and loads a song file', async ({ page }) => {
  await gotoApp(page);
  const titleInput = page.getByLabel('Song title');
  await titleInput.fill('E2E SONG');
  const download = await clickAndDownload(page, () => commandButton(page, 'SAVE SONG').click());
  expect(download.suggestedFilename()).toMatch(/\.yaml$/);
  const path = await download.path();
  const buffer = await readFile(path);
  await titleInput.fill('CHANGED');
  await uploadSongFile(page, { name: 'e2e-song.yaml', mimeType: 'application/yaml', buffer });
  await expect(titleInput).toHaveValue('E2E SONG', { timeout: 15_000 });
});

test('switches theme between dark and light', async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator('.app')).toHaveClass(/dark/);
  await page.locator('.theme-toggle[title="Switch to light mode"]').click();
  await expect(page.locator('.app')).toHaveClass(/light/);
  await page.locator('.theme-toggle[title="Switch to dark mode"]').click();
  await expect(page.locator('.app')).toHaveClass(/dark/);
});

test('changes the theme in settings and persists it across a reload', async ({ page }) => {
  await gotoApp(page);
  await openSettings(page);
  await page.locator('#settings-theme').selectOption('light');
  await page.locator('#settings-action-ok').click();
  await expect(page.locator('.settings-modal')).toHaveCount(0);
  await expect(page.locator('.app')).toHaveClass(/light/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('dosound-tracker-theme')))
    .toBe('light');
  await page.reload();
  await expect(page.locator('.command-panel')).toBeVisible();
  await expect(page.locator('.app')).toHaveClass(/light/);
});

test('applies the contrast theme and text scale from settings', async ({ page }) => {
  await gotoApp(page);
  await openSettings(page);
  await page.locator('#settings-theme').selectOption('contrast');
  await page.locator('#settings-text-scale').selectOption('125');
  await page.locator('#settings-action-ok').click();
  await expect(page.locator('.settings-modal')).toHaveCount(0);
  await expect(page.locator('.app')).toHaveClass(/contrast/);
  await expect(page.locator('.app')).toHaveClass(/app-scale-125/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('dosound-tracker-theme')))
    .toBe('contrast');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('dosound-tracker-text-scale')))
    .toBe('125');
  const appBox = await page.locator('.app').boundingBox();
  const viewport = page.viewportSize();
  // The zoom-compensated shell still bounds to the viewport - no overflow.
  expect(appBox?.width ?? 0).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
  await page.reload();
  await expect(page.locator('.command-panel')).toBeVisible();
  await expect(page.locator('.app')).toHaveClass(/contrast/);
  await expect(page.locator('.app')).toHaveClass(/app-scale-125/);
});

test('switches the sound engine to Ayumi and plays', async ({ page }) => {
  await gotoApp(page);
  await openSettings(page);
  await page.locator('#settings-category-sound').click();
  await page.locator('#settings-sound-engine').selectOption('ayumi');
  await page.locator('#settings-action-ok').click();
  await expect(page.locator('.settings-modal')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('dosound-tracker-sound-engine')))
    .toBe('ayumi');
  await commandButton(page, 'PLAY SONG').click();
  await expect(page.locator('.play-song-button')).toHaveClass(/playing/);
  await expect(page.locator('.position-number.current')).not.toHaveText('00', {
    timeout: 10_000,
  });
  await commandButton(page, 'STOP').click();
  await expect(page.locator('.play-song-button')).not.toHaveClass(/playing/);
});

test('exports the song as VGM', async ({ page }) => {
  await gotoApp(page);
  await openExportModal(page);
  const download = await clickAndDownload(page, () =>
    page.locator('.export-modal').getByRole('button', { name: 'VGM' }).click(),
  );
  expect(download.suggestedFilename()).toMatch(/\.vgm$/);
  const path = await download.path();
  const buffer = await readFile(path);
  expect(buffer.subarray(0, 4).toString('latin1')).toBe('Vgm ');
});

test('exports the song as MAX', async ({ page }) => {
  await gotoApp(page);
  await openExportModal(page);
  const download = await clickAndDownload(page, () =>
    page.locator('.export-modal').getByRole('button', { name: 'MAX' }).click(),
  );
  expect(download.suggestedFilename()).toMatch(/\.max$/);
  const path = await download.path();
  const buffer = await readFile(path);
  expect(buffer.subarray(0, 4).toString('latin1')).toBe('MAX ');
});

test('exports the song as MOD', async ({ page }) => {
  await gotoApp(page);
  await openExportModal(page);
  const download = await clickAndDownload(page, () =>
    page.locator('.export-modal').getByRole('button', { name: 'MOD' }).click(),
  );
  expect(download.suggestedFilename()).toMatch(/\.mod$/);
  const path = await download.path();
  const buffer = await readFile(path);
  expect(buffer.subarray(1080, 1084).toString('latin1')).toBe('M.K.');
});

test('exports the song as MIDI', async ({ page }) => {
  await gotoApp(page);
  await openExportModal(page);
  const download = await clickAndDownload(page, () =>
    page.locator('.export-modal').getByRole('button', { name: 'MIDI' }).click(),
  );
  expect(download.suggestedFilename()).toMatch(/\.mid$/);
  const path = await download.path();
  const buffer = await readFile(path);
  expect(buffer.subarray(0, 4).toString('latin1')).toBe('MThd');
});

test('opens the About modal and renders the changelog', async ({ page }) => {
  await gotoApp(page);
  await page.getByLabel('About DOSOUND Tracker').click();
  const aboutModal = page.getByRole('dialog', { name: 'About' });
  await expect(aboutModal).toBeVisible();
  await expect(aboutModal).toContainText('DOSOUND Tracker');
  await expect(aboutModal).toContainText('Version:');
  await aboutModal.getByRole('button', { name: 'CHANGES' }).click();
  const changesModal = page.getByRole('dialog', { name: 'Changes' });
  await expect(changesModal).toBeVisible();
  await expect(changesModal).toContainText('Version');
});
