import { useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  computeAreaChangePct,
  formatAreaHa,
  WATERBODY_CATEGORIES,
} from '../lib/directoryUtils';
import { WaterbodyCategory, WaterbodyRecord } from '../types/monitoring';
import { MonitoringStatusText, VerificationStatusText } from './StatusText';

interface ReportsViewProps {
  waterbodies: WaterbodyRecord[];
}

export function ReportsView({ waterbodies }: ReportsViewProps) {
  const [stateFilter, setStateFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | WaterbodyCategory>('All');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const namedRows = useMemo(
    () => waterbodies.filter((w) => w.entry_type === 'named_waterbody'),
    [waterbodies]
  );

  const states = useMemo(
    () =>
      [
        'All',
        ...Array.from(new Set(namedRows.map((w) => w.state).filter(Boolean))).sort(),
      ],
    [namedRows]
  );

  const filteredRows = useMemo(() => {
    return namedRows.filter((wb) => {
      if (stateFilter !== 'All' && wb.state !== stateFilter) return false;
      if (categoryFilter !== 'All' && wb.waterbody_category !== categoryFilter) return false;
      return true;
    });
  }, [namedRows, stateFilter, categoryFilter]);

  const totalHistHa = filteredRows.reduce((s, w) => s + (w.historical_area ?? 0), 0);
  const totalRecentHa = filteredRows.reduce((s, w) => s + (w.recent_area ?? 0), 0);

  const handleDownloadCsv = async () => {
    if (filteredRows.length === 0) return;
    setExportingCsv(true);
    setExportMessage('');
    try {
      const response = await fetch('/api/reports/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: filteredRows }),
      });

      if (!response.ok) {
        throw new Error('Server CSV generation failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ghost-shoreline-report-${stateFilter.toLowerCase().replace(/\s+/g, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportMessage(`Exported ${filteredRows.length} rows to CSV.`);
    } catch {
      setExportMessage('Could not export CSV. Please retry.');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleDownloadPdf = () => {
    if (filteredRows.length === 0) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.text('GHOST SHORELINE — Waterbody Analysis Report', 14, 18);
    doc.setFontSize(10);
    doc.text("India's Vanishing Lakes & Ponds Monitoring System", 14, 24);
    doc.text(
      `DEMO DATA NOTICE: Sample reference values only. Generated ${new Date().toISOString().slice(0, 10)}.`,
      14,
      30
    );
    doc.text(
      `Scope: ${stateFilter} | Category: ${categoryFilter} | Sites: ${filteredRows.length} | Historical: ${Math.round(totalHistHa).toLocaleString()} ha | Recent: ${Math.round(totalRecentHa).toLocaleString()} ha`,
      14,
      37
    );

    let y = 46;
    doc.setFontSize(9);
    doc.text('Waterbody', 14, y);
    doc.text('State', 72, y);
    doc.text('Category', 106, y);
    doc.text('Hist (ha)', 142, y);
    doc.text('Recent (ha)', 162, y);
    doc.text('Verification', 184, y);
    y += 3;
    doc.line(14, y, 198, y);
    y += 5;

    for (const row of filteredRows) {
      if (y > 270) {
        doc.addPage();
        y = 18;
      }
      doc.text(row.name.slice(0, 28), 14, y);
      doc.text((row.state || 'Unspecified').slice(0, 16), 72, y);
      doc.text(row.waterbody_category.slice(0, 18), 106, y);
      doc.text(row.historical_area !== null ? String(row.historical_area) : 'Pending', 142, y);
      doc.text(row.recent_area !== null ? String(row.recent_area) : 'Pending', 162, y);
      doc.text(row.verification_status.slice(0, 14), 184, y);
      y += 6;
    }

    y += 6;
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.text(
      'Scientific Note: Satellite monitoring is periodic (not live video). Small ponds (<5 ha) have higher detection uncertainty.',
      14,
      y
    );

    doc.save(`ghost-shoreline-report-${stateFilter.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    setExportMessage(`Generated PDF report for ${filteredRows.length} waterbodies.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-cyan-400">
            CSV &amp; PDF Export · DEMO DATA
          </p>
          <h1 className="text-2xl font-display font-bold text-slate-50">
            Waterbody Analysis Reports
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={exportingCsv || filteredRows.length === 0}
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {exportingCsv ? 'Preparing CSV...' : 'Download CSV Report'}
          </button>
          <button
            type="button"
            disabled={filteredRows.length === 0}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-[#0F1A2E] text-slate-100 text-xs font-semibold hover:border-cyan-500/60 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Download PDF Report
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="bg-teal-500/10 border border-teal-500/40 rounded-lg px-4 py-2.5 text-xs text-teal-200">
          {exportMessage}
        </div>
      )}

      {/* Report Scope Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-4">
        <label className="space-y-1 text-xs text-slate-300">
          <span>State / UT Scope</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All India' : s}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-xs text-slate-300">
          <span>Waterbody Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'All' | WaterbodyCategory)}
            className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
          >
            <option value="All">All Categories</option>
            {WATERBODY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col justify-center">
          <span className="text-xs text-slate-400">Included Historical Total</span>
          <span className="text-lg font-mono font-bold tabular-nums text-teal-300">
            {Math.round(totalHistHa).toLocaleString()} ha
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs text-slate-400">Included Recent Total</span>
          <span className="text-lg font-mono font-bold tabular-nums text-cyan-300">
            {Math.round(totalRecentHa).toLocaleString()} ha
          </span>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            Report Preview ({filteredRows.length} Records · DEMO DATA)
          </h2>
          <span className="text-xs text-slate-400">
            Includes CSV &amp; PDF scientific disclosures
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#0B1322] border-b border-slate-800 text-xs text-slate-400">
                <th className="py-3 px-4">Waterbody</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Historical</th>
                <th className="py-3 px-4 text-right">Recent</th>
                <th className="py-3 px-4 text-right">Change</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Monitoring</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRows.map((row) => {
                const pct = computeAreaChangePct(row);
                return (
                  <tr key={row.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-medium text-slate-100">{row.name}</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {row.district ? `${row.district}, ` : ''}
                      {row.state || 'Unspecified'}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-300">
                      {row.waterbody_category}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-teal-300">
                      {formatAreaHa(row.historical_area)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-cyan-300">
                      {formatAreaHa(row.recent_area)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-200">
                      {pct !== null ? `${pct}%` : '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <VerificationStatusText status={row.verification_status} />
                    </td>
                    <td className="py-2.5 px-4">
                      <MonitoringStatusText status={row.monitoring_status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
