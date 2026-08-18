import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { confirmMatch, dismissMatch } from "@/lib/actions/match";
import type { MatchingMeta } from "@/lib/match/engine";
import { SubmitButton } from "@/components/gmail/submit-button";
import { Badge } from "@/components/ui/badge";

interface PendingEvent {
  id: string;
  subject: string;
  sender: string;
  extracted_data: { matching?: MatchingMeta } | null;
}

interface AppRow {
  id: string;
  company: string;
  role: string;
}

function formatConfidence(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  return `${Math.round(value * 100)}%`;
}

export async function PendingMatches({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("OS_Email_Events")
    .select("id, subject, sender, extracted_data")
    .eq("user_id", userId)
    .filter("extracted_data->matching->>status", "eq", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  const events = (eventData ?? []) as PendingEvent[];

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pending matches to confirm.
      </p>
    );
  }

  const appIds = events
    .map((e) => e.extracted_data?.matching?.applicationId)
    .filter((id): id is string => Boolean(id));

  const { data: appData } = await supabase
    .from("OS_Applications")
    .select("id, company, role")
    .in("id", appIds);

  const apps = new Map((appData ?? [] as AppRow[]).map((app) => [app.id, app]));

  return (
    <ul className="divide-y">
      {events.map((event) => {
        const matching = event.extracted_data?.matching;
        const app = matching?.applicationId ? apps.get(matching.applicationId) : undefined;

        return (
          <li key={event.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{event.subject}</p>
              <p className="truncate text-sm text-muted-foreground">
                {event.sender}
              </p>
              {app ? (
                <p className="mt-1 text-sm">
                  Match:{" "}
                  <Link href={`/applications/${app.id}`} className="font-medium text-primary underline underline-offset-4">
                    {app.company} — {app.role}
                  </Link>
                  <Badge variant="outline" className="ml-2">
                    {formatConfidence(matching?.confidence)}
                  </Badge>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Matching application no longer exists.
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={confirmMatch}>
                <input type="hidden" name="eventId" value={event.id} />
                {app ? (
                  <input type="hidden" name="applicationId" value={app.id} />
                ) : null}
                <SubmitButton size="sm" disabled={!app}>
                  Confirm
                </SubmitButton>
              </form>
              <form action={dismissMatch}>
                <input type="hidden" name="eventId" value={event.id} />
                <SubmitButton variant="outline" size="sm">
                  Dismiss
                </SubmitButton>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}