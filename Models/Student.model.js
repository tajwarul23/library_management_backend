import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true, unique: true },
  session: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}$/, "Session must be like 2020-21"],
  },
  department: { type: String, enum: ["CSE", "EEE", "CE"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Student = mongoose.model("Student", studentSchema);
