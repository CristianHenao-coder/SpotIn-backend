import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const g = globalThis as unknown as { mongooseCache?: Cache };
const cache: Cache = g.mongooseCache ?? { conn: null, promise: null };
g.mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, { dbName: "app-spotIn" })
      .then((m) => m);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
