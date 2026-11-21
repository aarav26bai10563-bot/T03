import React, { useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  CopyCheck,
  Database,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  NAMED_WATERBODY_TARGET_COUNT,
  TRADITIONAL_TERMS_TARGET_COUNT,
} from '../data/waterbodyDirectory';
import {
  detectPossibleDuplicates,
  formatAreaHa,
  parseBatchDirectoryInput,
  VERIFICATION_STATUSES,
  WATERBODY_CATEGORIES,
} from '../lib/directoryUtils';
import { CreateWaterbodyInput } from '../lib/firestoreService';
import {
  EntryType,
  VerificationStatus,
  WaterbodyCategory,
  WaterbodyRecord,
} from '../types/monitoring';
import { MonitoringStatusText, VerificationStatusText } from './StatusText';

interface DirectoryViewProps {
  waterbodies: WaterbodyRecord[];
  user: User | null;
  isFirestoreSynced: boolean;
  onSelectWaterbody: (waterbodyId: string) => void;
  onCreateWaterbody: (input: CreateWaterbodyInput) => Promise<void>;
  onBatchImportEntries: (entries: WaterbodyRecord[]) => Promise<void>;
  onSignIn: () => void;
}

type DirectorySection = 'named_waterbody' | 'traditional_term';
type SortOption = 'alpha-asc' | 'alpha-desc' | 'loss-desc' | 'verification';

