import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

console.log("Mongo URI Loaded:", !!uri);

const client = new MongoClient(uri);

export async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log(error);
  }
}

export default client;
