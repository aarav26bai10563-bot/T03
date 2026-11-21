import { useState } from 'react';
import { MonitoringObservationRecord, SeasonalComparison } from '../types/monitoring';

interface WaterTrendLineChartProps {
  observations: MonitoringObservationRecord[];
  historicalBaselineHa: number;
  title?: string;
}

export function WaterTrendLineChart({
  observations,
  historicalBaselineHa,
  title = 'Observed Surface Water Extent vs. Historical Reference (DEMO)',
}: WaterTrendLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const sorted = [...observations].sort((a, b) =>
    a.observationDate.localeCompare(b.observationDate)
  );

  if (sorted.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400 border border-slate-800/80 rounded-xl bg-[#0B1322]">
        No periodic observations available for this selection.
      </div>
    );
  }

  const width = 680;
  const height = 250;
  const padLeft = 58;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allValues = [...sorted.map((o) => o.observedAreaHa), historicalBaselineHa];
  const maxVal = Math.max(...allValues) * 1.12 || 100;
  const minVal = 0;

  const xFor = (idx: number) =>
    sorted.length === 1
      ? padLeft + plotW / 2
      : padLeft + (idx / (sorted.length - 1)) * plotW;

  const yFor = (val: number) =>
    padTop + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;

  const baselineY = yFor(historicalBaselineHa);

  const pathD = sorted
    .map((obs, idx) => `${idx === 0 ? 'M' : 'L'} ${xFor(idx).toFixed(1)} ${yFor(obs.observedAreaHa).toFixed(1)}`)
    .join(' ');

  const areaD = `${pathD} L ${xFor(sorted.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: Math.round(minVal + t * (maxVal - minVal)),
    y: yFor(minVal + t * (maxVal - minVal)),
  }));

  const activePoint = hoverIdx !== null ? sorted[hoverIdx] : sorted[sorted.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">
            Periodic satellite &amp; field observations (discrete dates, not continuous feed)
          </p>
        </div>
        {activePoint && (
          <div className="text-right font-mono text-xs tabular-nums bg-[#070D17] border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">{activePoint.observationDate}</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-cyan-300 font-semibold">
              {activePoint.observedAreaHa.toLocaleString()} ha
            </span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-slate-300">NDWI {activePoint.ndwiMean.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[460px] h-auto select-none"
          role="img"
          aria-label="Waterbody surface area timeline chart"
        >
          <defs>
            <linearGradient id="cyanExtentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={width - padRight}
                y2={tick.y}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono"
              >
                {tick.value.toLocaleString()}
              </text>
            </g>
          ))}

          {/* Historical Reference Baseline */}
          <line
            x1={padLeft}
            y1={baselineY}
            x2={width - padRight}
            y2={baselineY}
            stroke="#14b8a6"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={width - padRight}
            y={Math.max(baselineY - 6, 14)}
            textAnchor="end"
            className="fill-teal-300 text-[10px] font-mono"
          >
            Historical Ref: {historicalBaselineHa.toLocaleString()} ha
          </text>

          {/* Observed Area Fill & Curve */}
          <path d={areaD} fill="url(#cyanExtentFill)" />
          <path
            d={pathD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Interactive Crosshair & Data Points */}
          {hoverIdx !== null && (
            <line
              x1={xFor(hoverIdx)}
              y1={padTop}
              x2={xFor(hoverIdx)}
              y2={padTop + plotH}
              stroke="#38bdf8"
              strokeOpacity="0.45"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {sorted.map((obs, idx) => {
            const cx = xFor(idx);
            const cy = yFor(obs.observedAreaHa);
            const isHovered = hoverIdx === idx;
            return (
              <g key={obs.id}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={obs.isHistoricalBaseline ? '#14b8a6' : '#22d3ee'}
                  stroke="#070d17"
                  strokeWidth="2"
                />
                <rect
                  x={cx - 18}
                  y={padTop}
                  width={36}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                />
                {(idx === 0 || idx === sorted.length - 1 || idx % 2 === 0) && (
                  <text
                    x={cx}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {obs.observationDate.slice(0, 7)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-0.5 bg-teal-400 border-t border-dashed border-teal-400" />
          Historical Reference Baseline
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-0.5 bg-cyan-400" />
          Observed Periodic Extent (ha)
        </span>
      </div>
    </div>
  );
}

export function SeasonalComparisonChart({
  seasonal,
  name,
}: {
  seasonal: SeasonalComparison;
  name: string;
}) {
  const bars = [
    { label: 'Hist. Pre-Monsoon', value: seasonal.baselinePreMonsoonHa, color: '#0d9488' },
    { label: 'Recent Monsoon', value: seasonal.monsoonHa, color: '#0891b2' },
    { label: 'Recent Post-Monsoon', value: seasonal.postMonsoonHa, color: '#06b6d4' },
    { label: 'Recent Winter', value: seasonal.winterHa, color: '#38bdf8' },
    { label: 'Recent Pre-Monsoon', value: seasonal.preMonsoonHa, color: '#f59e0b' },
  ];

  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">
          Seasonal Surface Area Comparison · {name}
        </h3>
        <p className="text-xs text-slate-400">
          DEMO seasonal contrast showing monsoon recharge vs. pre-monsoon contraction (ha)
        </p>
      </div>
      <div className="space-y-2.5">
        {bars.map((bar) => {
          const pct = Math.max(4, Math.round((bar.value / maxVal) * 100));
          return (
            <div key={bar.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{bar.label}</span>
                <span className="font-mono tabular-nums text-slate-200">
                  {bar.value.toLocaleString()} ha
                </span>
              </div>
              <div className="h-2.5 w-full rounded-sm bg-[#070D17] overflow-hidden border border-slate-800/80">
                <div
                  className="h-full rounded-sm transition-all duration-300"
                  style={{ width: `${pct}%`, backgroundColor: bar.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
