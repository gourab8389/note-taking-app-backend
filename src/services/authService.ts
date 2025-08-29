import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { sendOTPEmail } from './emailService';
import { generateOTP } from '../utils/otpGenerator';
import { CreateUserData, LoginData, VerifyOTPData } from '../types';

const prisma = new PrismaClient();

export class AuthService {
  async signup(data: CreateUserData) {
    const { email, name, password } = data;

    // Input validation
    if (!email || !name || !password) {
      throw new Error('Email, name, and password are required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }, // Normalize email
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(), // Normalize email
        name: name.trim(), // Trim whitespace
        password: hashedPassword,
        otp,
        otpExpiry,
        isEmailVerified: false, // Explicitly set
      },
    });

    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail the signup, but log the error
      // You might want to implement a retry mechanism
    }

    return {
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      userId: user.id,
    };
  }

  async verifyOTP(data: VerifyOTPData) {
    const { email, otp } = data;

    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new Error('No OTP found for this user. Please request a new one.');
    }

    if (user.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      throw new Error('OTP has expired. Please request a new one.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    const token = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    });

    return {
      message: 'Email verified successfully',
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        isEmailVerified: updatedUser.isEmailVerified,
      },
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user signed up with Google (no password)
    if (!user.password && user.googleId) {
      throw new Error('This account was created with Google. Please sign in with Google.');
    }

    if (!user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      // Generate new OTP for unverified users
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpiry },
      });

      try {
        await sendOTPEmail(user.email, otp, user.name);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      throw new Error('Please verify your email first. A new verification code has been sent.');
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async googleLogin(user: any) {
    if (!user || !user.id || !user.email) {
      throw new Error('Invalid user data from Google');
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      throw new Error('User not found in database');
    }

    const token = generateToken({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    });

    return {
      message: 'Google login successful',
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        isEmailVerified: dbUser.isEmailVerified,
      },
    };
  }

  async resendOTP(email: string) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    try {
      await sendOTPEmail(email, otp, user.name);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      throw new Error('Failed to send OTP. Please try again later.');
    }

    return { message: 'OTP resent successfully' };
  }

  async getProfile(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isEmailVerified: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.avatar && { avatar: data.avatar }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async initiatePasswordReset(email: string) {
    if (!email) {
      throw new Error('Email is required');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    if (user.googleId && !user.password) {
      throw new Error('This account was created with Google. Password reset is not applicable.');
    }

    // Generate reset token (you'd need to implement this)
    // const resetToken = generateResetToken();
    // await sendPasswordResetEmail(email, resetToken, user.name);

    return { message: 'If the email exists, a reset link has been sent.' };
  }
}