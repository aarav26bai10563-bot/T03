import { signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEMO_ALERTS,
  DEMO_OBSERVATIONS,
  DEMO_WATERBODIES,
} from '../data/demoWaterbodies';
import { computeAreaChangePct } from '../lib/directoryUtils';
import {
  AlertStatus,
  DroughtAlertRecord,
  EntryType,
  MonitoringObservationRecord,
  MonitoringStatus,
  Season,
  SensorSource,
  UserProfileRecord,
  VerificationStatus,
  WaterbodyCategory,
  WaterbodyRecord,
} from '../types/monitoring';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 64);
  return cleaned || `id-${Date.now()}`;
}

function clampStr(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

function toFirestoreWaterbodyPayload(uid: string, docId: string, wb: WaterbodyRecord) {
  const isTerm = wb.entry_type === 'traditional_term';
  return {
    id: docId,
    ownerId: uid,
    name: clampStr(wb.name, 160),
    alternative_names: (wb.alternative_names || [])
      .map((n) => clampStr(n, 120))
      .filter(Boolean)
      .slice(0, 10),
    entry_type: wb.entry_type,
    waterbody_category: wb.waterbody_category,
    state: clampStr(wb.state || '', 80),
    district: clampStr(wb.district || '', 80),
    country: clampStr(wb.country || 'India', 40),
    latitude:
      !isTerm && wb.latitude !== null && wb.longitude !== null
        ? Math.min(Math.max(wb.latitude, 5), 38)
        : null,
    longitude:
      !isTerm && wb.latitude !== null && wb.longitude !== null
        ? Math.min(Math.max(wb.longitude, 68), 98)
        : null,
    historical_area:
      wb.historical_area !== null ? Math.min(Math.max(wb.historical_area, 0), 500000) : null,
    recent_area:
      wb.recent_area !== null ? Math.min(Math.max(wb.recent_area, 0), 500000) : null,
    estimated_area_loss:
      wb.estimated_area_loss !== null
        ? Math.min(Math.max(wb.estimated_area_loss, -500000), 500000)
        : null,
    monitoring_status: wb.monitoring_status,
    verification_status: wb.verification_status,
    data_source: clampStr(wb.data_source || 'DEMO Reference Dataset', 120),
    historicalPeriod: clampStr(wb.historicalPeriod || 'Pending baseline', 60),
    recentPeriod: clampStr(wb.recentPeriod || 'Pending observation', 60),
    resolutionNote: clampStr(wb.resolutionNote || '', 360),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(user: User): Promise<UserProfileRecord> {
  const path = `userProfiles/${user.uid}`;
  const ref = doc(db, 'userProfiles', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfileRecord;
    }
    const newProfile = {
      uid: user.uid,
      displayName: clampStr(user.displayName || 'Environmental Researcher', 120),
      email: clampStr(user.email || '', 160),
      organization: 'Independent Monitoring',
      preferredState: 'All India',
      demoSeeded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, newProfile);
    return {
      uid: user.uid,
      displayName: newProfile.displayName,
      email: newProfile.email,
      organization: newProfile.organization,
      preferredState: newProfile.preferredState,
      demoSeeded: false,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedRecordsToFirestore(
  uid: string,
  records: WaterbodyRecord[]
): Promise<void> {
  try {
    for (let i = 0; i < records.length; i += 80) {
      const chunk = records.slice(i, i + 80);
      const batch = writeBatch(db);
      for (const wb of chunk) {
        const docId = sanitizeId(`${uid.slice(0, 12)}-${wb.id}`);
        const ref = doc(db, 'waterbodies', docId);
        batch.set(ref, toFirestoreWaterbodyPayload(uid, docId, wb));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'waterbodies');
  }
}

export async function seedDemoWorkspaceToFirestore(uid: string): Promise<void> {
  // Step 1: Seed waterbodies in 80-doc chunks so relational exists() checks pass
  await seedRecordsToFirestore(uid, DEMO_WATERBODIES);

  // Step 2: Seed observations in batches
  try {
    for (let i = 0; i < DEMO_OBSERVATIONS.length; i += 80) {
      const chunk = DEMO_OBSERVATIONS.slice(i, i + 80);
      const obsBatch = writeBatch(db);
      for (const obs of chunk) {
        const docId = sanitizeId(`${uid.slice(0, 12)}-${obs.id}`);
        const waterbodyDocId = sanitizeId(`${uid.slice(0, 12)}-${obs.waterbodyId}`);
        const ref = doc(db, 'monitoringObservations', docId);
        obsBatch.set(ref, {
          id: docId,
          ownerId: uid,
          waterbodyId: waterbodyDocId,
          waterbodyName: clampStr(obs.waterbodyName, 160),
          observationDate: clampStr(obs.observationDate, 32),
          season: obs.season,
          sensorSource: obs.sensorSource,
          observedAreaHa: obs.observedAreaHa,
          ndwiMean: obs.ndwiMean,
          cloudCoverPct: obs.cloudCoverPct,
          isHistoricalBaseline: obs.isHistoricalBaseline,
          notes: clampStr(obs.notes, 500),
          createdAt: serverTimestamp(),
        });
      }
      await obsBatch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'monitoringObservations');
  }

  // Step 3: Seed preliminary alerts and mark userProfile.demoSeeded = true
  try {
    const alertBatch = writeBatch(db);
    for (const alert of DEMO_ALERTS) {
      const docId = sanitizeId(`${uid.slice(0, 12)}-${alert.id}`);
      const waterbodyDocId = sanitizeId(`${uid.slice(0, 12)}-${alert.waterbodyId}`);
      const ref = doc(db, 'alerts', docId);
      alertBatch.set(ref, {
        id: docId,
        ownerId: uid,
        waterbodyId: waterbodyDocId,
        waterbodyName: clampStr(alert.waterbodyName, 160),
        state: clampStr(alert.state, 80),
        district: clampStr(alert.district, 80),
        severity: alert.severity,
        status: alert.status,
        estimatedLossPct: alert.estimatedLossPct,
        seasonalComparisonNote: clampStr(alert.seasonalComparisonNote, 400),
        disclaimer: clampStr(alert.disclaimer, 240),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    const profileRef = doc(db, 'userProfiles', uid);
    alertBatch.update(profileRef, {
      demoSeeded: true,
      updatedAt: serverTimestamp(),
    });
    await alertBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'alerts');
  }
}

export function subscribeWorkspaceCollections(
  uid: string,
  onWaterbodies: (items: WaterbodyRecord[]) => void,
  onObservations: (items: MonitoringObservationRecord[]) => void,
  onAlerts: (items: DroughtAlertRecord[]) => void
): () => void {
  const wbQuery = query(collection(db, 'waterbodies'), where('ownerId', '==', uid));
  const obsQuery = query(
    collection(db, 'monitoringObservations'),
    where('ownerId', '==', uid)
  );
  const alertQuery = query(collection(db, 'alerts'), where('ownerId', '==', uid));

  const unsubWb = onSnapshot(
    wbQuery,
    (snapshot) => {
      const demoLookup = new Map(DEMO_WATERBODIES.map((d) => [d.name, d]));
      const items: WaterbodyRecord[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as WaterbodyRecord;
        const matchingDemo = demoLookup.get(raw.name);
        return {
          ...raw,
          areaChangePct: computeAreaChangePct(raw),
          historicalPolygon: matchingDemo?.historicalPolygon,
          recentPolygon: matchingDemo?.recentPolygon,
          seasonalComparison: matchingDemo?.seasonalComparison,
          hydrologyNotes: matchingDemo?.hydrologyNotes,
        };
      });
      onWaterbodies(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'waterbodies')
  );

  const unsubObs = onSnapshot(
    obsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as MonitoringObservationRecord);
      onObservations(items);
    },
    (error) =>
      handleFirestoreError(error, OperationType.LIST, 'monitoringObservations')
  );

  const unsubAlerts = onSnapshot(
    alertQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as DroughtAlertRecord);
      onAlerts(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, 'alerts')
  );

  return () => {
    unsubWb();
    unsubObs();
    unsubAlerts();
  };
}

export interface CreateWaterbodyInput {
  name: string;
  alternative_names: string[];
  entry_type: EntryType;
  waterbody_category: WaterbodyCategory;
  state: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  historical_area: number | null;
  recent_area: number | null;
  verification_status: VerificationStatus;
  resolutionNote: string;
}

export async function createWaterbodyRecord(
  uid: string,
  input: CreateWaterbodyInput
): Promise<string> {
  const id = sanitizeId(`wb-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const path = `waterbodies/${id}`;

  const isTerm = input.entry_type === 'traditional_term';
  const hasCoords =
    !isTerm && input.latitude !== null && input.longitude !== null;
  const hist = input.historical_area;
  const rec = input.recent_area;
  const loss =
    hist !== null && rec !== null ? Number((hist - rec).toFixed(1)) : null;

  let status: MonitoringStatus = 'Unmonitored';
  if (isTerm) {
    status = 'Terminology Only';
  } else if (hist !== null && rec !== null && hist > 0) {
    const pct = ((rec - hist) / hist) * 100;
    status =
      rec < 5
        ? 'Low Confidence'
        : pct <= -40
        ? 'Severe Recession'
        : pct <= -20
        ? 'Moderate Loss'
        : pct <= -10
        ? 'Watch'
        : 'Stable';
  }

  const record: WaterbodyRecord = {
    id,
    ownerId: uid,
    name: input.name,
    alternative_names: input.alternative_names,
    entry_type: input.entry_type,
    waterbody_category: input.waterbody_category,
    state: input.state,
    district: input.district,
    country: 'India',
    latitude: hasCoords ? input.latitude : null,
    longitude: hasCoords ? input.longitude : null,
    historical_area: isTerm ? null : hist,
    recent_area: isTerm ? null : rec,
    estimated_area_loss: isTerm ? null : loss,
    monitoring_status: status,
    verification_status: isTerm ? 'Terminology Record' : input.verification_status,
    data_source: isTerm ? 'Traditional Hydrology Lexicon' : 'User Directory Entry',
    historicalPeriod: hist !== null ? 'User Baseline Reference' : 'Pending baseline',
    recentPeriod:
      rec !== null
        ? `Recorded ${new Date().toISOString().slice(0, 10)}`
        : 'Pending observation',
    resolutionNote:
      input.resolutionNote ||
      (isTerm
        ? 'Traditional water-body term; stored as terminology record without fake coordinates.'
        : 'User-entered directory record; verify coordinates and satellite extent independently.'),
  };

  try {
    await setDoc(doc(db, 'waterbodies', id), toFirestoreWaterbodyPayload(uid, id, record));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface LogObservationInput {
  observationDate: string;
  season: Season;
  sensorSource: SensorSource;
  observedAreaHa: number;
  ndwiMean: number;
  cloudCoverPct: number;
  isHistoricalBaseline: boolean;
  notes: string;
}

export async function logWaterbodyObservation(
  uid: string,
  waterbody: WaterbodyRecord,
  input: LogObservationInput
): Promise<void> {
  const obsId = sanitizeId(`obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const obsPath = `monitoringObservations/${obsId}`;

  try {
    await setDoc(doc(db, 'monitoringObservations', obsId), {
      id: obsId,
      ownerId: uid,
      waterbodyId: waterbody.id,
      waterbodyName: clampStr(waterbody.name, 160),
      observationDate: clampStr(input.observationDate, 32),
      season: input.season,
      sensorSource: input.sensorSource,
      observedAreaHa: Math.min(Math.max(input.observedAreaHa, 0), 500000),
      ndwiMean: Math.min(Math.max(input.ndwiMean, -1), 1),
      cloudCoverPct: Math.min(Math.max(input.cloudCoverPct, 0), 100),
      isHistoricalBaseline: input.isHistoricalBaseline,
      notes: clampStr(input.notes, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, obsPath);
  }

  if (!input.isHistoricalBaseline && waterbody.entry_type === 'named_waterbody') {
    const wbPath = `waterbodies/${waterbody.id}`;
    const newArea = Math.min(Math.max(input.observedAreaHa, 0), 500000);
    const hist = waterbody.historical_area;
    const loss = hist !== null ? Number((hist - newArea).toFixed(1)) : null;
    let nextStatus: MonitoringStatus = 'Unmonitored';
    if (hist !== null && hist > 0) {
      const changePct = ((newArea - hist) / hist) * 100;
      nextStatus =
        newArea < 5
          ? 'Low Confidence'
          : changePct <= -40
          ? 'Severe Recession'
          : changePct <= -20
          ? 'Moderate Loss'
          : changePct <= -10
          ? 'Watch'
          : 'Stable';
    }

    try {
      await updateDoc(doc(db, 'waterbodies', waterbody.id), {
        recent_area: newArea,
        estimated_area_loss: loss,
        monitoring_status: nextStatus,
        recentPeriod: clampStr(`${input.observationDate} (${input.season})`, 60),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, wbPath);
    }
  }
}

export async function updateAlertStatusInFirestore(
  alertId: string,
  nextStatus: AlertStatus
): Promise<void> {
  const path = `alerts/${alertId}`;
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
