import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "student_user" },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
  notified: { type: Boolean, default: false }, // for best practice
  createdAt: { type: Date, default: Date.now },
});

export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
