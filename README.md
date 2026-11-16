# Amazon India — TypeScript Playwright Automation Framework

A clean, reusable Playwright + TypeScript framework for **amazon.in** that:

1. Reads a product name from an environment variable.
2. Searches amazon.in and waits for the results to load completely.
3. Extracts title, rating, review count, price, Prime availability, and sponsored status.
4. Filters out sponsored products and picks the **highest-rated** product with
   **≥ 4.0 stars and ≥ 100 reviews**.
5. Saves the selected product to `test-results/selected-product.json` **before** adding it to cart.
6. Opens the product, adds it to cart, and goes to checkout.
7. **Stops at the checkout review page** and prints:
   `Manual payment and OTP verification required.`

> **Safety first:** this framework never stores or enters card details, never
> enters an OTP, and never clicks "Place your order". If Amazon asks for
> sign-in, the test stops gracefully instead of automating credentials.

## Project structure

```
amazon-playwright-framework/
├── playwright.config.ts        # Timeouts, retries, HTML reporter, base URL
├── package.json
├── tsconfig.json
├── .env.example                # Copy to .env and set PRODUCT_NAME
├── src/
│   ├── config/config.ts        # Reads PRODUCT_NAME + settings from env
│   ├── types/product.types.ts  # ProductDetails interface
│   ├── locators/               # Selectors in separate files (one per page)
│   │   ├── homePage.locators.ts
│   │   ├── searchResultsPage.locators.ts
│   │   ├── productPage.locators.ts
│   │   └── cartPage.locators.ts
│   ├── pages/                  # Page Object Model (POM)
│   │   ├── HomePage.ts
│   │   ├── SearchResultsPage.ts   # extraction + filtering + selection
│   │   ├── ProductPage.ts
│   │   └── CartPage.ts
│   └── utils/
│       ├── logger.ts           # Timestamped logs (console + file)
│       ├── screenshotHelper.ts # Screenshot at every step
│       ├── retryHelper.ts      # Retry with growing delay
│       └── fileHelper.ts       # Save JSON
└── tests/
    └── amazon-shopping.spec.ts # The end-to-end flow (uses test.step)
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install the Chromium browser used by Playwright
npx playwright install chromium

# 3. Create your .env file
cp .env.example .env
```

Edit `.env` and set the product you want:

```env
PRODUCT_NAME=wireless headphones
HEADLESS=false        # false = watch the browser, true = headless
MIN_RATING=4.0
MIN_REVIEWS=100
MAX_RESULTS=20
```

## Run

```bash
# Run the full flow (headless, as set in .env)
npm test

# Run headed so you can watch the browser
npm run test:headed

# Open the Playwright UI (step through, watch, debug)
npm run test:ui

# View the HTML report after a run
npm run report

# Type-check only (no browser needed)
npm run typecheck
```

Change the product without editing any code:

```bash
# Windows PowerShell
$env:PRODUCT_NAME="laptop stand"; npm test

# Windows Command Prompt
set PRODUCT_NAME=laptop stand && npm test

# macOS / Linux
PRODUCT_NAME="laptop stand" npm test
```

## What you get after a run

| Output | Location |
| --- | --- |
| HTML report | `playwright-report/index.html` (`npm run report`) |
| Selected product JSON | `test-results/selected-product.json` |
| Step screenshots | `test-results/screenshots/` (one per step) |
| Detailed log file | `test-results/logs/run-<timestamp>.log` |
| Trace / video (on failure) | `test-results/` (Playwright default) |

`selected-product.json` contains the searched term, the criteria used, the
selected product (title, rating, reviews, price, Prime, sponsored, URL), and
every product extracted from page 1.

## How the selection works

1. The framework scans the first `MAX_RESULTS` results on page 1.
2. It drops every result that carries Amazon's **Sponsored** label.
3. It keeps only products with **rating ≥ MIN_RATING** and **reviews ≥ MIN_REVIEWS**.
4. It sorts by rating (highest first), breaking ties by most reviews, and picks #1.
5. If nothing qualifies, the test fails with a clear message telling you to
   change the product name or lower `MIN_RATING` / `MIN_REVIEWS`.

## Robust waits and retries

- Playwright's auto-waiting on every action, plus explicit waits for the
  search box, results grid, product title, and the "Place your order" button.
- `networkidle` wait after search (with a safe fallback if it times out).
- `withRetry()` helper retries flaky actions (navigation, search click,
  add-to-cart) with a growing delay and logs each attempt.
- `playwright.config.ts` sets 1 retry locally (2 on CI), a 120-second test
  timeout, and `trace: on-first-retry`.

## Sign-in (optional)

By default the framework runs **signed out**. Amazon usually asks for sign-in
before checkout. When that happens the framework detects the sign-in page,
takes a screenshot, logs it, and marks the test **skipped** (blocked by a
manual step) — it never enters credentials or an OTP.

If you want the flow to reach the checkout review page, sign in manually once
and save the session:

```bash
# Opens a browser; sign in manually, then close it. The session is saved.
npx playwright codegen --save-storage=auth.json https://www.amazon.in
```

Then set `AUTH_STATE_PATH=auth.json` in `.env`. The framework will reuse that
session. Never commit `auth.json` — it is already in `.gitignore`.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `Missing required environment variable "PRODUCT_NAME"` | Copy `.env.example` to `.env` and set `PRODUCT_NAME`. |
| CAPTCHA / robot check | Amazon blocked the automated browser. Run headed (`HEADLESS=false`) and solve the CAPTCHA manually once, or run from a residential network. The framework stops with a clear message instead of crashing. |
| `No product meets the criteria...` | The search returned only low-rated or low-review products (or only sponsored ones). Try a different product name, or lower `MIN_RATING` / `MIN_REVIEWS` in `.env`. |
| Test skipped: "Sign-in required" | Amazon wants sign-in before checkout. Sign in manually (see above) or accept the stop — the flow already proved search, selection, and add-to-cart. |
| A locator stops matching | Amazon changes its markup. Update only the matching selector in `src/locators/*.locators.ts` — no page or test code needs to change. |
| `npx playwright test` cannot find Chromium | Run `npx playwright install chromium` once. |

## What the framework deliberately does NOT do

- No card details are stored, entered, or processed.
- No OTP entry is automated.
- "Place your order" is never clicked.
- No login credentials are stored in code or `.env`.
