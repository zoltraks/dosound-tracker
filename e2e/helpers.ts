import { expect, type Download, type Page } from '@playwright/test';

interface FilePayload {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.command-panel')).toBeVisible();
}

export function commandButton(page: Page, name: string) {
  return page.locator('.command-panel').getByRole('button', { name, exact: true });
}

export async function openSettings(page: Page): Promise<void> {
  await page.getByLabel('Settings', { exact: true }).click();
  await expect(page.locator('.settings-modal')).toBeVisible();
}

export async function openExportModal(page: Page): Promise<void> {
  await commandButton(page, 'EXPORT').click();
  await expect(page.locator('.export-modal')).toBeVisible();
}

export function songFileInput(page: Page) {
  return page.locator('#song-file-input');
}

export function instrumentFileInput(page: Page) {
  return page.locator('#instrument-file-input');
}

export async function uploadSongFile(page: Page, file: FilePayload): Promise<void> {
  await songFileInput(page).setInputFiles(file);
  await expect(songFileInput(page)).toHaveValue(new RegExp(`${file.name}$`));
}

export async function clickAndDownload(
  page: Page,
  trigger: () => Promise<void>,
): Promise<Download> {
  const downloadPromise = page.waitForEvent('download');
  await trigger();
  return downloadPromise;
}
