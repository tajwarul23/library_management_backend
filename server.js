import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
dotenv.config();

import studentRouter from "./Routes/Student.router.js";
import adminRouter from "./Routes/Admin.router.js";
import authRouter from "./Routes/Auth.routes.js";
import userRouter from "./Routes/User.router.js";
import { startCronJobs } from "./Jobs/CronJobs.js";
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

    //port listening
    app.listen(port, () => {
      console.log(`listening to ${port}`);
      startCronJobs();
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error =>", err);
  });

//home testing route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from home route", success: true });
});
//auth router
app.use("/api/auth", authRouter);

//student router
app.use("/api/student", studentRouter);

//admin router
app.use("/api/admin", adminRouter);

//user router[student, admin]
app.use("/api/user", userRouter);

//verification
