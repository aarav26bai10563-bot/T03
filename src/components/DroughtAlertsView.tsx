import { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  AlertSeverity,
  AlertStatus,
  DroughtAlertRecord,
  WaterbodyRecord,
} from '../types/monitoring';
import { AlertSeverityText, AlertStatusText } from './StatusText';

interface DroughtAlertsViewProps {
  alerts: DroughtAlertRecord[];
  waterbodies: WaterbodyRecord[];
  user: User | null;
  isFirestoreSynced: boolean;
  onUpdateAlertStatus: (alertId: string, nextStatus: AlertStatus) => Promise<void>;
  onSelectWaterbody: (waterbodyId: string) => void;
}

export function DroughtAlertsView({
  alerts,
  waterbodies,
  user,
  isFirestoreSynced,
  onUpdateAlertStatus,
  onSelectWaterbody,
}: DroughtAlertsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<'All' | AlertSeverity>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | AlertStatus>('All');
  const [busyId, setBusyId] = useState<string | null>(null);

  const wbMap = useMemo(() => new Map(waterbodies.map((w) => [w.id, w])), [waterbodies]);

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter]);

  const handleTransition = async (alertId: string, nextStatus: AlertStatus) => {
    setBusyId(alertId);
    try {
      await onUpdateAlertStatus(alertId, nextStatus);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-rose-300">
          Preliminary Hydrological Screening · DEMO DATA
        </p>
        <h1 className="text-2xl font-display font-bold text-slate-50">
          Potential Water-Loss &amp; Drought Alerts
        </h1>
      </div>

      {/* Mandatory Official Disclaimer */}
      <div className="bg-[#0F1A2E] border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
          <p className="font-semibold text-amber-200 text-sm">
            Preliminary Monitoring Alerts — Not Official Drought Declarations
          </p>
          <p>
            These alerts highlight potential surface-water area declines within the DEMO dataset to support early screening. Official drought declarations in India are issued exclusively by State Governments in coordination with IMD and the Central Water Commission (CWC) based on rainfall, soil moisture, crop indices, and reservoir telemetry.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#070D17] border border-slate-800">
          {(['All', 'Critical', 'High', 'Moderate', 'Low'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                severityFilter === sev
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-slate-100'
              }`}
            >
              {sev === 'All' ? 'All Severities' : sev}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | AlertStatus)}
          aria-label="Filter by alert status"
          className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-xs text-slate-100"
        >
          <option value="All">All Alert Statuses</option>
          <option value="Active">Active</option>
          <option value="Acknowledged">Acknowledged</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-[#0F1A2E] border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
            No alerts match the selected severity or status filters.
          </div>
        ) : (
          filtered.map((alert) => {
            const linkedWb = wbMap.get(alert.waterbodyId);
            const seasonal = linkedWb?.seasonalComparison;
            return (
              <div
                key={alert.id}
                className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <AlertSeverityText severity={alert.severity} />
                      <span className="text-slate-600">·</span>
                      <AlertStatusText status={alert.status} />
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">DEMO DATA</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectWaterbody(alert.waterbodyId)}
                      className="text-lg font-display font-bold text-slate-100 hover:text-cyan-300 transition-colors text-left cursor-pointer"
                    >
                      {alert.waterbodyName}
                    </button>
                    <p className="text-xs text-slate-400">
                      {alert.district}, {alert.state}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Est. Surface Loss</p>
                      <p className="text-xl font-mono font-bold tabular-nums text-rose-300">
                        -{alert.estimatedLossPct}%
                      </p>
                    </div>

                    {user && isFirestoreSynced && alert.status !== 'Resolved' && (
                      <div className="flex items-center gap-2">
                        {alert.status === 'Active' && (
                          <button
                            type="button"
                            disabled={busyId === alert.id}
                            onClick={() => handleTransition(alert.id, 'Acknowledged')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:border-cyan-500/60 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Acknowledge
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === alert.id}
                          onClick={() => handleTransition(alert.id, 'Resolved')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-semibold hover:bg-teal-400 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-300">{alert.seasonalComparisonNote}</p>

                {seasonal && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 block">Hist. Pre-Monsoon</span>
                      <span className="font-mono tabular-nums text-teal-300 font-semibold">
                        {seasonal.baselinePreMonsoonHa.toLocaleString()} ha
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Recent Monsoon</span>
                      <span className="font-mono tabular-nums text-cyan-300 font-semibold">
                        {seasonal.monsoonHa.toLocaleString()} ha
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Recent Winter</span>
                      <span className="font-mono tabular-nums text-slate-200 font-semibold">
                        {seasonal.winterHa.toLocaleString()} ha
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Recent Pre-Monsoon</span>
                      <span className="font-mono tabular-nums text-amber-300 font-semibold">
                        {seasonal.preMonsoonHa.toLocaleString()} ha
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 italic">{alert.disclaimer}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
