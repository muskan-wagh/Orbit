import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { AreaChart, BarRows } from "@/components/analytics/charts";

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: apps } = await supabase
    .from("OS_Applications")
    .select("status, platform, applied_at")
    .eq("user_id", user?.id);

  const applications = apps ?? [];

  // Applications over time: last 6 months
  const months: { label: string; key: string; count: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: date.toLocaleDateString(undefined, { month: "short" }),
      key: `${date.getFullYear()}-${date.getMonth()}`,
      count: 0,
    });
  }
  for (const app of applications) {
    if (!app.applied_at) continue;
    const date = new Date(app.applied_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.count += 1;
  }

  // By platform
  const platformCounts = new Map<string, number>();
  for (const app of applications) {
    const platform = app.platform?.trim() || "Other";
    platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + 1);
  }
  const platforms = [...platformCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({
      label,
      count,
      pct: pct(count, applications.length),
    }));

  // Funnel from current statuses
  const total = applications.length;
  const countFor = (status: string) =>
    applications.filter((app) => app.status === status).length;

  const applied = countFor("APPLIED");
  const assessment = countFor("ASSESSMENT");
  const interview = countFor("INTERVIEW");
  const offer = countFor("OFFER");
  const rejected = countFor("REJECTED");

  const conversions = [
    { label: "Applied → Assessment", value: pct(assessment, applied + assessment + interview + offer) },
    { label: "Assessment → Interview", value: pct(interview, assessment + interview + offer) },
    { label: "Interview → Offer", value: pct(offer, interview + offer) },
  ];

  const responded = assessment + interview + offer + rejected;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-8 py-8">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Where your pipeline stands.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Applications over time</h2>
              <p className="text-[13px] text-muted-foreground">
                Last 6 months
              </p>
            </div>
            <div className="px-5 py-4">
              {total === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No data yet. Add applications to see trends.
                </p>
              ) : (
                <AreaChart
                  points={months.map((m) => m.count)}
                  labels={months.map((m) => m.label)}
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Applications by platform</h2>
            </div>
            <div className="px-5 py-4">
              {platforms.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No data yet.
                </p>
              ) : (
                <BarRows items={platforms} />
              )}
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Conversion</h2>
              <p className="text-[13px] text-muted-foreground">
                Share of applications that progress
              </p>
            </div>
            <div className="px-5 py-4">
              <ul className="space-y-4">
                {conversions.map((c) => (
                  <li key={c.label}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span>{c.label}</span>
                      <span className="font-medium tabular-nums">{c.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground/70"
                        style={{ width: `${c.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="border-b px-5 py-3">
              <h2 className="text-sm font-semibold">Outcomes</h2>
            </div>
            <div className="space-y-1 px-5 py-3">
              {[
                { label: "Response rate", value: pct(responded, total), help: "Any response beyond applied" },
                { label: "Rejection rate", value: pct(rejected, total), help: "Applications rejected" },
                { label: "Offer rate", value: pct(offer, total), help: "Applications with an offer" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b py-2.5 text-[13px] last:border-0">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-[12px] text-muted-foreground">{row.help}</p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums">{row.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}