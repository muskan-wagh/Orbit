"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { Search, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "applied_desc", label: "Newest applied" },
  { value: "applied_asc", label: "Oldest applied" },
  { value: "company", label: "Company A–Z" },
  { value: "status", label: "Status" },
  { value: "deadline", label: "Next deadline" },
];

const SINCE_OPTIONS = [
  { value: "", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function selectClass() {
  return "h-8 rounded-md border bg-background px-2 text-[13px] outline-none focus-visible:border-ring";
}

export function TableToolbar({ platforms }: { platforms: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function navigate(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/applications?${qs}` : "/applications");
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-5 py-2.5">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: query.trim() });
        }}
      >
        <div className="flex h-8 w-56 items-center gap-2 rounded-md border bg-background px-2.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, role…"
            className="h-full w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                navigate({ q: null });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      <select
        className={selectClass()}
        value={searchParams.get("status") ?? ""}
        onChange={(event) => navigate({ status: event.target.value })}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <select
        className={selectClass()}
        value={searchParams.get("platform") ?? ""}
        onChange={(event) => navigate({ platform: event.target.value })}
        aria-label="Filter by platform"
      >
        <option value="">All platforms</option>
        {platforms.map((platform) => (
          <option key={platform} value={platform}>
            {platform}
          </option>
        ))}
      </select>

      <select
        className={selectClass()}
        value={searchParams.get("since") ?? ""}
        onChange={(event) => navigate({ since: event.target.value })}
        aria-label="Filter by date"
      >
        {SINCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-2">
        <select
          className={selectClass()}
          value={searchParams.get("sort") ?? "applied_desc"}
          onChange={(event) => navigate({ sort: event.target.value })}
          aria-label="Sort applications"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}