// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));

// ✅ FIXED CORS FOR NETLIFY + LOCALHOST
const allowedOrigins = [
  "https://ashishstudyhub.netlify.app", // ✅ your Netlify frontend
  "http://localhost:5500",              // local dev (Live Server)
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("🚫 CORS blocked request from:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Basic route test
app.get("/", (req, res) => {
  res.status(200).json({
    message: "✅ StudyHub Backend is Running!",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
