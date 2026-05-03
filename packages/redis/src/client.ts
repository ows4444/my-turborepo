import Redis from "ioredis";

let client: Redis | null = null;

export function getRedis(url: string) {
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }

  return client;
}
