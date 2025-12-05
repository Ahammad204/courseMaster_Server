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

// ---------------
// Serverless MongoDB Connection
// ---------------

let cachedDb = null;

async function ensureDB() {
  if (cachedDb) return cachedDb;
  cachedDb = await connectDB(); // make sure connectDB returns a Promise
  console.log("MongoDB connected");
  return cachedDb;
}

// Ensure DB is connected for *all* requests before routes
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ---------------
// Middlewares
// ---------------
app.use(cors(corsOptions));
app.use(cookieParser());

// Stripe webhook must use raw body and come before express.json
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// JSON body parser for everything else
app.use(express.json());

// ---------------
// Routes
// ---------------
app.get("/", (req, res) => res.send("Server is Running..."));

app.use(authRoutes);
app.use(userRoutes);
app.use(courseRoutes);
app.use(paymentRoutes);
app.use(assignmentRoutes);

// ---------------
// Vercel export
// ---------------
module.exports = app;
// If you're using ESM or Vercel "Express" framework detection, you can also do:
// export default app;
