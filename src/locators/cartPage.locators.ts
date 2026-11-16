/**
 * Locators for the Amazon.in cart and checkout pages.
 * SAFETY: there is deliberately NO locator for card details, OTP fields,
 * or the "Place your order" submit action beyond detecting it — the
 * framework stops at the review page and never clicks it.
 */
export const CartPageLocators = {
  /** "Shopping Cart" heading on the cart page. */
  cartTitle: 'h1:has-text("Shopping Cart")',
  /** One item row in the cart. */
  cartItem: 'div[data-asin]',
  /** Item title inside a cart row. */
  cartItemTitle: 'span.a-truncate-cut',
  /** "Proceed to Buy" button on the cart page. */
  proceedToBuyButton: 'input[name="proceedToRetailCheckout"]',
  /** "Proceed to checkout" link (alternate label). */
  proceedToCheckoutButton: 'a:has-text("Proceed to checkout")',
  /** Sign-in page email field — used only to DETECT that sign-in is required. */
  signInEmail: '#ap_email',
  /** Sign-in submit button — used only for detection, never clicked. */
  signInSubmit: '#signInSubmit',
  /**
   * Final "Place your order" button on the checkout review page.
   * Used ONLY to confirm we reached the review page. Never clicked.
   */
  placeOrderButton: '#placeYourOrder, input[name="placeYourOrder"]',
  /** Checkout review heading (fallback detection). */
  checkoutReviewHeading: 'h1:has-text("Review your order")',
} as const;
