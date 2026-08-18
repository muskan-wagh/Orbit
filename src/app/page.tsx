import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { StatsBar } from "@/components/overview/stats-bar";
import { Funnel } from "@/components/overview/funnel";
import { ActionRequired } from "@/components/overview/action-required";
import { RecentActivity } from "@/components/overview/recent-activity";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string; tasks?: string; gmail?: string; reason?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [appsResult, gmailResult] = await Promise.all([
    supabase
      .from("OS_Applications")
      .select("*")
      .eq("user_id", user?.id),
    supabase
      .from("OS_Gmail_Connections")
      .select("google_email")
      .eq("user_id", user?.id)
      .maybeSingle(),
  ]);

  const applications = appsResult.data ?? [];
  const { match, tasks, gmail, reason } = await searchParams;
  const matchParts = match ? match.split("|").map(Number) : null;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-lg font-semibold">Overview</h1>
            <p className="text-sm text-muted-foreground">
              Here&apos;s what you should do today.
            </p>
          </div>
          <Link
            href="/applications"
            className="text-[13px] text-muted-foreground hover:text-foreground"
          >
            Open pipeline →
          </Link>
        </div>

        {matchParts ? (
          <p className="mb-4 rounded-md bg-sky-50 px-4 py-2.5 text-[13px] text-sky-800">
            Matching complete: {matchParts[0] ?? 0} auto-matched,{" "}
            {matchParts[1] ?? 0} need confirmation, {matchParts[2] ?? 0} errors.
          </p>
        ) : null}
        {tasks ? (
          <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
            Tasks created: {tasks}.
          </p>
        ) : null}
        {gmail === "connected" ? (
          <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
            Gmail connected successfully.
          </p>
        ) : null}
        {gmail === "error" ? (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2.5 text-[13px] text-red-800">
            <span className="font-medium">Gmail connection failed.</span>{" "}
            {reason ? (
              <>
                Google said: <code className="break-all">{reason}</code>
              </>
            ) : (
              "The OAuth callback rejected the request."
            )}
          </p>
        ) : null}

        {!gmailResult?.data && gmail !== "connected" ? (
          <Link
            href="/gmail"
            className="mb-5 flex items-center justify-between rounded-md border px-4 py-2.5 text-[13px] transition-colors hover:bg-accent/50"
          >
            <span>
              <span className="font-medium">Connect Gmail</span> to automatically
              detect interviews, assessments, and offers from email.
            </span>
            <span className="text-muted-foreground">Go to Gmail →</span>
          </Link>
        ) : null}

        <StatsBar applications={applications} />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActionRequired userId={user?.id ?? ""} />
          </div>
          <div className="rounded-lg border">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Pipeline</h2>
            </div>
            <div className="px-5 py-4">
              <Funnel applications={applications} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link
              href="/gmail"
              className="text-[13px] text-muted-foreground hover:text-foreground"
            >
              Email events →
            </Link>
          </div>
          <div className="px-5 py-4">
            <RecentActivity userId={user?.id ?? ""} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}