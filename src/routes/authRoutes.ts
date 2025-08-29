import { Router, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth';
import {
  validateSignup,
  validateLogin,
  validateOTP,
  handleValidationErrors,
} from '../middleware/validation';
import passport from '../services/googleAuth';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';

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

// Regular auth routes
router.post('/signup', 
  authRateLimit, 
  validateSignup, 
  handleValidationErrors, 
  authController.signup.bind(authController)
);

router.post('/verify-otp', 
  authRateLimit, 
  validateOTP, 
  handleValidationErrors, 
  authController.verifyOTP.bind(authController)
);

router.post('/login', 
  authRateLimit, 
  validateLogin, 
  handleValidationErrors, 
  authController.login.bind(authController)
);

router.post('/resend-otp', 
  otpRateLimit, 
  authController.resendOTP.bind(authController)
);

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false // Add this for consistency
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google_auth_failed`
  }),
  authController.googleCallback.bind(authController)
);

// Profile route
router.get('/profile', 
  authenticate, 
  authController.getProfile.bind(authController) as RequestHandler
);

export default router;