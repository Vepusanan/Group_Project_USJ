const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Test database connection
const pool = require("./config/database");

// Health check route
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      error: error.message,
    });
  }
});

// Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/profiles', require('./routes/profiles'));
// app.use('/api/search', require('./routes/search'));
// app.use('/api/connections', require('./routes/connections'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware (must be last)
// app.use(require("./middleware/errorHandler"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
