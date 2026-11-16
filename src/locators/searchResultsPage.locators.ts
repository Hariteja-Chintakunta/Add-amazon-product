/**
 * Locators for the Amazon.in search results page.
 * `resultCard` is the container for one product; all other selectors are
 * scoped *inside* a single result card by the page object.
 */
export const SearchResultsPageLocators = {
  /** The whole results area. */
  resultsContainer: 'div[data-component-type="s-search-results"]',
  /** One product card in the results grid. */
  resultCard: 'div[data-component-type="s-search-result"]',
  /** Product title text inside a card. Amazon currently renders the title inside h2 and not always under h2 a span. */
  title: 'h2, a h2',
  /** Clickable title link inside a card (opens the product page). */
  titleLink: 'a:has(h2), a[href*="/dp/"], a[href*="/gp/product/"]',
  /** Star rating text, e.g. "4.3 out of 5 stars". */
  ratingText: 'span.a-icon-alt',
  /** Reviews count link text (the "12,345" under the stars). */
  reviewCountLink: 'a[href*="#customerReviews"] span.a-size-base',
  /** Fallback reviews count (underlined number). */
  reviewCountFallback: 'span.a-size-base.s-underline-text',
  /** Full price text, e.g. "₹1,299" (most reliable). */
  priceOffscreen: 'span.a-price span.a-offscreen',
  /** Fallback price (whole-rupees part only). */
  priceWhole: 'span.a-price-whole',
  /** Prime badge shown on Prime-eligible products. */
  primeBadge: 'i.a-icon-prime',
  /** Sponsored label Amazon renders on paid listings (current markup). */
  sponsoredLabel: 'span.puis-sponsored-label-text',
  /** Sponsored label (older markup fallback). */
  sponsoredLabelFallback: 'span[data-component-type="s-sponsored-label"]',
} as const;
