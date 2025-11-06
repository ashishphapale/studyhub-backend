const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// =========================
// Middleware Configuration
// =========================
app.use(express.json({ limit: "10mb" })); // handle large JSON bodies safely
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500"], // adjust for frontend dev server
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression()); // improves performance
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded files

// =========================
// Basic Route
// =========================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "✅ StudyHub Backend is Running!",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// =========================
// API Routes
// =========================
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

// =========================
// Handle 404 - Unknown Routes
// =========================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "❌ Route not found",
    path: req.originalUrl,
  });
});

// =========================
// Global Error Handler
// =========================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// =========================
// Graceful Shutdown
// =========================
process.on("SIGINT", async () => {
  console.log("\n🧹 Gracefully shutting down server...");
  server.close(() => {
    console.log("💤 Server closed. Disconnecting MongoDB...");
    process.exit(0);
  });
});
