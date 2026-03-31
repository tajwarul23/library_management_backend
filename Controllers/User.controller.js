/**
 * -----Common Features Between Admin and student
 * Get Profile
 * Update Profile
 */

import { User } from "../Models/student_user.model.js"
import { transporter } from "../Utils/transporter.js";
import bcrypt from "bcryptjs";
import validator from "validator"
import dotenv from "dotenv";
dotenv.config();

//get profile
export const getProfile = async(req, res)=>{
    try {
        const user = await User.findById(req.user._id).select("-password -verificationToken -verificationExpiry");
        
        if(!user){
            res.status(404).json({message:"User not found", success:false});
        }
        res.status(200).json({success:true,data:user})
    } catch (error) {
        res.status(401).json({message:"Error in get profile", err:error.message})
    }
}

//changePassword
export const changePassword = async (req, res)=>{
    try {
        const{currentPassword, newPassword, confirmPassword} = req.body;

        //validate input
        if(!currentPassword || !newPassword || !confirmPassword){
            return res.status(400).json({message:"All fields are required..!", success:false})
        }
        if(newPassword !== confirmPassword){
            return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
        }
        //get user
        const user = await User.findById(req.user._id);
        if(!user){
            return res.status(404).json({message:"User not found..!", success:false})
        }
        //check if current password is currect
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch){
            return res.status(400).json({success:false, message:"Current Password is incorrect..!"})
        }
        //check if new password is same as current
        const isSame = await bcrypt.compare(newPassword, user.password);
        if(isSame){
            return res.status(400).json({success:false, message:"New Password must be different..!"})
        }
        //validate new password
        if(!validator.isStrongPassword(newPassword,{minLength:8, minLowercase:1, minUppercase:1, minNumbers:1, minSymbols:1})){
            return res.status(400).json({
                success:false,
              message: "Password must contain at least 8 characters with 1 lowercase, 1 uppercase, 1 number, and 1 symbol"
      });
        }

        await User.findByIdAndUpdate(user._id,{
            password:await bcrypt.hash(newPassword, 10)
        });

    try {
            await transporter.sendMail({
            from:"SEC Library",
            to:user.email,
            subject:"Password Changed Successfully..!",
            html:`  <h2>Password Changed</h2>
    <p>Your password was successfully changed.</p>
    <p>If this was not you, please contact support immediately.</p>
    <br/>
    <small>Time: ${new Date().toLocaleString()}</small>`
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error sending mail in changing password", error: error.message });
    }
        return res.status(200).json({success:true, message:"Password changed successfully..!"})
    }  catch (error) {
    return res.status(500).json({ success: false, message: "Error changing password", error: error.message });
  }
}

//updateProfile

export const updateProfile = async (req, res) => {
  try {
    const { name, email, department } = req.body;

    // 1. Validate required fields
    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Department are required!",
      });
    }

    // 2. Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3. Validate department enum
    const validDepartments = ["CSE", "EEE", "Civil"];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department selected",
      });
    }

    // 4. Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // 5. Check email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Email already in use!",
      });
    }

    // 6. Update allowed fields only
    user.name = name;
    user.email = email;
    user.department = department;

    await user.save();

    // 7. Return updated user (without sensitive data)
    const updatedUser = await User.findById(user._id).select(
      "-password -verificationToken -verificationTokenExpiry"
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};