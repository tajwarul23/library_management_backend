import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    default: "Admin",
  },
  isVerified:{type:Boolean, default:false},
  verificationToken :{type: String},
  verificationTokenExpiry :{type: Date},
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const admin_user = mongoose.model("admin_user", userSchema);
export const AdminUser = admin_user;
