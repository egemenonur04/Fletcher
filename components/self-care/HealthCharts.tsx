"use client";

import { useEffect, useRef, useState } from "react";
import { formatMinutes } from "@/lib/health";

// Two single-series charts in ink on paper: minutes per week as columns, body weight as a line.
// Each has a hover tooltip; the numbers behind them are in a table beside or below.

const H = 180;
const PAD = { top: 16, right: 12, bottom: 24, left: 40 };
const INK = "var(--color-gray-900)";
const GRID = "var(--color-gray-200)";
const MUTED = "var(--color-gray-500)";

const short = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/**
 * The chart's drawn width in px, so text stays its real size: a fixed viewBox scaled down to a
 * phone shrinks 11px labels to 6px.
 */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Round up to a clean axis maximum: 60, 120, 300… */
function niceMax(v: number): number {
  if (v <= 0) return 60;
  const steps = [30, 60, 120, 180, 240, 300, 450, 600, 900, 1200, 1800, 2400, 3000, 4500, 6000];
  return steps.find((s) => s >= v) ?? Math.ceil(v / 1000) * 1000;
}

function Tooltip({ x, y, W, children }: { x: number; y: number; W: number; children: React.ReactNode }) {
  // Kept inside the plot: flips to the left of the point in the right half.
  const left = x > W / 2;
  return (
    <div role="status" className="pointer-events-none absolute z-10 bg-white border border-gray-900 px-2 py-1 text-xs text-gray-900 whitespace-nowrap"
      style={{ top: `${(y / H) * 100}%`, left: `${(x / W) * 100}%`, transform: `translate(${left ? "calc(-100% - 8px)" : "8px"}, -50%)` }}>
      {children}
    </div>
  );
}

export function WeeklyBars({ data }: { data: { week: string; minutes: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth();
  const max = niceMax(Math.max(...data.map((d) => d.minutes)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(24, slot - 2);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Minutes trained per week, last 12 weeks" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={MUTED} className="tabular-nums">
              {t >= 60 ? `${Math.round(t / 60 * 10) / 10}h` : t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const top = y(d.minutes);
          const h = PAD.top + plotH - top;
          const r = Math.min(4, h);
          return (
            <g key={d.week}>
              {h > 0 && (
                <path
                  d={`M${cx - barW / 2},${PAD.top + plotH} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${PAD.top + plotH} Z`}
                  fill={INK} opacity={hover === null || hover === i ? 1 : 0.35}
                />
              )}
              {(i === data.length - 1 || i % (W < 480 ? 4 : 3) === 0) && (
                <text x={cx} y={H - 6} textAnchor="middle" fontSize={11} fill={MUTED}>{i === data.length - 1 ? "This wk" : short(d.week)}</text>
              )}
              {/* Hit target: the whole slot, taller and wider than the bar. */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent"
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                aria-label={`Week of ${short(d.week)}: ${formatMinutes(d.minutes)}`} />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <Tooltip W={W} x={PAD.left + slot * hover + slot / 2} y={y(data[hover].minutes)}>
          Week of {short(data[hover].week)} · <strong>{formatMinutes(data[hover].minutes)}</strong>
        </Tooltip>
      )}
    </div>
  );
}

export function WeightLine({ data }: { data: { date: string; kg: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth();
  const points = [...data].sort((a, b) => a.date.localeCompare(b.date));
  if (points.length < 2) return null;
  const t = (d: string) => new Date(`${d}T00:00:00Z`).getTime();
  const t0 = t(points[0].date);
  const t1 = t(points[points.length - 1].date);
  const kgs = points.map((p) => p.kg);
  const lo = Math.floor(Math.min(...kgs) - 1);
  const hi = Math.ceil(Math.max(...kgs) + 1);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (d: string) => PAD.left + ((t(d) - t0) / Math.max(1, t1 - t0)) * plotW;
  const y = (kg: number) => PAD.top + plotH - ((kg - lo) / (hi - lo)) * plotH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.date)},${y(p.kg)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Body weight from ${short(points[0].date)} to ${short(last.date)}`} onMouseLeave={() => setHover(null)}>
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
            <text x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={MUTED} className="tabular-nums">{v}</text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} fontSize={11} fill={MUTED}>{short(points[0].date)}</text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={11} fill={MUTED}>{short(last.date)}</text>
        <path d={path} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.date}>
            {(hover === i || i === points.length - 1) && (
              <circle cx={x(p.date)} cy={y(p.kg)} r={4} fill={INK} stroke="var(--color-white)" strokeWidth={2} />
            )}
            <circle cx={x(p.date)} cy={y(p.kg)} r={12} fill="transparent" tabIndex={0}
              onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
              aria-label={`${short(p.date)}: ${p.kg} kg`} />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <Tooltip W={W} x={x(points[hover].date)} y={y(points[hover].kg)}>
          {short(points[hover].date)} · <strong>{points[hover].kg} kg</strong>
        </Tooltip>
      )}
    </div>
  );
}
