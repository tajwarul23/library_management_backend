import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../Models/User.model.js";
dotenv.config();

export const Authenticated = async (req, res, next) => {
  try {
    const token = req.header("Auth");

  if (!token) {
    return res.json({ message: "Login is Required..!" });
  }

  //verify the token we got from the login header and the secret key we have set on login function
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const id = decoded.userId;

  let user = await User.findById(id);
  if (!user) {
    return res
      .status(401)
      .json({ message: "User doesn't exist..!", status: false });
  }

  //the verified user is now saved to req.user
  req.user = user;

  next();
  } catch (error) {
      if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        expired: true   
      });
    }
  }
};

export const Authorize = (allowedRoles) => (req, res, next) => {
  const user = req.user;
  if (!allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: "Forbidden", status: false });
  }
  next();
};
