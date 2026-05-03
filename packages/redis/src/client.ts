import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis() {
  if (!client) {
    const url = process.env.REDIS_URL;

    if (!url) {
      throw new Error("REDIS_URL is required");
    }

    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  return client;
}
