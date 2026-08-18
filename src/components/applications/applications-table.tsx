import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants";
import { ApplicationRow } from "@/components/applications/application-row";
import { CreateApplicationDialog } from "@/components/applications/create-application-dialog";
import { relativeTime, formatShortDate, daysUntil } from "@/lib/time";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TaskRow {
  application_id: string | null;
  title: string;
  due_at: string | null;
}

interface EventRow {
  application_id: string | null;
  received_at: string | null;
}

const STATUS_ORDER = APPLICATION_STATUSES;

const NOW = Date.now();

function deadlineClass(value: string | null): string {
  if (!value) return "text-muted-foreground";
  const days = daysUntil(value);
  if (days === null) return "text-muted-foreground";
  if (days < 1) return "font-medium text-red-600";
  if (days <= 3) return "font-medium text-amber-600";
  return "text-muted-foreground";
}

export async function ApplicationsTable({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: {
    q?: string;
    status?: string;
    platform?: string;
    sort?: string;
    since?: string;
  };
}) {
  const supabase = await createClient();

  const [appsResult, tasksResult, eventsResult] = await Promise.all([
    supabase
      .from("OS_Applications")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("OS_Tasks")
      .select("application_id, title, due_at")
      .eq("user_id", userId)
      .in("status", ["TODO", "IN_PROGRESS"]),
    supabase
      .from("OS_Email_Events")
      .select("application_id, received_at")
      .eq("user_id", userId)
      .not("application_id", "is", null),
  ]);

  const applications = (appsResult.data ?? []) as Application[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const events = (eventsResult.data ?? []) as EventRow[];

  const nextByApp = new Map<string, { title: string; due_at: string | null }>();
  for (const task of tasks) {
    if (!task.application_id) continue;
    const current = nextByApp.get(task.application_id);
    if (!current) {
      nextByApp.set(task.application_id, { title: task.title, due_at: task.due_at });
    } else if (task.due_at && (!current.due_at || task.due_at < current.due_at)) {
      nextByApp.set(task.application_id, { title: task.title, due_at: task.due_at });
    }
  }

  const lastActivityByApp = new Map<string, string>();
  for (const event of events) {
    if (!event.application_id || !event.received_at) continue;
    const current = lastActivityByApp.get(event.application_id);
    if (!current || event.received_at > current) {
      lastActivityByApp.set(event.application_id, event.received_at);
    }
  }

  const query = (searchParams.q ?? "").trim().toLowerCase();
  const statusFilter = searchParams.status;
  const platformFilter = searchParams.platform;
  const sinceDays = Number(searchParams.since ?? 0);

  let rows = applications.filter((app) => {
    if (query && !`${app.company} ${app.role}`.toLowerCase().includes(query)) return false;
    if (statusFilter && app.status !== statusFilter) return false;
    if (platformFilter && app.platform !== platformFilter) return false;
    if (sinceDays > 0 && app.applied_at) {
      const cutoff = NOW - sinceDays * 86400000;
      if (new Date(app.applied_at).getTime() < cutoff) return false;
    }
    return true;
  });

  const sort = searchParams.sort ?? "applied_desc";
  rows = [...rows].sort((a, b) => {
    if (sort === "company") return a.company.localeCompare(b.company);
    if (sort === "status") {
      return (STATUS_ORDER.indexOf(a.status as ApplicationStatus) ?? 99) - (STATUS_ORDER.indexOf(b.status as ApplicationStatus) ?? 99);
    }
    if (sort === "deadline") {
      const da = nextByApp.get(a.id)?.due_at;
      const db = nextByApp.get(b.id)?.due_at;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    }
    const ta = a.applied_at ? new Date(a.applied_at).getTime() : -Infinity;
    const tb = b.applied_at ? new Date(b.applied_at).getTime() : -Infinity;
    return sort === "applied_asc" ? ta - tb : tb - ta;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b px-5 py-2.5">
        <p className="text-[13px] text-muted-foreground">
          {rows.length} application{rows.length === 1 ? "" : "s"}
        </p>
        <div className="ml-auto">
          <CreateApplicationDialog />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">
            {applications.length === 0
              ? "No applications yet."
              : "No applications match your filters."}
          </p>
          <CreateApplicationDialog />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Next action</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead className="text-right">Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((app) => {
              const next = nextByApp.get(app.id);
              const lastActivity = lastActivityByApp.get(app.id);
              return (
                <ApplicationRow
                  key={app.id}
                  app={{
                    id: app.id,
                    company: app.company,
                    role: app.role,
                    platform: app.platform,
                    status: app.status,
                  }}
                  applied={formatShortDate(app.applied_at)}
                  nextAction={next?.title ?? "—"}
                  deadline={next?.due_at ? formatShortDate(next.due_at) : "—"}
                  deadlineClass={next?.due_at ? deadlineClass(next.due_at) : "text-muted-foreground"}
                  resume="—"
                  lastActivity={relativeTime(lastActivity)}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}