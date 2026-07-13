import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { repairCandidateAssignments } from "./utils/repairUtility.js";
import path from "path";

dotenv.config();
console.log("Groq ENV =", process.env.GROQ_API_KEY ? "Loaded" : "Missing");

const app = express();

connectDB().then(() => {
  repairCandidateAssignments();
});

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/files loading
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: { message: "Too many requests from this IP, please try again later." },
});
app.use("/api", limiter);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);

app.get("/", (req, res) => {
  res.send("HireTrack API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});