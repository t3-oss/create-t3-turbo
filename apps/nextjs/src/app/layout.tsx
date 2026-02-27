import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@gmacko/ui";
import { SkipToContent } from "@gmacko/ui/skip-to-content";
import { ThemeProvider, ThemeToggle } from "@gmacko/ui/theme";
import { Toaster } from "@gmacko/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { AppCommandPalette } from "./_components/command-palette";
import { Providers } from "./providers";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://gmacko.dev"
      : "http://localhost:3000",
  ),
  title: "gmacko.dev — Full-Stack SaaS Starter",
  description:
    "Production-ready monorepo with auth, payments, analytics, and multi-platform support. Ship faster with type-safe full-stack scaffolding.",
  openGraph: {
    title: "gmacko.dev — Full-Stack SaaS Starter",
    description:
      "Production-ready monorepo with auth, payments, analytics, and multi-platform support.",
    url: "https://gmacko.dev",
    siteName: "gmacko.dev",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <SkipToContent />
        <ThemeProvider>
          <Providers>
            <TRPCReactProvider>
              <main id="main-content">{props.children}</main>
              <AppCommandPalette />
            </TRPCReactProvider>
          </Providers>
          <div className="fixed right-4 bottom-4 z-50">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
