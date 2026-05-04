import nodemailer from 'nodemailer';
import crypto from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Email verification template
export const getVerificationEmailTemplate = (username: string, otp: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - HorizonFX</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .otp-code {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                padding: 20px;
                border-radius: 8px;
                letter-spacing: 8px;
                margin: 20px 0;
                font-family: monospace;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to HorizonFX!</h1>
        </div>
        <div class="content">
            <h2>Hello ${username},</h2>
            <p>Thank you for registering with HorizonFX. To complete your registration and access our premium trading tools, please verify your email address.</p>
            
            <p>Enter the following 6-digit verification code:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p style="text-align: center; font-weight: bold;">Enter this code on the verification page to activate your account.</p>
            
            <p><strong>Important:</strong> This verification code will expire in 10 minutes for security reasons.</p>
            
            <p>If you didn't create an account with HorizonFX, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 HorizonFX. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
  `;
};

// Send verification email
export const sendVerificationEmail = async (email: string, username: string, otp: string): Promise<boolean> => {
  const emailOptions: EmailOptions = {
    to: email,
    subject: 'Verify Your Email - OTP Code - HorizonFX',
    html: getVerificationEmailTemplate(username, otp)
  };

  return await sendEmail(emailOptions);
};

// Forgot password OTP email template
export const getForgotPasswordOtpEmailTemplate = (username: string, otp: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - HorizonFX</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .otp-code {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                padding: 20px;
                border-radius: 8px;
                letter-spacing: 8px;
                margin: 20px 0;
                font-family: monospace;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>HorizonFX Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${username},</h2>
            <p>We received a request to reset your password. Use the OTP below to proceed.</p>
            
            <p>Your one-time password (OTP) is:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p><strong>Important:</strong> This OTP will expire in 10 minutes.</p>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 HorizonFX. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
  `;
};

// New password email template
export const getNewPasswordEmailTemplate = (username: string, newPassword: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - HorizonFX</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .password-box {
                background: #e0e0e0;
                color: #333;
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-family: monospace;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Your Password Has Been Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${username},</h2>
            <p>Your password for your HorizonFX account has been successfully changed.</p>
            
            <p>Here is your new temporary password:</p>
            
            <div class="password-box">${newPassword}</div>
            
            <p><strong>Action Required:</strong> For your security, please log in with this new password and change it to something memorable immediately.</p>
            
            <p>If you did not authorize this change, please contact our support team right away.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 HorizonFX. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </body>
    </html>
  `;
};