const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
 try {

   // Get token from header
   const token = req.header("Authorization");

   if (!token) {
      return res.status(401).json({
         message: "Access denied. No token provided."
      });
   }

   // Verify token
   const decoded = jwt.verify(token, process.env.JWT_SECRET);

   // Attach user to request
   req.user = decoded;

   next();

 } catch (error) {

   res.status(401).json({
      message: "Invalid token"
   });

 }
};

module.exports = authMiddleware;
