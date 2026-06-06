require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const { chat, getChatHistory, clearChatHistory } = require("./bot");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_real_secret";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Simple auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// Health check + basic UI route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Simple login - accepts any email, returns JWT. (For demo only)
app.post("/api/login", (req, res) => {
  const { email, name } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email required" });
  }
  const user = { email, name: name || email.split("@")[0] };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
  res.json({ success: true, token, user });
});

// Get current user
app.get("/api/me", authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Chat endpoint (requires auth)
app.post("/api/chat", authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a message! 💬",
      });
    }

    // Prepend small personal note so bot is cute
    const userDisplay = req.user?.name || req.user?.email || "friend";
    const userMessage = `${message}`;

    const result = await chat(userMessage);
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({ success: true, message: result.message, userName: result.userName });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong 😢 Please try again!",
      error: error.message,
    });
  }
});

// Get chat history for logged-in user (for demo, returns whole history)
app.get("/api/history", authenticate, (req, res) => {
  try {
    const history = getChatHistory();
    res.json({
      success: true,
      data: history,
      totalConversations: history.conversations.length,
      userName: history.userProfile.name || req.user.name || req.user.email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving history",
      error: error.message,
    });
  }
});

// Clear chat history (protected)
app.post("/api/history/clear", authenticate, (req, res) => {
  try {
    clearChatHistory();
    res.json({
      success: true,
      message: "Chat history cleared! Starting fresh 🌸",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing history",
      error: error.message,
    });
  }
});

// Serve static files (already configured). Fallback to index for SPA
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error 😢",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cute Chatbot Server is running on port ${PORT}!`);
  console.log(`📌 API: http://localhost:${PORT}`);
  console.log(`💕 Chat endpoint: http://localhost:${PORT}/api/chat`);
});
