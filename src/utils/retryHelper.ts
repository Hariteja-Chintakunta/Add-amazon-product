import { Logger } from './logger';

export interface RetryOptions {
  /** Number of extra attempts after the first try (default 2). */
  retries?: number;
  /** Base delay between attempts in ms; grows with each attempt (default 1000). */
  delayMs?: number;
  /** Human-readable name used in log lines. */
  label?: string;
  logger?: Logger;
}

/**
 * Runs an async operation and retries it on failure with a growing delay.
 * Use it for flaky actions (clicks, navigation) that Playwright's
 * auto-waiting alone cannot save. Throws the last error when all
 * attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? 1000;
  const label = options.label ?? 'operation';
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const wait = delayMs * (attempt + 1);
        options.logger?.warn(
          `[retry] ${label} failed (attempt ${attempt + 1}/${retries + 1}). ` +
            `Retrying in ${wait}ms. Error: ${(error as Error).message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }
  throw lastError;
}
