import Redis from "ioredis";

const clients = new Map<string, Redis>();

export function getRedis(url: string) {
  let client = clients.get(url);

  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    clients.set(url, client);
  }

  return client;
}
