"use client";

import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@/lib/constants";
import { InlineStatus } from "@/components/applications/inline-status";

interface RowApp {
  id: string;
  company: string;
  role: string;
  platform: string | null;
  status: ApplicationStatus;
}

export function ApplicationRow({
  app,
  applied,
  nextAction,
  deadline,
  deadlineClass,
  resume,
  lastActivity,
}: {
  app: RowApp;
  applied: string;
  nextAction: string;
  deadline: string;
  deadlineClass: string;
  resume: string;
  lastActivity: string;
}) {
  const router = useRouter();

  return (
    <tr
      className="relative cursor-pointer border-b text-[13px] transition-colors last:border-0 hover:bg-accent/40"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("select, a, button, label")) return;
        router.push(`/applications/${app.id}`);
      }}
    >
      <td className="py-0 pl-5 pr-3">
        <a
          href={`/applications/${app.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {app.company}
        </a>
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">{app.role}</td>
      <td className="px-3 py-2.5 text-muted-foreground">{app.platform ?? "—"}</td>
      <td className="px-3 py-2.5">
        <InlineStatus applicationId={app.id} status={app.status} />
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">{applied}</td>
      <td className="max-w-[14rem] truncate px-3 py-2.5 text-muted-foreground">
        {nextAction}
      </td>
      <td className={`px-3 py-2.5 ${deadlineClass}`}>{deadline}</td>
      <td className="px-3 py-2.5 text-muted-foreground">{resume}</td>
      <td className="px-3 py-2.5 text-right text-muted-foreground">{lastActivity}</td>
    </tr>
  );
}