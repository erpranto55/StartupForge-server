import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";
import verifyToken from "../middlewares/verifyToken.js";
import verifyRole from "../middlewares/verifyRole.js";

const router = express.Router();

const opportunitiesCollection = db.collection("opportunities");
const usersCollection = db.collection("users");

/**
 * Create Opportunity
 */
router.post("/", verifyToken, verifyRole("founder"), async (req, res) => {
  try {
    const opportunity = req.body;

    // Check Founder
    const founder = await usersCollection.findOne({
      email: opportunity.founder_email,
    });

    if (!founder) {
      return res.status(404).json({
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
      return res.status(403).json({
        success: false,
        message:
          "Premium Founder subscription required to post more than 3 opportunities.",
      });
    }

    const result = await opportunitiesCollection.insertOne({
      ...opportunity,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Opportunity created successfully",
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

/**
 * Get Founder Opportunities
 */
router.get("/founder/:email", verifyToken, verifyRole("founder"), async (req, res) => {
  try {
    const opportunities = await opportunitiesCollection
      .find({
        founder_email: req.params.email,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.json({
      success: true,
      data: opportunities,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get All Opportunities
 */
router.get("/", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 6, workType, industry } = req.query;

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
      query.work_type = {
        $in: workType.split(","),
      };
    }

    if (industry) {
      query.industry = {
        $in: industry.split(","),
      };
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

    res.json({
      success: true,
      data: opportunities,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/dashboard/:email", verifyToken, verifyRole("founder"), async (req, res) => {
  try {
    const { email } = req.params;

    const applicationsCollection = db.collection("applications");

    const totalOpportunities = await opportunitiesCollection.countDocuments({
      founder_email: email,
    });

    const totalApplications = await applicationsCollection.countDocuments({
      founder_email: email,
    });

    const acceptedMembers = await applicationsCollection.countDocuments({
      founder_email: email,
      status: "Accepted",
    });

    res.json({
      success: true,
      data: {
        totalOpportunities,
        totalApplications,
        acceptedMembers,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Update Opportunity
 */
router.patch("/:id", verifyToken, verifyRole("founder"), async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
    };

    delete updatedData._id;
    delete updatedData.createdAt;
    delete updatedData.founder_email;

    const result = await opportunitiesCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: updatedData,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    res.json({
      success: true,
      message: "Opportunity updated successfully",
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

/**
 * Delete Opportunity
 */
router.delete("/:id", verifyToken, verifyRole("founder", "admin"), async (req, res) => {
  try {
    const result = await opportunitiesCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    res.json({
      success: true,
      message: "Opportunity deleted successfully",
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

