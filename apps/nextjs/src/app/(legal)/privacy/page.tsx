import type { Metadata } from "next";

const APP_NAME = process.env.APP_NAME ?? "Gmacko";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">
        Last updated: February 2026
      </p>

      <h2>1. Information We Collect</h2>
      <h3>Account Information</h3>
      <p>
        When you create an account, we collect your name, email address, and
        profile information. If you sign in via a third-party provider (Google,
        GitHub, Discord, Microsoft), we receive your public profile from that
        provider.
      </p>

      <h3>Usage Data</h3>
      <p>
        We automatically collect information about how you interact with our
        service, including pages visited, features used, and actions taken. This
        data is processed by our analytics provider (PostHog) and is used to
        improve the product.
      </p>

      <h3>Technical Data</h3>
      <p>
        We collect IP addresses, browser type, device information, and operating
        system for security monitoring, error tracking (via Sentry), and fraud
        prevention.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain our service</li>
        <li>To authenticate your identity and manage your account</li>
        <li>To process payments and manage subscriptions</li>
        <li>To send transactional emails (password resets, billing receipts)</li>
        <li>To monitor and improve service reliability and performance</li>
        <li>To detect and prevent fraud and abuse</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>We share data with the following categories of service providers:</p>
      <ul>
        <li><strong>Payment processing:</strong> Stripe (payment data)</li>
        <li><strong>Analytics:</strong> PostHog (usage data)</li>
        <li><strong>Error monitoring:</strong> Sentry (technical data)</li>
        <li><strong>Email delivery:</strong> Resend (email addresses)</li>
        <li><strong>Hosting:</strong> Vercel / your hosting provider</li>
        <li><strong>Database:</strong> Neon (all stored data)</li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your account data for as long as your account is active. When
        you delete your account, all personal data is permanently removed within
        30 days, except for anonymized audit logs retained for compliance.
      </p>

      <h2>5. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> your personal data (via Settings &gt; Export Data)</li>
        <li><strong>Correct</strong> inaccurate data (via Settings &gt; Profile)</li>
        <li><strong>Delete</strong> your account and all associated data</li>
        <li><strong>Port</strong> your data in a machine-readable format (JSON export)</li>
        <li><strong>Object</strong> to certain data processing activities</li>
        <li><strong>Restrict</strong> processing in certain circumstances</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        We implement industry-standard security measures including encryption in
        transit (TLS), encryption at rest, role-based access controls, API key
        hashing, session management, and comprehensive audit logging.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management.
        See our <a href="/cookies">Cookie Policy</a> for details.
      </p>

      <h2>8. Contact</h2>
      <p>
        For privacy-related inquiries, contact us at{" "}
        <strong>privacy@yourcompany.com</strong>.
      </p>
    </div>
  );
}
