import {
  AlertSeverity,
  AlertStatus,
  MonitoringStatus,
  VerificationStatus,
} from '../types/monitoring';

export function MonitoringStatusText({ status }: { status: MonitoringStatus }) {
  const config: Record<MonitoringStatus, { glyph: string; colorClass: string }> = {
    Stable: { glyph: '●', colorClass: 'text-teal-400' },
    Watch: { glyph: '◐', colorClass: 'text-cyan-300' },
    'Moderate Loss': { glyph: '▲', colorClass: 'text-amber-400' },
    'Severe Recession': { glyph: '◆', colorClass: 'text-rose-400' },
    'Low Confidence': { glyph: '◇', colorClass: 'text-slate-400' },
    Unmonitored: { glyph: '○', colorClass: 'text-slate-400' },
    'Terminology Only': { glyph: '§', colorClass: 'text-teal-300' },
  };

  const item = config[status] || config.Unmonitored;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${item.colorClass}`}
    >
      <span aria-hidden="true" className="text-[11px] leading-none">
        {item.glyph}
      </span>
      <span>{status}</span>
    </span>
  );
}

export function VerificationStatusText({ status }: { status: VerificationStatus }) {
  const config: Record<VerificationStatus, { glyph: string; colorClass: string }> = {
    Verified: { glyph: '✓', colorClass: 'text-teal-300' },
    'Partially Verified': { glyph: '◐', colorClass: 'text-cyan-300' },
    Unverified: { glyph: '?', colorClass: 'text-amber-300' },
    'Terminology Record': { glyph: '§', colorClass: 'text-slate-300' },
  };

  const item = config[status] || config.Unverified;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-mono whitespace-nowrap ${item.colorClass}`}
    >
      <span aria-hidden="true" className="text-[11px] leading-none">
        {item.glyph}
      </span>
      <span>{status}</span>
    </span>
  );
}

export function AlertSeverityText({ severity }: { severity: AlertSeverity }) {
  const config: Record<AlertSeverity, { glyph: string; colorClass: string }> = {
    Critical: { glyph: '◆', colorClass: 'text-rose-400' },
    High: { glyph: '▲', colorClass: 'text-amber-400' },
    Moderate: { glyph: '◐', colorClass: 'text-cyan-300' },
    Low: { glyph: '●', colorClass: 'text-teal-400' },
  };
  const item = config[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${item.colorClass}`}
    >
      <span aria-hidden="true" className="text-[11px] leading-none">
        {item.glyph}
      </span>
      <span>{severity}</span>
    </span>
  );
}

export function AlertStatusText({ status }: { status: AlertStatus }) {
  const config: Record<AlertStatus, string> = {
    Active: 'text-rose-300',
    Acknowledged: 'text-amber-300',
    Resolved: 'text-teal-300',
  };
  return (
    <span className={`text-xs font-mono whitespace-nowrap ${config[status]}`}>
      {status}
    </span>
  );
}
