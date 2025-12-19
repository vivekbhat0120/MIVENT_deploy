const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "photoflow-demo-secret";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user; // user contains { sub: userId, email, ... }
    next();
  });
};

module.exports = { authenticateToken };
