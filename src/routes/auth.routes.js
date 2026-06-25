import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const router = express.Router();
const usersCollection = db.collection("users");

router.post("/jwt", async (req, res) => {
  const { email } = req.body;
  
  const user = await usersCollection.findOne({ email });
  if (!user) {
    return res.status(404).send({ success: false, message: "User not found" });
  }

  const token = jwt.sign({ email: user.email, role: user.role, isBlocked: user.isBlocked }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    })
    .send({
      success: true,
      token,
    });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token").send({
    success: true,
  });
});

export default router;
