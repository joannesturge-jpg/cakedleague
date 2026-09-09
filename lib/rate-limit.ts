// In-memory sliding-window limiter. Good enough to blunt scripted
// brute-force/spam against a single warm serverless instance; it does NOT
// share state across concurrent instances or survive a cold start. If we
// ever see real abuse get through this, the next step up is a shared store
// (e.g. Upstash Redis) instead of per-instance memory.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastCleanup = 0;

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

// Returns true if the call is allowed, false if the key is over its limit.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastCleanup > windowMs) {
    cleanup(now);
    lastCleanup = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests() {
  return Response.json(
    { error: "Too many attempts. Please wait a bit and try again." },
    { status: 429 }
  );
}
