/**
 * EmPay — Email Service
 * Handles sending verification emails using nodemailer
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Logging helper
const logEmail = (msg) => {
  const logDir = path.join(__dirname, '../../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logPath = path.join(logDir, 'email.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
};

// Create transporter using SMTP from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.log('SMTP Configuration Error:', error.message);
    } else {
      console.log('SMTP Server is ready to take messages');
    }
  });
} else {
  console.log('ℹ️  SMTP not configured. Running in Development/Mock mode.');
}

/**
 * Generate a random verification token
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send verification email to user
 * @param {string} email - User email address
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 */
async function sendVerificationEmail(email, token, firstName) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  // Log to persistent file
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logPath = path.join(logDir, 'email.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] URL for ${email}: ${verificationUrl}\n`);

  // Log verification URL to console for development (when email not configured)
  console.log('\n📧 ==========================================');
  console.log(`📧 Verification Email for: ${email}`);
  console.log(`📧 Name: ${firstName}`);
  console.log(`📧 Verification URL: ${verificationUrl}`);
  console.log('📧 ==========================================\n');

  // Skip actual email sending if SMTP not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('ℹ️  SMTP not configured. Copy the verification URL above to verify manually.');
    return { success: true, messageId: 'dev-mode-logged' };
  }

  const mailOptions = {
    from: `"EmPay HRMS" <${process.env.SMTP_USER || 'noreply@empay.dev'}>`,
    to: email,
    subject: 'Verify your EmPay account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">EmPay</h1>
            <p style="color: #6B7280; margin: 5px 0 0 0;">HRMS Platform</p>
          </div>
          
          <h2 style="color: #111827; margin-bottom: 20px;">Welcome, ${firstName}!</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
            Thank you for creating an account with EmPay. To complete your registration and start using our HRMS platform, please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            Or copy and paste this link into your browser:
          </p>
          
          <p style="background-color: #F3F4F6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #4B5563;">
            ${verificationUrl}
          </p>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-top: 20px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
            © 2025 EmPay HRMS. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Welcome to EmPay, ${firstName}!\n\nPlease verify your email by clicking this link: ${verificationUrl}\n\nThis link expires in 24 hours.`,
  };

  try {
    logEmail(`Attempting to send email to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    logEmail(`SUCCESS: Verification email sent to ${email}. MessageID: ${info.messageId}`);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logEmail(`ERROR: Failed to send to ${email}. Error: ${error.message}`);
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

/**
 * Send welcome email after verification
 * @param {string} email - User email address
 * @param {string} firstName - User's first name
 */
async function sendWelcomeEmail(email, firstName) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const mailOptions = {
    from: `"EmPay HRMS" <${process.env.SMTP_USER || 'noreply@empay.dev'}>`,
    to: email,
    subject: 'Your EmPay account is now active',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">EmPay</h1>
            <p style="color: #6B7280; margin: 5px 0 0 0;">HRMS Platform</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <div style="background-color: #10B981; color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 30px;">
              ✓
            </div>
          </div>
          
          <h2 style="color: #111827; text-align: center; margin-bottom: 20px;">Email Verified!</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
            Hi ${firstName}, your email has been successfully verified. Your EmPay account is now active and ready to use.
          </p>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
            You can now access all features of the HRMS platform including:
          </p>
          
          <ul style="color: #4B5563; line-height: 1.8; margin-bottom: 20px;">
            <li>Payroll management and payslip access</li>
            <li>Attendance tracking and clock-in/out</li>
            <li>Leave requests and approvals</li>
            <li>Employee profile management</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}/login" 
               style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Go to Login
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
            © 2025 EmPay HRMS. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName}, your email has been verified! You can now log in at ${frontendUrl}/login`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

async function sendPasswordResetEmail(email, token, firstName) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"EmPay HRMS" <${process.env.SMTP_USER || 'noreply@empay.dev'}>`,
    to: email,
    subject: 'Reset your EmPay password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3B82F6; margin: 0;">EmPay</h1>
            <p style="color: #6B7280; margin: 5px 0 0 0;">HRMS Platform</p>
          </div>
          
          <h2 style="color: #111827; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
            Hi ${firstName}, we received a request to reset your EmPay password. Click the button below to choose a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
            Or copy and paste this link into your browser:
          </p>
          
          <p style="background-color: #F3F4F6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #4B5563;">
            ${resetUrl}
          </p>
          
          <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-top: 20px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
            © 2025 EmPay HRMS. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `Hi ${firstName}, reset your EmPay password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
