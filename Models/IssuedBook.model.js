import mongoose from "mongoose";

const IssuedBookSchema = new mongoose.Schema(
  {
    issuedId:{
      type:String,
      unique:true,
      default: ()=>`IS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    //which book
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    //which user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue"],
      default: "borrowed",
    },
  },
  { timestamps: true },
);

IssuedBookSchema.index({issuedId:1});

export const IssuedBook = mongoose.model("IssuedBook", IssuedBookSchema);
