import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateSignup = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateOTP = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

export const validateNote = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};