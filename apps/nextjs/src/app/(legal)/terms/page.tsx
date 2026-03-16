import type { Metadata } from "next";

const APP_NAME = process.env.APP_NAME ?? "Gmacko";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Terms of Service — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <div>
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground text-sm">
        Last updated: February 2026
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using {APP_NAME} (&quot;the Service&quot;), you agree to
        be bound by these Terms of Service. If you are using the Service on
        behalf of an organization, you represent that you have the authority to
        bind that organization.
      </p>

      <h2>2. Account Registration</h2>
      <ul>
        <li>You must provide accurate and complete registration information</li>
        <li>You are responsible for maintaining the security of your account credentials</li>
        <li>You must notify us immediately of any unauthorized use of your account</li>
        <li>You must be at least 18 years old to use the Service</li>
      </ul>

      <h2>3. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate any applicable laws or regulations</li>
        <li>Infringe on the rights of others</li>
        <li>Attempt to gain unauthorized access to the Service or its systems</li>
        <li>Interfere with or disrupt the Service</li>
        <li>Use the Service for any fraudulent or malicious purpose</li>
        <li>Reverse engineer, decompile, or disassemble the Service</li>
      </ul>

      <h2>4. Subscriptions and Payments</h2>
      <ul>
        <li>Paid plans are billed in advance on a monthly or annual basis</li>
        <li>All fees are non-refundable except as required by law</li>
        <li>We may change pricing with 30 days&apos; notice</li>
        <li>Failure to pay may result in suspension of your account</li>
        <li>Payment processing is handled by Stripe and subject to their terms</li>
      </ul>

      <h2>5. Data and Privacy</h2>
      <p>
        Your use of the Service is subject to our{" "}
        <a href="/privacy">Privacy Policy</a>. You retain ownership of all data
        you upload to the Service. We do not claim any ownership rights over
        your content.
      </p>

      <h2>6. API Usage</h2>
      <ul>
        <li>API access is subject to rate limits based on your plan</li>
        <li>API keys must be kept confidential</li>
        <li>We reserve the right to suspend API access for abuse</li>
      </ul>

      <h2>7. Service Level</h2>
      <p>
        We strive to maintain high availability but do not guarantee uninterrupted
        service. We will provide reasonable notice of planned maintenance.
        Enterprise plans may include specific SLA commitments.
      </p>

      <h2>8. Termination</h2>
      <ul>
        <li>You may cancel your account at any time through Settings</li>
        <li>We may suspend or terminate accounts that violate these Terms</li>
        <li>Upon termination, your data will be deleted per our retention policy</li>
        <li>Provisions that should survive termination will remain in effect</li>
      </ul>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, {APP_NAME} shall not be liable
        for any indirect, incidental, special, consequential, or punitive
        damages arising from your use of the Service.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of
        material changes via email or in-app notification. Continued use of the
        Service after changes constitutes acceptance of the new Terms.
      </p>

      <h2>11. Contact</h2>
      <p>
        For questions about these Terms, contact us at{" "}
        <strong>legal@yourcompany.com</strong>.
      </p>
    </div>
  );
}
