import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { AppSidebar, MobileSidebar } from "~/components/app-sidebar";
import { NotificationBell } from "~/components/notification-bell";

/**
 * Dashboard layout — wraps all authenticated app pages.
 *
 * Pattern:
 *   (dashboard)/              → this layout (sidebar + main content)
 *   (dashboard)/dashboard/    → main dashboard page
 *   (dashboard)/projects/     → projects list, create, detail
 *   (dashboard)/team/         → team management
 *   (dashboard)/analytics/    → usage analytics
 *
 * This route group does NOT affect the URL — /dashboard, /projects, /team
 * all appear at the root level.
 *
 * Navigation preloading:
 * - All <Link> components use prefetch (Next.js default) for instant nav
 * - AppSidebar also calls router.prefetch() on mount for key routes
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="flex h-screen">
      <AppSidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Top bar */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-6 backdrop-blur">
          {/* Mobile hamburger — hidden on desktop */}
          <MobileSidebar user={session.user} />

          <div className="flex flex-1 items-center gap-4">
            {/* Search placeholder — wire up to command palette */}
            <div className="text-muted-foreground flex-1 text-sm">
              Press{" "}
              <kbd className="bg-muted pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs">
                <span className="text-xs">&#8984;</span>K
              </kbd>{" "}
              to search
            </div>
          </div>
          <NotificationBell />
          <Link
            href="/settings"
            prefetch
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Settings
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
