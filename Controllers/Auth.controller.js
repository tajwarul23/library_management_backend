import { User } from "../Models/User.model.js";
import { Student } from "../Models/Student.model.js";
import crypto from "crypto"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { transporter } from "../Utils/transporter.js";
import validator from "validator"
dotenv.config();

//register user[only student]
export const registerUser = async (req, res) => {
  const { name, email, password, studentId, department } = req.body;

  try {
    if(!validator.isEmail(email)){
      return res.status(401).json({message:"Input a valid Email", success:false});
    }
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
    if(!validator.isStrongPassword(password, {minLength:8, minLowercase:1, minUppercase:1, minSymbols:1, minNumbers:1})){
        return res.status(401).json({message:"Password must contain at least 8 characters with 1 lowercase, 1 uppercase, 1 number, and 1 symbol", success:false});
    }
    //hash the user password
    const hashPassword = await bcrypt.hash(password, 10);

    //generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) //24 hrs

    //create and save user to the db
    user = await User.create({
      name,
      email,
      password: hashPassword,
      studentId,
      department,
      verificationToken,
      verificationTokenExpiry
    });

    //send verification email
    const verificationUrl = `${process.env.BACKEND_URL}/verify-email?token=${verificationToken}`

    await transporter.sendMail({
      from:"SEC Library",
      to:email,
      subject:"Verify your Email Address",
      html:`<h2>Welcome, ${name}!</h2>
        <p>Click the button below to verify your email. This link expires in <strong>24 hours</strong>.</p>
        <a href="${verificationUrl}" style="padding:10px 20px; background:#4F46E5; color:white; border-radius:5px; text-decoration:none;">
          Verify Email
        </a>
        <p>Or copy this link: ${verificationUrl}</p>`
    })
    res.status(200).json({
      message: "User Registered Successfully! Please Check your email to verify your account",
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

//verification route handler
export const verifyEmail = async(req, res)=>{
  const {token} = req.query;
  try {
    const user = await User.findOne({verificationToken:token, verificationTokenExpiry:{$gt: Date.now()}});
    if(!user){
      return res.status(400).json({message:"Invalid or expired verification token"})
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
     res.status(200).json({ message: "Email verified successfully! You can now log in.", success: true });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email", success: false, err: error.message });
  }
}

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
    
    if(!user.isVerified){
      return res.status(403).json({ message: "Please verify your email before logging in.", success: false });
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


//forget password

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      to: user.email,
      from: "SEC Library",
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset your password (valid for 15 minutes)</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If not requested, ignore this email.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Reset link sent to email",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in forgot password",
      error: error.message,
    });
  }
};



//reset-password

export const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { newPassword, confirmPassword } = req.body;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "Password is not strong enough",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token expired or invalid",
      });
    }

    // hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    // clear token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully!",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

//logout user [admin, student]
