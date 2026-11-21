export type EntryType = 'named_waterbody' | 'traditional_term';

export type WaterbodyCategory =
  | 'Natural lake'
  | 'Natural pond'
  | 'Village pond'
  | 'Reservoir'
  | 'Wetland'
  | 'Temple pond'
  | 'Agricultural pond'
  | 'Irrigation tank'
  | 'Traditional water structure'
  | 'Other or unverified waterbody';

export type VerificationStatus =
  | 'Verified'
  | 'Partially Verified'
  | 'Unverified'
  | 'Terminology Record';

export type MonitoringStatus =
  | 'Stable'
  | 'Watch'
  | 'Moderate Loss'
  | 'Severe Recession'
  | 'Low Confidence'
  | 'Unmonitored'
  | 'Terminology Only';

export type Season = 'Pre-Monsoon' | 'Monsoon' | 'Post-Monsoon' | 'Winter';

export type SensorSource =
  | 'Sentinel-2 Optical (Demo)'
  | 'Sentinel-1 SAR (Demo)'
  | 'JRC Historical (Demo)'
  | 'Field Log';

export type AlertSeverity = 'Low' | 'Moderate' | 'High' | 'Critical';
export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export type PageId =
  | 'dashboard'
  | 'map'
  | 'directory'
  | 'historical'
  | 'satellite'
  | 'alerts'
  | 'reports'
  | 'about';

export interface SeasonalComparison {
  baselinePreMonsoonHa: number;
  preMonsoonHa: number;
  monsoonHa: number;
  postMonsoonHa: number;
  winterHa: number;
}

export interface WaterbodyRecord {
  id: string;
  ownerId: string;
  name: string;
  alternative_names: string[];
  entry_type: EntryType;
  waterbody_category: WaterbodyCategory;
  state: string;
  district: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  historical_area: number | null;
  recent_area: number | null;
  estimated_area_loss: number | null;
  monitoring_status: MonitoringStatus;
  verification_status: VerificationStatus;
  data_source: string;
  historicalPeriod: string;
  recentPeriod: string;
  resolutionNote: string;
  createdAt?: string;
  updatedAt?: string;
  // Derived / client geometry helpers
  areaChangePct?: number | null;
  historicalPolygon?: [number, number][];
  recentPolygon?: [number, number][];
  seasonalComparison?: SeasonalComparison;
  hydrologyNotes?: string;
}

export interface MonitoringObservationRecord {
  id: string;
  ownerId: string;
  waterbodyId: string;
  waterbodyName: string;
  observationDate: string;
  season: Season;
  sensorSource: SensorSource;
  observedAreaHa: number;
  ndwiMean: number;
  cloudCoverPct: number;
  isHistoricalBaseline: boolean;
  notes: string;
  createdAt?: string;
}

export interface DroughtAlertRecord {
  id: string;
  ownerId: string;
  waterbodyId: string;
  waterbodyName: string;
  state: string;
  district: string;
  severity: AlertSeverity;
  status: AlertStatus;
  estimatedLossPct: number;
  seasonalComparisonNote: string;
  disclaimer: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email: string;
  organization: string;
  preferredState: string;
  demoSeeded: boolean;
  createdAt?: string;
  updatedAt?: string;
}
