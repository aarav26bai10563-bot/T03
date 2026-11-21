import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  DEMO_ALERTS,
  DEMO_OBSERVATIONS,
  DEMO_WATERBODIES,
} from './data/demoWaterbodies';
import { detectPossibleDuplicates } from './lib/directoryUtils';
import { auth, testFirestoreConnection } from './lib/firebase';
import {
  createWaterbodyRecord,
  CreateWaterbodyInput,
  ensureUserProfile,
  LogObservationInput,
  logWaterbodyObservation,
  seedDemoWorkspaceToFirestore,
  seedRecordsToFirestore,
  signInWithGoogle,
  signOutUser,
  subscribeWorkspaceCollections,
  updateAlertStatusInFirestore,
} from './lib/firestoreService';
import {
  AlertStatus,
  DroughtAlertRecord,
  MonitoringObservationRecord,
  PageId,
  UserProfileRecord,
  WaterbodyRecord,
} from './types/monitoring';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutShell } from './components/LayoutShell';
import { DashboardView } from './components/DashboardView';
import { IndiaMapView } from './components/IndiaMapView';
import { DirectoryView } from './components/DirectoryView';
import { WaterbodyDetailView } from './components/WaterbodyDetailView';
import { HistoricalMonitoringView } from './components/HistoricalMonitoringView';
import { SatelliteAnalysisView } from './components/SatelliteAnalysisView';
import { DroughtAlertsView } from './components/DroughtAlertsView';
import { ReportsView } from './components/ReportsView';
import { AboutView } from './components/AboutView';

