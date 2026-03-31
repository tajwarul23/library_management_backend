import express from "express";
import { loginUser, student_register , admin_register ,  verifyEmail , forgotPassword , resetPassword } from "../Controllers/Auth.controller.js";


const router = express.Router();

//registration for student
router.post("/student/registration", student_register);

//registration for admin
router.post("/admin/registration", admin_register);

//login user
router.post("/login", loginUser)

//verify email
router.get("/verify-email", verifyEmail)

//forget password
router.post("/forgot/password", forgotPassword)

//reset-password
router.post("/password/reset" , resetPassword)


export default router

