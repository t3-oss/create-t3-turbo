import type { Metadata } from "next";

const APP_NAME = process.env.APP_NAME ?? "Gmacko";

export const metadata: Metadata = {
  title: `Cookie Policy — ${APP_NAME}`,
};

export default function CookiePolicyPage() {
  return (
    <div>
      <h1>Cookie Policy</h1>
      <p className="text-muted-foreground text-sm">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <h2>1. What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They help the site remember your preferences and understand
        how you interact with it.
      </p>

      <h2>2. Cookies We Use</h2>

      <h3>Essential Cookies (Always Active)</h3>
      <p>
        These cookies are required for the Service to function and cannot be
        disabled.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>better-auth.session_token</code></td>
            <td>Authentication session</td>
            <td>7 days</td>
          </tr>
          <tr>
            <td><code>__Host-csrf-token</code></td>
            <td>CSRF protection</td>
            <td>Session</td>
          </tr>
          <tr>
            <td><code>theme</code></td>
            <td>Light/dark mode preference</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td><code>locale</code></td>
            <td>Language preference</td>
            <td>1 year</td>
          </tr>
        </tbody>
      </table>

      <h3>Analytics Cookies (Optional)</h3>
      <p>
        These cookies help us understand how you use the Service so we can
        improve it. They are only set if you consent.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>ph_*</code></td>
            <td>PostHog</td>
            <td>Product analytics</td>
            <td>1 year</td>
          </tr>
        </tbody>
      </table>

      <h3>Error Monitoring (Optional)</h3>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Provider</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sentry-*</code></td>
            <td>Sentry</td>
            <td>Error tracking and performance monitoring</td>
            <td>Session</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Managing Cookies</h2>
      <p>
        You can control cookies through your browser settings. Note that
        disabling essential cookies will prevent you from using the Service.
      </p>
      <ul>
        <li>
          <strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies
        </li>
        <li>
          <strong>Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies
        </li>
        <li>
          <strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data
        </li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>
        Our third-party providers (PostHog, Sentry) may set their own cookies.
        Their use of cookies is governed by their respective privacy policies.
      </p>

      <h2>5. Contact</h2>
      <p>
        For questions about our cookie practices, contact us at{" "}
        <strong>privacy@yourcompany.com</strong>.
      </p>
    </div>
  );
}
