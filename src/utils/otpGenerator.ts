export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isOTPExpired = (otpExpiry: Date): boolean => {
  return new Date() > otpExpiry;
};