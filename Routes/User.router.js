import express from "express";
import { getBooksForStudent, loginUser, registerUser, verifyEmail } from "../Controllers/User.controller.js";
import { Authenticated, Authorize } from "../Middlewares/Auth.js";

const router = express.Router();

//register user
router.post("/register", registerUser);

//login user
router.post("/login", loginUser)

//verify email
router.get("/verify-email", verifyEmail)

//get book details for student
router.get("/books", Authenticated, Authorize(["Student"]), getBooksForStudent)
export default router;
