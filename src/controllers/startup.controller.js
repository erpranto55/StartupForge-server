import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

export const createStartup = async (req, res) => {
  try {
    const startup = {
      ...req.body,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await db.collection("startups").insertOne(startup);

    res.status(201).send({
      success: true,
      message: "Startup Created Successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};
