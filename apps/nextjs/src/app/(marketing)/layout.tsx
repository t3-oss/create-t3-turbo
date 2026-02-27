import Link from "next/link";

import { Button } from "@gmacko/ui/button";

import { APP_NAME } from "~/constants";

/**
 * Marketing layout — wraps public-facing pages (landing, pricing, blog, etc.)
 *
 * Pattern:
 *   (marketing)/              → this layout (navbar + footer)
 *   (marketing)/pricing/      → pricing page
 *   (marketing)/blog/         → blog index
 *   (marketing)/about/        → about page
 *
 * The root page.tsx lives outside route groups so it's still at /.
 * Move it into (marketing)/ if you want all public pages to share this layout.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold">
            {APP_NAME}
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 md:flex-row md:justify-between">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Cookies
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
