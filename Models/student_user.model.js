import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: {
    type: String,
    required: true,
    match: [/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number"],
  },
  role: {
    type: String,
    default: "Student",
  },
  studentId: { type: String, required: true },
  department: { type: String, enum: ["CSE", "EEE", "CE"], required: true },
  fine: {
    type: Number,
    default: 0,
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("student_user", userSchema);
