import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  validateSignup,
  validateLogin,
  validateOTP,
  handleValidationErrors,
} from '../middleware/validation';
import passport from '../services/googleAuth';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});

const otpRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1,
  message: {
    success: false,
    message: 'Please wait before requesting another OTP.',
  },
});

router.post('/signup', authRateLimit, validateSignup, handleValidationErrors, authController.signup);
router.post('/verify-otp', authRateLimit, validateOTP, handleValidationErrors, authController.verifyOTP);
router.post('/login', authRateLimit, validateLogin, handleValidationErrors, authController.login);
router.post('/resend-otp', otpRateLimit, authController.resendOTP);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), authController.googleCallback);

router.get('/profile', authenticate, authController.getProfile as RequestHandler);

export default router;