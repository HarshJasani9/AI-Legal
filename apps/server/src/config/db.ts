import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined in the environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }

  // Handle reconnection events
  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
};
