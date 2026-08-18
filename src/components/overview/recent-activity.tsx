import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { relativeDay, relativeTime } from "@/lib/time";

interface ActivityItem {
  key: string;
  timestamp: string;
  day: string;
  title: string;
  detail: string;
  href?: string;
}

interface EventRow {
  id: string;
  event_type: string | null;
  subject: string;
  application_id: string | null;
  received_at: string | null;
}

interface AppRow {
  id: string;
  company: string;
  created_at: string;
}

interface TaskRow {
  id: string;
  title: string;
  application_id: string | null;
  created_at: string;
}

export async function RecentActivity({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [eventsResult, appsResult, tasksResult] = await Promise.all([
    supabase
      .from("OS_Email_Events")
      .select("id, event_type, subject, application_id, received_at")
      .eq("user_id", userId)
      .order("received_at", { ascending: false })
      .limit(6),
    supabase
      .from("OS_Applications")
      .select("id, company, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("OS_Tasks")
      .select("id, title, application_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const items: ActivityItem[] = [];

  for (const event of (eventsResult.data ?? []) as EventRow[]) {
    items.push({
      key: `event-${event.id}`,
      timestamp: event.received_at ?? event.id,
      day: relativeDay(event.received_at),
      title: event.subject,
      detail: `${event.event_type ?? "Event"} detected`,
      href: event.application_id ? `/applications/${event.application_id}` : undefined,
    });
  }

  for (const app of (appsResult.data ?? []) as AppRow[]) {
    items.push({
      key: `app-${app.id}`,
      timestamp: app.created_at,
      day: relativeDay(app.created_at),
      title: app.company,
      detail: "Application added",
      href: `/applications/${app.id}`,
    });
  }

  for (const task of (tasksResult.data ?? []) as TaskRow[]) {
    items.push({
      key: `task-${task.id}`,
      timestamp: task.created_at,
      day: relativeDay(task.created_at),
      title: task.title,
      detail: "Task created",
      href: task.application_id ? `/applications/${task.application_id}` : undefined,
    });
  }

  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const visible = items.slice(0, 10);

  if (visible.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        No activity yet. Add an application or connect Gmail to get started.
      </p>
    );
  }

  let lastDay: string | null = null;
  const groups: { day: string; items: ActivityItem[] }[] = [];
  for (const item of visible) {
    if (item.day !== lastDay) {
      groups.push({ day: item.day, items: [] });
      lastDay = item.day;
    }
    groups[groups.length - 1].items.push(item);
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.day}>
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            {group.day}
          </p>
          <ul className="mt-1.5 divide-y">
            {group.items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 py-2">
                <span className="size-1.5 shrink-0 rounded-full bg-foreground/30" />
                <div className="min-w-0 flex-1">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="truncate text-[13px] font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <p className="truncate text-[13px] font-medium">{item.title}</p>
                  )}
                  <p className="truncate text-[12px] text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] text-muted-foreground">
                  {relativeTime(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}