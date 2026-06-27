import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";

const router = express.Router();

const applicationsCollection = db.collection("applications");
const startupsCollection = db.collection("startups");

router.post("/", async (req, res) => {
  try {
    const application = req.body;

    const existing = await applicationsCollection.findOne({
      opportunity_id: application.opportunity_id,
      applicant_email: application.applicant_email,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this opportunity.",
      });
    }

    const result = await applicationsCollection.insertOne({
      ...application,
      status: "Pending",
      applied_at: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
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

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//Control Accept or Delete

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

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const application = await applicationsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!["Accepted", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const result = await applicationsCollection.updateOne(
      {
        _id: application._id,
      },
      {
        $set: {
          status,
        },
      },
    );

    if (status === "Accepted") {
      await startupsCollection.updateOne(
        {
          founder_email: application.founder_email,
        },
        {
          $addToSet: {
            team_members: {
              user_email: application.applicant_email,

              name: application.applicant_name,

              portfolio: application.portfolio,

              role: application.role_title,

              joined_at: new Date(),
            },
          },
        },
      );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
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
 * Get Application By Opportunity & Applicant
 */
router.get("/check", async (req, res) => {
  try {
    const { opportunity_id, applicant_email } = req.query;

    const application = await applicationsCollection.findOne({
      opportunity_id,
      applicant_email,
    });

    res.json({
      success: true,
      applied: !!application,
      data: application,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await applicationsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      message: "Application deleted successfully",
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
