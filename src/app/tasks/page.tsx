import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { TasksList } from "@/components/tasks/tasks-list";
import { GenerateTasksButton } from "@/components/tasks/generate-tasks-button";
import { formatShortDate, relativeTime } from "@/lib/time";
import type { TaskPriority } from "@/lib/constants";

interface DoneTask {
  id: string;
  title: string;
  priority: TaskPriority;
  due_at: string | null;
  updated_at: string;
}

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: doneData } = await supabase
    .from("OS_Tasks")
    .select("id, title, priority, due_at, updated_at")
    .eq("user_id", user?.id)
    .eq("status", "DONE")
    .order("updated_at", { ascending: false })
    .limit(10);

  const done = (doneData ?? []) as DoneTask[];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-lg font-semibold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Action items from your application pipeline.
            </p>
          </div>
          <GenerateTasksButton />
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Open</h2>
          </div>
          <div className="px-5 py-3">
            <TasksList userId={user?.id ?? ""} limit={50} />
          </div>
        </div>

        {done.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-lg border">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Completed</h2>
            </div>
            <div className="px-5 py-2">
              <ul className="divide-y">
                {done.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-4 py-2.5">
                    <p className="line-through text-[13px] text-muted-foreground">
                      {task.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-3 text-[12px] text-muted-foreground">
                      {task.due_at ? <span>{formatShortDate(task.due_at)}</span> : null}
                      <span>{relativeTime(task.updated_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}