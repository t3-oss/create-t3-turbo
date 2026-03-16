"use client";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="bg-background text-foreground fixed left-4 top-4 z-[100] -translate-y-full rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}
