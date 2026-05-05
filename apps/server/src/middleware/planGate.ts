import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const checkPlanLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure the user exists in our database
    const user = await User.findOrCreate(clerkId);

    // Enforce the 3 contract limit per month for free users
    if (user.plan === 'free' && user.contractsUsed >= 3) {
      return res.status(403).json({ error: 'Free tier limit reached. Upgrade to Pro.' });
    }

    // If they have enough quota (or are PRO), proceed to the next middleware (file upload)
    next();
  } catch (error) {
    console.error('checkPlanLimit error:', error);
    res.status(500).json({ error: 'Internal server error while checking plan limits' });
  }
};
