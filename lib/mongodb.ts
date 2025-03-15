import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in your .env.local file."
  );
}

if (!dbName) {
  throw new Error(
    "Please define the MONGODB_DB environment variable in your .env.local file."
  );
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    cachedClient = await client.connect();
    cachedDb = cachedClient.db(dbName);
    return { client: cachedClient, db: cachedDb };
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

export default client;
