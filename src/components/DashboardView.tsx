import {
  AlertTriangle,
  ArrowRight,
  CloudUpload,
  Compass,
  Database,
  Droplets,
  TrendingDown,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { computeAreaChangePct } from '../lib/directoryUtils';
import {
  DroughtAlertRecord,
  MonitoringObservationRecord,
  PageId,
  WaterbodyRecord,
} from '../types/monitoring';
import { SeasonalComparisonChart, WaterTrendLineChart } from './Charts';
import { MonitoringStatusText } from './StatusText';

interface DashboardViewProps {
  waterbodies: WaterbodyRecord[];
  observations: MonitoringObservationRecord[];
  alerts: DroughtAlertRecord[];
  user: User | null;
  isFirestoreSynced: boolean;
  syncingDemo: boolean;
  onSyncDemoToFirestore: () => void;
  onSignIn: () => void;
  onNavigate: (page: PageId) => void;
  onSelectWaterbody: (waterbodyId: string) => void;
}

export function DashboardView({
  waterbodies,
  observations,
  alerts,
  user,
  isFirestoreSynced,
  syncingDemo,
  onSyncDemoToFirestore,
  onSignIn,
  onNavigate,
  onSelectWaterbody,
}: DashboardViewProps) {
  const namedEntries = waterbodies.filter((wb) => wb.entry_type === 'named_waterbody');
  const termEntries = waterbodies.filter((wb) => wb.entry_type === 'traditional_term');
  const measuredEntries = namedEntries.filter(
    (wb) => wb.historical_area !== null && wb.recent_area !== null
  );

  const waterbodiesWithLoss = measuredEntries.filter((wb) => {
    const pct = computeAreaChangePct(wb);
    return pct !== null && pct <= -10;
  });

  const totalHistoricalHa = measuredEntries.reduce(
    (sum, wb) => sum + (wb.historical_area ?? 0),
    0
  );
  const totalRecentHa = measuredEntries.reduce(
    (sum, wb) => sum + (wb.recent_area ?? 0),
    0
  );
  const estimatedAreaLostHa = Math.max(
    0,
    Number((totalHistoricalHa - totalRecentHa).toFixed(1))
  );
  const lostPct =
    totalHistoricalHa > 0
      ? Number(((estimatedAreaLostHa / totalHistoricalHa) * 100).toFixed(1))
      : 0;
  const activeAlertsCount = alerts.filter((a) => a.status !== 'Resolved').length;

  const severeRecessionList = [...measuredEntries]
    .sort((a, b) => (computeAreaChangePct(a) ?? 0) - (computeAreaChangePct(b) ?? 0))
    .slice(0, 6);

  const featuredWb = severeRecessionList[0] || measuredEntries[0] || namedEntries[0];
  const featuredObservations = featuredWb
    ? observations.filter((o) => o.waterbodyId === featuredWb.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-mono text-cyan-400">
            DEMO DATA · Sample National Surface Water Intelligence
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-50 text-balance">
            India&apos;s Vanishing Lakes &amp; Ponds Monitoring Overview
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tracking surface water extent contractions, exposed ghost shorelines, and preliminary dry-season anomalies across Indian lakes, wetlands, reservoirs, and village tanks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            Explore India Map
          </button>
          <button
            type="button"
            onClick={() => onNavigate('directory')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-[#0F1A2E] text-slate-200 text-sm font-medium hover:border-cyan-500/60 hover:text-cyan-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Database className="w-4 h-4" />
            Waterbody Directory
          </button>
        </div>
      </section>

      {/* 4 Summary Cards */}
      <section
        aria-label="Key summary indicators"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Monitored Waterbodies</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-50">
              {namedEntries.length}
            </span>
            <span className="text-xs font-mono text-slate-400">DEMO DATA</span>
          </div>
          <p className="text-xs text-slate-400 tabular-nums">
            {measuredEntries.length} measured · {termEntries.length} traditional terms
          </p>
        </div>

        <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Possible Water Loss</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-amber-300">
              {waterbodiesWithLoss.length}
            </span>
            <span className="text-xs font-mono text-slate-400">
              / {measuredEntries.length} measured (DEMO)
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Sites showing &ge;10% reduction vs. historical baseline
          </p>
        </div>

        <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Estimated Water Area Lost</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-rose-300">
              {estimatedAreaLostHa.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">ha ({lostPct}% DEMO)</span>
          </div>
          <p className="text-xs text-slate-400 tabular-nums">
            Historical {Math.round(totalHistoricalHa).toLocaleString()} ha &rarr; Recent{' '}
            {Math.round(totalRecentHa).toLocaleString()} ha
          </p>
        </div>

        <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Potential Drought Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold tabular-nums text-slate-50">
              {activeAlertsCount}
            </span>
            <span className="text-xs font-mono text-slate-400">PRELIMINARY · DEMO</span>
          </div>
          <p className="text-xs text-slate-400">
            Preliminary screening indicators, not official declarations
          </p>
        </div>
      </section>

      {/* Primary Charts & Priority Watchlist */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 space-y-6">
          {featuredWb && (
            <>
              <WaterTrendLineChart
                observations={featuredObservations}
                historicalBaselineHa={featuredWb.historical_area ?? 0}
                title={`Priority Recession Signal: ${featuredWb.name} (${featuredWb.state}) · DEMO DATA`}
              />
              {featuredWb.seasonalComparison && (
                <div className="pt-5 border-t border-slate-800/80">
                  <SeasonalComparisonChart
                    seasonal={featuredWb.seasonalComparison}
                    name={featuredWb.name}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-100">
                  Highest Recession Sites
                </h2>
                <p className="text-xs text-slate-400">DEMO reference comparison (ha)</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('historical')}
                className="text-xs font-medium text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 cursor-pointer"
              >
                Timeline
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {severeRecessionList.map((wb) => {
                const pct = computeAreaChangePct(wb);
                return (
                  <button
                    key={wb.id}
                    type="button"
                    onClick={() => onSelectWaterbody(wb.id)}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-800/35 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{wb.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {wb.district}, {wb.state} · {wb.waterbody_category}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-sm font-mono font-semibold tabular-nums text-rose-300">
                        {pct !== null ? `${pct}%` : '—'}
                      </p>
                      <MonitoringStatusText status={wb.monitoring_status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Firestore Workspace Sync Card */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">
                Cloud Workspace (Firestore)
              </h3>
              <span className="text-xs font-mono text-cyan-300">
                {isFirestoreSynced ? 'Synced' : user ? 'Ready' : 'Guest Mode'}
              </span>
            </div>
            {!user ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with Google to persist the India Waterbody Directory, field observations, and alert statuses in your Firestore workspace.
                </p>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full py-2 px-4 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  Sign in with Google to Save Data
                </button>
              </div>
            ) : !isFirestoreSynced ? (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Copy the curated DEMO dataset into your Firestore collections so you can log updates and manage alerts directly in the cloud.
                </p>
                <button
                  type="button"
                  disabled={syncingDemo}
                  onClick={onSyncDemoToFirestore}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-teal-500 text-slate-950 text-xs font-semibold hover:bg-teal-400 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  {syncingDemo ? 'Syncing to Firestore...' : 'Initialize My Firestore Workspace'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Your waterbodies directory, periodic observations, and preliminary alerts are live-synced with Firebase Firestore.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
