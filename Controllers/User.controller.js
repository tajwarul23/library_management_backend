/**
 * -----Common Features Between Admin and student
 * Get Profile
 * Update Profile
 */

import { User } from "../Models/User.model.js"

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

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.status(200).json({success:true, message:"Password changed successfully..!"})
    }  catch (error) {
    res.status(500).json({ success: false, message: "Error changing password", error: error.message });
  }
}

//updateProfile