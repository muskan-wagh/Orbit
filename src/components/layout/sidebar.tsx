"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FolderKanban,
  ListTodo,
  FileText,
  Mail,
  BarChart3,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/applications", label: "Applications", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/gmail", label: "Gmail", icon: Mail },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold text-background">
          O
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Orbit</p>
          <p className="text-[11px] text-muted-foreground">Job Application OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-px px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-3 py-3">
        <p className="px-2.5 text-[11px] text-muted-foreground">
          v0.1 · Phase 8
        </p>
      </div>
    </aside>
  );
}