/**
 * Rate limiting via Upstash Redis. No-op when UPSTASH_REDIS_REST_URL is not set.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export type RateLimitKey = "photo-upload" | "beta-apply" | "request" | "search" | "api";

const limiters: Record<RateLimitKey, Ratelimit> | null = redis
  ? {
      "photo-upload": new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        analytics: true,
      }),
      "beta-apply": new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
      }),
      request: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        analytics: true,
      }),
      search: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        analytics: true,
      }),
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "15 m"),
        analytics: true,
      }),
    }
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/** Returns rate limit result. When Redis is not configured, always allows (success: true). */
export async function checkRateLimit(
  identifier: string,
  key: RateLimitKey,
): Promise<RateLimitResult> {
  if (!limiters) {
    return { success: true, limit: 0, remaining: 999, reset: 0 };
  }
  const limiter = limiters[key];
  if (!limiter) {
    return { success: true, limit: 0, remaining: 999, reset: 0 };
  }
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/** Get client identifier from request (IP or fallback). */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  return ip;
}
