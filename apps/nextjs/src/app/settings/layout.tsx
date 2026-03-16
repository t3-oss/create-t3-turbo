import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { SETTINGS_NAV } from "~/constants";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full shrink-0 md:w-48">
          <nav className="flex gap-1 md:flex-col">
            {SETTINGS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
