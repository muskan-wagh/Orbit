import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { GmailStatusCard } from "@/components/gmail/gmail-status-card";
import { SyncEmailsButton } from "@/components/emails/sync-emails-button";
import { EmailEventsList } from "@/components/emails/email-events-list";
import { MatchNowButton } from "@/components/match/match-now-button";

export default async function GmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: connection } = await supabase
    .from("OS_Gmail_Connections")
    .select("google_email")
    .eq("user_id", user?.id)
    .maybeSingle();

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="text-lg font-semibold">Gmail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Gmail to automatically track applications from email.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <GmailStatusCard googleEmail={connection?.google_email ?? null} />
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
                <div>
                  <h2 className="text-sm font-semibold">Email intelligence</h2>
                  <p className="text-[13px] text-muted-foreground">
                    Scan, classify, and match job-related emails.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MatchNowButton />
                  <SyncEmailsButton />
                </div>
              </div>
              <div className="px-5 py-3">
                <EmailEventsList userId={user?.id ?? ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}