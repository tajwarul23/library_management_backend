import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, trim: true, unique: true },
    totalCopies: { type: Number, required: true, min: 0 },
    availableCopies: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ["CSE", "EEE", "CE", "PHYSICS", "CHEMISTRY", "GENERAL"],
      default: "GENERAL",
    },
  },
  { timestamps: true },
);

export const Book = mongoose.model("Book", bookSchema);
