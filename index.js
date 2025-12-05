require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const corsOptions = require("./config/corsOptions");
const { connectDB } = require("./config/db");

// Routes
const webhookRoutes = require("./routes/webhookRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");

const app = express();

// CORS + cookies
app.use(cors(corsOptions));
app.use(cookieParser());

// ------------------
// Stripe Webhook Route
// ------------------
// Must be before express.json() and use raw body parsing
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// Parse JSON for all other routes
app.use(express.json());

// Root route
app.get("/", (req, res) => res.send("Server is Running..."));

// API routes
app.use(authRoutes);
app.use(userRoutes);
app.use(courseRoutes);
app.use(paymentRoutes);
app.use(assignmentRoutes);

// ------------------
// Serverless MongoDB Connection
// ------------------
let cachedDb = null;

async function connectToDB() {
  if (cachedDb) return cachedDb;
  try {
    cachedDb = await connectDB();
    console.log("MongoDB connected");
    return cachedDb;
  } catch (err) {
    console.error("DB connection failed:", err);
    throw err; // Fail gracefully
  }
}

// Wrap each request to ensure DB is connected
app.use(async (req, res, next) => {
  try {
    await connectToDB();
    next();
  } catch (err) {
    res.status(500).send("Database connection failed");
  }
});

module.exports = app;
