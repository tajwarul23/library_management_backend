/**
 * -----Common Features Between Admin and student
 * Get Profile
 * Update Profile
 */

import { User } from "../Models/User.model.js"

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