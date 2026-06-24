import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();


import { connectDB } from "./config/db.js";


const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("StartupForge Server Running");
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running On ${PORT}`);
});
