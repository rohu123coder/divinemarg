import { createRequire } from "module";
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../../.env", import.meta.url).pathname });

import { createClient, type RedisClientType } from "redis";

const url = process.env.REDIS_URL;
if (!url) {
  throw new Error("REDIS_URL is not set");
}

export const redis: RedisClientType = createClient({ url });

export async function connect(): Promise<void> {
  redis.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  try {
    await redis.connect();
  } catch (err) {
    console.error("Redis connection failed:", err);
    throw err;
  }
}
