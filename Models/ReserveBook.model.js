import mongoose from "mongoose";

const reserveBookSchema = new mongoose.Schema({
    //which book
    book:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Book",
        required:true
    },

    //which user
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    },

    status:{
        type:String,
        enum:["pending", "issued", "cancelled", "expired"],
        default:"pending"
    },
    reservedAt:{
        type:Date,
        default:Date.now
    },
    expiresAt:{
        type:Date,
        required:true
    },
    cancelledAt:{
        type:Date,
        default:null
    }

    
},{timestamps:true})



export const ReserveBook =  mongoose.model("ReservedBook", reserveBookSchema);