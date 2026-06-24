import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

const router = express.Router();

const startupsCollection = db.collection("startups");

router.post("/", async (req, res) => {
  try {
    const startup = req.body;

    const result = await startupsCollection.insertOne({
      ...startup,
      status: "pending",
      createdAt: new Date(),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const startups = await startupsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.send(startups);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const startup = await startupsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(startup);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
