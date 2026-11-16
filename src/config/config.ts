import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the project root.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface FrameworkConfig {
  /** Product name to search for on amazon.in (from PRODUCT_NAME). */
  productName: string;
  baseUrl: string;
  headless: boolean;
  /** Minimum star rating for the selected product (default 4.0). */
  minRating: number;
  /** Minimum number of reviews for the selected product (default 100). */
  minReviews: number;
  /** How many search results to scan on page 1 (default 20). */
  maxResultsToScan: number;
  /** Folder for logs, screenshots and JSON output. */
  outputDir: string;
  /** Optional Playwright storage-state file (signed-in session). */
  authStatePath?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy ".env.example" to ".env" and set ${name} (for example: ${name}=wireless headphones).`,
    );
  }
  return value.trim();
}

export const config: FrameworkConfig = {
  productName: requiredEnv('PRODUCT_NAME'),
  baseUrl: process.env.BASE_URL || 'https://www.amazon.in',
  headless: process.env.HEADLESS !== 'false',
  minRating: Number(process.env.MIN_RATING || 4.0),
  minReviews: Number(process.env.MIN_REVIEWS || 100),
  maxResultsToScan: Number(process.env.MAX_RESULTS || 20),
  outputDir: process.env.OUTPUT_DIR || 'test-results',
  authStatePath: process.env.AUTH_STATE_PATH || undefined,
};
