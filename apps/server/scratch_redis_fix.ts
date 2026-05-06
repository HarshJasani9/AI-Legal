import Redis from "ioredis";

const redisUrl = "redis://default:umlZ1VPsp6IBZquHVfLisWL7WOKsOETg@hill-ylang-pen-25903.db.redis.io:18949";

async function run() {
  console.log("Connecting to Redis...");
  const redis = new Redis(redisUrl);
  
  try {
    const res = await redis.config("SET", "maxmemory-policy", "noeviction");
    console.log("Successfully set maxmemory-policy to noeviction:", res);
  } catch (err) {
    console.error("Failed to set config:", err);
  } finally {
    redis.disconnect();
  }
}

run();
