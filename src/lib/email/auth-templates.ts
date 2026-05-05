import { escapeHtml } from "../utils";

import { EmailTemplate, baseStyles } from "./base";

export function createEmailVerificationTemplate(verificationUrl: string): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Welcome to Manta! Please verify your email address to complete your registration.</p>
                    
          <p>Click the button below to verify your email address:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p>If you did not create an account with us, please ignore this email.</p>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Manta!
    
    Please verify your email address to complete your registration.
        
    Visit this link: ${verificationUrl}
    
    If you did not create an account with us, please ignore this email.
    
    This verification link will expire in 24 hours for security reasons.
  `;

  return {
    subject: "Verify Your Email Address - Manta",
    html,
    text,
  };
}

export function createPasswordResetTemplate(resetUrl: string): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to set a new password for your account:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>This reset link will expire in 1 hour for security reasons.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset - Manta
    
    We received a request to reset your password.
    
    Visit this link to reset your password: ${resetUrl}
    
    If you did not request this password reset, please ignore this email.
    
    This reset link will expire in 1 hour for security reasons.
  `;

  return {
    subject: "Password Reset Request - Manta",
    html,
    text,
  };
}

export function createWelcomeTemplate(name: string, dashboardUrl?: string): EmailTemplate {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>Welcome to Manta, ${name}!</h2>
          <p>Your email has been successfully verified. Welcome to the future of receipt scanning and expense management!</p>
          
          <p>Here's what you can do now:</p>
          <ul>
            <li>📸 Scan receipts with AI-powered recognition</li>
            <li>📊 Export your data to CSV or Excel</li>
            <li>💼 Manage your expenses efficiently</li>
            <li>🔍 Advanced search and filtering</li>
          </ul>
          
          <a href="${dashboardUrl ?? "#"}" class="button">Open Dashboard</a>
          
          <p>If you have any questions, don't hesitate to contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Manta, ${name}!
    
    Your email has been successfully verified. Welcome to the future of receipt scanning and expense management!
    
    Here's what you can do now:
    • Scan receipts with AI-powered recognition
    • Export your data to CSV or Excel
    • Manage your expenses efficiently
    • Advanced search and filtering
    
    Visit your dashboard: ${dashboardUrl ?? "your dashboard"}
    
    If you have any questions, don't hesitate to contact our support team.
  `;

  return {
    subject: "Welcome to Manta! 🎉",
    html,
    text,
  };
}

/** Sent immediately after a customer completes self-service sign-up (credentials registration). */
export function createSignupWelcomeTemplate(name: string, shopUrl: string): EmailTemplate {
  const safeName = escapeHtml(name);
  const year = new Date().getFullYear();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1 class="logo">Manta</h1>
        </div>
        <div class="content">
          <h2>Welcome, ${safeName}!</h2>
          <p>Your Manta account is ready. You can browse classes, book sessions, and manage your membership any time.</p>
          <a href="${shopUrl}" class="button">Browse classes</a>
          <p>Thank you for joining us — we look forward to seeing you in the studio.</p>
        </div>
        <div class="footer">
          <p>&copy; ${year} Manta. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome, ${name}!

Your Manta account is ready. You can browse classes, book sessions, and manage your membership any time.

Open the shop: ${shopUrl}

Thank you for joining us — we look forward to seeing you in the studio.

© ${year} Manta. All rights reserved.
  `.trim();

  return {
    subject: "Welcome to Manta — your account is ready",
    html,
    text,
  };
}
