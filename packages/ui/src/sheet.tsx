"use client";

import { Dialog as SheetPrimitive } from "radix-ui";

import { cn } from "@gmacko/ui";
import { Button } from "@gmacko/ui/button";

/**
 * Sheet — Slide-out panel from any edge (mobile nav, filters, detail views).
 *
 * Usage:
 *   <Sheet
 *     trigger={<Button variant="ghost" size="icon"><MenuIcon /></Button>}
 *     side="left"
 *     title="Navigation"
 *   >
 *     <nav>...</nav>
 *   </Sheet>
 *
 * Controlled:
 *   <Sheet open={open} onOpenChange={setOpen} side="right" title="Filters">
 *     <FilterForm />
 *   </Sheet>
 */

interface SheetProps {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const sideVariants = {
  top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom:
    "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right:
    "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
};

export function Sheet({
  trigger,
  children,
  title,
  description,
  side = "left",
  open,
  onOpenChange,
  className,
}: SheetProps) {
  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <SheetPrimitive.Trigger asChild>{trigger}</SheetPrimitive.Trigger>
      )}
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <SheetPrimitive.Content
          className={cn(
            "bg-background fixed z-50 flex flex-col shadow-lg transition-transform duration-300 ease-in-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            sideVariants[side],
            className,
          )}
        >
          {(title ?? description) && (
            <div className="border-b px-6 py-4">
              {title && (
                <SheetPrimitive.Title className="text-lg font-semibold">
                  {title}
                </SheetPrimitive.Title>
              )}
              {description && (
                <SheetPrimitive.Description className="text-muted-foreground mt-1 text-sm">
                  {description}
                </SheetPrimitive.Description>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">{children}</div>
          <SheetPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              aria-label="Close"
            >
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
}
