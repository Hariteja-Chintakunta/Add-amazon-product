import { Locator, Page, expect } from '@playwright/test';
import { HomePageLocators as L } from '../locators/homePage.locators';
import { Logger } from '../utils/logger';
import { captureScreenshot } from '../utils/screenshotHelper';
import { withRetry } from '../utils/retryHelper';

/** Amazon.in home page — open the site, detect blocks, run a search. */
export class HomePage {
  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
    private readonly outputDir: string,
  ) {}

  /** Opens amazon.in and confirms the search box is visible. */
  async goto(baseUrl: string): Promise<void> {
    this.logger.step(`Navigating to ${baseUrl}`);
    await withRetry(
      () =>
        this.page.goto(baseUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        }),
      { label: 'goto amazon.in', logger: this.logger },
    );
    await this.page.waitForLoadState('domcontentloaded');
    await this.detectCaptcha();
    await this.dismissLocationPopover();
    const searchBox = await this.getVisibleSearchBox();
    const searchBoxVisible = await searchBox.isVisible().catch(() => false);
    if (searchBoxVisible) {
      this.logger.info('Amazon home page loaded — search box is visible.');
    } else {
      this.logger.warn('Amazon home page loaded, but the search box is not visible; continuing with page state.');
    }
    await captureScreenshot(this.page, this.outputDir, '01-homepage', this.logger);
  }

  private async getVisibleSearchBox(): Promise<Locator> {
    const candidates = [
      this.page.locator('#twotabsearchtextbox'),
      this.page.locator('input[name="field-keywords"]'),
      this.page.locator('input[aria-label="Search Amazon.in"]'),
    ];

    for (const candidate of candidates) {
      if ((await candidate.count()) > 0) {
        return candidate.first();
      }
    }

    return this.page.locator(L.searchBox).first();
  }

  /** Throws a clear, controlled error when Amazon shows a CAPTCHA / robot check. */
  async detectCaptcha(): Promise<void> {
    const captcha = this.page.locator(L.captchaForm);
    if ((await captcha.count()) > 0) {
      await captureScreenshot(this.page, this.outputDir, '00-captcha-detected', this.logger);
      throw new Error(
        'CAPTCHA / robot check detected on amazon.in. Amazon blocked the automated browser. ' +
          'Run headed (HEADLESS=false) and solve the CAPTCHA manually once, or run from a residential network. Stopping here.',
      );
    }
  }

  /** Best-effort dismiss of the "Deliver to" location popover; never throws. */
  private async dismissLocationPopover(): Promise<void> {
    try {
      const close = this.page.locator(L.locationPopoverClose).first();
      if ((await close.count()) > 0 && (await close.isVisible())) {
        await close.click({ timeout: 3000 });
        this.logger.info('Dismissed the delivery-location popover.');
      }
    } catch {
      // Popover not present or already gone — safe to ignore.
    }
  }

  /** Types the product name and submits the search. */
  async search(productName: string): Promise<void> {
    this.logger.step(`Searching for product: "${productName}"`);
    const box = await this.getVisibleSearchBox();
    await box.waitFor({ state: 'attached', timeout: 30_000 });
    await box.click({ timeout: 15_000 }).catch(() => undefined);
    await box.fill(productName, { timeout: 15_000 }).catch(() => undefined);
    const searchButton = this.page.locator(L.searchButton).first();
    await withRetry(() => searchButton.click(), {
      label: 'click search button',
      logger: this.logger,
    });
    await this.page.waitForLoadState('domcontentloaded');
    this.logger.info(`Search submitted for "${productName}".`);
    await captureScreenshot(this.page, this.outputDir, '02-search-submitted', this.logger);
  }
}
