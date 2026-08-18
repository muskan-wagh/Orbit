import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailExtraction, EmailEventType } from "@/lib/ai/extract";
import type { MatchingMeta } from "@/lib/match/engine";
import type { TaskPriority } from "@/lib/constants";

interface TaskRow {
  id: string;
  user_id: string;
  application_id: string | null;
  title: string;
  due_at: string | null;
}

interface EventRow {
  id: string;
  application_id: string;
  extracted_data: {
    extraction?: EmailExtraction | null;
    matching?: MatchingMeta;
  } | null;
}

interface ApplicationRow {
  id: string;
  company: string;
}

export interface TaskSummary {
  created: number;
  skipped: number;
  errors: number;
}

interface TaskSpec {
  title: string;
  description: string;
  due_at: string | null;
  priority: TaskPriority;
}

const URGENT_WINDOW_MS = 48 * 60 * 60 * 1000;

function escalatedPriority(dueAt: string | null, base: TaskPriority): TaskPriority {
  if (!dueAt) return base;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return base;
  if (due - Date.now() <= URGENT_WINDOW_MS) return "URGENT";
  return base;
}

const EVENT_TASK_RULES: Record<EmailEventType, (args: {
  company: string;
  actionItem: string | null;
  summary: string | null;
  eventDate: string | null;
  deadline: string | null;
}) => TaskSpec | null> = {
  APPLICATION_CONFIRMATION: () => null,
  INTERVIEW: ({ company, actionItem, summary, eventDate, deadline }) => ({
    title: `Prepare for interview — ${company}`,
    description: actionItem ?? summary ?? "Prepare for the upcoming interview.",
    due_at: eventDate ?? deadline,
    priority: "HIGH",
  }),
  ASSESSMENT: ({ company, actionItem, summary, eventDate, deadline }) => ({
    title: `Complete assessment — ${company}`,
    description: actionItem ?? summary ?? "Complete the assessment.",
    due_at: deadline ?? eventDate,
    priority: "HIGH",
  }),
  OFFER: ({ company, actionItem, summary, eventDate, deadline }) => ({
    title: `Respond to offer — ${company}`,
    description: actionItem ?? summary ?? "Review and respond to the offer.",
    due_at: deadline ?? eventDate,
    priority: "HIGH",
  }),
  REJECTION: () => null,
  FOLLOW_UP: ({ company, actionItem, summary, deadline }) => ({
    title: `Follow up — ${company}`,
    description: actionItem ?? summary ?? "Follow up on the application.",
    due_at: deadline,
    priority: "MEDIUM",
  }),
  OTHER: ({ actionItem, summary, deadline }) => {
    if (!actionItem) return null;
    const short = actionItem.length > 60 ? `${actionItem.slice(0, 60)}…` : actionItem;
    return {
      title: short,
      description: actionItem ?? summary ?? "",
      due_at: deadline,
      priority: "LOW",
    };
  },
};

export async function generateTasks(
  supabase: SupabaseClient,
  userId: string,
): Promise<TaskSummary> {
  const summary: TaskSummary = { created: 0, skipped: 0, errors: 0 };

  const [eventsResult, tasksResult, appsResult] = await Promise.all([
    supabase
      .from("OS_Email_Events")
      .select("id, application_id, extracted_data")
      .eq("user_id", userId)
      .not("application_id", "is", null),
    supabase
      .from("OS_Tasks")
      .select("id, user_id, application_id, title, due_at")
      .eq("user_id", userId),
    supabase
      .from("OS_Applications")
      .select("id, company")
      .eq("user_id", userId),
  ]);

  const events = (eventsResult.data ?? []) as EventRow[];
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const apps = new Map(
    (appsResult.data ?? [] as ApplicationRow[]).map((app) => [app.id, app]),
  );

  const existing = new Set(
    tasks.map(
      (task) =>
        `${task.application_id}::${task.title}::${task.due_at ? new Date(task.due_at).toISOString() : "none"}`,
    ),
  );

  for (const event of events) {
    try {
      const extraction = event.extracted_data?.extraction;
      const matching = event.extracted_data?.matching;
      if (!extraction || matching?.status !== "matched") continue;

      const rule = EVENT_TASK_RULES[extraction.eventType];
      if (!rule) continue;

      const app = apps.get(event.application_id);
      if (!app) continue;

      const spec = rule({
        company: app.company,
        actionItem: extraction.actionItem,
        summary: extraction.summary,
        eventDate: extraction.eventDate,
        deadline: extraction.deadline,
      });
      if (!spec) continue;

      const dueAt = spec.due_at ? new Date(spec.due_at).toISOString() : null;
      const key = `${event.application_id}::${spec.title}::${dueAt ?? "none"}`;
      if (existing.has(key)) {
        summary.skipped += 1;
        continue;
      }

      const { error } = await supabase.from("OS_Tasks").insert({
        user_id: userId,
        application_id: event.application_id,
        title: spec.title,
        description: spec.description,
        due_at: dueAt,
        priority: escalatedPriority(dueAt, spec.priority),
        status: "TODO",
      });

      if (error) {
        summary.errors += 1;
      } else {
        existing.add(key);
        summary.created += 1;
      }
    } catch {
      summary.errors += 1;
    }
  }

  return summary;
}