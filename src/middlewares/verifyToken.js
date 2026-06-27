import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

const usersCollection = db.collection("users");

const verifyToken = async (req, res, next) => {
  console.log(`[verifyToken] Incoming Request: ${req.method} ${req.originalUrl}`);
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  console.log("Cookies:", req.cookies);
  console.log("Token:", token);
  if (!token) {
    console.log("[verifyToken] No token found");
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await usersCollection.findOne({ email: decoded.email });

    if (!user) {
      return res.status(401).send({
        message: "Unauthorized Access",
      });
    }

    if (user.isBlocked) {
      return res.status(403).send({
        message: "Account is blocked",
      });
    }

    req.user = {
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      userId: user._id?.toString(),
    };

    next();
  } catch {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }
};

export default verifyToken;
