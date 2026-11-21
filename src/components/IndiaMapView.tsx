import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  ArrowUpRight,
  Layers,
  LocateFixed,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { computeAreaChangePct, formatAreaHa } from '../lib/directoryUtils';
import { WaterbodyCategory, WaterbodyRecord } from '../types/monitoring';
import { MonitoringStatusText, VerificationStatusText } from './StatusText';

interface IndiaMapViewProps {
  waterbodies: WaterbodyRecord[];
  selectedWaterbodyId: string | null;
  onSelectMarker: (waterbodyId: string) => void;
  onOpenDetail: (waterbodyId: string) => void;
  onOpenDirectory: () => void;
}

const INDIA_CENTER: [number, number] = [22.3511, 78.9629];
const INDIA_ZOOM = 5;

const QUICK_CATEGORY_TABS: ('All' | WaterbodyCategory)[] = [
  'All',
  'Natural lake',
  'Wetland',
  'Reservoir',
  'Irrigation tank',
  'Village pond',
];

function getStatusColor(status: WaterbodyRecord['monitoring_status']): string {
  switch (status) {
    case 'Severe Recession':
      return '#f43f5e';
    case 'Moderate Loss':
      return '#f59e0b';
    case 'Watch':
      return '#22d3ee';
    case 'Stable':
      return '#14b8a6';
    case 'Low Confidence':
    default:
      return '#94a3b8';
  }
}

