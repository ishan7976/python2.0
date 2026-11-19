import { useState } from 'react';

interface SgpaPoint {
  label: string;
  value: number;
  detail?: string;
}

export function SgpaLineChart({
  data,
  cgpaReference,
}: {
  data: SgpaPoint[];
  cgpaReference?: number | null;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl bg-[#F8FAFC] text-sm text-[#64748B]">
        Add semester SGPA records to visualize your trend.
      </div>
    );
  }

  const width = 520;
  const height = 210;
  const padL = 38;
  const padR = 20;
  const padT = 22;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const minVal = 5;
  const maxVal = 10;
  const getX = (i: number) =>
    data.length === 1 ? padL + plotW / 2 : padL + (i / (data.length - 1)) * plotW;
  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padT + plotH - ((clamped - minVal) / (maxVal - minVal)) * plotH;
  };

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value), ...d }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padT + plotH} L ${points[0].x} ${padT + plotH} Z`;
  const gridTicks = [5, 6, 7, 8, 9, 10];

  return (
    <div className="relative w-full">
      {cgpaReference !== null && cgpaReference !== undefined && (
        <div className="mb-1 flex items-center justify-end gap-4 text-xs text-[#64748B]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full bg-[#0284C7]" />
            SGPA
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#059669] tabular-nums">
            <span className="h-0 w-3.5 border-t-2 border-dashed border-[#059669]" />
            CGPA {cgpaReference.toFixed(2)}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full overflow-visible"
        role="img"
        aria-label="Semester-wise SGPA performance chart"
      >
        <defs>
          <linearGradient id="sgpaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DCEEFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#DCEEFF" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {gridTicks.map((t) => {
          const y = getY(t);
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#F1F5F9" strokeWidth={1} />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-[#64748B] font-mono text-[10px]"
              >
                {t.toFixed(0)}
              </text>
            </g>
          );
        })}

        {cgpaReference !== null && cgpaReference !== undefined && (
          <line
            x1={padL}
            y1={getY(cgpaReference)}
            x2={width - padR}
            y2={getY(cgpaReference)}
            stroke="#059669"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}

        {points.length > 1 && <path d={areaPath} fill="url(#sgpaFill)" />}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="#0284C7" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {points.map((p, idx) => {
          const active = hoveredIdx === idx;
          return (
            <g
              key={p.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 6.5 : 4.5}
                fill={active ? '#DB2777' : '#FFFFFF'}
                stroke={active ? '#FCE4EC' : '#0284C7'}
                strokeWidth={2.5}
              />
              <text
                x={p.x}
                y={p.y - 11}
                textAnchor="middle"
                className="fill-[#1E293B] font-mono text-[10px] font-semibold"
              >
                {p.value.toFixed(2)}
              </text>
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="fill-[#64748B] text-[11px]"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface StackedBarItem {
  label: string;
  primary: number;
  secondary: number;
}

export function StackedBarChart({
  data,
  primaryLabel,
  secondaryLabel,
  primaryColor = '#6EE7B7',
  secondaryColor = '#F9A8D4',
  emptyText = 'No activity recorded yet.',
}: {
  data: StackedBarItem[];
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor?: string;
  secondaryColor?: string;
  emptyText?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxTotal = Math.max(...data.map((d) => d.primary + d.secondary), 0);

  if (data.length === 0 || maxTotal === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl bg-[#F8FAFC] text-sm text-[#64748B]">
        {emptyText}
      </div>
    );
  }

  const width = 520;
  const height = 210;
  const padL = 32;
  const padR = 14;
  const padT = 26;
  const padB = 32;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const slotW = plotW / data.length;
  const barW = Math.min(34, slotW * 0.56);
  const scaleMax = Math.max(maxTotal, 4);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-end gap-4 text-xs text-[#64748B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: primaryColor }} />
          {primaryLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: secondaryColor }} />
          {secondaryLabel}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full overflow-visible"
        role="img"
        aria-label={`${primaryLabel} vs ${secondaryLabel} chart`}
      >
        {[0, 0.5, 1].map((frac) => {
          const y = padT + plotH - frac * plotH;
          const val = Math.round(frac * scaleMax);
          return (
            <g key={frac}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#F1F5F9" strokeWidth={1} />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-[#64748B] font-mono text-[10px]">
                {val}
              </text>
            </g>
          );
        })}

        {data.map((d, idx) => {
          const x = padL + idx * slotW + (slotW - barW) / 2;
          const pH = (d.primary / scaleMax) * plotH;
          const sH = (d.secondary / scaleMax) * plotH;
          const pY = padT + plotH - pH;
          const sY = pY - sH;
          const active = hoveredIdx === idx;
          const total = d.primary + d.secondary;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {d.primary > 0 && (
                <rect
                  x={x}
                  y={pY}
                  width={barW}
                  height={pH}
                  rx={d.secondary === 0 ? 4 : 0}
                  fill={primaryColor}
                  opacity={active ? 1 : 0.9}
                />
              )}
              {d.secondary > 0 && (
                <rect
                  x={x}
                  y={sY}
                  width={barW}
                  height={sH}
                  rx={4}
                  fill={secondaryColor}
                  opacity={active ? 1 : 0.9}
                />
              )}
              {total > 0 && (
                <text
                  x={x + barW / 2}
                  y={Math.min(pY, sY) - 6}
                  textAnchor="middle"
                  className="fill-[#1E293B] font-mono text-[10px] font-medium"
                >
                  {total}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={height - 10}
                textAnchor="middle"
                className="fill-[#64748B] text-[10px]"
              >
                {d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface SimpleBarItem {
  label: string;
  value: number;
  color: string;
}

export function SimpleBarChart({
  data,
  unit = '',
  emptyText = 'No records available yet.',
}: {
  data: SimpleBarItem[];
  unit?: string;
  emptyText?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 0);

  if (data.length === 0 || maxVal === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-[#F8FAFC] text-sm text-[#64748B]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-1">
      {data.map((item) => {
        const pct = Math.max(4, Math.round((item.value / maxVal) * 100));
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#1E293B]">{item.label}</span>
              <span className="font-mono tabular-nums text-[#64748B]">
                {item.value}
                {unit}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${item.value === 0 ? 0 : pct}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
