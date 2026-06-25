import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized Access",
      });
    }

    if (decoded.isBlocked) {
      return res.status(403).send({
        message: "Account is blocked",
      });
    }

    req.user = decoded;

    next();
  });
};

export default verifyToken;
