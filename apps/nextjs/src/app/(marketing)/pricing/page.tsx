import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@gmacko/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for teams of all sizes.",
};

/**
 * Pricing page — example of a marketing page with the (marketing) layout.
 *
 * Pattern for pricing pages:
 * 1. Hero section with value proposition
 * 2. Pricing tiers in a grid
 * 3. FAQ section
 * 4. CTA section
 *
 * Replace the placeholder plans with your actual Stripe price IDs.
 */

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For individuals getting started.",
    features: [
      "Up to 3 projects",
      "1,000 API calls/month",
      "Community support",
      "Basic analytics",
    ],
    cta: "Get Started",
    href: "/dashboard",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing teams that need more.",
    features: [
      "Unlimited projects",
      "100,000 API calls/month",
      "Priority support",
      "Advanced analytics",
      "Team collaboration",
      "Custom domains",
    ],
    cta: "Start Free Trial",
    href: "/dashboard",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced needs.",
    features: [
      "Everything in Pro",
      "Unlimited API calls",
      "SSO / SAML",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
      "Audit logs",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@gmacko.dev",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Start free. Upgrade when you need to. No hidden fees.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-lg border p-8 ${
              plan.highlighted
                ? "border-primary ring-primary/20 ring-2"
                : ""
            }`}
          >
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {plan.description}
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && (
                <span className="text-muted-foreground ml-1 text-sm">
                  {plan.period}
                </span>
              )}
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary size-4 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className="mt-8"
              variant={plan.highlighted ? "default" : "outline"}
              asChild
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
