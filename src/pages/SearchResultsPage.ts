import { expect, Locator, Page } from '@playwright/test';
import { SearchResultsPageLocators as L } from '../locators/searchResultsPage.locators';
import { ProductDetails, SelectionCriteria } from '../types/product.types';
import { Logger } from '../utils/logger';
import { captureScreenshot } from '../utils/screenshotHelper';

/** "4.3 out of 5 stars" -> 4.3 ; anything else -> 0. */
function parseRating(text: string | null): number {
  if (!text) return 0;
  const match = text.match(/(\d+(?:\.\d+)?)\s*out of 5/i);
  return match ? parseFloat(match[1]) : 0;
}

/** "83,285 ratings", "83.2K ratings", "2.3L ratings" -> 83285, 83200, 230000 ; anything else -> 0. */
function parseReviewCount(text: string | null): number {
  if (!text) return 0;
  const normalized = text
    .replace(/,/g, '')
    .replace(/ratings|reviews/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const match = normalized.match(/([\d.]+)\s*([KkMmLl])?/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const suffix = (match[2] || '').toLowerCase();
  const multipliers: Record<string, number> = {
    '': 1,
    k: 1_000,
    m: 1_000_000,
    l: 100_000,
  };
  return Math.round(value * (multipliers[suffix] ?? 1));
}

/** "₹1,299" -> { text: "₹1,299", value: 1299 } ; anything else -> 0. */
function parsePrice(text: string | null): { text: string; value: number } {
  if (!text) return { text: '', value: 0 };
  const cleaned = text.replace(/[₹\s,]/g, '').replace(/[^0-9.]/g, '');
  const value = cleaned ? parseFloat(cleaned) : 0;
  return { text: text.trim(), value: Number.isNaN(value) ? 0 : value };
}

/**
 * Amazon.in search results page — wait for results, extract product
 * details, filter sponsored listings, and pick the best eligible product.
 */
export class SearchResultsPage {
  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
    private readonly outputDir: string,
  ) {}

  /** Waits until the results grid is fully loaded (cards visible + network settled). */
  async waitForResultsLoaded(): Promise<void> {
    this.logger.step('Waiting for search results to load completely');
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissContinueShopping();
    const cards = this.page.locator(L.resultCard);
    await expect.poll(async () => {
      await this.dismissContinueShopping();
      return await cards.count();
    }, { timeout: 30_000 }).toBeGreaterThan(0);
    await this.page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
      this.logger.warn('networkidle not reached within 30s — continuing with the visible results.');
    });
    const count = await cards.count();
    this.logger.info(`Search results loaded. ${count} result card(s) visible on page 1.`);
    await captureScreenshot(this.page, this.outputDir, '03-search-results', this.logger);
  }

  private async dismissContinueShopping(): Promise<void> {
    try {
      const button = this.page.locator('button:has-text("Continue shopping"), a:has-text("Continue shopping")').first();
      if ((await button.count()) > 0 && (await button.isVisible().catch(() => false))) {
        await button.click({ timeout: 5_000 });
        await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
        this.logger.info('Dismissed the continue-shopping prompt before waiting for product cards.');
      }
    } catch {
      // Optional Amazon overlay; ignore if absent.
    }
  }

  /** Extracts title, rating, reviews, price, Prime and sponsored status for the first N results. */
  async getAllProducts(maxToScan: number): Promise<ProductDetails[]> {
    const cards = this.page.locator(L.resultCard);
    const total = await cards.count();
    const limit = Math.min(total, maxToScan);
    this.logger.step(`Extracting details from the first ${limit} result(s)`);
    const products: ProductDetails[] = [];
    for (let i = 0; i < limit; i++) {
      try {
        const product = await this.extractProduct(cards.nth(i), i + 1);
        if (product) products.push(product);
      } catch (error) {
        this.logger.warn(`Skipping result #${i + 1}: ${(error as Error).message}`);
      }
    }
    this.logger.info(`Extracted ${products.length} product(s) with usable details.`);
    return products;
  }

  private async extractProduct(card: Locator, position: number): Promise<ProductDetails | null> {
    const title = ((await card.locator(L.title).first().textContent({ timeout: 2_000 }).catch(() => null)) ?? '').trim();
    if (!title) return null;

    const href = await card.locator(L.titleLink).first().getAttribute('href', { timeout: 2_000 }).catch(() => null);
    const url = href ? new URL(href, this.page.url()).toString() : this.page.url();

    const ratingText = await card.locator(L.ratingText).first().textContent({ timeout: 2_000 }).catch(() => null);
    const rating = parseRating(ratingText);

    let reviewText = await card.locator(L.reviewCountLink).first().textContent({ timeout: 2_000 }).catch(() => null);
    if (reviewText === null) {
      reviewText = await card.locator(L.reviewCountFallback).first().textContent({ timeout: 2_000 }).catch(() => null);
    }
    if (!reviewText) {
      reviewText = await card.locator('a[href*="#customerReviews"], a[href*="customerReviews"]').first().getAttribute('aria-label', { timeout: 2_000 }).catch(() => null);
    }
    const reviewCount = parseReviewCount(reviewText);

    let priceTextRaw = await card.locator(L.priceOffscreen).first().textContent({ timeout: 2_000 }).catch(() => null);
    if (!priceTextRaw) {
      priceTextRaw = await card.locator(L.priceWhole).first().textContent({ timeout: 2_000 }).catch(() => null);
    }
    const { text: priceText, value: priceValue } = parsePrice(priceTextRaw);

    const prime = (await card.locator(L.primeBadge).count()) > 0;
    const sponsored = await this.isSponsored(card);

    return { title, rating, reviewCount, priceText, priceValue, prime, sponsored, url, position };
  }

  /** True when the card carries Amazon's sponsored label. */
  private async isSponsored(card: Locator): Promise<boolean> {
    if ((await card.locator(L.sponsoredLabel).count()) > 0) return true;
    if ((await card.locator(L.sponsoredLabelFallback).count()) > 0) return true;
    const label = card.locator('span:has-text("Sponsored")').first();
    if ((await label.count()) > 0) {
      const text = ((await label.textContent()) ?? '').trim();
      if (text === 'Sponsored') return true;
    }
    return false;
  }

  /**
   * Drops sponsored products, keeps only those with rating >= minRating
   * and reviews >= minReviews, then returns the highest-rated one
   * (ties broken by most reviews). Throws when nothing qualifies.
   */
  selectBest(products: ProductDetails[], criteria: SelectionCriteria): ProductDetails {
    const organic = products.filter((p) => !p.sponsored);
    this.logger.info(
      `Filtered out ${products.length - organic.length} sponsored product(s). ${organic.length} organic product(s) remain.`,
    );
    const eligible = organic.filter(
      (p) => p.rating >= criteria.minRating && p.reviewCount >= criteria.minReviews,
    );
    this.logger.info(
      `${eligible.length} product(s) meet the criteria (rating >= ${criteria.minRating}, reviews >= ${criteria.minReviews}).`,
    );
    if (eligible.length === 0) {
      throw new Error(
        `No product meets the criteria (rating >= ${criteria.minRating} stars and >= ${criteria.minReviews} reviews) ` +
          `among non-sponsored results. Try a different product name or lower MIN_RATING / MIN_REVIEWS in .env.`,
      );
    }
    eligible.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    const best = eligible[0];
    this.logger.step(
      `Selected best product: "${best.title}" | ${best.rating} stars | ${best.reviewCount} reviews | ${best.priceText} | Prime: ${best.prime}`,
    );
    return best;
  }

  /**
   * Clicks the selected product's title link and returns the page it opens on.
   * Handles both cases: same-tab navigation and a new tab.
   */
  async openProduct(product: ProductDetails): Promise<Page> {
    this.logger.step(`Opening product page: "${product.title}"`);
    const context = this.page.context();
    const pagesBefore = context.pages().length;
    const card = this.page.locator(L.resultCard).nth(product.position - 1);
    const titleLink = card.locator(L.titleLink).first();
    const popupPromise = context.waitForEvent('page').catch(() => null);
    await titleLink.click({ timeout: 30_000, force: true });
    await this.page.waitForTimeout(1500);
    const popup = await popupPromise;
    const pages = context.pages();
    let target: Page = this.page;
    if (popup) {
      target = popup;
      await target.bringToFront();
    } else if (pages.length > pagesBefore) {
      target = pages[pages.length - 1];
      await target.bringToFront();
    }
    await target.waitForLoadState('domcontentloaded', { timeout: 60_000 });
    this.logger.info(`Product page opened: ${target.url()}`);
    return target;
  }
}
