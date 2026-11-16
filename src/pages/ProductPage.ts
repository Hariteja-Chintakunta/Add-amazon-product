import { Page } from '@playwright/test';
import { ProductPageLocators as L } from '../locators/productPage.locators';
import { Logger } from '../utils/logger';
import { captureScreenshot } from '../utils/screenshotHelper';
import { withRetry } from '../utils/retryHelper';

/** Amazon.in product detail page — verify it loaded, add the item to cart. */
export class ProductPage {
  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
    private readonly outputDir: string,
  ) {}

  /** Waits for the product title and confirms the page loaded. */
  async waitForLoaded(): Promise<void> {
    this.logger.step('Waiting for the product page to load');
    await this.page.locator(L.title).waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.waitForLoadState('domcontentloaded');
    const title = ((await this.page.locator(L.title).textContent()) ?? '').trim();
    this.logger.info(`Product page loaded: "${title}"`);
    await captureScreenshot(this.page, this.outputDir, '04-product-page', this.logger);
  }

  /** Clicks "Add to Cart" and confirms the item landed in the cart (with retries). */
  async addToCart(): Promise<void> {
    this.logger.step('Adding the product to cart');
    const button = this.page.locator(L.addToCartButton);
    await button.waitFor({ state: 'visible', timeout: 30_000 });
    await withRetry(
      async () => {
        await button.click();
        // Success = the "Added to Cart" confirmation appears, or the cart count goes above 0.
        await Promise.race([
          this.page
            .locator(L.addedToCartConfirmation)
            .first()
            .waitFor({ state: 'visible', timeout: 15_000 }),
          this.page.waitForURL(/\/cart\//, { timeout: 15_000 }),
        ]).catch(() => undefined);
        const countText = await this.page.locator(L.cartCount).textContent().catch(() => null);
        const count = countText ? parseInt(countText.trim(), 10) : 0;
        const confirmationVisible =
          (await this.page.locator(L.addedToCartConfirmation).count()) > 0;
        if ((!Number.isNaN(count) && count > 0) || confirmationVisible) return;
        throw new Error('Add to cart showed no confirmation and the cart count is still 0.');
      },
      { label: 'add to cart', logger: this.logger, retries: 2 },
    );
    this.logger.info('Product added to cart (confirmation visible / cart count increased).');
    await captureScreenshot(this.page, this.outputDir, '05-added-to-cart', this.logger);
  }
}
