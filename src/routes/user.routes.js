import express from "express";
import { db } from "../config/db.js";
import { ObjectId } from "mongodb";
import verifyToken from "../middlewares/verifyToken.js";
import verifyRole from "../middlewares/verifyRole.js";

const router = express.Router();

const usersCollection = db.collection("users");

// Create User
router.post("/", async (req, res) => {
  try {
    const user = req.body;

    const existingUser = await usersCollection.findOne({
      email: user.email,
    });

    if (existingUser) {
      return res.send({
        message: "User already exists",
      });
    }

    const result = await usersCollection.insertOne({
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
router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const users = await usersCollection.find().toArray();

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get User By Email
router.get("/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const user = await usersCollection.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.patch("/block/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const result = await usersCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          isBlocked: true,
        },
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/unblock/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const result = await usersCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          isBlocked: false,
        },
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch("/role/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const id = req.params.id;

    const { role } = req.body;

    const result = await usersCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          role,
        },
      },
    );

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;

