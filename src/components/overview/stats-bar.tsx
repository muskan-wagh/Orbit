import type { Application } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 px-5 first:pl-0">
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-6 w-px bg-border" />;
}

export function StatsBar({ applications }: { applications: Application[] }) {
  const total = applications.length;
  const counts = applications.reduce<Record<string, number>>(
    (acc, app) => {
      acc[app.status] = (acc[app.status] ?? 0) + 1;
      return acc;
    },
    { APPLIED: 0, ASSESSMENT: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 },
  );

  const responded =
    counts.ASSESSMENT + counts.INTERVIEW + counts.OFFER + counts.REJECTED;
  const responseRate =
    total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border px-5 py-4">
      <Stat label="Applications" value={String(total)} />
      <Divider />
      <Stat label="Assessments" value={String(counts.ASSESSMENT)} />
      <Divider />
      <Stat label="Interviews" value={String(counts.INTERVIEW)} />
      <Divider />
      <Stat label="Offers" value={String(counts.OFFER)} />
      <Divider />
      <Stat label="Response rate" value={`${responseRate}%`} />
    </div>
  );
}