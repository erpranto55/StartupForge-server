import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

const router = express.Router();

const applicationsCollection = db.collection("applications");

router.post("/", async (req, res) => {
  try {
    const application = req.body;

    const existing = await applicationsCollection.findOne({
      opportunity_id: application.opportunity_id,
      applicant_email: application.applicant_email,
    });

    if (existing) {
      return res.status(400).send({
        message: "Already Applied",
      });
    }

    const result = await applicationsCollection.insertOne({
      ...application,
      status: "Pending",
      applied_at: new Date(),
    });

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

router.get("/user/:email", async (req, res) => {
  try {
    const applications = await applicationsCollection
      .find({
        applicant_email: req.params.email,
      })
      .sort({
        applied_at: -1,
      })
      .toArray();

    res.send(applications);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/founder/:email", async (req, res) => {
  try {
    const applications = await applicationsCollection
      .find({
        founder_email: req.params.email,
      })
      .sort({
        applied_at: -1,
      })
      .toArray();

    res.send(applications);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/accept/:id", async (req, res) => {
  try {
    const result = await applicationsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status: "Accepted",
        },
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/reject/:id", async (req, res) => {
  try {
    const result = await applicationsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status: "Rejected",
        },
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await applicationsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;