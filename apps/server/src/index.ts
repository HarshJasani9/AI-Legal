import "dotenv/config";
import "./config/env"; // Validate environment variables immediately
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { User } from "@repo/shared";
import { connectDB } from "./config/db";
import contractsRouter from "./routes/contracts";
import { generalLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import remindersRouter from "./routes/reminders";
import "./jobs/analyze.job";
import "./jobs/reminder.job";
import "./jobs/monthlyReset.job";

export const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply general rate limiting to all requests
app.use(generalLimiter);

app.use("/api/contracts", contractsRouter);
app.use("/api/reminders", remindersRouter);

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/user", (req: Request, res: Response) => {
  const user: User = { id: "1", name: "Alice", email: "alice@example.com" };
  res.json(user);
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }).catch((err) => {
    console.error("Failed to start server due to database connection error:", err);
    process.exit(1);
  });
}
