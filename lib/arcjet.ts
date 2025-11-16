import arcjet, { tokenBucket } from "@arcjet/next";

/**
 * Arcjet rate limiting config.
 * Token bucket for collection creation.
 * Tracks by IP address.
 * 10 collections per hour max.
 *
 * @see https://docs.arcjet.com/rate-limiting/token-bucket
 */
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
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

export default aj;
