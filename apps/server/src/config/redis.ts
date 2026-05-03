import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("REDIS_URL is not defined! Defaulting to localhost:6379");
}

// BullMQ requires maxRetriesPerRequest to be set to null for robust queue handling
export const redisConnection = new Redis(redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redisConnection.on("connect", () => {
  console.log("Connected to Redis successfully.");
});
