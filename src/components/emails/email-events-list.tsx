import { createClient } from "@/lib/supabase/server";
import { deleteEmailEvent } from "@/lib/actions/emails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConfidence(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

interface EmailEvent {
  id: string;
  event_type: string | null;
  subject: string;
  sender: string;
  confidence: number | null;
  received_at: string | null;
}

export async function EmailEventsList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("OS_Email_Events")
    .select("id, event_type, subject, sender, confidence, received_at")
    .eq("user_id", userId)
    .order("received_at", { ascending: false })
    .limit(10);

  const list = (events ?? []) as EmailEvent[];

  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No email events processed yet. Click “Sync emails” to scan your Gmail.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {list.map((event) => (
        <li key={event.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{event.subject}</p>
            <p className="truncate text-sm text-muted-foreground">
              {event.sender} · {formatDate(event.received_at)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant="outline">{event.event_type ?? "NOT JOB-RELATED"}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatConfidence(event.confidence)}
            </span>
            <form action={deleteEmailEvent}>
              <input type="hidden" name="id" value={event.id} />
              <Button type="submit" variant="ghost" size="icon" aria-label="Delete event">
                <Trash2 className="size-4" />
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}