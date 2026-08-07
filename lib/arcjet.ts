import arcjet, { tokenBucket } from "@arcjet/next";
import { env } from "@/lib/env";

/**
 * Arcjet rate limiting config for dealership collection creation.
 *
 * Applies a token bucket per IP address so abuse does not exhaust collection resources.
 *
 * @see https://docs.arcjet.com/rate-limiting/token-bucket
 */
const aj = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track based on User IP
  rules: [
    // Rate limiting specifically for collection creation
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // 10 collections
      interval: 3600, // per hour
      capacity: 10, // maximum burst capacity
    }),
  ],
});

/**
 * Arcjet rate limiter for dealership collection creation.
 *
 * Applies a token bucket per IP address so abuse does not exhaust collection resources.
 *
 * @see https://docs.arcjet.com/rate-limiting/token-bucket
 */
export default aj;
