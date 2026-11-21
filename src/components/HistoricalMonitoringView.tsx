import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { computeAreaChangePct } from '../lib/directoryUtils';
import { MonitoringObservationRecord, WaterbodyRecord } from '../types/monitoring';
import { WaterTrendLineChart } from './Charts';
import { MonitoringStatusText } from './StatusText';

interface HistoricalMonitoringViewProps {
  waterbodies: WaterbodyRecord[];
  observations: MonitoringObservationRecord[];
  initialWaterbodyId?: string | null;
}

export function HistoricalMonitoringView({
  waterbodies,
  observations,
  initialWaterbodyId,
}: HistoricalMonitoringViewProps) {
  const measuredWaterbodies = useMemo(
    () =>
      waterbodies.filter(
        (w) =>
          w.entry_type === 'named_waterbody' &&
          w.historical_area !== null &&
          w.recent_area !== null
      ),
    [waterbodies]
  );

  const [selectedId, setSelectedId] = useState<string>(
    initialWaterbodyId || measuredWaterbodies[0]?.id || ''
  );
  const [compareBlend, setCompareBlend] = useState<number>(60);

  const selectedWb = useMemo(
    () =>
      measuredWaterbodies.find((w) => w.id === selectedId) ||
      measuredWaterbodies[0],
    [measuredWaterbodies, selectedId]
  );

  const wbObservations = useMemo(() => {
    if (!selectedWb) return [];
    return observations
      .filter((o) => o.waterbodyId === selectedWb.id)
      .sort((a, b) => a.observationDate.localeCompare(b.observationDate));
  }, [observations, selectedWb]);

  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);

  if (!selectedWb) {
    return (
      <div className="p-6 bg-[#0F1A2E] border border-slate-800 rounded-xl text-slate-400">
        No waterbodies with historical and recent area measurements are currently available.
      </div>
    );
  }

  const activeObs =
    wbObservations[Math.min(selectedStepIdx, Math.max(wbObservations.length - 1, 0))] || null;

  const historicalArea = selectedWb.historical_area ?? 0;
  const recentArea = selectedWb.recent_area ?? 0;
  const ratio = Math.max(0.15, Math.min(1, recentArea / Math.max(historicalArea, 0.1)));
  const lostHa = Math.max(0, Number((historicalArea - recentArea).toFixed(1)));
  const areaChangePct = computeAreaChangePct(selectedWb);

  const outerRx = 140;
  const outerRy = 86;
  const recentScale = Math.sqrt(ratio);
  const innerRx = outerRx * recentScale;
  const innerRy = outerRy * recentScale;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-cyan-400">
            Historical Baseline vs. Recent Periodic Extent · DEMO DATA
          </p>
          <h1 className="text-2xl font-display font-bold text-slate-50">
            Historical Monitoring &amp; Before-After Comparison
          </h1>
        </div>

        <label className="flex flex-col gap-1 text-xs text-slate-300 min-w-[260px]">
          <span>Select Monitored Waterbody</span>
          <select
            value={selectedWb.id}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setSelectedStepIdx(0);
            }}
            className="px-3 py-2 rounded-lg bg-[#0F1A2E] border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {measuredWaterbodies.map((wb) => (
              <option key={wb.id} value={wb.id}>
                {wb.name} ({wb.state})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Before-and-After Interactive Comparison Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-100">
                Before-and-After Shoreline Extent Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Slide between historical reference ({selectedWb.historicalPeriod}) and recent ({selectedWb.recentPeriod})
              </p>
            </div>
            <MonitoringStatusText status={selectedWb.monitoring_status} />
          </div>

          <div className="bg-[#070D17] border border-slate-800 rounded-xl p-4">
            <svg
              viewBox="0 0 360 220"
              className="w-full h-56"
              role="img"
              aria-label="Before and after water extent schematic"
            >
              <line
                x1="20"
                y1="110"
                x2="340"
                y2="110"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1="180"
                y1="15"
                x2="180"
                y2="205"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              <path
                d={`M ${180 - outerRx} 110 C ${180 - outerRx} ${110 - outerRy * 0.9}, ${
                  180 + outerRx * 0.6
                } ${110 - outerRy * 1.05}, ${180 + outerRx} 110 C ${180 + outerRx * 0.9} ${
                  110 + outerRy
                }, ${180 - outerRx * 0.7} ${110 + outerRy * 0.95}, ${180 - outerRx} 110 Z`}
                fill="#0d9488"
                fillOpacity={Math.max(0.08, (100 - compareBlend) / 220)}
                stroke="#14b8a6"
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              <text
                x="180"
                y="24"
                textAnchor="middle"
                className="fill-teal-300 text-[10px] font-mono"
              >
                Historical Outer Shoreline: {historicalArea.toLocaleString()} ha
              </text>

              <path
                d={`M ${180 - innerRx} 112 C ${180 - innerRx} ${112 - innerRy * 0.9}, ${
                  180 + innerRx * 0.6
                } ${112 - innerRy * 1.05}, ${180 + innerRx} 112 C ${180 + innerRx * 0.9} ${
                  112 + innerRy
                }, ${180 - innerRx * 0.7} ${112 + innerRy * 0.95}, ${180 - innerRx} 112 Z`}
                fill="#06b6d4"
                fillOpacity={Math.max(0.18, compareBlend / 145)}
                stroke="#22d3ee"
                strokeWidth="2"
              />

              <text
                x="180"
                y="116"
                textAnchor="middle"
                className="fill-slate-50 text-[11px] font-mono font-semibold"
              >
                Recent: {recentArea.toLocaleString()} ha
              </text>
              <text
                x="180"
                y="206"
                textAnchor="middle"
                className="fill-rose-300 text-[10px] font-mono"
              >
                Exposed Ghost Shoreline Delta: {lostHa.toLocaleString()} ha (
                {areaChangePct ?? 0}%)
              </text>
            </svg>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                Comparison Overlay Focus
              </span>
              <span className="font-mono text-cyan-300">
                {compareBlend < 35
                  ? 'Emphasizing Historical Baseline'
                  : compareBlend > 65
                  ? 'Emphasizing Recent Shoreline'
                  : 'Balanced Ghost Shoreline Overlay'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={compareBlend}
              onChange={(e) => setCompareBlend(Number(e.target.value))}
              aria-label="Blend between historical and recent extent"
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Before (Historical {historicalArea.toLocaleString()} ha)</span>
              <span>After (Recent {recentArea.toLocaleString()} ha)</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-6 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 flex flex-col justify-between space-y-4">
          <WaterTrendLineChart
            observations={wbObservations}
            historicalBaselineHa={historicalArea}
            title={`Multi-Year Periodic Trajectory · ${selectedWb.name} (DEMO)`}
          />
          <p className="text-xs text-slate-400 leading-relaxed pt-3 border-t border-slate-800/80">
            Note: Satellite observations are captured periodically during cloud-free optical passes or SAR radar overpasses, not as continuous live video. {selectedWb.resolutionNote}
          </p>
        </div>
      </div>

      {/* Interactive Timeline Scrubber */}
      <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-semibold text-slate-100">
              Observation Timeline Explorer
            </h2>
            <p className="text-xs text-slate-400">
              Select any discrete observation date to inspect historical baseline vs. recent measurements
            </p>
          </div>
          {activeObs && (
            <span className="text-xs font-mono text-cyan-300">
              {activeObs.isHistoricalBaseline ? 'HISTORICAL BASELINE' : 'RECENT OBSERVATION'} ·{' '}
              {activeObs.observationDate}
            </span>
          )}
        </div>

        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {wbObservations.map((obs, idx) => {
            const isSelected = idx === selectedStepIdx;
            return (
              <button
                key={obs.id}
                type="button"
                onClick={() => setSelectedStepIdx(idx)}
                className={`min-w-[145px] text-left p-3 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 text-slate-100'
                    : 'bg-[#070D17] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <p className="text-[11px] font-mono text-slate-400">{obs.observationDate}</p>
                <p className="text-sm font-mono font-bold tabular-nums text-cyan-300 mt-1">
                  {obs.observedAreaHa.toLocaleString()} ha
                </p>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  {obs.isHistoricalBaseline ? 'Historical Ref' : obs.season}
                </p>
              </button>
            );
          })}
        </div>

        {activeObs && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block">Observation Period Type</span>
              <span
                className={`font-semibold ${
                  activeObs.isHistoricalBaseline ? 'text-teal-300' : 'text-cyan-300'
                }`}
              >
                {activeObs.isHistoricalBaseline
                  ? 'Historical Baseline'
                  : 'Recent Monitoring Pass'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Sensor Pipeline</span>
              <span className="text-slate-100 font-medium">{activeObs.sensorSource}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Mean NDWI / Cloud Cover</span>
              <span className="font-mono text-slate-100 tabular-nums">
                {activeObs.ndwiMean.toFixed(2)} · {activeObs.cloudCoverPct}% cloud
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Observation Note</span>
              <span className="text-slate-300">{activeObs.notes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