export function IndiaMapView({
  waterbodies,
  selectedWaterbodyId,
  onSelectMarker,
  onOpenDetail,
  onOpenDirectory,
}: IndiaMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<'All' | WaterbodyCategory>('All');
  const [darkOsmMode, setDarkOsmMode] = useState(true);
  const [showGhostPolygons, setShowGhostPolygons] = useState(true);

  // Strictly plot ONLY verified named waterbodies with actual coordinates
  const mappableWaterbodies = useMemo(
    () =>
      waterbodies.filter(
        (wb) =>
          wb.entry_type === 'named_waterbody' &&
          wb.verification_status === 'Verified' &&
          wb.latitude !== null &&
          wb.longitude !== null
      ),
    [waterbodies]
  );

  const unmappedCount = waterbodies.length - mappableWaterbodies.length;

  const states = useMemo(
    () =>
      [
        'All',
        ...Array.from(
          new Set(mappableWaterbodies.map((w) => w.state).filter(Boolean))
        ).sort(),
      ],
    [mappableWaterbodies]
  );

  const districts = useMemo(() => {
    const base =
      selectedState === 'All'
        ? mappableWaterbodies
        : mappableWaterbodies.filter((w) => w.state === selectedState);
    return ['All', ...Array.from(new Set(base.map((w) => w.district).filter(Boolean))).sort()];
  }, [mappableWaterbodies, selectedState]);

  const filteredWaterbodies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mappableWaterbodies.filter((wb) => {
      if (selectedState !== 'All' && wb.state !== selectedState) return false;
      if (selectedDistrict !== 'All' && wb.district !== selectedDistrict) return false;
      if (selectedCategory !== 'All' && wb.waterbody_category !== selectedCategory)
        return false;
      if (q) {
        const matchesName = wb.name.toLowerCase().includes(q);
        const matchesAlt = wb.alternative_names.some((a) =>
          a.toLowerCase().includes(q)
        );
        const matchesLoc =
          wb.district.toLowerCase().includes(q) || wb.state.toLowerCase().includes(q);
        if (!matchesName && !matchesAlt && !matchesLoc) return false;
      }
      return true;
    });
  }, [
    mappableWaterbodies,
    searchQuery,
    selectedState,
    selectedDistrict,
    selectedCategory,
  ]);

  const activeWaterbody = useMemo(
    () =>
      filteredWaterbodies.find((w) => w.id === selectedWaterbodyId) ||
      mappableWaterbodies.find((w) => w.id === selectedWaterbodyId) ||
      filteredWaterbodies[0] ||
      null,
    [filteredWaterbodies, mappableWaterbodies, selectedWaterbodyId]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      minZoom: 4,
      maxZoom: 17,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors · GHOST SHORELINE DEMO',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = layerGroupRef.current;
    const map = mapRef.current;
    if (!group || !map) return;

    group.clearLayers();

    filteredWaterbodies.forEach((wb) => {
      if (wb.latitude === null || wb.longitude === null) return;
      const color = getStatusColor(wb.monitoring_status);
      const isSelected = activeWaterbody?.id === wb.id;
      const pct = computeAreaChangePct(wb);

      if (showGhostPolygons && wb.historicalPolygon && wb.recentPolygon) {
        L.polygon(wb.historicalPolygon, {
          color: '#14b8a6',
          weight: isSelected ? 2.5 : 1.5,
          dashArray: '5 4',
          fillColor: '#0d9488',
          fillOpacity: isSelected ? 0.16 : 0.08,
        }).addTo(group);

        L.polygon(wb.recentPolygon, {
          color,
          weight: isSelected ? 2.5 : 1.5,
          fillColor: color,
          fillOpacity: isSelected ? 0.42 : 0.25,
        }).addTo(group);
      }

      const marker = L.circleMarker([wb.latitude, wb.longitude], {
        radius: isSelected ? 10 : 7,
        color: '#070d17',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
      });

      marker.bindPopup(
        `<div style="min-width:190px;font-family:sans-serif;">
          <div style="font-size:11px;color:#38bdf8;margin-bottom:2px;">Verified · ${wb.waterbody_category}</div>
          <div style="font-weight:700;font-size:14px;color:#f8fafc;">${wb.name}</div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${wb.district}, ${wb.state}</div>
          <div style="font-size:12px;color:#e2e8f0;">Recent: <strong>${formatAreaHa(wb.recent_area)}</strong>${pct !== null ? ` (${pct}%)` : ''}</div>
        </div>`
      );

      marker.on('click', () => {
        onSelectMarker(wb.id);
      });

      marker.addTo(group);
    });
  }, [filteredWaterbodies, activeWaterbody, showGhostPolygons, onSelectMarker]);

  const focusWaterbodyOnMap = (wb: WaterbodyRecord) => {
    onSelectMarker(wb.id);
    if (mapRef.current && wb.latitude !== null && wb.longitude !== null) {
      mapRef.current.flyTo(
        [wb.latitude, wb.longitude],
        (wb.historical_area ?? 0) > 2000 ? 10 : 12,
        { duration: 0.7 }
      );
    }
  };

  const handleResetIndiaView = () => {
    mapRef.current?.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 0.6 });
  };

  const activePct = activeWaterbody ? computeAreaChangePct(activeWaterbody) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-cyan-400">
            OpenStreetMap Base · {mappableWaterbodies.length} Verified Geolocated Sites
            {unmappedCount > 0 ? ` · ${unmappedCount} Unverified/Terminology Entries in Directory` : ''}
          </p>
          <h1 className="text-2xl font-display font-bold text-slate-50">
            Explore India Waterbody Map
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0F1A2E] border border-slate-800">
          {QUICK_CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-slate-100'
              }`}
            >
              {cat === 'All' ? 'All Verified' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-3.5">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified waterbodies or alternative names..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedDistrict('All');
          }}
          aria-label="Filter by state"
          className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
        >
          {states.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All States / UTs' : s}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          aria-label="Filter by district"
          className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
        >
          {districts.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All Districts' : d}
            </option>
          ))}
        </select>
      </div>

      {/* Split Map Stage */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8 relative rounded-xl overflow-hidden border border-slate-800 bg-[#070D17] min-h-[500px] lg:min-h-[600px]">
          <div
            ref={mapContainerRef}
            className={`w-full h-full min-h-[500px] lg:min-h-[600px] ${
              darkOsmMode ? 'leaflet-dark-tiles' : ''
            }`}
          />

          <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Zoom in"
              className="p-2 rounded-lg bg-[#0F1A2E]/95 border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/60 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Zoom out"
              className="p-2 rounded-lg bg-[#0F1A2E]/95 border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/60 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetIndiaView}
              aria-label="Reset map to India overview"
              className="p-2 rounded-lg bg-[#0F1A2E]/95 border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/60 transition-colors cursor-pointer"
            >
              <LocateFixed className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkOsmMode((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1A2E]/95 border border-slate-700 text-xs font-medium text-slate-200 hover:border-cyan-500/60 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              {darkOsmMode ? 'OSM Dark Mode' : 'OSM Standard'}
            </button>
            <button
              type="button"
              onClick={() => setShowGhostPolygons((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                showGhostPolygons
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                  : 'bg-[#0F1A2E]/95 border-slate-700 text-slate-300'
              }`}
            >
              {showGhostPolygons ? 'Ghost Shorelines: On' : 'Ghost Shorelines: Off'}
            </button>
          </div>

          <div className="absolute bottom-3 left-3 z-[400] bg-[#0F1A2E]/95 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Stable
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Watch
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Moderate Loss
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Severe Recession
            </span>
          </div>
        </div>

        {/* Right Side Inspector */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {activeWaterbody ? (
            <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-cyan-400">
                    {activeWaterbody.waterbody_category}
                  </p>
                  <h2 className="text-lg font-display font-bold text-slate-50">
                    {activeWaterbody.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeWaterbody.district}, {activeWaterbody.state}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <VerificationStatusText status={activeWaterbody.verification_status} />
                  <MonitoringStatusText status={activeWaterbody.monitoring_status} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                <div>
                  <p className="text-xs text-slate-400">Historical</p>
                  <p className="text-sm font-mono font-semibold tabular-nums text-teal-300">
                    {formatAreaHa(activeWaterbody.historical_area)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Recent</p>
                  <p className="text-sm font-mono font-semibold tabular-nums text-cyan-300">
                    {formatAreaHa(activeWaterbody.recent_area)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Change</p>
                  <p className="text-sm font-mono font-semibold tabular-nums text-rose-300">
                    {activePct !== null ? `${activePct}%` : 'Pending'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeWaterbody.resolutionNote}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => focusWaterbodyOnMap(activeWaterbody)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:border-cyan-500/60 transition-colors cursor-pointer"
                >
                  Zoom to Basin
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDetail(activeWaterbody.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
                >
                  Full Analysis
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 text-sm text-slate-400 space-y-2">
              <p>No verified geolocated waterbodies match these filters.</p>
              <button
                type="button"
                onClick={onOpenDirectory}
                className="text-xs text-cyan-300 hover:underline cursor-pointer"
              >
                Search unverified entries in Waterbody Directory &rarr;
              </button>
            </div>
          )}

          <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-4 flex-1 flex flex-col min-h-[260px] max-h-[370px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-300">
                Verified Map Sites ({filteredWaterbodies.length})
              </h3>
              <button
                type="button"
                onClick={onOpenDirectory}
                className="text-xs font-mono text-cyan-300 hover:underline cursor-pointer"
              >
                All Directory &rarr;
              </button>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-800/70 pr-1 mt-1">
              {filteredWaterbodies.map((wb) => {
                const isSelected = activeWaterbody?.id === wb.id;
                const pct = computeAreaChangePct(wb);
                return (
                  <button
                    key={wb.id}
                    type="button"
                    onClick={() => focusWaterbodyOnMap(wb)}
                    className={`w-full py-2.5 px-2.5 text-left flex items-center justify-between gap-2 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/12' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{wb.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {wb.district}, {wb.state}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-300 shrink-0">
                      {pct !== null ? `${pct}%` : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
