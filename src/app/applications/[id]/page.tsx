import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteApplication } from "@/lib/actions/applications";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { AppShell } from "@/components/layout/app-shell";
import { InlineStatus } from "@/components/applications/inline-status";
import { EditApplicationForm } from "@/components/applications/edit-application-form";
import { SubmitButton } from "@/components/gmail/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFullDate, formatShortDate, relativeTime, daysUntil } from "@/lib/time";
import type { ApplicationStatus, TaskPriority, TaskStatus } from "@/lib/constants";
import { ArrowLeft, Trash2, Check, CalendarClock } from "lucide-react";

interface EventRow {
  id: string;
  event_type: string | null;
  subject: string;
  sender: string | null;
  confidence: number | null;
  received_at: string | null;
  extracted_data: { matching?: { status?: string } } | null;
}

interface TaskRow {
  id: string;
  title: string;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

function deadlineLabel(dueAt: string | null): string {
  if (!dueAt) return "No deadline";
  const days = daysUntil(dueAt);
  if (days === null) return formatShortDate(dueAt);
  if (days < 1) return `Due today`;
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function deadlineColor(dueAt: string | null): string {
  if (!dueAt) return "text-muted-foreground";
  const days = daysUntil(dueAt);
  if (days === null) return "text-muted-foreground";
  if (days < 1) return "text-red-600";
  if (days <= 3) return "text-amber-600";
  return "text-muted-foreground";
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [appResult, eventsResult, tasksResult] = await Promise.all([
    supabase
      .from("OS_Applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", user?.id)
      .maybeSingle(),
    supabase
      .from("OS_Email_Events")
      .select("id, event_type, subject, sender, confidence, received_at, extracted_data")
      .eq("application_id", id)
      .eq("user_id", user?.id)
      .order("received_at", { ascending: false })
      .limit(20),
    supabase
      .from("OS_Tasks")
      .select("id, title, due_at, priority, status")
      .eq("application_id", id)
      .eq("user_id", user?.id)
      .order("due_at", { ascending: true, nullsFirst: true }),
  ]);

  const application = appResult.data;
  if (!application) {
    notFound();
  }

  const events = (eventsResult.data ?? []) as EventRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const openTasks = tasks.filter((task) => task.status === "TODO" || task.status === "IN_PROGRESS");

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to applications
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-xl font-semibold">{application.company}</h1>
              <InlineStatus
                applicationId={application.id}
                status={application.status as ApplicationStatus}
              />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{application.role}</p>
          </div>
          <form action={deleteApplication}>
            <input type="hidden" name="id" value={application.id} />
            <Button type="submit" variant="ghost" size="sm" aria-label="Delete application">
              <Trash2 className="size-4" />
            </Button>
          </form>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border">
              <div className="border-b px-5 py-3">
                <h2 className="text-sm font-semibold">Details</h2>
              </div>
              <div className="grid gap-x-6 gap-y-0 px-5 py-2 sm:grid-cols-2">
                {[
                  ["Platform", application.platform],
                  ["Location", application.location],
                  ["Salary", application.salary],
                  ["Applied", formatFullDate(application.applied_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b py-2.5 text-sm last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium">{value ?? "—"}</span>
                  </div>
                ))}
                <div className="border-b py-2.5 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Job URL: </span>
                  {application.job_url ? (
                    <a
                      href={application.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-primary underline underline-offset-4"
                    >
                      {application.job_url}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                {application.notes ? (
                  <div className="border-b py-2.5 text-sm sm:col-span-2">
                    <span className="text-muted-foreground">Notes: </span>
                    <span className="whitespace-pre-wrap">{application.notes}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <h2 className="text-sm font-semibold">Timeline</h2>
                <span className="text-[12px] text-muted-foreground">
                  {events.length} email event{events.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="px-5 py-4">
                {events.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No email events linked yet. Connect Gmail and sync to build a
                    timeline.
                  </p>
                ) : (
                  <ol className="relative space-y-0 border-l border-border pl-5">
                    {events.map((event) => (
                      <li key={event.id} className="relative py-3">
                        <span className="absolute -left-[23px] top-4 size-2 rounded-full bg-foreground/40" />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{event.event_type ?? "EVENT"}</Badge>
                          <span className="text-[13px] font-medium">{event.subject}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {event.sender} · {relativeTime(event.received_at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border">
              <div className="border-b px-5 py-3">
                <h2 className="text-sm font-semibold">Tasks</h2>
              </div>
              <div className="px-5 py-3">
                {openTasks.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No open tasks.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {openTasks.map((task) => (
                      <li key={task.id} className="flex items-start justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium">{task.title}</p>
                          <p className={`mt-0.5 flex items-center gap-1 text-[12px] ${deadlineColor(task.due_at)}`}>
                            <CalendarClock className="size-3" />
                            {deadlineLabel(task.due_at)}
                            {" · "}
                            {task.priority}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <form action={updateTaskStatus}>
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="status" value="DONE" />
                            <SubmitButton variant="ghost" size="sm" aria-label="Mark done">
                              <Check className="size-4" />
                            </SubmitButton>
                          </form>
                          <form action={deleteTask}>
                            <input type="hidden" name="id" value={task.id} />
                            <SubmitButton variant="ghost" size="sm" aria-label="Delete task">
                              <Trash2 className="size-4" />
                            </SubmitButton>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-lg border">
              <div className="border-b px-5 py-3">
                <h2 className="text-sm font-semibold">Edit application</h2>
              </div>
              <div className="px-5 py-4">
                <EditApplicationForm application={application} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}