import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import WebSocketRelay from "./services/websocketRelay";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    console.log("Database alive");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

const app = express();
const server = createServer(app);

// ✅ Allow both development and production frontends
const allowedOrigins = [
  "https://app.zerobug.tech",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// ✅ Handle preflight for all routes
app.options(
  "*",
  cors({
    origin: allowedOrigins,
  })
);

// ✅ Testing
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//   })
// );

// // ✅ Handle preflight for all routes
// app.options(
//   "*",
//   cors({
//     origin: "http://localhost:5173",
//   })
// );
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/project", projectRoutes);

// Initialize WebSocket relay
const wsRelay = new WebSocketRelay(server);

// Add stats endpoint for debugging
app.get("/api/ws/stats", (_req, res) => {
  res.json(wsRelay.getConnectionStats());
});

const PORT = process.env.PORT || 3401;

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 WebSocket relay available at ws://localhost:${PORT}/ws`);
});

//Webhook testline 5(*)
