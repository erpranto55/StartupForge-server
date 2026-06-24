import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

import verifyToken from "./middlewares/verifyToken.js";
app.get(
  "/private",
  verifyToken,
  (req, res) => {
    res.send({
      success: true,
      message: "Private Route Access Granted",
      user: req.user,
    });
  }
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("StartupForge Server Running");
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});
