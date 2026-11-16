import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

/**
 * Takes a screenshot and saves it under <OUTPUT_DIR>/screenshots/
 * with a timestamped name, e.g. 2026-11-16T10-00-00-000Z_03-search-results.png.
 * Returns the saved file path.
 */
export async function captureScreenshot(
  page: Page,
  outputDir: string,
  name: string,
  logger: Logger,
): Promise<string> {
  const dir = path.join(outputDir, 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(dir, `${timestamp}_${name}.png`);
  await page.screenshot({ path: filePath });
  logger.info(`Screenshot saved: ${filePath}`);
  return filePath;
}
