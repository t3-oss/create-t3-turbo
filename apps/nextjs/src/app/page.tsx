import { Suspense } from "react";

import { SignInButton, SignInFallback } from "~/components/sign-in-btn";

const features = [
  {
    name: "Email & Password",
    link: "https://www.better-auth.com/docs/authentication/email-password",
  },
  {
    name: "Organization | Teams",
    link: "https://www.better-auth.com/docs/plugins/organization",
  },
  {
    name: "Passkeys",
    link: "https://www.better-auth.com/docs/plugins/passkey",
  },
  {
    name: "Multi Factor",
    link: "https://www.better-auth.com/docs/plugins/2fa",
  },
  {
    name: "Password Reset",
    link: "https://www.better-auth.com/docs/authentication/email-password#request-password-reset",
  },
  {
    name: "Email Verification",
    link: "https://www.better-auth.com/docs/authentication/email-password#email-verification",
  },
  {
    name: "Roles & Permissions",
    link: "https://www.better-auth.com/docs/plugins/organization#roles",
  },
  {
    name: "Rate Limiting",
    link: "https://www.better-auth.com/docs/reference/security#rate-limiting",
  },
  {
    name: "Session Management",
    link: "https://www.better-auth.com/docs/concepts/session-management",
  },
];

export default function Home() {
  return (
    <div className="no-visible-scrollbar flex min-h-[80vh] items-center justify-center overflow-hidden px-6 md:px-0">
      <main className="row-start-2 flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-center text-4xl font-bold text-black dark:text-white">
            Better Auth.
          </h3>
          <p className="text-center text-sm break-words md:text-base">
            Official demo to showcase{" "}
            <a
              href="https://better-auth.com"
              target="_blank"
              className="italic underline"
            >
              better-auth.
            </a>{" "}
            features and capabilities. <br />
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 md:w-10/12">
          <div className="flex flex-col flex-wrap gap-3 pt-2">
            <div className="bg-secondary/60 border-y border-dotted py-2 opacity-80">
              <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <span className="text-center">
                  All features on this demo are implemented with Better Auth
                  without any custom backend code
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {features.map((feature) => (
                <a
                  className="text-muted-foreground hover:text-foreground hover:border-foreground flex cursor-pointer items-center gap-1 border-b pb-1 text-xs transition-all duration-150 ease-in-out"
                  key={feature.name}
                  href={feature.link}
                >
                  {feature.name}
                </a>
              ))}
            </div>
          </div>

          <Suspense fallback={<SignInFallback />}>
            <SignInButton />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
