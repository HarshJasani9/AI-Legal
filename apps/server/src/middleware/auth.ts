import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid Bearer token" });
    }

    const token = authHeader.split(" ")[1];
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      console.error("CLERK_SECRET_KEY is missing from environment variables.");
      return res.status(500).json({ error: "Internal server error" });
    }

    const payload = await verifyToken(token, {
      secretKey: secretKey,
    });

    // Attach the verified userId to the request
    req.auth = {
      userId: payload.sub,
    };

    next();
  } catch (error) {
    console.error("Clerk token verification failed:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
