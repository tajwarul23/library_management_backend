import express from "express";
import { loginUser, registerUser, verifyEmail } from "../Controllers/Auth.controller.js";


const router = express.Router();

//register user
router.post("/register", registerUser);

//login user
router.post("/login", loginUser)

//verify email
router.get("/verify-email", verifyEmail)
export default router

