import express from "express";
import { changePassword, getProfile , updateProfile } from "../Controllers/User.controller.js";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";

const router = express.Router();

//get user profile
router.get("/profile",Authenticated, Authorize(["Admin", "Student"]), getProfile);

//change password
router.patch("/updatePassword",Authenticated, Authorize(["Admin", "Student"]), changePassword)


//update profile
router.patch("/update-profile",Authenticated, Authorize(["Admin", "Student"]), updateProfile)

export default router;