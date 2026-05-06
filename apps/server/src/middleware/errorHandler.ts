import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let error = err.name || 'Error';

  // Handle mongoose errors or other specific errors if needed
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = 'Validation Error';
  }

  // Handle Stripe webhook errors
  if (err.type === 'StripeSignatureVerificationError') {
    statusCode = 400;
    message = 'Invalid Stripe signature';
    error = 'StripeError';
  }

  res.status(statusCode).json({
    error,
    message,
    statusCode,
  });
};
