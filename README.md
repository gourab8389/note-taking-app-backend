# Note Taking App - Backend

A full-stack note-taking application backend built with Node.js, TypeScript, Express, PostgreSQL, and Prisma.

## Features

- 🔐 JWT Authentication
- 📧 Email OTP Verification
- 🔑 Google OAuth Integration
- 📝 CRUD Operations for Notes
- 🛡️ Security Middleware
- 📊 Input Validation
- 🚀 TypeScript Support
- 🗄️ PostgreSQL with Prisma ORM

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Gmail account (for SMTP) or Resend account
- Google OAuth credentials

## Environment Variables

- `PORT`: The port on which the server will run (default: 5000)
- `DATABASE_URL`: The connection string for the PostgreSQL database
- `JWT_SECRET`: The secret key used for signing JWT tokens
- `GOOGLE_CLIENT_ID`: The client ID for Google OAuth
- `GOOGLE_CLIENT_SECRET`: The client secret for Google OAuth
- `CLIENT_URL`: The URL of the frontend application
- `SMTP_HOST`: The SMTP host for sending emails
- `SMTP_PORT`: The SMTP port for sending emails
- `SMTP_USER`: The SMTP user for sending emails
- `SMTP_PASS`: The SMTP password for sending emails
