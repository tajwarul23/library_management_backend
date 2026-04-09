// server.js
import dns from "dns";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";



import studentRouter from "./Routes/Student.router.js";
import adminRouter from "./Routes/Admin.router.js";
import authRouter from "./Routes/Auth.routes.js";
import userRouter from "./Routes/User.router.js";
import { startExpireReservationJob } from "./cron/expireservation.js";
import { startExpireReturnBookJob } from "./cron/expirereturnbook.js";

// set DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// load environment variables
dotenv.config();

// create express app
const app = express();


app.use(helmet())


// apply rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,                // max 5 requests per IP per window
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false,  // do not send X-RateLimit-* headers
  message: "Too many requests, try again later",
});
app.use(limiter);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

// test route
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from home route", success: true });
});

// routers
app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

// connect to MongoDB
mongoose
  .connect(process.env.DB_URL, { dbName: "SEC_Library_Management" })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully..!");
    // start server
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
      // start cron jobs
      startExpireReservationJob();
      startExpireReturnBookJob();
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error =>", err);
  });