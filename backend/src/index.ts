import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL!);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

const app = express();

// ✅ Only allow production frontend
app.use(
  cors({
    origin: "https://app.zerobug.tech",
  })
);

// ✅ Handle preflight for all routes
app.options(
  "*",
  cors({
    origin: "https://app.zerobug.tech",
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

//Webhook testline 2