export function DirectoryView({
  waterbodies,
  user,
  isFirestoreSynced,
  onSelectWaterbody,
  onCreateWaterbody,
  onBatchImportEntries,
  onSignIn,
}: DirectoryViewProps) {
  const [activeSection, setActiveSection] = useState<DirectorySection>('named_waterbody');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | WaterbodyCategory>('All');
  const [verificationFilter, setVerificationFilter] = useState<'All' | VerificationStatus>('All');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('alpha-asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchEntryType, setBatchEntryType] = useState<EntryType>('named_waterbody');
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [altNamesInput, setAltNamesInput] = useState('');

  const [formState, setFormState] = useState<CreateWaterbodyInput>({
    name: '',
    alternative_names: [],
    entry_type: 'named_waterbody',
    waterbody_category: 'Other or unverified waterbody',
    state: '',
    district: '',
    latitude: null,
    longitude: null,
    historical_area: null,
    recent_area: null,
    verification_status: 'Unverified',
    resolutionNote: '',
  });

  const namedEntries = useMemo(
    () => waterbodies.filter((w) => w.entry_type === 'named_waterbody'),
    [waterbodies]
  );

  const traditionalTermEntries = useMemo(
    () => waterbodies.filter((w) => w.entry_type === 'traditional_term'),
    [waterbodies]
  );

  const duplicateMap = useMemo(
    () => detectPossibleDuplicates(waterbodies),
    [waterbodies]
  );

  const sectionEntries =
    activeSection === 'named_waterbody' ? namedEntries : traditionalTermEntries;

  const states = useMemo(() => {
    const unique = Array.from(
      new Set(sectionEntries.map((w) => w.state.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const hasBlank = sectionEntries.some((w) => !w.state.trim());
    return ['All', ...unique, ...(hasBlank ? ['Unspecified'] : [])];
  }, [sectionEntries]);

  const districts = useMemo(() => {
    const base =
      stateFilter === 'All'
        ? sectionEntries
        : stateFilter === 'Unspecified'
        ? sectionEntries.filter((w) => !w.state.trim())
        : sectionEntries.filter((w) => w.state === stateFilter);
    const unique = Array.from(
      new Set(base.map((w) => w.district.trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    const hasBlank = base.some((w) => !w.district.trim());
    return ['All', ...unique, ...(hasBlank ? ['Unspecified'] : [])];
  }, [sectionEntries, stateFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = sectionEntries.filter((wb) => {
      if (stateFilter === 'Unspecified' && wb.state.trim() !== '') return false;
      if (stateFilter !== 'All' && stateFilter !== 'Unspecified' && wb.state !== stateFilter)
        return false;

      if (districtFilter === 'Unspecified' && wb.district.trim() !== '') return false;
      if (
        districtFilter !== 'All' &&
        districtFilter !== 'Unspecified' &&
        wb.district !== districtFilter
      ) {
        return false;
      }

      if (categoryFilter !== 'All' && wb.waterbody_category !== categoryFilter) return false;
      if (verificationFilter !== 'All' && wb.verification_status !== verificationFilter)
        return false;
      if (duplicatesOnly && !duplicateMap.has(wb.id)) return false;

      if (q) {
        const matchesName = wb.name.toLowerCase().includes(q);
        const matchesAlt = wb.alternative_names.some((alt) =>
          alt.toLowerCase().includes(q)
        );
        const matchesLocation =
          wb.state.toLowerCase().includes(q) || wb.district.toLowerCase().includes(q);
        if (!matchesName && !matchesAlt && !matchesLocation) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'alpha-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'alpha-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'loss-desc') {
        const lossA = a.estimated_area_loss ?? -Infinity;
        const lossB = b.estimated_area_loss ?? -Infinity;
        return lossB - lossA;
      }
      return a.verification_status.localeCompare(b.verification_status);
    });
  }, [
    sectionEntries,
    searchQuery,
    stateFilter,
    districtFilter,
    categoryFilter,
    verificationFilter,
    duplicatesOnly,
    duplicateMap,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetFiltersAndPage = (nextSection: DirectorySection) => {
    setActiveSection(nextSection);
    setStateFilter('All');
    setDistrictFilter('All');
    setCategoryFilter('All');
    setVerificationFilter('All');
    setCurrentPage(1);
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (formState.name.trim().length < 1) {
      setFormError('Please enter the waterbody or traditional term name.');
      return;
    }
    setSubmitting(true);
    try {
      const alts = altNamesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      await onCreateWaterbody({
        ...formState,
        alternative_names: alts,
      });
      setShowAddModal(false);
      setAltNamesInput('');
      setFormState({
        name: '',
        alternative_names: [],
        entry_type: 'named_waterbody',
        waterbody_category: 'Other or unverified waterbody',
        state: '',
        district: '',
        latitude: null,
        longitude: null,
        historical_area: null,
        recent_area: null,
        verification_status: 'Unverified',
        resolutionNote: '',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchFeedback('');
    const parsed = parseBatchDirectoryInput(batchRawText, batchEntryType);
    if (parsed.length === 0) {
      setBatchFeedback('Paste at least one entry line to import.');
      return;
    }
    setBatchBusy(true);
    try {
      await onBatchImportEntries(parsed);
      setBatchFeedback(
        `Imported ${parsed.length} ${
          batchEntryType === 'traditional_term'
            ? 'traditional terminology records'
            : 'named waterbody entries'
        } with original spelling preserved.`
      );
      setBatchRawText('');
      setShowBatchModal(false);
    } catch (err) {
      setBatchFeedback(err instanceof Error ? err.message : 'Batch import failed.');
    } finally {
      setBatchBusy(false);
    }
  };

  const sectionDuplicateCount = sectionEntries.filter((e) => duplicateMap.has(e.id)).length;

  return (
    <div className="space-y-6">
      {/* Header & Totals */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-mono text-cyan-400">
            INDIA WATERBODY DIRECTORY · {namedEntries.length} Named ({NAMED_WATERBODY_TARGET_COUNT} target) ·{' '}
            {traditionalTermEntries.length} Traditional Terms ({TRADITIONAL_TERMS_TARGET_COUNT} target)
          </p>
          <h1 className="text-2xl font-display font-bold text-slate-50">
            India Waterbody &amp; Traditional Terms Directory
          </h1>
          <p className="text-xs text-slate-400">
            Original spelling preserved for all entries. Unverified records and traditional terms are never assigned invented states, districts, or coordinates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setBatchEntryType(activeSection);
              setShowBatchModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-[#0F1A2E] text-xs font-medium text-slate-200 hover:border-cyan-500/60 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Batch Import List
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => {
                setFormState((prev) => ({
                  ...prev,
                  entry_type: activeSection,
                  waterbody_category:
                    activeSection === 'traditional_term'
                      ? 'Traditional water structure'
                      : 'Other or unverified waterbody',
                  verification_status:
                    activeSection === 'traditional_term'
                      ? 'Terminology Record'
                      : 'Unverified',
                }));
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign in to Save to Firestore
            </button>
          )}
        </div>
      </div>

      {batchFeedback && (
        <div className="bg-teal-500/10 border border-teal-500/40 rounded-xl px-4 py-3 text-xs text-teal-200 flex items-center justify-between gap-2">
          <span>{batchFeedback}</span>
          <button
            type="button"
            onClick={() => setBatchFeedback('')}
            className="text-teal-300 hover:text-teal-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two Separate Directory Sections Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => resetFiltersAndPage('named_waterbody')}
          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            activeSection === 'named_waterbody'
              ? 'bg-[#0F1A2E] border-cyan-500/60'
              : 'bg-[#0B1322] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Database className="w-4 h-4 text-cyan-400" />
              Named Waterbodies Section
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">
              {namedEntries.length} / {NAMED_WATERBODY_TARGET_COUNT}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Named lakes, ponds, village tanks, reservoirs, wetlands, and temple ponds across India.
          </p>
        </button>

        <button
          type="button"
          onClick={() => resetFiltersAndPage('traditional_term')}
          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
            activeSection === 'traditional_term'
              ? 'bg-[#0F1A2E] border-teal-500/60'
              : 'bg-[#0B1322] border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100">
              <BookMarked className="w-4 h-4 text-teal-400" />
              Traditional Waterbody Terms Section
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-teal-300">
              {traditionalTermEntries.length} / {TRADITIONAL_TERMS_TARGET_COUNT}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Regional terminology &amp; traditional water-harvesting systems stored as terminology records (not plotted on map).
          </p>
        </button>
      </div>

      {/* Search, Filters & Alphabetical Sort Bar */}
      <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search waterbody name, traditional name, state..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setDistrictFilter('All');
              setCurrentPage(1);
            }}
            aria-label="Filter by state"
            className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All States' : s}
              </option>
            ))}
          </select>

          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by district"
            className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Districts' : d}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as 'All' | WaterbodyCategory);
              setCurrentPage(1);
            }}
            aria-label="Filter by waterbody category"
            className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Categories</option>
            {WATERBODY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value as 'All' | VerificationStatus);
              setCurrentPage(1);
            }}
            aria-label="Filter by verification status"
            className="px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Verification</option>
            {VERIFICATION_STATUSES.map((vs) => (
              <option key={vs} value={vs}>
                {vs}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 tabular-nums">
              Showing <strong className="text-slate-200">{filtered.length}</strong> of{' '}
              {sectionEntries.length} entries in this section
            </span>

            <button
              type="button"
              onClick={() => {
                setDuplicatesOnly((v) => !v);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                duplicatesOnly
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                  : 'bg-[#070D17] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <CopyCheck className="w-3.5 h-3.5" />
              Possible Duplicates ({sectionDuplicateCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSortBy((prev) => (prev === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc'))
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#070D17] border border-slate-800 text-slate-200 hover:border-cyan-500/60 cursor-pointer"
            >
              {sortBy === 'alpha-desc' ? (
                <ArrowUpAZ className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <ArrowDownAZ className="w-3.5 h-3.5 text-cyan-400" />
              )}
              {sortBy === 'alpha-desc' ? 'Name Z → A' : 'Name A → Z'}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort entries"
              className="px-2.5 py-1 rounded-md bg-[#070D17] border border-slate-800 text-slate-200"
            >
              <option value="alpha-asc">Alphabetical (A–Z)</option>
              <option value="alpha-desc">Alphabetical (Z–A)</option>
              <option value="loss-desc">Area Loss (High–Low)</option>
              <option value="verification">Verification Status</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Entries per page"
              className="px-2.5 py-1 rounded-md bg-[#070D17] border border-slate-800 text-slate-200"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table (Desktop) & Cards (Mobile) */}
      <div className="bg-[#0F1A2E] border border-slate-800/90 rounded-xl overflow-hidden">
        {paginatedRows.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-200">
              {activeSection === 'traditional_term' && traditionalTermEntries.length === 0
                ? `Traditional Waterbody Terms section is prepared for your ${TRADITIONAL_TERMS_TARGET_COUNT} entries.`
                : 'No entries match your current search or filter criteria.'}
            </p>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              {activeSection === 'traditional_term' && traditionalTermEntries.length === 0
                ? 'Send the full 325-entry list in your next message (or click Batch Import List above) to populate traditional regional terms as terminology records without fake geographic coordinates.'
                : 'Try clearing the state, category, or verification filter.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-medium text-slate-400 bg-[#0B1322]">
                    <th className="py-3.5 px-4">Waterbody / Term Name</th>
                    <th className="py-3.5 px-4">State / District</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Historical</th>
                    <th className="py-3.5 px-4 text-right">Recent</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4">Monitoring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {paginatedRows.map((wb) => {
                    const dupMatches = duplicateMap.get(wb.id);
                    return (
                      <tr
                        key={wb.id}
                        onClick={() => onSelectWaterbody(wb.id)}
                        className="hover:bg-slate-800/35 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-100">{wb.name}</div>
                          <div className="text-xs text-slate-400">
                            {wb.alternative_names.length > 0
                              ? `Alt: ${wb.alternative_names.join(', ')}`
                              : wb.data_source}
                            {dupMatches && (
                              <span className="text-amber-300 ml-2">
                                · Possible duplicate: {dupMatches.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          <div>{wb.state || 'Unspecified'}</div>
                          <div className="text-slate-500">{wb.district || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          {wb.waterbody_category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-teal-300">
                          {formatAreaHa(wb.historical_area)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-cyan-300">
                          {formatAreaHa(wb.recent_area)}
                        </td>
                        <td className="py-3 px-4">
                          <VerificationStatusText status={wb.verification_status} />
                        </td>
                        <td className="py-3 px-4">
                          <MonitoringStatusText status={wb.monitoring_status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {paginatedRows.map((wb) => (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => onSelectWaterbody(wb.id)}
                  className="w-full p-4 text-left space-y-2 hover:bg-slate-800/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{wb.name}</p>
                      <p className="text-xs text-slate-400">
                        {wb.state || 'Unspecified state'}
                        {wb.district ? `, ${wb.district}` : ''} · {wb.waterbody_category}
                      </p>
                    </div>
                    <VerificationStatusText status={wb.verification_status} />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>Hist: {formatAreaHa(wb.historical_area)}</span>
                    <span>Recent: {formatAreaHa(wb.recent_area)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="border-t border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 bg-[#0B1322]">
              <span className="font-mono tabular-nums text-slate-400">
                Page {safePage} of {totalPages} ({filtered.length} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0F1A2E] text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0F1A2E] text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Single Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-[#0F1A2E] border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-slate-50">
                Add Waterbody or Traditional Term Record
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmitNew} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1 text-xs text-slate-300">
                  <span>Entry Type</span>
                  <select
                    value={formState.entry_type}
                    onChange={(e) => {
                      const nextType = e.target.value as EntryType;
                      setFormState({
                        ...formState,
                        entry_type: nextType,
                        waterbody_category:
                          nextType === 'traditional_term'
                            ? 'Traditional water structure'
                            : 'Other or unverified waterbody',
                        verification_status:
                          nextType === 'traditional_term'
                            ? 'Terminology Record'
                            : 'Unverified',
                        latitude: nextType === 'traditional_term' ? null : formState.latitude,
                        longitude: nextType === 'traditional_term' ? null : formState.longitude,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                  >
                    <option value="named_waterbody">Named Waterbody</option>
                    <option value="traditional_term">Traditional Waterbody Term</option>
                  </select>
                </label>

                <label className="block space-y-1 text-xs text-slate-300">
                  <span>Waterbody Category</span>
                  <select
                    value={formState.waterbody_category}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        waterbody_category: e.target.value as WaterbodyCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                  >
                    {WATERBODY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1 text-xs text-slate-300 sm:col-span-2">
                  <span>Primary Name (Exact Spelling)</span>
                  <input
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                  />
                </label>

                <label className="block space-y-1 text-xs text-slate-300 sm:col-span-2">
                  <span>Alternative / Traditional Names (comma-separated)</span>
                  <input
                    value={altNamesInput}
                    onChange={(e) => setAltNamesInput(e.target.value)}
                    placeholder="Optional regional spellings..."
                    className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                  />
                </label>

                <label className="block space-y-1 text-xs text-slate-300">
                  <span>State (leave blank if unknown)</span>
                  <input
                    value={formState.state}
                    onChange={(e) => setFormState({ ...formState, state: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                  />
                </label>

                <label className="block space-y-1 text-xs text-slate-300">
                  <span>District (leave blank if unknown)</span>
                  <input
                    value={formState.district}
                    onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                  />
                </label>

                {formState.entry_type === 'named_waterbody' && (
                  <>
                    <label className="block space-y-1 text-xs text-slate-300">
                      <span>Latitude (optional, 5°–38° N)</span>
                      <input
                        type="number"
                        step="0.0001"
                        min={5}
                        max={38}
                        value={formState.latitude ?? ''}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            latitude: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        placeholder="Leave empty if unverified"
                        className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm font-mono text-slate-100"
                      />
                    </label>
                    <label className="block space-y-1 text-xs text-slate-300">
                      <span>Longitude (optional, 68°–98° E)</span>
                      <input
                        type="number"
                        step="0.0001"
                        min={68}
                        max={98}
                        value={formState.longitude ?? ''}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            longitude: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        placeholder="Leave empty if unverified"
                        className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm font-mono text-slate-100"
                      />
                    </label>
                    <label className="block space-y-1 text-xs text-slate-300">
                      <span>Verification Status</span>
                      <select
                        value={formState.verification_status}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            verification_status: e.target.value as VerificationStatus,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                      >
                        <option value="Unverified">Unverified</option>
                        <option value="Partially Verified">Partially Verified</option>
                        <option value="Verified">Verified</option>
                      </select>
                    </label>
                  </>
                )}
              </div>

              <label className="block space-y-1 text-xs text-slate-300">
                <span>Notes / Context</span>
                <textarea
                  rows={2}
                  value={formState.resolutionNote}
                  onChange={(e) =>
                    setFormState({ ...formState, resolutionNote: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-sm text-slate-100"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 hover:text-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-[#0F1A2E] border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-slate-50">
                Batch Import Directory Entries
              </h2>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Paste one entry per line (either plain names or <span className="font-mono text-cyan-300">Name | State | District | Category | Alt1, Alt2</span>). Original spelling is preserved and missing states, districts, or coordinates are never invented.
            </p>
            <form onSubmit={handleBatchSubmit} className="space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-300">Import Section:</span>
                <select
                  value={batchEntryType}
                  onChange={(e) => setBatchEntryType(e.target.value as EntryType)}
                  className="px-3 py-1.5 rounded-lg bg-[#070D17] border border-slate-800 text-slate-100"
                >
                  <option value="named_waterbody">Named Waterbodies</option>
                  <option value="traditional_term">Traditional Waterbody Terms</option>
                </select>
              </div>
              <textarea
                rows={8}
                value={batchRawText}
                onChange={(e) => setBatchRawText(e.target.value)}
                placeholder={'Example:\nLoktak Lake | Manipur | Bishnupur | Natural lake | Phumdis Lake\nKund'}
                className="w-full px-3 py-2 rounded-lg bg-[#070D17] border border-slate-800 text-xs font-mono text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchBusy}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-semibold hover:bg-cyan-400 disabled:opacity-60 cursor-pointer"
                >
                  {batchBusy ? 'Importing...' : 'Import Entries'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
