import express from "express";
import { changePassword, getProfile } from "../Controllers/User.controller.js";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";

const router = express.Router();

//get user profile
router.get("/profile",Authenticated, Authorize(["Admin", "Student"]), getProfile);

//change password
router.post("/changePassword",Authenticated, Authorize(["Admin", "Student"]), changePassword)

export default router;