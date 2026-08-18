import type { Application } from "@/lib/types";

const STAGES = ["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER"] as const;

export function Funnel({ applications }: { applications: Application[] }) {
  const counts = STAGES.map((status) =>
    applications.filter((app) => app.status === status).length,
  );
  const max = Math.max(1, ...counts);

  const conversions: (number | null)[] = [];
  for (let i = 1; i < STAGES.length; i++) {
    const from = counts[i - 1];
    conversions.push(from > 0 ? Math.round((counts[i] / from) * 100) : null);
  }

  return (
    <div className="space-y-3">
      {STAGES.map((stage, index) => (
        <div key={stage} className="flex items-center gap-3">
          <div className="flex w-32 items-center gap-2">
            <span className="text-[13px] font-medium">{stage}</span>
            <span className="text-[13px] text-muted-foreground">
              {counts[index]}
            </span>
          </div>
          <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted">
            <div
              className="h-full rounded-md bg-foreground/10 transition-all"
              style={{ width: `${(counts[index] / max) * 100}%` }}
            />
          </div>
          {index > 0 ? (
            <div className="w-24 text-right text-[12px] text-muted-foreground">
              {conversions[index - 1] === null ? "—" : `${conversions[index - 1]}%`}
            </div>
          ) : (
            <div className="w-24 text-right text-[12px] text-muted-foreground">
              applied
            </div>
          )}
        </div>
      ))}
      <p className="flex items-center justify-between pt-1 text-[12px] text-muted-foreground">
        <span>Step conversion rate</span>
        <span>{conversions.map((c) => (c === null ? "—" : `${c}%`)).join(" → ")}</span>
      </p>
    </div>
  );
}