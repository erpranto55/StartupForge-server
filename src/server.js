import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";

dotenv.config();

import { connectDB } from "./config/db.js";

import userRoutes from "./routes/user.routes.js";
import startupRoutes from "./routes/startup.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import verifyToken from "./middlewares/verifyToken.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/custom-auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/private", verifyToken, (req, res) => {
  res.send({
    success: true,
    message: "Private Route Access Granted",
    user: req.user,
  });
});

app.get("/", (req, res) => {
  res.send("StartupForge Server Running");
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});
