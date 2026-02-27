"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  useCommandPalette,
} from "@gmacko/ui/command";

interface CommandItem {
  label: string;
  shortcut?: string;
  onSelect: () => void;
}

export function AppCommandPalette() {
  const router = useRouter();
  const { open, setOpen, close } = useCommandPalette();
  const [search, setSearch] = useState("");

  const navigate = (path: string) => {
    close();
    router.push(path);
  };

  const navigationItems = [
    { label: "Home", onSelect: () => navigate("/") },
    { label: "Settings", shortcut: "S", onSelect: () => navigate("/settings") },
    { label: "Profile", onSelect: () => navigate("/settings/profile") },
    { label: "Billing", onSelect: () => navigate("/settings/billing") },
    { label: "Sessions", onSelect: () => navigate("/settings/sessions") },
  ];

  const adminItems = [
    { label: "Admin Dashboard", onSelect: () => navigate("/admin") },
    { label: "User Management", onSelect: () => navigate("/admin/users") },
  ];

  const legalItems = [
    { label: "Privacy Policy", onSelect: () => navigate("/privacy") },
    { label: "Terms of Service", onSelect: () => navigate("/terms") },
    { label: "Cookie Policy", onSelect: () => navigate("/cookies") },
  ];

  const actionItems = [
    {
      label: "Toggle Theme",
      shortcut: "T",
      onSelect: () => {
        close();
        // Dispatch theme toggle via the existing ThemeToggle mechanism
        document.querySelector<HTMLButtonElement>("[data-theme-toggle]")?.click();
      },
    },
  ];

  const filterItems = (items: typeof navigationItems) => {
    if (!search) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase()),
    );
  };

  const filteredNav = filterItems(navigationItems);
  const filteredAdmin = filterItems(adminItems);
  const filteredLegal = filterItems(legalItems);
  const filteredActions = filterItems(actionItems);
  const hasResults =
    filteredNav.length +
      filteredAdmin.length +
      filteredLegal.length +
      filteredActions.length >
    0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <CommandList>
        {!hasResults && <CommandEmpty>No results found.</CommandEmpty>}

        {filteredNav.length > 0 && (
          <CommandGroup heading="Navigation">
            {filteredNav.map((item) => (
              <CommandItem key={item.label} onSelect={item.onSelect}>
                {item.label}
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredAdmin.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Admin">
              {filteredAdmin.map((item) => (
                <CommandItem key={item.label} onSelect={item.onSelect}>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {filteredActions.map((item) => (
                <CommandItem key={item.label} onSelect={item.onSelect}>
                  {item.label}
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredLegal.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Legal">
              {filteredLegal.map((item) => (
                <CommandItem key={item.label} onSelect={item.onSelect}>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
