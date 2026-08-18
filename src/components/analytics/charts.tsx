const WIDTH = 480;
const HEIGHT = 140;
const PAD = 4;

export function AreaChart({
  points,
  labels,
}: {
  points: number[];
  labels: string[];
}) {
  const max = Math.max(1, ...points);
  const coords = points.map((value, index) => {
    const x = PAD + (index * (WIDTH - PAD * 2)) / Math.max(1, points.length - 1);
    const y = HEIGHT - PAD - (value / max) * (HEIGHT - PAD * 2);
    return { x, y };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `M${coords[0]?.x ?? PAD},${HEIGHT - PAD} ${line} L${coords[coords.length - 1]?.x ?? WIDTH - PAD},${HEIGHT - PAD} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Applications over time"
      >
        <line
          x1={PAD}
          y1={HEIGHT - PAD}
          x2={WIDTH - PAD}
          y2={HEIGHT - PAD}
          className="stroke-border"
          strokeWidth="1"
        />
        <path d={area} className="fill-foreground/8" />
        <polyline
          points={line}
          fill="none"
          className="stroke-foreground"
          strokeWidth="1.5"
        />
        {coords.map((c, index) => (
          <circle key={index} cx={c.x} cy={c.y} r="2" className="fill-foreground" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        {labels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
}

export function BarRows({
  items,
}: {
  items: { label: string; count: number; pct: number }[];
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[13px] text-muted-foreground">
            {item.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/70"
              style={{ width: `${item.pct}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[13px] tabular-nums">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}