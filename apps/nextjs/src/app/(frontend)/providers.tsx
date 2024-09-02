"use client";

import { TRPCReactProvider } from "@acme/api/provider";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { getToken } from "~/utils/token";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TRPCReactProvider source="nextjs-react" token={getToken()}>
        {children}
      </TRPCReactProvider>
      <div className="absolute bottom-4 right-4">
        <ThemeToggle />
      </div>
      <Toaster />
    </ThemeProvider>
  );
};
