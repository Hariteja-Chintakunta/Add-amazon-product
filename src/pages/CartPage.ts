import { Page } from '@playwright/test';
import { CartPageLocators as L } from '../locators/cartPage.locators';
import { Logger } from '../utils/logger';
import { captureScreenshot } from '../utils/screenshotHelper';

/**
 * Amazon.in cart and checkout pages.
 *
 * SAFETY: this class only *detects* the sign-in page and the final
 * "Place your order" button. It never enters credentials, never enters
 * an OTP, and never clicks "Place your order". The flow stops at the
 * checkout review page by design.
 */
export class CartPage {
  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
    private readonly outputDir: string,
  ) {}

  /** Opens the cart page directly. */
  async gotoCart(baseUrl: string): Promise<void> {
    this.logger.step('Navigating to the cart');
    await this.page.goto(`${baseUrl}/gp/cart/view.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await this.page
      .locator(L.cartTitle)
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => undefined);
    await captureScreenshot(this.page, this.outputDir, '06-cart-page', this.logger);
  }

  /** Clicks "Proceed to Buy" (or "Proceed to checkout") to enter checkout. */
  async proceedToCheckout(): Promise<void> {
    this.logger.step('Clicking "Proceed to Buy / Proceed to checkout"');
    const buyButton = this.page.locator(L.proceedToBuyButton).first();
    if ((await buyButton.count()) > 0) {
      await buyButton.click();
    } else {
      await this.page.locator(L.proceedToCheckoutButton).first().click();
    }
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60_000 });
    await captureScreenshot(this.page, this.outputDir, '07-after-proceed-to-checkout', this.logger);
  }

  /** True when Amazon redirected to the sign-in page (manual step required). */
  async isSignInRequired(): Promise<boolean> {
    if (this.page.url().includes('/ap/signin')) return true;
    return (await this.page.locator(L.signInEmail).count()) > 0;
  }

  /**
   * Waits for the final checkout review page (the "Place your order"
   * button is visible). The framework stops here — it never clicks it.
   */
  async waitForCheckoutReview(): Promise<void> {
    this.logger.step('Waiting for the checkout review page');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page
      .locator(L.placeOrderButton)
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 });
    this.logger.info('Reached the checkout review page ("Place your order" button is visible).');
    await captureScreenshot(this.page, this.outputDir, '08-checkout-review', this.logger);
  }
}
