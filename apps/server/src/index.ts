import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { User } from "@repo/shared";
import { connectDB } from "./config/db";
import contractsRouter from "./routes/contracts";
import "./jobs/analyze.job";

export const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/contracts", contractsRouter);

// Routes
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/user", (req: Request, res: Response) => {
  const user: User = { id: "1", name: "Alice", email: "alice@example.com" };
  res.json(user);
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

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
