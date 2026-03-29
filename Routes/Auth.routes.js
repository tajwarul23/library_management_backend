import express from "express";
import { loginUser, registerUser, verifyEmail , forgotPassword , resetPassword } from "../Controllers/Auth.controller.js";


const router = express.Router();

//register user
router.post("/register", registerUser);

//login user
router.post("/login", loginUser)

//verify email
router.get("/verify-email", verifyEmail)

//forget password
router.post("/forgot/password", forgotPassword)

//reset-password
router.post("/password/reset" , resetPassword)


export default router

