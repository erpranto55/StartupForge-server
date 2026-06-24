import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const client = new MongoClient(
  process.env.MONGODB_URI
);

export async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log(error);
  }
}

export const db =
  client.db("startupforge");

export default client;