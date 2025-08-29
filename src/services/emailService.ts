import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendOTPEmail = async (email: string, otp: string, name: string): Promise<void> => {
  const subject = 'Your OTP for Note Taking App';
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 10px;">
    <!-- Header -->
    <div style="text-align: center; padding: 10px 0; border-bottom: 1px solid #eaeaea;">
      <h2 style="margin: 0; color: #007bff;">Note Taking App</h2>
    </div>

    <!-- Body -->
    <div style="padding: 20px; color: #333;">
      <p style="font-size: 16px; margin: 0 0 15px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 15px; margin: 0 0 20px;">Thank you for signing up! Your OTP for email verification is:</p>

      <!-- OTP Box -->
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; padding: 15px 30px; font-size: 28px; font-weight: bold; color: #ffffff; background: linear-gradient(90deg, #007bff, #0056b3); border-radius: 8px;">
          ${otp}
        </span>
      </div>

      <p style="font-size: 14px; margin: 0 0 15px;">This OTP will expire in <strong>10 minutes</strong>.</p>
      <p style="font-size: 14px; margin: 0 0 15px; color: #666;">If you didn’t request this, you can safely ignore this email.</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 15px; border-top: 1px solid #eaeaea; font-size: 13px; color: #888;">
      <p style="margin: 0;">Best regards,<br><strong>Note Taking App Team</strong></p>
    </div>
  </div>
`;


  try {
    if (resend) {
      await resend.emails.send({
        from: 'Note Taking App <noreply@yourdomain.com>',
        to: [email],
        subject,
        html,
      });
    } else {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        html,
      });
    }
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};