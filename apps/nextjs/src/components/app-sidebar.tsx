"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { cn } from "@gmacko/ui";
import { Avatar } from "@gmacko/ui/avatar";
import { Button } from "@gmacko/ui/button";
import { Separator } from "@gmacko/ui/separator";
import { Sheet } from "@gmacko/ui/sheet";

/**
 * Reusable app sidebar for the dashboard layout.
 *
 * To add a new section:
 * 1. Add a nav item to the `navItems` array below
 * 2. Create the corresponding route in (dashboard)/
 * 3. The active state is automatically determined from the URL
 *
 * Features:
 * - Mobile-responsive: collapses to hamburger menu on small screens
 * - Route preloading: prefetches nav targets on mount for instant navigation
 * - Sheet drawer on mobile for full navigation access
 */

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    title: "Projects",
    href: "/projects",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </svg>
    ),
  },
  {
    title: "Team",
    href: "/team",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
];

/** Routes to prefetch on mount for instant navigation */
const PREFETCH_ROUTES = [
  "/dashboard",
  "/projects",
  "/team",
  "/analytics",
  "/settings",
  "/settings/profile",
];

interface AppSidebarProps {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Button
            key={item.href}
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start gap-2"
            asChild
          >
            <Link href={item.href} onClick={onNavigate} prefetch>
              {item.icon}
              {item.title}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

function SidebarUser({
  user,
  onNavigate,
}: {
  user: AppSidebarProps["user"];
  onNavigate?: () => void;
}) {
  return (
    <div className="p-4">
      <Link
        href="/settings/profile"
        prefetch
        onClick={onNavigate}
        className={cn(
          "hover:bg-accent flex items-center gap-3 rounded-md p-2 transition-colors",
        )}
      >
        <Avatar className="size-8">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? "User"} className="size-full rounded-full object-cover" />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-xs font-medium">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name ?? "User"}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </div>
      </Link>
    </div>
  );
}

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();

  // Prefetch key routes on mount for instant navigation
  useEffect(() => {
    for (const route of PREFETCH_ROUTES) {
      router.prefetch(route);
    }
  }, [router]);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="bg-card hidden h-full w-64 shrink-0 flex-col border-r md:flex">
        {/* Logo / App name */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold" prefetch>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>My App</span>
          </Link>
        </div>

        <SidebarNav />

        <Separator />

        <SidebarUser user={user} />
      </aside>
    </>
  );
}

/** Mobile sidebar — Sheet drawer triggered by hamburger button */
export function MobileSidebar({ user }: AppSidebarProps) {
  return (
    <Sheet
      trigger={
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      }
      side="left"
      title="Navigation"
    >
      <SidebarNav />
      <Separator />
      <SidebarUser user={user} />
    </Sheet>
  );
}
