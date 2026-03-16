/**
 * Transactional email templates for common SaaS flows.
 *
 * These return plain HTML strings — no React Email dependency needed.
 * If you need richer layouts, swap these for @react-email/components.
 */

const APP_NAME = process.env.APP_NAME ?? "Gmacko";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Shared Layout ───────────────────────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; margin: 0; color: #111827; }
    .btn { display: inline-block; padding: 12px 24px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .code { font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header"><h1>${APP_NAME}</h1></div>
  ${body}
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
    <p><a href="${APP_URL}">Visit ${APP_NAME}</a></p>
  </div>
</body>
</html>`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function welcomeEmail(params: { name: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: `Welcome to ${APP_NAME}!`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>Welcome to ${APP_NAME}! We're excited to have you on board.</p>
      <p>Here are a few things to get you started:</p>
      <ul>
        <li>Complete your profile in Settings</li>
        <li>Explore the dashboard</li>
        <li>Check out our documentation</li>
      </ul>
      <p><a class="btn" href="${APP_URL}/settings/profile">Complete Your Profile</a></p>
      <p>If you have any questions, just reply to this email.</p>
    `),
  };
}

export function emailVerificationEmail(params: {
  name: string;
  verificationUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Verify your email for ${APP_NAME}`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p><a class="btn" href="${params.verificationUrl}">Verify Email</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p><span class="code">${params.verificationUrl}</span></p>
      <p>This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    `),
  };
}

export function passwordResetEmail(params: {
  name: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Reset your ${APP_NAME} password`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p><a class="btn" href="${params.resetUrl}">Reset Password</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p><span class="code">${params.resetUrl}</span></p>
      <p>This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    `),
  };
}

export function subscriptionConfirmationEmail(params: {
  name: string;
  plan: string;
  amount: string;
  billingPeriod: string;
}): { subject: string; html: string } {
  return {
    subject: `Your ${APP_NAME} ${params.plan} subscription is active`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>Your subscription has been confirmed! Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Plan</td><td style="padding: 8px 0; font-weight: 500;">${params.plan}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Amount</td><td style="padding: 8px 0; font-weight: 500;">${params.amount}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Billing</td><td style="padding: 8px 0; font-weight: 500;">${params.billingPeriod}</td></tr>
      </table>
      <p><a class="btn" href="${APP_URL}/settings/billing">Manage Subscription</a></p>
    `),
  };
}

export function subscriptionCancelledEmail(params: {
  name: string;
  plan: string;
  endDate: string;
}): { subject: string; html: string } {
  return {
    subject: `Your ${APP_NAME} subscription has been cancelled`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>Your ${params.plan} subscription has been cancelled. You'll continue to have access until <strong>${params.endDate}</strong>.</p>
      <p>If you change your mind, you can resubscribe at any time:</p>
      <p><a class="btn" href="${APP_URL}/settings/billing">Resubscribe</a></p>
      <p>We'd love to hear your feedback — just reply to this email.</p>
    `),
  };
}

export function invoiceReceiptEmail(params: {
  name: string;
  amount: string;
  invoiceNumber: string;
  invoiceUrl: string;
  date: string;
}): { subject: string; html: string } {
  return {
    subject: `Receipt for ${APP_NAME} — ${params.amount}`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>Here's your receipt for your recent payment:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #6b7280;">Invoice #</td><td style="padding: 8px 0; font-weight: 500;">${params.invoiceNumber}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Date</td><td style="padding: 8px 0; font-weight: 500;">${params.date}</td></tr>
        <tr><td style="padding: 8px 0; color: #6b7280;">Amount</td><td style="padding: 8px 0; font-weight: 500;">${params.amount}</td></tr>
      </table>
      <p><a class="btn" href="${params.invoiceUrl}">View Invoice</a></p>
    `),
  };
}

export function teamInviteEmail(params: {
  inviterName: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.inviterName} invited you to join ${params.organizationName} on ${APP_NAME}`,
    html: layout(`
      <p>Hi there,</p>
      <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.organizationName}</strong> as a <strong>${params.role}</strong> on ${APP_NAME}.</p>
      <p><a class="btn" href="${params.inviteUrl}">Accept Invitation</a></p>
      <p>This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
    `),
  };
}

export function dataExportReadyEmail(params: {
  name: string;
  downloadUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Your ${APP_NAME} data export is ready`,
    html: layout(`
      <p>Hi ${params.name},</p>
      <p>Your data export is ready for download. Click the button below to download your data:</p>
      <p><a class="btn" href="${params.downloadUrl}">Download Data</a></p>
      <p>This link expires in 24 hours for security purposes.</p>
    `),
  };
}
