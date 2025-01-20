import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();
const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in your .env file."
  );
}

if (!dbName) {
  throw new Error(
    "Please define the MONGODB_DB environment variable in your .env file."
  );
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let clientPromise: Promise<MongoClient> | null = null;

export async function connectToDatabase() {
  if (!clientPromise) {
    clientPromise = client.connect().then((connectedClient) => {
      console.log("Successfully connected to MongoDB");
      return connectedClient;
    });
  }

  const connectedClient = await clientPromise;
  const db = connectedClient.db(dbName);
  return { db, client: connectedClient };
}
