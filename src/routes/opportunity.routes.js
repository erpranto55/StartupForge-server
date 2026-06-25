import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

const router = express.Router();

const opportunitiesCollection = db.collection("opportunities");
const usersCollection = db.collection("users");

/**
 * Create Opportunity
 */
router.post("/", async (req, res) => {
  try {
    const opportunity = req.body;

    // Check Founder
    const founder = await usersCollection.findOne({
      email: opportunity.founder_email,
    });

    if (!founder) {
      return res.status(404).send({
        success: false,
        message: "Founder not found",
      });
    }

    // Count Existing Opportunities
    const totalOpportunities = await opportunitiesCollection.countDocuments({
      founder_email: opportunity.founder_email,
    });

    // Premium Check
    if (totalOpportunities >= 3 && !founder.isPremium) {
      return res.status(403).send({
        success: false,
        message:
          "Premium Founder subscription required to post more than 3 opportunities.",
      });
    }

    const result = await opportunitiesCollection.insertOne({
      ...opportunity,
      createdAt: new Date(),
    });

    res.send({
      success: true,
      result,
    });
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get Founder Opportunities
 */
router.get("/founder/:email", async (req, res) => {
  try {
    const opportunities = await opportunitiesCollection
      .find({
        founder_email: req.params.email,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.send(opportunities);
  } catch (error) {
    console.log(error);

    res.status(500).send(error);
  }
});

/**
 * Get All Opportunities
 * Search
 * Filter
 * Pagination
 */
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
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await opportunitiesCollection.countDocuments(query);

    res.send({
      opportunities,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.log(error);

    res.status(500).send(error);
  }
});

/**
 * Get Single Opportunity
 */
router.get("/:id", async (req, res) => {
  try {
    const opportunity = await opportunitiesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(opportunity);
  } catch (error) {
    console.log(error);

    res.status(500).send(error);
  }
});

/**
 * Update Opportunity
 */
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
    console.log(error);

    res.status(500).send(error);
  }
});

/**
 * Delete Opportunity
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await opportunitiesCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (error) {
    console.log(error);

    res.status(500).send(error);
  }
});

export default router;
