import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  }),
);

//mongodb connection

mongoose
  .connect(process.env.DB_URL, { dbName: "SEC_Library_Management" })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully..!");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error =>", err);
  });
app.listen(port, () => {
  console.log(`listening to ${port}`);
});
