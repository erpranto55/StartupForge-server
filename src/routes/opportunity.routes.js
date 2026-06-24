import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

const router = express.Router();

const opportunitiesCollection = db.collection("opportunities");

router.post("/", async (req, res) => {
  try {
    const opportunity = req.body;

    const result = await opportunitiesCollection.insertOne({
      ...opportunity,
      createdAt: new Date(),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/", async (req, res) => {
  try {
    const { search = "", workType, page = 1, limit = 6 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        {
          role_title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          required_skills: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (workType) {
      query.work_type = workType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const opportunities = await opportunitiesCollection
      .find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .toArray();

    const total = await opportunitiesCollection.countDocuments(query);

    res.send({
      opportunities,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const opportunity = await opportunitiesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(opportunity);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/founder/:email", async (req, res) => {
  try {
    const opportunities = await opportunitiesCollection
      .find({
        founder_email: req.params.email,
      })
      .toArray();

    res.send(opportunities);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const result = await opportunitiesCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: req.body,
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await opportunitiesCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;