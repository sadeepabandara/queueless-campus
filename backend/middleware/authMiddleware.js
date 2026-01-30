const jwt = require("jsonwebtoken");

const auth = (roles = []) => {

  // Convert single role into array
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {

    try {

      // ✅ Get Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "Authentication token missing"
        });
      }

      // ✅ Extract token
      const token = authHeader.split(" ")[1];

      // ✅ Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Attach user to request
      req.user = decoded;

      // ✅ Role-based access control
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          message: "You do not have permission to access this resource"
        });
      }

      next();

    } catch (error) {

      console.error("AUTH MIDDLEWARE ERROR:", error.message);

      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }
  };
};

module.exports = auth;