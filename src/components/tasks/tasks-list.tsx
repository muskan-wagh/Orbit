import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import type { TaskPriority, TaskStatus } from "@/lib/constants";
import { SubmitButton } from "@/components/gmail/submit-button";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2 } from "lucide-react";

const PRIORITY_VARIANTS: Record<TaskPriority, "default" | "secondary" | "destructive" | "outline"> = {
  URGENT: "destructive",
  HIGH: "default",
  MEDIUM: "secondary",
  LOW: "outline",
};

interface TaskRow {
  id: string;
  application_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
}

interface AppRow {
  id: string;
  company: string;
}

const NOW = Date.now();

function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < NOW;
}

function formatDue(value: string | null): string {
  if (!value) return "No due date";
  const due = new Date(value);
  const hours = (due.getTime() - NOW) / (60 * 60 * 1000);
  if (hours < 0) return `Overdue ${due.toLocaleDateString()}`;
  if (hours < 48) {
    return `Due ${due.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}`;
  }
  return `Due ${due.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
}

export async function TasksList({ userId, limit = 10 }: { userId: string; limit?: number }) {
  const supabase = await createClient();

  const { data: taskData } = await supabase
    .from("OS_Tasks")
    .select("id, application_id, title, description, due_at, priority, status")
    .eq("user_id", userId)
    .in("status", ["TODO", "IN_PROGRESS"])
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  const tasks = (taskData ?? []) as TaskRow[];

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open tasks. New interviews, assessments, offers, and follow-ups will
        show up here automatically.
      </p>
    );
  }

  const appIds = tasks
    .map((task) => task.application_id)
    .filter((id): id is string => Boolean(id));

  const { data: appData } = await supabase
    .from("OS_Applications")
    .select("id, company")
    .in("id", appIds.length > 0 ? appIds : ["00000000-0000-0000-0000-000000000000"]);

  const apps = new Map((appData ?? [] as AppRow[]).map((app) => [app.id, app]));

  return (
    <ul className="divide-y">
      {tasks.map((task) => {
        const app = task.application_id ? apps.get(task.application_id) : undefined;
        const overdue = isOverdue(task.due_at);

        return (
          <li key={task.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={PRIORITY_VARIANTS[task.priority]}>{task.priority}</Badge>
                {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
                <span className="font-medium">{task.title}</span>
              </div>
              {task.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {task.description}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDue(task.due_at)}
                {app ? (
                  <>
                    {" · "}
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {app.company}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={updateTaskStatus}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="status" value="DONE" />
                <SubmitButton size="sm">
                  <Check className="size-4" />
                  Done
                </SubmitButton>
              </form>
              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <SubmitButton variant="outline" size="sm">
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete task</span>
                </SubmitButton>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}