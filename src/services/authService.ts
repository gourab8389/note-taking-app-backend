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

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        otp,
        otpExpiry,
      },
    });

    await sendOTPEmail(email, otp, name);

    return {
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      userId: user.id,
    };
  }

  async verifyOTP(data: VerifyOTPData) {
    const { email, otp } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new Error('No OTP found for this user');
    }

    if (user.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      throw new Error('OTP has expired');
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
      },
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new Error('Please verify your email first');
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
      },
    };
  }

  async googleLogin(user: any) {
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return {
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  async resendOTP(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
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

    await sendOTPEmail(email, otp, user.name);

    return { message: 'OTP resent successfully' };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}