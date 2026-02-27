import Link from "next/link";

import { Button } from "@gmacko/ui/button";

import { AuthShowcase } from "./_components/auth-showcase";

const features = [
  {
    title: "Type-Safe Full Stack",
    description:
      "End-to-end type safety from database to UI with Drizzle ORM, tRPC, and TypeScript. No more runtime surprises.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Authentication Built In",
    description:
      "Better Auth with OAuth providers, email/password, session management, and role-based access control out of the box.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: "Payments & Subscriptions",
    description:
      "Stripe integration with subscription plans, checkout sessions, billing portal, and webhook handling. RevenueCat for mobile.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    title: "Observability First",
    description:
      "Deep Sentry error tracking and PostHog product analytics integrated at every layer — API, UI, and mobile.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v-5.5m3 5.5V8.25" />
      </svg>
    ),
  },
  {
    title: "Multi-Platform",
    description:
      "One codebase powering Next.js web, Expo mobile, and TanStack Start apps. Shared API, auth, and business logic.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    title: "AI-Native Tooling",
    description:
      "MCP server for AI agents, OpenCode skills for development workflows, and LLM-powered scaffolding built right in.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
];

const techStack = [
  { name: "Next.js 15", category: "Web" },
  { name: "React 19", category: "UI" },
  { name: "Expo 54", category: "Mobile" },
  { name: "tRPC v11", category: "API" },
  { name: "Drizzle ORM", category: "Database" },
  { name: "Better Auth", category: "Auth" },
  { name: "Tailwind v4", category: "Styling" },
  { name: "shadcn/ui", category: "Components" },
  { name: "Turborepo", category: "Build" },
  { name: "Stripe", category: "Payments" },
  { name: "Sentry", category: "Monitoring" },
  { name: "PostHog", category: "Analytics" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="border-border/50 sticky top-0 z-50 border-b backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold tracking-tight">
            gmacko<span className="text-primary">.dev</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Settings
            </Link>
            <AuthShowcase />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="bg-primary/5 absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--color-primary)_0%,transparent_100%)] opacity-[0.07]" />
        <div className="container mx-auto px-4 text-center">
          <div className="bg-muted text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm">
            <span className="bg-primary h-2 w-2 rounded-full" />
            Production-ready monorepo starter
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl">
            Ship faster with{" "}
            <span className="bg-gradient-to-r from-[hsl(280,100%,60%)] to-[hsl(220,100%,60%)] bg-clip-text text-transparent">
              type-safe
            </span>{" "}
            full-stack scaffolding
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg md:text-xl">
            Everything you need to build, deploy, and scale a modern SaaS
            product. Authentication, payments, analytics, and multi-platform
            support — all wired up and ready to go.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2.5 font-mono text-sm">
              <span className="text-muted-foreground">$</span>
              <span>npx create-gmacko-app my-app</span>
              <button
                className="text-muted-foreground hover:text-foreground ml-2 transition-colors"
                title="Copy to clipboard"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <Link href="https://github.com/gmackorg/create-gmacko-app">
              <Button variant="outline" size="lg">
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tech Stack Bar */}
      <section className="border-border/50 border-y py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {techStack.map((tech) => (
              <div key={tech.name} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{tech.category}</span>
                <span className="font-medium">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
              A carefully curated stack of battle-tested tools, wired together
              with best practices for type safety, observability, and developer
              experience.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border p-6 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-lg p-2.5">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Workflow */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              From zero to production in minutes
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
              Simplified patterns for every stage of your development lifecycle.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Local Development",
                desc: "Docker Compose spins up Postgres and Redis. Or use PGlite for zero-dependency local testing. Default admin/test accounts included.",
                code: "pnpm dev",
              },
              {
                step: "2",
                title: "Staging",
                desc: "Push to a branch and get a preview deployment. Separate staging database, Sentry environment, and PostHog project.",
                code: "git push origin feature/...",
              },
              {
                step: "3",
                title: "Production",
                desc: "Neon Postgres, Vercel hosting, Sentry alerts, PostHog dashboards, and Stripe webhooks — all configured.",
                code: "git push origin main",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-primary text-primary-foreground mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {item.desc}
                </p>
                <code className="bg-background rounded-md border px-3 py-1 text-xs">
                  {item.code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to build?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
            Scaffold your next project in seconds. Customize integrations during
            setup, or start with the recommended defaults.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-2.5 font-mono text-sm">
              <span className="text-muted-foreground">$</span>
              <span>npx create-gmacko-app my-app</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border/50 border-t py-8">
        <div className="container mx-auto flex items-center justify-between px-4">
          <span className="text-muted-foreground text-sm">
            Built with create-gmacko-app
          </span>
          <div className="text-muted-foreground flex gap-4 text-sm">
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
            <Link
              href="https://github.com/gmackorg/create-gmacko-app"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
