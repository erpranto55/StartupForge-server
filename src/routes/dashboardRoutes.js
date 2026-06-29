import express from "express";
import { db } from "../config/db.js";
import verifyToken from "../middlewares/verifyToken.js";
import verifyRole from "../middlewares/verifyRole.js";

const router = express.Router();

const usersCollection = db.collection("users");
const startupsCollection = db.collection("startups");
const opportunitiesCollection = db.collection("opportunities");
const paymentsCollection = db.collection("payments");

/*
|--------------------------------------------------------------------------
| Admin Dashboard Summary
|--------------------------------------------------------------------------
*/

router.get("/admin", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const [
      users,
      startups,
      approvedStartups,
      pendingStartups,
      opportunities,
      payments,
    ] = await Promise.all([
      usersCollection.countDocuments(),
      startupsCollection.countDocuments(),
      startupsCollection.countDocuments({
        status: "approved",
      }),
      startupsCollection.countDocuments({
        status: "pending",
      }),
      opportunitiesCollection.countDocuments(),
      paymentsCollection.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        users,
        startups,
        approvedStartups,
        pendingStartups,
        opportunities,
        payments,
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

export default router;
