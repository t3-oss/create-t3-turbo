"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, PlusCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@acme/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import type { Session } from "~/auth/client";
import { authClient as client } from "~/auth/client";

export default function AccountSwitcher({ sessions }: { sessions: Session[] }) {
  const { data: currentUser } = client.useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a user"
          className="w-[250px] justify-between"
        >
          <Avatar className="mr-2 h-6 w-6">
            <AvatarImage
              src={currentUser?.user.image ?? undefined}
              alt={currentUser?.user.name}
            />
            <AvatarFallback>{currentUser?.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {currentUser?.user.name}
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandList>
            <CommandGroup heading="Current Account">
              <CommandItem
                // onSelect={() => {}}
                className="w-full justify-between text-sm"
                key={currentUser?.user.id}
              >
                <div className="flex items-center">
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage
                      src={currentUser?.user.image ?? undefined}
                      alt={currentUser?.user.name}
                    />
                    <AvatarFallback>
                      {currentUser?.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {currentUser?.user.name}
                </div>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Switch Account">
              {sessions
                .filter((s) => s.user.id !== currentUser?.user.id)
                .map((u, i) => (
                  <CommandItem
                    key={i}
                    onSelect={async () => {
                      await client.multiSession.setActive({
                        sessionToken: u.session.token,
                      });
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={u.user.image ?? undefined}
                        alt={u.user.name}
                      />
                      <AvatarFallback>{u.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex w-full items-center justify-between">
                      <div>
                        <p>{u.user.name}</p>
                        <p className="text-xs">({u.user.email})</p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  router.push("/sign-in");
                  setOpen(false);
                }}
                className="cursor-pointer text-sm"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Account
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
