import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/constants";
import { PendingMatches } from "@/components/match/pending-matches";
import { daysUntil } from "@/lib/time";

interface TaskRow {
  id: string;
  application_id: string | null;
  title: string;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

interface AppRow {
  id: string;
  company: string;
}

function severity(dueAt: string | null, priority: TaskPriority): { dot: string; label: string } {
  if (!dueAt) {
    if (priority === "URGENT") return { dot: "bg-red-500", label: "High" };
    if (priority === "HIGH") return { dot: "bg-amber-500", label: "Medium" };
    return { dot: "bg-emerald-500", label: "On track" };
  }
  const days = daysUntil(dueAt);
  if (days === null) return { dot: "bg-emerald-500", label: "On track" };
  if (days < 1) return { dot: "bg-red-500", label: "Due now" };
  if (days <= 3) return { dot: "bg-amber-500", label: `Due in ${days}d` };
  if (days <= 7) return { dot: "bg-yellow-500", label: `Due in ${days}d` };
  return { dot: "bg-emerald-500", label: `Due in ${days}d` };
}

export async function ActionRequired({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [tasksResult, appsResult] = await Promise.all([
    supabase
      .from("OS_Tasks")
      .select("id, application_id, title, due_at, priority, status")
      .eq("user_id", userId)
      .in("status", ["TODO", "IN_PROGRESS"])
      .order("due_at", { ascending: true, nullsFirst: true })
      .limit(8),
    supabase
      .from("OS_Applications")
      .select("id, company")
      .eq("user_id", userId),
  ]);

  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const apps = new Map(
    (appsResult.data ?? [] as AppRow[]).map((app) => [app.id, app]),
  );

  const urgent = tasks.filter((task) => task.due_at && daysUntil(task.due_at) !== null && (daysUntil(task.due_at) as number) < 1);
  const urgentCount = urgent.length;

  return (
    <section id="action-required" className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Action required</h2>
          {urgentCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-red-100 text-[11px] font-semibold text-red-700">
              {urgentCount}
            </span>
          ) : null}
        </div>
        <Link
          href="/tasks"
          className="text-[13px] text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="px-5 py-3">
        {tasks.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Nothing to do. New interviews, assessments, and offers will show up
            here.
          </p>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => {
              const app = task.application_id ? apps.get(task.application_id) : undefined;
              const { dot, label } = severity(task.due_at, task.priority);
              return (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{task.title}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {app ? (
                        <Link
                          href={`/applications/${app.id}`}
                          className="hover:underline"
                        >
                          {app.company}
                        </Link>
                      ) : (
                        "Application"
                      )}
                      {" · "}
                      {label}
                    </p>
                  </div>
                  <Link
                    href={`/applications/${app?.id ?? ""}`}
                    className="shrink-0 text-[13px] text-muted-foreground hover:text-foreground"
                  >
                    Open
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-3 border-t pt-3">
          <PendingMatches userId={userId} />
        </div>
      </div>
    </section>
  );
}