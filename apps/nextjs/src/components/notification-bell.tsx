"use client";

import { useState } from "react";
import Link from "next/link";

import { cn } from "@gmacko/ui";
import { Button } from "@gmacko/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gmacko/ui/dropdown-menu";

import { useTRPC } from "~/trpc/react";

/**
 * Notification bell dropdown for the top bar.
 *
 * Fetches unread + recent notifications via the tRPC
 * `notification.list` query and shows them in a dropdown.
 *
 * Features:
 * - Unread badge count indicator
 * - Mark individual or all as read
 * - Links to relevant pages
 * - Empty state when no notifications
 *
 * Replace mock data with real tRPC queries:
 *   const { data } = trpc.notification.list.useQuery();
 *   const markRead = trpc.notification.markAsRead.useMutation();
 *   const markAllRead = trpc.notification.markAllAsRead.useMutation();
 */

interface Notification {
  id: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: Date;
}

/** Format relative time (e.g. "2m ago", "3h ago", "1d ago") */
function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${String(days)}d ago`;
}

/** Mock notifications — replace with tRPC query */
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "New team member",
    body: "Jane Doe accepted your invite to Acme Corp.",
    href: "/team",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: "2",
    title: "Project deployed",
    body: 'Your project "Landing Page" was deployed to production.',
    href: "/projects",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    title: "Subscription renewed",
    body: "Your Pro plan has been renewed for another month.",
    href: "/settings/billing",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "4",
    title: "Usage alert",
    body: "You've used 80% of your API calls this month.",
    href: "/analytics",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
];

export function NotificationBell() {
  // TODO: Replace with tRPC query
  // const trpc = useTRPC();
  // const { data: notifications } = trpc.notification.list.useQuery();
  // const markRead = trpc.notification.markAsRead.useMutation();
  // const markAllRead = trpc.notification.markAllAsRead.useMutation();
  void useTRPC; // referenced for when real queries are wired up

  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          {/* Bell icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="text-muted-foreground px-2 py-6 text-center text-sm">
            No notifications yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const content = (
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        !notification.read && "font-semibold",
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.read && (
                      <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {notification.body}
                  </p>
                  <span className="text-muted-foreground text-[10px]">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
              );

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex items-start gap-3 px-2 py-2.5"
                  onSelect={() => markAsRead(notification.id)}
                  asChild={Boolean(notification.href)}
                >
                  {notification.href ? (
                    <Link href={notification.href} prefetch>
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
