import { User } from "../Models/User.model.js";
import { Student } from "../Models/Student.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

//register user[only student]
export const registerUser = async (req, res) => {
  const { name, email, password, studentId } = req.body;

  try {
    //user with the same email exists or not
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(404)
        .json({ message: "User Already Exists..!", success: false });
    }
    //check if the student has added or not
    let student = await Student.findOne({ studentId });
    if (!student) {
      return res
        .status(404)
        .json({ message: "Invalid Student ID..!", success: false });
    }
    //hash the user password
    const hashPassword = await bcrypt.hash(password, 10);

    //create and save user to the db
    user = await User.create({
      name,
      email,
      password: hashPassword,
      studentId,
    });
    res.status(200).json({
      message: "User Registered Successfully..!",
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(404).json({
      message: "Error in registering user..!",
      success: false,
      err: error.message,
    });
  }
};

//login user [admin, student]
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "All fields are required..!",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "User Not Found..!",
        success: false,
      });
    }
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Incorrect Credentials..!",
        success: false,
      });
    }

    //after log in generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.status(200).json({
      message: `Welcome ${user.name}`,
      success: true,
      token: token,
      role: user.role,
    });
  } catch (error) {
    res.status(401).json({
      message: "Error in log in user..!",
      err: error.message,
      success: false,
    });
  }
};
