import { test, Page } from '@playwright/test';
import * as path from 'path';
import { config } from '../src/config/config';
import { Logger } from '../src/utils/logger';
import { captureScreenshot } from '../src/utils/screenshotHelper';
import { saveJson } from '../src/utils/fileHelper';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { ProductPage } from '../src/pages/ProductPage';
import { CartPage } from '../src/pages/CartPage';

/**
 * Amazon India end-to-end shopping flow.
 *
 * 1. Read the product name from PRODUCT_NAME (env).
 * 2. Search amazon.in and extract title, rating, reviews, price, Prime, sponsored.
 * 3. Drop sponsored products; pick the highest-rated one with
 *    rating >= MIN_RATING (default 4.0) and reviews >= MIN_REVIEWS (default 100).
 * 4. Save the selected product to test-results/selected-product.json BEFORE adding to cart.
 * 5. Open the product, add to cart, go to checkout.
 * 6. STOP at the checkout review page and print:
 *    "Manual payment and OTP verification required."
 *
 * SAFETY: the framework never stores or enters card details, never enters
 * an OTP, and never clicks "Place your order". If Amazon asks for sign-in,
 * the test stops gracefully (skipped) instead of automating credentials.
 */
test.describe('Amazon India — search, select best product, add to cart', () => {
  test('buy the highest-rated product for a given search term', async ({ page }) => {
    const logger = new Logger(config.outputDir);
    const out = config.outputDir;

    logger.step(`Starting Amazon.in flow for product: "${config.productName}"`);
    logger.info(
      `Criteria: rating >= ${config.minRating}, reviews >= ${config.minReviews}, non-sponsored only.`,
    );
    logger.info(`Logs: ${logger.getLogFile()}`);

    const home = new HomePage(page, logger, out);
    const results = new SearchResultsPage(page, logger, out);

    await test.step('Open amazon.in', async () => {
      await home.goto(config.baseUrl);
    });

    await test.step(`Search for "${config.productName}"`, async () => {
      await home.search(config.productName);
    });

    const products = await test.step('Load and extract search results', async () => {
      await results.waitForResultsLoaded();
      const list = await results.getAllProducts(config.maxResultsToScan);
      if (list.length === 0) {
        throw new Error(
          `No products could be extracted for "${config.productName}". ` +
            'Amazon may have changed its layout or shown a CAPTCHA.',
        );
      }
      return list;
    });

    const best = await test.step('Select the highest-rated eligible product', async () => {
      return results.selectBest(products, {
        minRating: config.minRating,
        minReviews: config.minReviews,
      });
    });

    // Save the selected product details BEFORE adding it to the cart.
    await test.step('Save selected product details to JSON', async () => {
      const file = path.join(out, 'selected-product.json');
      saveJson(file, {
        searchedFor: config.productName,
        selectedAt: new Date().toISOString(),
        criteria: { minRating: config.minRating, minReviews: config.minReviews },
        product: best,
        allExtracted: products,
      });
      logger.info(`Selected product details saved to ${file}`);
    });

    const productPage: Page = await test.step('Open the selected product', async () => {
      return results.openProduct(best);
    });

    const product = new ProductPage(productPage, logger, out);
    await test.step('Add the product to cart', async () => {
      await product.waitForLoaded();
      await product.addToCart();
    });

    const cart = new CartPage(productPage, logger, out);
    await test.step('Go to cart and proceed to checkout', async () => {
      await cart.gotoCart(config.baseUrl);
      await cart.proceedToCheckout();
      if (await cart.isSignInRequired()) {
        await captureScreenshot(productPage, out, '09-signin-required', logger);
        logger.warn(
          'Amazon asked for sign-in before checkout. Sign-in is a manual step — ' +
            'the framework will NOT enter credentials or OTP.',
        );
        logger.info(
          'STOPPING HERE. Sign in manually in the browser if you want to continue to the checkout review page.',
        );
        // Blocked by a manual step, not a framework failure.
        test.skip(true, 'Sign-in required by Amazon before checkout (manual step).');
      }
    });

    await test.step('Stop at the checkout review page', async () => {
      await cart.waitForCheckoutReview();
      // SAFETY: never click "Place your order", never enter card details, never enter OTP.
      const message = 'Manual payment and OTP verification required.';
      logger.info(message);
      console.log('\n============================================================');
      console.log(message);
      console.log('The framework stops here by design. Do NOT automate payment or OTP.');
      console.log('============================================================\n');
      await captureScreenshot(productPage, out, '08-checkout-review', logger);
    });
  });
});
