import { rateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisConnection } from '../config/redis';

// General Limiter: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  requestPropertyName: 'rateLimitGeneral',
  store: new RedisStore({
    // @ts-expect-error - Known issue with rate-limit-redis and ioredis types
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:general:',
  }),
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Strict Limiter: 10 requests per 1 minute per IP
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 10, // Limit each IP to 10 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  requestPropertyName: 'rateLimitStrict',
  store: new RedisStore({
    // @ts-expect-error - Known issue with rate-limit-redis and ioredis types
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:strict:',
  }),
  message: {
    error: 'Too many high-cost requests. Please slow down and try again in a minute.',
  },
});
