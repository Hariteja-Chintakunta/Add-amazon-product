/**
 * Locators for the Amazon.in home page.
 * Kept in a separate file so page objects never hard-code selectors.
 * NOTE: Amazon changes its markup from time to time. If a selector stops
 * matching, update it here only — no page or test code needs to change.
 */
export const HomePageLocators = {
  /** Main search text box in the top navigation. Amazon sometimes uses the legacy field id or generic input name. */
  searchBox: '#twotabsearchtextbox, input[name="field-keywords"], input[aria-label="Search Amazon.in"]',
  /** Search (magnifier) button next to the search box. */
  searchButton: '#nav-search-submit-button, input[name="nav-search-submit-button"], input[type="submit"][value="Go"]',
  /** Amazon logo — used as a "page is really amazon.in" sanity check. */
  navLogo: '#nav-logo-sprites',
  /** CAPTCHA / robot-check form shown when Amazon blocks the browser. */
  captchaForm: 'form[action="/errors/validateCaptcha"]',
  /** CAPTCHA instruction text ("Enter the characters you see below"). */
  captchaText: 'text=Enter the characters you see below',
  /** "Deliver to" location popover close button (best-effort dismiss). */
  locationPopoverClose: '#nav-global-location-popover-close, #GLUXConfirmClose',
} as const;
