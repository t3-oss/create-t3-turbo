import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheduled Maintenance",
  robots: { index: false, follow: false },
};

/**
 * Maintenance page shown when MAINTENANCE_MODE=true.
 *
 * Middleware redirects all non-API, non-health traffic here.
 * Customize the design to match your brand.
 */
export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-muted-foreground mb-6 text-6xl">
          {/* Wrench icon as pure CSS/unicode — no dependency needed */}
          <span role="img" aria-label="maintenance">&#x1F527;</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Scheduled Maintenance
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          We&apos;re performing scheduled maintenance to improve our service.
          We&apos;ll be back shortly.
        </p>
        <div className="text-muted-foreground mt-8 text-sm">
          <p>
            If you need immediate assistance, contact us at{" "}
            <a
              href="mailto:support@gmacko.dev"
              className="text-foreground underline underline-offset-4"
            >
              support@gmacko.dev
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
