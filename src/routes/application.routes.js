import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../config/db.js";
import verifyToken from "../middlewares/verifyToken.js";
import verifyRole from "../middlewares/verifyRole.js";

const router = express.Router();

const applicationsCollection = db.collection("applications");
const startupsCollection = db.collection("startups");

router.post("/", verifyToken, verifyRole("collaborator"), async (req, res) => {
  try {
    const {
      opportunity_id,
      founder_email,
      startup_name,
      role_title,
      portfolio,
      motivation,
    } = req.body;

    const applicant_email = req.user.email;
    const applicant_name = req.user.name || req.user.username || "";
    const applicant_photo = req.user.image || "";

    // Prevent duplicate application
    const existing = await applicationsCollection.findOne({
      opportunity_id,
      applicant_email,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this opportunity.",
      });
    }

    const application = {
      opportunity_id,
      founder_email,
      startup_name,
      role_title,

      applicant_email,
      applicant_name,
      applicant_photo,

      portfolio: portfolio || "",
      motivation: motivation || "",

      status: "Pending",
      applied_at: new Date(),
    };

    const result = await applicationsCollection.insertOne(application);

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

router.get(
  "/user/:email",
  verifyToken,
  verifyRole("collaborator"),
  async (req, res) => {
    try {
      const applications = await applicationsCollection
        .find({
          applicant_email: req.user.email,
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
  },
);

//Control Accept or Delete

router.get(
  "/founder/:email",
  verifyToken,
  verifyRole("founder"),
  async (req, res) => {
    try {
      const applications = await applicationsCollection
        .find({
          founder_email: req.user.email,
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
  },
);

router.patch("/:id", verifyToken, verifyRole("founder"), async (req, res) => {
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

    if (application.founder_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "Forbidden Access",
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
      console.log("Application:", application);

      const startupResult = await startupsCollection.updateOne(
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

      console.log("Startup Update Result:", startupResult);
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
router.get(
  "/check",
  verifyToken,
  verifyRole("collaborator"),
  async (req, res) => {
    try {
      const { opportunity_id } = req.query;

      const applicant_email = req.user.email;

      const application = await applicationsCollection.findOne({
        opportunity_id,
        applicant_email,
      });

      res.json({
        success: true,
        applied: !!application,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

router.delete(
  "/:id",
  verifyToken,
  verifyRole("founder", "collaborator", "admin"),
  async (req, res) => {
    try {
      const application = await applicationsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      if (req.user.role === "collaborator" && application.applicant_email !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: "Forbidden Access",
        });
      }

      if (req.user.role === "founder" && application.founder_email !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: "Forbidden Access",
        });
      }

      const result = await applicationsCollection.deleteOne({
        _id: application._id,
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
  },
);

export default router;
