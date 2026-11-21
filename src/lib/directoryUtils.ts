import {
  EntryType,
  VerificationStatus,
  WaterbodyCategory,
  WaterbodyRecord,
} from '../types/monitoring';

export const WATERBODY_CATEGORIES: WaterbodyCategory[] = [
  'Natural lake',
  'Natural pond',
  'Village pond',
  'Reservoir',
  'Wetland',
  'Temple pond',
  'Agricultural pond',
  'Irrigation tank',
  'Traditional water structure',
  'Other or unverified waterbody',
];

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Verified',
  'Partially Verified',
  'Unverified',
  'Terminology Record',
];

const GENERIC_TOKENS = new Set([
  'lake',
  'pond',
  'reservoir',
  'wetland',
  'tank',
  'sagar',
  'tal',
  'taal',
  'talab',
  'jheel',
  'beel',
  'eri',
  'kere',
  'kund',
  'baoli',
  'bawdi',
  'johad',
  'sarovar',
  'dam',
  'lagoon',
]);

export function normalizeWaterbodyKey(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !GENERIC_TOKENS.has(token));
  return cleaned.join(' ').trim() || name.trim().toLowerCase();
}

/**
 * Detects possible duplicate names across entries of the same entry_type
 * without ever merging or deleting records automatically.
 */
export function detectPossibleDuplicates(
  entries: WaterbodyRecord[]
): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const byTypeAndKey = new Map<string, WaterbodyRecord[]>();

  for (const entry of entries) {
    const baseKey = normalizeWaterbodyKey(entry.name);
    if (!baseKey) continue;
    const composite = `${entry.entry_type}::${baseKey}`;
    const list = byTypeAndKey.get(composite) || [];
    list.push(entry);
    byTypeAndKey.set(composite, list);

    // Also index alternative names against same entry_type
    for (const alt of entry.alternative_names) {
      const altKey = normalizeWaterbodyKey(alt);
      if (altKey && altKey !== baseKey) {
        const altComposite = `${entry.entry_type}::${altKey}`;
        const altList = byTypeAndKey.get(altComposite) || [];
        altList.push(entry);
        byTypeAndKey.set(altComposite, altList);
      }
    }
  }

  for (const group of byTypeAndKey.values()) {
    if (group.length < 2) continue;
    const uniqueIds = new Set(group.map((g) => g.id));
    if (uniqueIds.size < 2) continue;

    for (const item of group) {
      const others = group
        .filter((other) => other.id !== item.id)
        .map((other) => other.name);
      if (others.length > 0) {
        const existing = result.get(item.id) || [];
        const merged = Array.from(new Set([...existing, ...others]));
        result.set(item.id, merged);
      }
    }
  }

  return result;
}

export function computeAreaChangePct(wb: WaterbodyRecord): number | null {
  if (
    wb.historical_area === null ||
    wb.recent_area === null ||
    wb.historical_area <= 0
  ) {
    return null;
  }
  return Number(
    (((wb.recent_area - wb.historical_area) / wb.historical_area) * 100).toFixed(1)
  );
}

export function formatAreaHa(val: number | null): string {
  if (val === null || Number.isNaN(val)) return 'Pending';
  return `${val.toLocaleString()} ha`;
}

export function inferCategoryFromName(
  name: string,
  entryType: EntryType
): WaterbodyCategory {
  if (entryType === 'traditional_term') {
    return 'Traditional water structure';
  }
  const lower = name.toLowerCase();
  if (lower.includes('reservoir') || lower.includes('dam') || lower.includes('barrage')) {
    return 'Reservoir';
  }
  if (lower.includes('wetland') || lower.includes('lagoon') || lower.includes('beel') || lower.includes('marsh')) {
    return 'Wetland';
  }
  if (lower.includes('temple') || lower.includes('pushkarini') || lower.includes('kalyani') || lower.includes('kund')) {
    return 'Temple pond';
  }
  if (lower.includes('eri') || lower.includes('tank') || lower.includes('cheruvu')) {
    return 'Irrigation tank';
  }
  if (lower.includes('johad') || lower.includes('village')) {
    return 'Village pond';
  }
  if (lower.includes('lake') || lower.includes('sagar') || lower.includes('tal') || lower.includes('jheel')) {
    return 'Natural lake';
  }
  if (lower.includes('pond')) {
    return 'Natural pond';
  }
  return 'Other or unverified waterbody';
}

/**
 * Parses bulk line-delimited entries (either plain names or pipe/tab-delimited rows)
 * while strictly preserving original spelling and never inventing states, districts, or coordinates.
 */
export function parseBatchDirectoryInput(
  rawText: string,
  entryType: EntryType,
  dataSource = 'User Directory Import'
): WaterbodyRecord[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
    .filter((line) => line.length > 0);

  const nowTag = Date.now().toString(36);
  return lines.map((line, index) => {
    // Optional structured delimiter: Name | State | District | Category | Alt1, Alt2
    const parts = line.includes('|')
      ? line.split('|').map((p) => p.trim())
      : [line];
    const originalName = parts[0];
    const state = parts[1] || '';
    const district = parts[2] || '';
    const rawCat = parts[3] as WaterbodyCategory | undefined;
    const altNames = parts[4]
      ? parts[4]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    const validCategory =
      rawCat && WATERBODY_CATEGORIES.includes(rawCat)
        ? rawCat
        : entryType === 'traditional_term'
        ? 'Traditional water structure'
        : 'Other or unverified waterbody';

    const slug = originalName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32);

    return {
      id: `${entryType === 'traditional_term' ? 'term' : 'dir'}-${slug || 'entry'}-${nowTag}-${index}`,
      ownerId: 'demo-public',
      name: originalName,
      alternative_names: altNames,
      entry_type: entryType,
      waterbody_category: validCategory,
      state,
      district,
      country: 'India',
      latitude: null,
      longitude: null,
      historical_area: null,
      recent_area: null,
      estimated_area_loss: null,
      monitoring_status:
        entryType === 'traditional_term' ? 'Terminology Only' : 'Unmonitored',
      verification_status:
        entryType === 'traditional_term' ? 'Terminology Record' : 'Unverified',
      data_source: dataSource,
      historicalPeriod: 'Pending baseline',
      recentPeriod: 'Pending observation',
      resolutionNote:
        entryType === 'traditional_term'
          ? 'Traditional water-body terminology record; not a geographic coordinate point.'
          : 'Imported directory entry awaiting geographic coordinate and satellite extent verification.',
      areaChangePct: null,
    };
  });
}
