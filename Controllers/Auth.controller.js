import { User } from "../Models/student_user.model.js";
import { AdminUser } from "../Models/admin_user.model.js";
import { Student } from "../Models/Student.model.js";
import crypto from "crypto"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { transporter } from "../Utils/transporter.js";
import validator from "validator"
dotenv.config();


// hashing the token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getAuthBaseUrl = () => {
  let url = process.env.BACKEND_URL || "http://localhost:5000";

  // remove ending slash (if any)
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  // add /api/auth if not already present
  if (!url.endsWith("/api/auth")) {
    url += "/api/auth";
  }

  return url;
};


// checking user already exist or not
const findUserByEmail = async (email) => {
  const student = await User.findOne({ email });
  if (student) return student;
  const admin = await AdminUser.findOne({ email });
  return admin;
};


//checking user is student or admin
const findUserByEmailAndRole = async (email, role) => {
  if (role === "Student") {
    return User.findOne({ email, role: "Student" });
  }

  return AdminUser.findOne({ email, role: "Admin" });
};



const findUserByVerificationToken = async (token) => {
  if (!token) return null;
  const hashedToken = hashToken(token);
  const student = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpiry: { $gt: Date.now() },
  });
  if (student) return student;
  const admin = await AdminUser.findOne({
    verificationToken: hashedToken,
    verificationTokenExpiry: { $gt: Date.now() },
  });
  return admin;
};




const findUserByResetToken = async (token) => {
  if (!token) return null;
  const hashedToken = hashToken(token);
  const student = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });
  if (student) return student;
  const admin = await AdminUser.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });
  return admin;
};

//register user[only student]
export const student_register = async (req, res) => {
  const { name, email, password, phone, studentId, department } = req.body;

  try {
    if (!name || !email || !password || !phone || !studentId || !department) {
      return res.status(400).json({
        message: "All fields are required..!",
        success: false,
      });
    }

    if(!validator.isEmail(email)){
      return res.status(400).json({message:"Input a valid Email", success:false});
    }

    if (!/^01[3-9]\d{8}$/.test(phone)) {
      return res.status(400).json({
        message: "Enter a valid Bangladeshi phone number",
        success: false,
      });
    }

    if (!["CSE", "EEE", "CE"].includes(department)) {
      return res.status(400).json({
        message: "Department must be one of CSE, EEE, CE",
        success: false,
      });
    }

    //user with the same email exists or not
    let user = await findUserByEmail(email);
    if (user) {
      return res
        .status(409)
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
        return res.status(400).json({message:"Password must contain at least 8 characters with 1 lowercase, 1 uppercase, 1 number, and 1 symbol", success:false});
    }
    //hash the user password
    const hashPassword = await bcrypt.hash(password, 10);

    //generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) //24 hrs

    //create and save user to the db
    user = await User.create({
      name,
      email,
      password: hashPassword,
      phone,
      studentId,
      department,
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry
    });

    //send verification email
    const verificationUrl = `${getAuthBaseUrl()}/verify-email?token=${verificationToken}`

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify your Email Address",
        html: `<h2>Welcome, ${name}!</h2>
          <p>Click the button below to verify your email. This link expires in <strong>24 hours</strong>.</p>
          <a href="${verificationUrl}" style="padding:10px 20px; background:#4F46E5; color:white; border-radius:5px; text-decoration:none;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>`
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      console.error(`❌ Email send failed for ${email}:`, emailError.message);
      return res.status(500).json({
        message: "User registered but email could not be sent. Check email configuration.",
        success: false,
        err: emailError.message,
      });
    }

    res.status(201).json({
      message: "User Registered Successfully! Please Check your email to verify your account",
      success: true,
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in registering user..!",
      success: false,
      err: error.message,
    });
  }
};



//register admin
export const admin_register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required..!",
        success: false,
      });
    }

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ message: "Input a valid Email", success: false });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User Already Exists..!", success: false });
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minSymbols: 1,
        minNumbers: 1,
      })
    ) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters with 1 lowercase, 1 uppercase, 1 number, and 1 symbol",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const admin = await AdminUser.create({
      name,
      email,
      password: hashPassword,
      role: "Admin",
      verificationToken: hashedVerificationToken,
      verificationTokenExpiry,
    });

    const verificationUrl = `${getAuthBaseUrl()}/verify-email?token=${verificationToken}`;
    const admin_email = "kawser.hamim.";
    
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: admin_email,
        subject: "Verify your Email Address",
        html: `<h2>Welcome, ${name}!</h2>
          <p>Click the button below to verify your email. This link expires in <strong>24 hours</strong>.</p>
          <a href="${verificationUrl}" style="padding:10px 20px; background:#4F46E5; color:white; border-radius:5px; text-decoration:none;">
            Verify Email
          </a>
          <p>Or copy this link: ${verificationUrl}</p>`,
      });
      console.log(`✅ Admin verification email sent to ${admin_email}`);
    } catch (emailError) {
      console.error(`❌ Admin email send failed:`, emailError.message);
      return res.status(500).json({
        message: "Admin registered but email could not be sent. Check email configuration.",
        success: false,
        err: emailError.message,
      });
    }

    return res.status(201).json({
      message: "Admin Registered Successfully! Please Check your email to verify your account",
      success: true,
      user: admin,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error in registering admin..!",
      success: false,
      err: error.message,
    });
  }
};




//verification route handler
export const verifyEmail = async(req, res)=>{
  const {token} = req.query;
  try {
    if (!token) {
      return res.status(400).json({ message: "Verification token is required", success: false });
    }
    const user = await findUserByVerificationToken(token);
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



const loginWithRole = async (req, res, role) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required..!",
        success: false,
      });
    }
    const user = await findUserByEmailAndRole(email, role);
    if (!user) {
      return res.status(401).json({
        message: `${role} not found..!`,
        success: false,
      });
    }
    // if(!user.isva)
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
    res.status(500).json({
      message: `Error in log in ${role.toLowerCase()}..!`,
      err: error.message,
      success: false,
    });
  }
};

//login student
export const studentLogin = async (req, res) => {
  return loginWithRole(req, res, "Student");
};

//login admin
export const adminLogin = async (req, res) => {
  return loginWithRole(req, res, "Admin");
};

//backward compatible login route
export const loginUser = async (req, res) => {
  return loginWithRole(req, res, "Student");
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

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = hashToken(resetToken);

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset Request",
        html: `
          <h2>Password Reset</h2>
          <p>Click below to reset your password (valid for 15 minutes)</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If not requested, ignore this email.</p>
        `,
      });
      console.log(`✅ Password reset email sent to ${user.email}`);
      return res.status(200).json({
        success: true,
        message: "Reset link sent to email",
      });
    } catch (emailError) {
      console.error(`❌ Password reset email failed for ${user.email}:`, emailError.message);
      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Check email configuration.",
        error: emailError.message,
      });
    }

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

    const user = await findUserByResetToken(token);

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
