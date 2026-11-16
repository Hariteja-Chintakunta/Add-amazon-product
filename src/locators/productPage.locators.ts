/**
 * Locators for the Amazon.in product detail page.
 */
export const ProductPageLocators = {
  /** Product title on the detail page. */
  title: '#productTitle',
  /** Full price text on the detail page. */
  priceOffscreen: 'span.a-price span.a-offscreen',
  /** Fallback price (whole-rupees part only). */
  priceWhole: 'span.a-price-whole',
  /** Buy box (right-hand purchase panel). */
  buyBox: '#buybox',
  /** "Add to Cart" button. */
  addToCartButton: '#add-to-cart-button',
  /** "Buy Now" button — present for reference; the framework never clicks it. */
  buyNowButton: '#buy-now-button',
  /**
   * Confirmation shown after a successful add-to-cart.
   * Amazon shows a side sheet ("Added to Cart") or a success banner.
   */
  addedToCartConfirmation:
    '#NATC_SMART_WAGON_CONF_MSG_SUCCESS, #sw-atc-confirmation, h1:has-text("Added to Cart")',
  /** Cart item count badge in the top navigation. */
  cartCount: '#nav-cart-count',
  /** "Proceed to checkout" link inside the added-to-cart side sheet. */
  proceedToCheckoutFromSideSheet: 'a:has-text("Proceed to checkout")',
} as const;
