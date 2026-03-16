"use client";

import type { ComponentProps } from "react";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@gmacko/ui";

// ─── Command Primitive (lightweight cmdk-compatible) ─────────────────────────

interface CommandContextValue {
  search: string;
  setSearch: (value: string) => void;
}

const CommandContext = {
  search: "",
  setSearch: (_: string) => {},
} satisfies CommandContextValue;

let _ctx = CommandContext;

const Command = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className,
      )}
      {...props}
    />
  ),
);
Command.displayName = "Command";

const CommandInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center border-b px-3">
      <svg
        className="mr-2 h-4 w-4 shrink-0 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={ref}
        className={cn(
          "placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
CommandInput.displayName = "CommandInput";

const CommandList = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "max-h-[300px] overflow-y-auto overflow-x-hidden",
        className,
      )}
      {...props}
    />
  ),
);
CommandList.displayName = "CommandList";

const CommandEmpty = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  ),
);
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & { heading?: string }
>(({ className, heading, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-foreground overflow-hidden p-1",
      className,
    )}
    {...props}
  >
    {heading && (
      <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
        {heading}
      </div>
    )}
    {children}
  </div>
));
CommandGroup.displayName = "CommandGroup";

const CommandSeparator = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  ),
);
CommandSeparator.displayName = "CommandSeparator";

const CommandItem = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    onSelect?: () => void;
    disabled?: boolean;
  }
>(({ className, onSelect, disabled, ...props }, ref) => (
  <div
    ref={ref}
    role="option"
    aria-selected={false}
    aria-disabled={disabled}
    data-disabled={disabled || undefined}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
      "hover:bg-accent hover:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    onClick={() => {
      if (!disabled) onSelect?.();
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !disabled) onSelect?.();
    }}
    tabIndex={disabled ? -1 : 0}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

const CommandShortcut = forwardRef<HTMLSpanElement, ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  ),
);
CommandShortcut.displayName = "CommandShortcut";

// ─── Command Dialog (Cmd+K) ─────────────────────────────────────────────────

interface CommandDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function CommandDialog({ open, onOpenChange, children }: CommandDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="bg-background fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-lg border shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Command className="[&_[role=option]]:py-3">
            {children}
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── useCommandPalette Hook ──────────────────────────────────────────────────

/**
 * Hook to control the command palette with Cmd+K / Ctrl+K.
 */
function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  return { open, setOpen, toggle, close };
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  useCommandPalette,
};
