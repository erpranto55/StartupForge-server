import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

const router = express.Router();

const startupsCollection = db.collection("startups");

// Create Startup
router.post("/", async (req, res) => {
  try {
    const startup = {
      ...req.body,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await startupsCollection.insertOne(startup);

    res.status(201).json({
      success: true,
      message: "Startup created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get All Startups
router.get("/", async (req, res) => {
  try {
    const startups = await startupsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: startups,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Startups By Founder Email
router.get("/founder/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const startups = await startupsCollection
      .find({
        founder_email: email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: startups,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Approve Startup
router.patch("/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await startupsCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          status: "approved",
        },
      },
    );

    res.json({
      success: true,
      message: "Startup approved successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Single Startup
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const startup = await startupsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup not found",
      });
    }

    res.json({
      success: true,
      data: startup,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update Startup
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body };

    delete updatedData._id;
    delete updatedData.createdAt;
    delete updatedData.founder_email;

    const result = await startupsCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: updatedData,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found",
      });
    }

    res.json({
      success: true,
      message: "Startup updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Startup
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await startupsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found",
      });
    }

    res.json({
      success: true,
      message: "Startup deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
