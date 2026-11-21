import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArrowLeft, Compass, MapPinOff, PlusCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { computeAreaChangePct, formatAreaHa } from '../lib/directoryUtils';
import { LogObservationInput } from '../lib/firestoreService';
import {
  MonitoringObservationRecord,
  Season,
  SensorSource,
  WaterbodyRecord,
} from '../types/monitoring';
import { SeasonalComparisonChart, WaterTrendLineChart } from './Charts';
import { MonitoringStatusText, VerificationStatusText } from './StatusText';

interface WaterbodyDetailViewProps {
  waterbody: WaterbodyRecord;
  observations: MonitoringObservationRecord[];
  possibleDuplicates: string[];
  user: User | null;
  isFirestoreSynced: boolean;
  onBack: () => void;
  onOpenOnMap: (waterbodyId: string) => void;
  onLogObservation: (waterbody: WaterbodyRecord, input: LogObservationInput) => Promise<void>;
}

export function WaterbodyDetailView({
  waterbody,
  observations,
  possibleDuplicates,
  user,
  isFirestoreSynced,
  onBack,
  onOpenOnMap,
  onLogObservation,
}: WaterbodyDetailViewProps) {
  const miniMapRef = useRef<HTMLDivElement | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [obsForm, setObsForm] = useState<LogObservationInput>({
    observationDate: '2025-04-15',
    season: 'Pre-Monsoon',
    sensorSource: 'Field Log',
    observedAreaHa: waterbody.recent_area ?? 0,
    ndwiMean: 0.16,
    cloudCoverPct: 0,
    isHistoricalBaseline: false,
    notes: '',
  });

  const hasVerifiedMapLocation =
    waterbody.entry_type === 'named_waterbody' &&
    waterbody.verification_status === 'Verified' &&
    waterbody.latitude !== null &&
    waterbody.longitude !== null;

  useEffect(() => {
    if (!miniMapRef.current || !hasVerifiedMapLocation) return;
    const lat = waterbody.latitude as number;
    const lng = waterbody.longitude as number;

    const map = L.map(miniMapRef.current, {
      center: [lat, lng],
      zoom: (waterbody.historical_area ?? 0) > 2000 ? 10 : 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    if (waterbody.historicalPolygon) {
      L.polygon(waterbody.historicalPolygon, {
        color: '#14b8a6',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#0d9488',
        fillOpacity: 0.16,
      }).addTo(map);
    }

    if (waterbody.recentPolygon) {
      L.polygon(waterbody.recentPolygon, {
        color: '#22d3ee',
        weight: 2,
        fillColor: '#06b6d4',
        fillOpacity: 0.4,
      }).addTo(map);
    }

    L.circleMarker([lat, lng], {
      radius: 7,
      color: '#070d17',
      weight: 2,
      fillColor: '#22d3ee',
      fillOpacity: 1,
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [waterbody, hasVerifiedMapLocation]);

  const sortedObs = [...observations].sort((a, b) =>
    b.observationDate.localeCompare(a.observationDate)
  );

  const areaChangePct = computeAreaChangePct(waterbody);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onLogObservation(waterbody, obsForm);
      setShowLogForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Waterbody Directory
        </button>

        <div className="flex items-center gap-2">
          {hasVerifiedMapLocation && (
            <button
              type="button"
              onClick={() => onOpenOnMap(waterbody.id)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-[#0F1A2E] text-xs font-medium text-slate-200 hover:border-cyan-500/60 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              View on India Map
            </button>
          )}
          {user && isFirestoreSynced && waterbody.entry_type === 'named_waterbody' && (
            <button
              type="button"
              onClick={() => setShowLogForm((v) => !v)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Log Observation
            </button>
          )}
        </div>
      </div>

      {/* Header Summary */}
      <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400">
              <span>{waterbody.entry_type === 'traditional_term' ? 'Traditional Waterbody Term' : 'Named Waterbody'}</span>
              <span className="text-slate-600">·</span>
              <span>{waterbody.waterbody_category}</span>
              {hasVerifiedMapLocation && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>
                    {(waterbody.latitude as number).toFixed(4)}° N,{' '}
                    {(waterbody.longitude as number).toFixed(4)}° E
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-50">{waterbody.name}</h1>
            <p className="text-sm text-slate-300">
              {waterbody.district ? `${waterbody.district} District, ` : ''}
              {waterbody.state ? `${waterbody.state}, ` : 'State unspecified · '}
              {waterbody.country}
            </p>
            <p className="text-xs text-slate-400">
              Alternative Names:{' '}
              <span className="text-slate-200">
                {waterbody.alternative_names.length > 0
                  ? waterbody.alternative_names.join(', ')
                  : 'None recorded'}
              </span>
            </p>
            {possibleDuplicates.length > 0 && (
              <p className="text-xs text-amber-300">
                Possible duplicate name notice (not auto-merged): {possibleDuplicates.join(', ')}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <VerificationStatusText status={waterbody.verification_status} />
            <MonitoringStatusText status={waterbody.monitoring_status} />
            <span className="text-[11px] font-mono text-slate-400">
              Source: {waterbody.data_source}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <p className="text-xs text-slate-400">
              Historical Extent ({waterbody.historicalPeriod})
            </p>
            <p className="text-xl font-mono font-bold tabular-nums text-teal-300">
              {formatAreaHa(waterbody.historical_area)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Recent Extent ({waterbody.recentPeriod})</p>
            <p className="text-xl font-mono font-bold tabular-nums text-cyan-300">
              {formatAreaHa(waterbody.recent_area)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Estimated Water Loss</p>
            <p className="text-xl font-mono font-bold tabular-nums text-rose-300">
              {waterbody.estimated_area_loss !== null
                ? `${waterbody.estimated_area_loss.toLocaleString()} ha${
                    areaChangePct !== null ? ` (${areaChangePct}%)` : ''
                  }`
                : 'Pending'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Notes &amp; Resolution</p>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              {waterbody.resolutionNote}
            </p>
          </div>
        </div>
      </div>

      {/* Log Observation Form */}
      {showLogForm && (
        <form
          onSubmit={handleLogSubmit}
          className="bg-[#0F1A2E] border border-cyan-500/40 rounded-xl p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-100">
            Log New Monitoring Observation (Saves to Firestore)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1 text-xs text-slate-300">
              <span>Observation Date</span>
              <input
                type="date"
                required
                value={obsForm.observationDate}
                onChange={(e) => setObsForm({ ...obsForm, observationDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-300">
              <span>Season</span>
              <select
                value={obsForm.season}
                onChange={(e) => setObsForm({ ...obsForm, season: e.target.value as Season })}
                className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
              >
                <option value="Pre-Monsoon">Pre-Monsoon</option>
                <option value="Monsoon">Monsoon</option>
                <option value="Post-Monsoon">Post-Monsoon</option>
                <option value="Winter">Winter</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-300">
              <span>Observed Surface Area (ha)</span>
              <input
                type="number"
                step="0.1"
                min={0}
                required
                value={obsForm.observedAreaHa}
                onChange={(e) =>
                  setObsForm({ ...obsForm, observedAreaHa: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm font-mono text-slate-100"
              />
            </label>
            <label className="space-y-1 text-xs text-slate-300">
              <span>Source</span>
              <select
                value={obsForm.sensorSource}
                onChange={(e) =>
                  setObsForm({ ...obsForm, sensorSource: e.target.value as SensorSource })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
              >
                <option value="Field Log">Field Log</option>
                <option value="Sentinel-2 Optical (Demo)">Sentinel-2 Optical (Demo)</option>
                <option value="Sentinel-1 SAR (Demo)">Sentinel-1 SAR (Demo)</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-300 sm:col-span-2">
              <span>Field / Analysis Notes</span>
              <input
                type="text"
                value={obsForm.notes}
                onChange={(e) => setObsForm({ ...obsForm, notes: e.target.value })}
                placeholder="e.g., Shoreline recession observed along eastern bund..."
                className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowLogForm(false)}
              className="px-3.5 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Observation'}
            </button>
          </div>
        </form>
      )}

      {/* Map + Timeline Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#0F1A2E] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-100">
              {hasVerifiedMapLocation
                ? 'Verified Map Location & Ghost Shoreline (DEMO)'
                : 'Map Location Status'}
            </h2>
            <p className="text-xs text-slate-400">
              {hasVerifiedMapLocation
                ? 'Dashed teal ring = historical reference · Cyan fill = recent extent'
                : 'Only verified entries with actual coordinates are plotted on the map'}
            </p>
          </div>
          {hasVerifiedMapLocation ? (
            <div ref={miniMapRef} className="w-full h-80 flex-1 leaflet-dark-tiles" />
          ) : (
            <div className="h-80 flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 bg-[#070D17]">
              <MapPinOff className="w-7 h-7 text-slate-500" />
              <p className="text-sm font-medium text-slate-300">
                {waterbody.entry_type === 'traditional_term'
                  ? 'Traditional Terminology Record'
                  : 'Coordinates Not Yet Verified'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                {waterbody.entry_type === 'traditional_term'
                  ? 'Traditional regional water-body terms are preserved as lexicon records and are never plotted as fake individual locations.'
                  : 'GHOST SHORELINE does not invent coordinates for unverified entries. This record remains searchable in the Directory.'}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-5">
          <WaterTrendLineChart
            observations={observations}
            historicalBaselineHa={waterbody.historical_area ?? 0}
          />
          {waterbody.seasonalComparison && (
            <div className="pt-4 border-t border-slate-800/80">
              <SeasonalComparisonChart
                seasonal={waterbody.seasonalComparison}
                name={waterbody.name}
              />
            </div>
          )}
        </div>
      </div>

      {/* Satellite Observation History Table */}
      <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Satellite &amp; Field Observation History ({sortedObs.length})
          </h2>
          <span className="text-xs text-slate-400">
            Historical baselines vs. recent discrete observations
          </span>
        </div>
        {sortedObs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No satellite or field observations recorded for this entry yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0B1322] border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Season</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Area (ha)</th>
                  <th className="py-3 px-4 text-right">NDWI</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedObs.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-200">
                      {obs.observationDate}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      <span
                        className={obs.isHistoricalBaseline ? 'text-teal-300' : 'text-cyan-300'}
                      >
                        {obs.isHistoricalBaseline
                          ? 'Historical Baseline'
                          : 'Recent Observation'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-300">{obs.season}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-300">{obs.sensorSource}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-100">
                      {obs.observedAreaHa.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-300">
                      {obs.ndwiMean.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {obs.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
