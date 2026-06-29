import express from "express";
import Stripe from "stripe";
import { db } from "../config/db.js";
import verifyToken from "../middlewares/verifyToken.js";
import verifyRole from "../middlewares/verifyRole.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentsCollection = db.collection("payments");
const usersCollection = db.collection("users");

/**
 * Create Stripe Checkout Session
 */
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyRole("founder"),
  async (req, res) => {
    try {
      const { email } = req.body;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],

        mode: "payment",

        line_items: [
          {
            price_data: {
              currency: "usd",

              product_data: {
                name: "StartupForge Premium Founder",
              },

              unit_amount: 2900, // $29.00
            },

            quantity: 1,
          },
        ],

        success_url: `${process.env.NEXT_PUBLIC_CLIENT_URL?.replace(/\/$/, "")}/payment-success?email=${email}`,

        cancel_url: `${process.env.NEXT_PUBLIC_CLIENT_URL?.replace(/\/$/, "")}/dashboard`,

        metadata: {
          email,
        },
      });

      res.send({
        success: true,
        url: session.url,
      });
    } catch (error) {
      console.log(error);

      res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
);

/**
 * Save Payment
 */
router.post("/", verifyToken, verifyRole("founder"), async (req, res) => {
  try {
    const payment = req.body;

    const existing = await paymentsCollection.findOne({
      transaction_id: payment.transaction_id,
    });

    if (existing) {
      return res.send({
        success: true,
        message: "Already saved",
      });
    }
    const result = await paymentsCollection.insertOne({
      user_email: payment.user_email,
      amount: payment.amount,
      payment_status: "Paid",
      transaction_id: payment.transaction_id,
      paid_at: new Date(),
    });

    await usersCollection.updateOne(
      { email: payment.user_email },
      {
        $set: {
          isPremium: true,
        },
      },
    );

    res.send({
      success: true,
      message: "Payment Saved Successfully",
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
 * Get All Payments
 */
router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const payments = await paymentsCollection
      .find()
      .sort({
        paid_at: -1,
      })
      .toArray();

    res.send(payments);
  } catch (error) {
    console.log(error);

    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

export default router;
