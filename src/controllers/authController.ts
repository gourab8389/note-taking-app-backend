import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../types';

const authService = new AuthService();

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOTP(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleLogin(req.user);
      const redirectUrl = `${process.env.CLIENT_URL}/auth/google/success?token=${result.token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      const errorUrl = `${process.env.CLIENT_URL}/auth/google/error`;
      res.redirect(errorUrl);
    }
  }

  async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.resendOTP(email);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}