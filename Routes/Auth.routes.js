import express from "express";
import { adminLogin, loginUser, studentLogin, student_register , admin_register ,  verifyEmail , forgotPassword , resetPassword } from "../Controllers/Auth.controller.js";


const router = express.Router();

//registration for student
router.post("/student/registration", student_register);

//registration for admin
router.post("/admin/registration", admin_register);

//login student
router.post("/student/login", studentLogin)

//login admin
router.post("/admin/login", adminLogin)

//backward compatible login route
router.post("/login", loginUser)

//verify email
router.get("/verify-email", verifyEmail)

//forget password
router.post("/forgot/password", forgotPassword)

//reset-password
router.post("/password/reset" , resetPassword)


export default router

