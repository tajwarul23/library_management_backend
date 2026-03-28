import express from "express";
import { getProfile } from "../Controllers/User.controller.js";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";

const router = express.Router();

//get user profile
router.get("/profile",Authenticated, Authorize(["Admin", "Student"]), getProfile)

export default router;