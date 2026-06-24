import express from "express";
import { db } from "../config/db.js";

const router = express.Router();

const usersCollection =
  db.collection("users");


// Create User
router.post("/", async (req, res) => {
  try {
    const user = req.body;

    const existingUser =
      await usersCollection.findOne({
        email: user.email,
      });

    if (existingUser) {
      return res.send({
        message: "User already exists",
      });
    }

    const result =
      await usersCollection.insertOne({
        ...user,
        isBlocked: false,
        createdAt: new Date(),
      });

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});


// Get All Users
router.get("/", async (req, res) => {
  try {
    const users =
      await usersCollection
        .find()
        .toArray();

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});


// Get User By Email
router.get(
  "/:email",
  async (req, res) => {
    try {
      const email =
        req.params.email;

      const user =
        await usersCollection.findOne({
          email,
        });

      res.send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

export default router;