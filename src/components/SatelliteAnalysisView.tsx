import { useState } from 'react';
import { Eye, Layers, Radar, Waves } from 'lucide-react';

type AnalysisTab = 'sentinel2' | 'sentinel1' | 'ndwi' | 'jrc' | 'ghost';

const TABS: { id: AnalysisTab; label: string }[] = [
  { id: 'sentinel2', label: 'Sentinel-2 Optical' },
  { id: 'sentinel1', label: 'Sentinel-1 Radar' },
  { id: 'ndwi', label: 'NDWI Detection' },
  { id: 'jrc', label: 'JRC Surface Water' },
  { id: 'ghost', label: 'Ghost Shoreline' },
];

export function SatelliteAnalysisView() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('sentinel2');
  const [ndwiThreshold, setNdwiThreshold] = useState<number>(0.15);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  // Simulated interactive sensitivity readout for NDWI threshold educational tool
  const estimatedWaterPixelsPct = Math.max(
    18,
    Math.min(82, Math.round(64 - (ndwiThreshold - 0.05) * 95))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-amber-300">
            Satellite Backend Status: Interface Ready — Not Connected to Live Satellite APIs
          </p>
          <h1 className="text-2xl font-display font-bold text-slate-50">
            Satellite Remote Sensing Analysis Workspace
          </h1>
        </div>
      </div>

      {/* Honest Satellite Connection Banner */}
      <div className="bg-[#0F1A2E] border border-amber-500/35 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-200">
            Prepared Analytical Interface (DEMO Visualizations Only)
          </p>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Live Copernicus Sentinel-2, Sentinel-1 SAR, and JRC Global Surface Water ingestion pipelines are not yet connected to a live earth-observation backend. This workspace demonstrates the planned optical, radar, NDWI, and ghost-shoreline analytical layers.
          </p>
        </div>
        <span className="text-xs font-mono text-amber-300 whitespace-nowrap shrink-0">
          Revisit: 5–12 Days (Periodic)
        </span>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0F1A2E] border border-slate-800 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Pipeline Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-7 bg-[#0F1A2E] border border-slate-800/90 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-300">
              {activeTab === 'sentinel1'
                ? 'Illustrative SAR Backscatter Visualization (DEMO)'
                : activeTab === 'jrc'
                ? 'Illustrative Wetland Shoreline Retreat (DEMO)'
                : 'Illustrative NDWI & Ghost Shoreline Visualization (DEMO)'}
            </span>
            <span className="text-xs font-mono text-slate-400">10m–30m Reference</span>
          </div>

          <div className="relative flex-1 min-h-[300px] bg-[#070D17]">
            {activeTab === 'sentinel1' ? (
              !imgError.radar ? (
                <img
                  src="/src/assets/images/demo_radar_backscatter_1795296148603.jpg"
                  alt="Illustrative Sentinel-1 SAR radar backscatter over a reservoir basin"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError((prev) => ({ ...prev, radar: true }))}
                  className="w-full h-full object-cover max-h-[420px]"
                />
              ) : (
                <div className="h-80 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Radar className="w-8 h-8 text-cyan-400" />
                  <span className="text-xs">SAR Radar Swath Visualization (DEMO)</span>
                </div>
              )
            ) : activeTab === 'jrc' ? (
              !imgError.wetland ? (
                <img
                  src="/src/assets/images/demo_wetland_aerial_1795296148179.jpg"
                  alt="Illustrative aerial view of receding wetland mudflats"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError((prev) => ({ ...prev, wetland: true }))}
                  className="w-full h-full object-cover max-h-[420px]"
                />
              ) : (
                <div className="h-80 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Waves className="w-8 h-8 text-teal-400" />
                  <span className="text-xs">Wetland Occurrence Visualization (DEMO)</span>
                </div>
              )
            ) : !imgError.ndwi ? (
              <img
                src="/src/assets/images/demo_sentinel_ndwi_lake_1795296148182.jpg"
                alt="Illustrative satellite view of receding lake shoreline contours"
                referrerPolicy="no-referrer"
                onError={() => setImgError((prev) => ({ ...prev, ndwi: true }))}
                className="w-full h-full object-cover max-h-[420px]"
              />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Layers className="w-8 h-8 text-cyan-400" />
                <span className="text-xs">NDWI &amp; Ghost Shoreline Visualization (DEMO)</span>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-4">
              <p className="text-xs text-slate-200">
                Illustrative DEMO visualization — not live satellite imagery from Copernicus or Google Earth Engine.
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 space-y-5">
          {activeTab === 'sentinel2' && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-display font-bold text-slate-50">
                  Sentinel-2 Multispectral Optical (10m)
                </h2>
                <p className="text-xs font-mono text-cyan-300">
                  Bands B3 (Green, 560 nm) · B8 (NIR, 842 nm) · B11 (SWIR, 1610 nm)
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sentinel-2 provides 10-meter spatial resolution optical imagery roughly every 5 days. It excels at delineating clear open-water boundaries for lakes and reservoirs during dry and post-monsoon seasons.
              </p>
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <p className="font-semibold text-slate-100">Known Sensor Limitations:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                  <li>Optical sensors cannot see through monsoon cloud cover; gaps are common from June to September.</li>
                  <li>Dense floating macrophytes (water hyacinth) can mimic terrestrial vegetation spectra.</li>
                  <li>Small village ponds (&lt; 0.5–1 ha) suffer from mixed boundary pixels at 10m resolution.</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'sentinel1' && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-display font-bold text-slate-50">
                  Sentinel-1 C-Band SAR Radar (10m)
                </h2>
                <p className="text-xs font-mono text-cyan-300">
                  Polarization: VV / VH Backscatter · All-Weather Day &amp; Night
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Synthetic Aperture Radar (SAR) penetrates clouds and rain, making it essential for monitoring monsoon flood peaks and wetland inundation across Assam, Kerala, and Odisha. Calm water acts as a specular reflector yielding low backscatter (dark regions).
              </p>
              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <p className="font-semibold text-slate-100">Radar Processing Considerations:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                  <li>Wind-roughened water waves increase backscatter and can cause false dry classifications.</li>
                  <li>Flat tarmac or dry sandbars can mimic smooth-water radar signatures without optical cross-checks.</li>
                </ul>
              </div>
            </>
          )}

          {activeTab === 'ndwi' && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-display font-bold text-slate-50">
                  NDWI Water Detection Simulator
                </h2>
                <p className="text-xs font-mono text-cyan-300">
                  NDWI = (Green − NIR) / (Green + NIR)
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Normalized Difference Water Index (McFeeters, 1996) separates open water (positive values) from soil and vegetation (negative values). Adjust the interactive threshold below to see why calibration matters:
              </p>

              <div className="bg-[#070D17] border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Classification Threshold (&tau;)</span>
                  <span className="font-mono font-bold text-cyan-300 tabular-nums">
                    NDWI &ge; {ndwiThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={-0.05}
                  max={0.45}
                  step={0.01}
                  value={ndwiThreshold}
                  onChange={(e) => setNdwiThreshold(Number(e.target.value))}
                  aria-label="NDWI classification threshold"
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Simulated Water Mask Coverage (DEMO):</span>
                  <span className="font-mono font-semibold text-teal-300 tabular-nums">
                    {estimatedWaterPixelsPct}% of basin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {ndwiThreshold < 0.08
                    ? 'Low threshold risks misclassifying damp mudflats and urban shadows as open water.'
                    : ndwiThreshold > 0.28
                    ? 'Strict threshold isolates deep water but can omit turbid shallow edges.'
                    : 'Balanced water-detection window for clear inland lakes.'}
                </p>
              </div>
            </>
          )}

          {activeTab === 'jrc' && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-display font-bold text-slate-50">
                  JRC Global Surface Water (1984–Present)
                </h2>
                <p className="text-xs font-mono text-cyan-300">
                  Landsat 30m Historical Occurrence &amp; Seasonality Reference
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                The European Commission&apos;s Joint Research Centre (JRC) dataset maps long-term surface water occurrence at 30m resolution. GHOST SHORELINE uses historical maximum-extent concepts to distinguish permanent reservoirs from seasonal wetlands.
              </p>
              <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-4">
                <p className="font-semibold text-slate-200">Why 30m Archive Matters:</p>
                <p>
                  Because 30m Landsat pixels cover 900 m², small rural johads and temple tanks require higher-resolution validation before drawing loss conclusions.
                </p>
              </div>
            </>
          )}

          {activeTab === 'ghost' && (
            <>
              <div className="space-y-1.5">
                <h2 className="text-lg font-display font-bold text-slate-50">
                  Ghost Shoreline Extraction Logic
                </h2>
                <p className="text-xs font-mono text-cyan-300">
                  Ghost Zone = Historical Maximum Extent − Recent Water Extent
                </p>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                A &ldquo;Ghost Shoreline&rdquo; represents the ring of former lakebed or wetland margin that held water in historical reference periods but appears dry, silted, or built over in recent observations.
              </p>
              <div className="bg-[#070D17] border border-slate-800 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-teal-300">
                  <Eye className="w-4 h-4 shrink-0" />
                  <span>Outer dashed ring = Historical reference water extent</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-300">
                  <Waves className="w-4 h-4 shrink-0" />
                  <span>Inner core = Recent observed open-water extent</span>
                </div>
                <p className="text-slate-400 pt-1">
                  Distinguishing natural seasonal drawdown from permanent encroachment requires multi-year post-monsoon comparisons.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