function GhostShorelineApp() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [selectedWaterbodyId, setSelectedWaterbodyId] = useState<string | null>(null);
  const [detailWaterbodyId, setDetailWaterbodyId] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [authBanner, setAuthBanner] = useState<string | null>(null);
  const [syncingDemo, setSyncingDemo] = useState(false);

  const [localImportedEntries, setLocalImportedEntries] = useState<WaterbodyRecord[]>([]);
  const [cloudWaterbodies, setCloudWaterbodies] = useState<WaterbodyRecord[]>([]);
  const [cloudObservations, setCloudObservations] = useState<MonitoringObservationRecord[]>([]);
  const [cloudAlerts, setCloudAlerts] = useState<DroughtAlertRecord[]>([]);

  useEffect(() => {
    void testFirestoreConnection();
  }, []);

  useEffect(() => {
    let unsubWorkspace: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (unsubWorkspace) {
        unsubWorkspace();
        unsubWorkspace = null;
      }

      if (currentUser) {
        try {
          const profile = await ensureUserProfile(currentUser);
          setUserProfile(profile);
          unsubWorkspace = subscribeWorkspaceCollections(
            currentUser.uid,
            setCloudWaterbodies,
            setCloudObservations,
            setCloudAlerts
          );
        } catch (err) {
          setAuthBanner(
            err instanceof Error
              ? 'Could not load Firestore workspace; displaying local DEMO reference data.'
              : 'Workspace connection error.'
          );
        }
      } else {
        setUserProfile(null);
        setCloudWaterbodies([]);
        setCloudObservations([]);
        setCloudAlerts([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubWorkspace) unsubWorkspace();
    };
  }, []);

  const isFirestoreSynced = Boolean(user && cloudWaterbodies.length >= DEMO_WATERBODIES.length);

  const activeWaterbodies = useMemo(() => {
    if (cloudWaterbodies.length === 0) {
      return [...DEMO_WATERBODIES, ...localImportedEntries];
    }
    const cloudByKey = new Map(
      cloudWaterbodies.map((wb) => [`${wb.entry_type}::${wb.name}`, wb])
    );
    const merged = DEMO_WATERBODIES.map(
      (demo) => cloudByKey.get(`${demo.entry_type}::${demo.name}`) || demo
    );
    const demoKeys = new Set(
      DEMO_WATERBODIES.map((demo) => `${demo.entry_type}::${demo.name}`)
    );
    for (const cloudItem of cloudWaterbodies) {
      if (!demoKeys.has(`${cloudItem.entry_type}::${cloudItem.name}`)) {
        merged.push(cloudItem);
      }
    }
    for (const localItem of localImportedEntries) {
      const key = `${localItem.entry_type}::${localItem.name}`;
      if (!demoKeys.has(key) && !cloudByKey.has(key)) {
        merged.push(localItem);
      }
    }
    return merged;
  }, [cloudWaterbodies, localImportedEntries]);

  const activeObservations = useMemo(
    () =>
      isFirestoreSynced && cloudObservations.length > 0
        ? cloudObservations
        : DEMO_OBSERVATIONS,
    [isFirestoreSynced, cloudObservations]
  );

  const activeAlerts = useMemo(
    () => (isFirestoreSynced && cloudAlerts.length > 0 ? cloudAlerts : DEMO_ALERTS),
    [isFirestoreSynced, cloudAlerts]
  );

  const duplicateMap = useMemo(
    () => detectPossibleDuplicates(activeWaterbodies),
    [activeWaterbodies]
  );

  const handleSignIn = async () => {
    setAuthBanner(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthBanner(
        err instanceof Error
          ? `Sign-in cancelled or blocked: ${err.message}`
          : 'Google Sign-In did not complete.'
      );
    }
  };

  const handleSignOut = async () => {
    setAuthBanner(null);
    await signOutUser();
  };

  const handleSyncDemoToFirestore = async () => {
    if (!user) return;
    setSyncingDemo(true);
    setAuthBanner(null);
    try {
      await seedDemoWorkspaceToFirestore(user.uid);
      if (localImportedEntries.length > 0) {
        await seedRecordsToFirestore(user.uid, localImportedEntries);
      }
      if (userProfile) {
        setUserProfile({ ...userProfile, demoSeeded: true });
      }
    } catch (err) {
      setAuthBanner(
        err instanceof Error
          ? `Failed to initialize Firestore workspace: ${err.message}`
          : 'Failed to initialize Firestore workspace.'
      );
    } finally {
      setSyncingDemo(false);
    }
  };

  const handleCreateWaterbody = async (input: CreateWaterbodyInput) => {
    if (!user) return;
    const newId = await createWaterbodyRecord(user.uid, input);
    setDetailWaterbodyId(newId);
    setActivePage('directory');
  };

  const handleBatchImportEntries = async (entries: WaterbodyRecord[]) => {
    if (user) {
      await seedRecordsToFirestore(user.uid, entries);
    } else {
      setLocalImportedEntries((prev) => [...prev, ...entries]);
    }
  };

  const handleLogObservation = async (
    waterbody: WaterbodyRecord,
    input: LogObservationInput
  ) => {
    if (!user) return;
    await logWaterbodyObservation(user.uid, waterbody, input);
  };

  const handleUpdateAlertStatus = async (alertId: string, nextStatus: AlertStatus) => {
    if (!user || !isFirestoreSynced) return;
    await updateAlertStatusInFirestore(alertId, nextStatus);
  };

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    if (page !== 'directory') {
      setDetailWaterbodyId(null);
    }
  };

  const handleOpenDetail = (waterbodyId: string) => {
    setDetailWaterbodyId(waterbodyId);
    setActivePage('directory');
  };

  const handleOpenOnMap = (waterbodyId: string) => {
    setSelectedWaterbodyId(waterbodyId);
    setDetailWaterbodyId(null);
    setActivePage('map');
  };

  const detailWaterbody = useMemo(
    () =>
      detailWaterbodyId
        ? activeWaterbodies.find((w) => w.id === detailWaterbodyId) || null
        : null,
    [detailWaterbodyId, activeWaterbodies]
  );

  const detailObservations = useMemo(
    () =>
      detailWaterbody
        ? activeObservations.filter((o) => o.waterbodyId === detailWaterbody.id)
        : [],
    [detailWaterbody, activeObservations]
  );

  return (
    <LayoutShell
      activePage={activePage}
      onNavigate={handleNavigate}
      user={user}
      authLoading={authLoading}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
      isFirestoreSynced={isFirestoreSynced}
    >
      {authBanner && (
        <div className="mb-5 bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3 text-xs text-amber-200 flex items-center justify-between gap-3">
          <span>{authBanner}</span>
          <button
            type="button"
            onClick={() => setAuthBanner(null)}
            className="text-amber-300 hover:text-amber-100 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {activePage === 'dashboard' && (
        <DashboardView
          waterbodies={activeWaterbodies}
          observations={activeObservations}
          alerts={activeAlerts}
          user={user}
          isFirestoreSynced={isFirestoreSynced}
          syncingDemo={syncingDemo}
          onSyncDemoToFirestore={handleSyncDemoToFirestore}
          onSignIn={handleSignIn}
          onNavigate={handleNavigate}
          onSelectWaterbody={handleOpenDetail}
        />
      )}

      {activePage === 'map' && (
        <IndiaMapView
          waterbodies={activeWaterbodies}
          selectedWaterbodyId={selectedWaterbodyId}
          onSelectMarker={setSelectedWaterbodyId}
          onOpenDetail={handleOpenDetail}
          onOpenDirectory={() => handleNavigate('directory')}
        />
      )}

      {activePage === 'directory' &&
        (detailWaterbody ? (
          <WaterbodyDetailView
            waterbody={detailWaterbody}
            observations={detailObservations}
            possibleDuplicates={duplicateMap.get(detailWaterbody.id) || []}
            user={user}
            isFirestoreSynced={isFirestoreSynced}
            onBack={() => setDetailWaterbodyId(null)}
            onOpenOnMap={handleOpenOnMap}
            onLogObservation={handleLogObservation}
          />
        ) : (
          <DirectoryView
            waterbodies={activeWaterbodies}
            user={user}
            isFirestoreSynced={isFirestoreSynced}
            onSelectWaterbody={handleOpenDetail}
            onCreateWaterbody={handleCreateWaterbody}
            onBatchImportEntries={handleBatchImportEntries}
            onSignIn={handleSignIn}
          />
        ))}

      {activePage === 'historical' && (
        <HistoricalMonitoringView
          waterbodies={activeWaterbodies}
          observations={activeObservations}
          initialWaterbodyId={selectedWaterbodyId}
        />
      )}

      {activePage === 'satellite' && <SatelliteAnalysisView />}

      {activePage === 'alerts' && (
        <DroughtAlertsView
          alerts={activeAlerts}
          waterbodies={activeWaterbodies}
          user={user}
          isFirestoreSynced={isFirestoreSynced}
          onUpdateAlertStatus={handleUpdateAlertStatus}
          onSelectWaterbody={handleOpenDetail}
        />
      )}

      {activePage === 'reports' && <ReportsView waterbodies={activeWaterbodies} />}

      {activePage === 'about' && <AboutView />}
    </LayoutShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GhostShorelineApp />
    </ErrorBoundary>
  );
}
