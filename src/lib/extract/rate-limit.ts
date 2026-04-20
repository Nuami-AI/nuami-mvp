// Design Ref: §7 Rate limiting + Plan FR-06.
// In-memory per-IP limiter: 10 requests/hour, 3 requests/minute.
// Cold-start caveat documented in Plan §5 (Risks).

const HOURLY_LIMIT = Number(process.env.RATE_LIMIT_HOURLY ?? 10);
const MINUTE_LIMIT = Number(process.env.RATE_LIMIT_MINUTE ?? 3);

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

interface Bucket {
  timestamps: number[]; // unix ms, newest-last
}

const ipBuckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number; // 0 when allowed
}

/**
 * Check + record a request for the given IP. Returns { allowed, retryAfterSeconds }.
 * Side effect: on allowed=true, appends the timestamp to the bucket.
 * On allowed=false, does NOT record (so the user can actually retry after cooldown).
 */
export function checkRateLimit(ip: string, now: number = Date.now()): RateLimitResult {
  const bucket = ipBuckets.get(ip) ?? { timestamps: [] };

  // Drop timestamps older than an hour.
  const fresh = bucket.timestamps.filter((t) => now - t < HOUR_MS);
  const inLastHour = fresh.length;
  const inLastMinute = fresh.filter((t) => now - t < MINUTE_MS).length;

  if (inLastHour >= HOURLY_LIMIT) {
    const oldest = fresh[0]!;
    const retryAfter = Math.ceil((HOUR_MS - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
  }
  if (inLastMinute >= MINUTE_LIMIT) {
    const oldestInMinute = fresh.filter((t) => now - t < MINUTE_MS)[0]!;
    const retryAfter = Math.ceil((MINUTE_MS - (now - oldestInMinute)) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
  }

  fresh.push(now);
  ipBuckets.set(ip, { timestamps: fresh });
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test-only: reset the in-memory state. Not called in production. */
export function __resetRateLimitForTests(): void {
  ipBuckets.clear();
}
