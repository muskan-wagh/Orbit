"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreateApplicationDialog } from "@/components/applications/create-application-dialog";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Search, Bell } from "lucide-react";

export function TopBar({
  email,
  initials,
}: {
  email: string;
  initials: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-5">
      <form
        className="flex w-full max-w-sm items-center gap-2 rounded-lg border bg-background px-3"
        onSubmit={(event) => {
          event.preventDefault();
          const value = query.trim();
          router.push(value ? `/applications?q=${encodeURIComponent(value)}` : "/applications");
        }}
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search applications…"
          className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
          /
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <Link
          href="/#action-required"
          aria-label="Notifications"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-4" />
        </Link>
        <div className="hidden sm:block">
          <CreateApplicationDialog />
        </div>
        <div className="relative">
          <details className="group">
            <summary
              role="button"
              aria-label="Account menu"
              className="ml-1.5 flex size-8 cursor-pointer list-none items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background ring-1 ring-border hover:ring-ring"
            >
              {initials}
            </summary>
            <div className="absolute right-0 top-9 z-50 w-60 rounded-lg border bg-popover p-1.5 shadow-lg">
              <div className="border-b px-2.5 py-2">
                <p className="truncate text-sm font-medium">{email}</p>
              </div>
              <div className="pt-1.5">
                <SignOutButton />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}