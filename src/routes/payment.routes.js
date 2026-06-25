import express from "express";
import Stripe from "stripe";
import { db } from "../config/db.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const paymentsCollection = db.collection("payments");
const usersCollection = db.collection("users");

/**
 * Create Stripe Checkout Session
 */
router.post("/create-checkout-session", async (req, res) => {
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

      success_url: `http://localhost:3000/payment-success?email=${email}`,

      cancel_url: "http://localhost:3000/dashboard",

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
});

/**
 * Save Payment
 */
router.post("/", async (req, res) => {
  try {
    const payment = req.body;

    const result = await paymentsCollection.insertOne({
      ...payment,
      paid_at: new Date(),
    });

    // Make User Premium
    await usersCollection.updateOne(
      {
        email: payment.user_email,
      },
      {
        $set: {
          isPremium: true,
        },
      }
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
router.get("/", async (req, res) => {
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