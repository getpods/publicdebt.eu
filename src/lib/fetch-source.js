import { setTimeout as delay } from "node:timers/promises";

// Read the body inside the timeout so a stalled download also gets retried.
export async function fetchSource(url, { headers = {}, timeoutMs = 30_000, attempts = 3 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let retryAfterMs = 0;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "PublicDebt.eu/0.2 data importer", ...headers },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!response.ok) {
        const error = new Error(`Source returned HTTP ${response.status}: ${url}`);
        error.retryable = response.status === 429 || response.status >= 500;
        const retryAfter = response.headers.get("retry-after");
        if (retryAfter) {
          retryAfterMs = /^\d+$/.test(retryAfter)
            ? Number(retryAfter) * 1_000
            : Math.max(0, Date.parse(retryAfter) - Date.now());
        }
        await response.body?.cancel();
        throw error;
      }
      return await response.text();
    } catch (error) {
      const retryable = error.retryable === true || error.name === "TimeoutError" ||
        error.name === "AbortError" || error instanceof TypeError;
      if (!retryable || attempt === attempts) throw error;
      const waitMs = Math.min(30_000, Math.max(500 * 2 ** (attempt - 1), retryAfterMs || 0));
      console.warn(`Retry ${attempt + 1}/${attempts} in ${waitMs} ms: ${error.message}`);
      await delay(waitMs);
    }
  }
}
