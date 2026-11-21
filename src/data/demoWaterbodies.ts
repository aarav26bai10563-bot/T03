import {
  DroughtAlertRecord,
  MonitoringObservationRecord,
  WaterbodyRecord,
} from '../types/monitoring';
import {
  DIRECTORY_NAMED_ENTRIES,
  DIRECTORY_TRADITIONAL_TERMS,
} from './waterbodyDirectory';

export const DEMO_WATERBODIES: WaterbodyRecord[] = [
  ...DIRECTORY_NAMED_ENTRIES,
  ...DIRECTORY_TRADITIONAL_TERMS,
];

export const DEMO_OBSERVATIONS: MonitoringObservationRecord[] = DIRECTORY_NAMED_ENTRIES.filter(
  (wb) => wb.historical_area !== null && wb.recent_area !== null
).flatMap((wb) => {
  const hist = wb.historical_area as number;
  const rec = wb.recent_area as number;
  const pct = wb.areaChangePct ?? 0;
  const mid1 = Number((hist * 0.94).toFixed(1));
  const mid2 = Number((hist * 0.88 + rec * 0.12).toFixed(1));
  const mid3 = Number((hist * 0.55 + rec * 0.45).toFixed(1));
  const mid4 = Number((hist * 0.32 + rec * 0.68).toFixed(1));
  const monsoonDip = Number(Math.min(hist, rec * 1.18).toFixed(1));

  return [
    {
      id: `obs-${wb.id}-2017-post`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2017-11-14',
      season: 'Post-Monsoon',
      sensorSource: 'JRC Historical (Demo)',
      observedAreaHa: hist,
      ndwiMean: 0.34,
      cloudCoverPct: 4,
      isHistoricalBaseline: true,
      notes: 'Historical post-monsoon reference surface extent (DEMO).',
    },
    {
      id: `obs-${wb.id}-2019-pre`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2019-05-08',
      season: 'Pre-Monsoon',
      sensorSource: 'Sentinel-2 Optical (Demo)',
      observedAreaHa: mid1,
      ndwiMean: 0.27,
      cloudCoverPct: 8,
      isHistoricalBaseline: true,
      notes: 'Baseline pre-monsoon optical pass (DEMO).',
    },
    {
      id: `obs-${wb.id}-2020-mon`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2020-08-21',
      season: 'Monsoon',
      sensorSource: 'Sentinel-1 SAR (Demo)',
      observedAreaHa: mid2,
      ndwiMean: 0.25,
      cloudCoverPct: 72,
      isHistoricalBaseline: false,
      notes: 'SAR backscatter delineation used due to heavy monsoon cloud cover (DEMO).',
    },
    {
      id: `obs-${wb.id}-2022-win`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2022-01-19',
      season: 'Winter',
      sensorSource: 'Sentinel-2 Optical (Demo)',
      observedAreaHa: mid3,
      ndwiMean: 0.19,
      cloudCoverPct: 6,
      isHistoricalBaseline: false,
      notes: 'Mid-period winter extent showing emerging ghost shoreline along shallow rim (DEMO).',
    },
    {
      id: `obs-${wb.id}-2023-pre`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2023-05-12',
      season: 'Pre-Monsoon',
      sensorSource: 'Sentinel-2 Optical (Demo)',
      observedAreaHa: mid4,
      ndwiMean: 0.14,
      cloudCoverPct: 5,
      isHistoricalBaseline: false,
      notes: 'Dry-season recession confirmed in optical pass (DEMO).',
    },
    {
      id: `obs-${wb.id}-2024-post`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2024-11-04',
      season: 'Post-Monsoon',
      sensorSource: 'Sentinel-2 Optical (Demo)',
      observedAreaHa: monsoonDip,
      ndwiMean: 0.21,
      cloudCoverPct: 11,
      isHistoricalBaseline: false,
      notes: 'Post-monsoon recharge failed to reach 2017 historical outer shoreline (DEMO).',
    },
    {
      id: `obs-${wb.id}-2025-recent`,
      ownerId: 'demo-public',
      waterbodyId: wb.id,
      waterbodyName: wb.name,
      observationDate: '2025-03-18',
      season: 'Pre-Monsoon',
      sensorSource: 'Sentinel-2 Optical (Demo)',
      observedAreaHa: rec,
      ndwiMean: pct < -35 ? 0.08 : 0.17,
      cloudCoverPct: 3,
      isHistoricalBaseline: false,
      notes: 'Most recent sample periodic observation (DEMO).',
    },
  ];
});

export const DEMO_ALERTS: DroughtAlertRecord[] = DIRECTORY_NAMED_ENTRIES.filter(
  (wb) => (wb.areaChangePct ?? 0) <= -15 && wb.historical_area !== null && wb.recent_area !== null
).map((wb) => {
  const loss = Math.abs(wb.areaChangePct ?? 0);
  const severity =
    loss >= 45
      ? 'Critical'
      : loss >= 30
      ? 'High'
      : loss >= 20
      ? 'Moderate'
      : 'Low';

  return {
    id: `alert-${wb.id}`,
    ownerId: 'demo-public',
    waterbodyId: wb.id,
    waterbodyName: wb.name,
    state: wb.state,
    district: wb.district,
    severity,
    status: 'Active',
    estimatedLossPct: loss,
    seasonalComparisonNote: `Recent sample extent (${wb.recent_area} ha) is ${loss}% below historical reference (${wb.historical_area} ha).`,
    disclaimer:
      'Preliminary monitoring alert from DEMO dataset. Not an official drought declaration by IMD, CWC, or State authorities.',
  };
});
