import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { commandButton, gotoApp } from './helpers';

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
  await expect(page.locator('.play-song-btn')).toHaveClass(/playing/);
  await expect(page.locator('.position-number.current')).not.toHaveText('00', {
    timeout: 10_000,
  });
  await commandButton(page, 'STOP').click();
  await expect(page.locator('.play-song-btn')).not.toHaveClass(/playing/);
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
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.export-modal').getByRole('button', { name: 'DATA' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.s$/);
  const path = await download.path();
  const content = await readFile(path, 'utf8');
  expect(content).toContain('music:');
  expect(content).toContain('dc.b');
});

test('saves and loads a song file', async ({ page }) => {
  await gotoApp(page);
  const titleInput = page.locator('.information-input').first();
  await titleInput.fill('E2E SONG');
  const downloadPromise = page.waitForEvent('download');
  await commandButton(page, 'SAVE SONG').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.yaml$/);
  const path = await download.path();
  const buffer = await readFile(path);
  await titleInput.fill('CHANGED');
  await page
    .locator('input[type="file"][accept=".yaml,.yml"]')
    .first()
    .setInputFiles({ name: 'e2e-song.yaml', mimeType: 'application/yaml', buffer });
  await expect(titleInput).toHaveValue('E2E SONG');
});

test('switches theme between dark and light', async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator('.app')).toHaveClass(/dark/);
  await page.locator('.theme-toggle[title="Switch to light mode"]').click();
  await expect(page.locator('.app')).toHaveClass(/light/);
  await page.locator('.theme-toggle[title="Switch to dark mode"]').click();
  await expect(page.locator('.app')).toHaveClass(/dark/);
});
