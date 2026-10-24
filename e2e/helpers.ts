import { expect, type Page } from '@playwright/test';

export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.command-panel')).toBeVisible();
}

export function commandButton(page: Page, name: string) {
  return page.locator('.command-panel').getByRole('button', { name, exact: true });
}
