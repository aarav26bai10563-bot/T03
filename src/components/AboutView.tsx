export function AboutView() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2 pb-6 border-b border-slate-800/80">
        <p className="text-xs font-mono text-cyan-400">
          Scientific Purpose &amp; Methodological Transparency
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-50">
          About GHOST SHORELINE
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          India&apos;s Vanishing Lakes &amp; Ponds Monitoring System — built to help researchers, municipal planners, and citizen hydrologists track surface water contraction across India.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-semibold text-slate-100">
          01. What Is a &ldquo;Ghost Shoreline&rdquo;?
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Across rapidly urbanizing and drought-prone basins in India, lakes, traditional irrigation tanks (eris, johads, keres), and floodplain wetlands frequently contract beyond normal seasonal variation. When water recedes or peripheral beds are reclaimed, the former historical waterline remains visible in multi-year satellite archives as a &ldquo;ghost shoreline.&rdquo;
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-slate-100">
          02. Scientific Accuracy &amp; Known Limitations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-cyan-300">
              DEMO Dataset Notice
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              All initial water extents, NDWI values, and alert severities shown in this application are labeled <strong>DEMO DATA</strong>. Live satellite API ingestion is not connected yet.
            </p>
          </div>

          <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-teal-300">
              Periodic Observation Cadence
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Satellite remote sensing is periodic (typically 5–12 day revisit intervals for Sentinel-2 and Sentinel-1), not continuous live video. Optical imagery is also interrupted by monsoon cloud cover.
            </p>
          </div>

          <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">
              Small Pond Resolution Limits
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Medium-resolution imagery (10m Sentinel-2 / 30m Landsat JRC) cannot reliably resolve very small village ponds (&lt; 0.5–1 hectare) due to mixed-pixel boundary noise and tree canopy overhang.
            </p>
          </div>

          <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-rose-300">
              Preliminary Screening Alerts Only
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Drought and water-loss alerts are preliminary remote-sensing screening indicators, not official government drought declarations (which are issued by State authorities, IMD, and CWC).
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-6 space-y-3">
        <h2 className="text-base font-display font-semibold text-slate-100">
          03. Historical vs. Recent Comparison Methodology
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          GHOST SHORELINE strictly separates historical reference baselines (multi-year 2016–2018 or JRC surface-water archives) from recent discrete observations (such as 2025 pre-monsoon passes) and evaluates them by season (Pre-Monsoon, Monsoon, Post-Monsoon, Winter) so natural monsoon fluctuations are not mistaken for permanent waterbody loss.
        </p>
      </section>
    </div>
  );
}
