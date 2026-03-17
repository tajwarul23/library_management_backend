import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Student", "Admin"],
    default: "Student",
  },
  studentId: { type: String, required: true },
  department:{type:String, enum:["CSE", "EEE", "Civil"], required:true},
  isVerified:{type:Boolean, default:false},
  verificationToken :{type: String},
  verificationTokenExpiry :{type: Date},
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
