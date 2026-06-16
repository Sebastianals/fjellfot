import {
  collection, doc, getDocs, setDoc, updateDoc, addDoc, onSnapshot,
  query, orderBy, limit, where, writeBatch, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from './firebase';

export type Profile = {
  uid: string; name: string; first: string; initial: string; city: string;
  level: number; tier: string; totalSteps: number; goal: number; streak: number;
};

export type LbRow = {
  id: string; name: string; initial: string; color: string;
  steps: number; region?: string; scope: string; you?: boolean;
};

export type Group = {
  id: string; name: string; type: 'comp' | 'team'; sub: string;
  pos: number; of: number; c1: string; c2: string;
  potTotal?: number; potStake?: number; members?: number; endsIn?: string;
};

export type Standing = {
  id: string; name: string; initial: string; color: string;
  steps: number; note?: string; order: number; you?: boolean;
};

export type LedgerEntry = {
  id: string; name: string; initial: string; color: string;
  paid: boolean; order: number; you?: boolean;
};

export const todayKey = () => new Date().toISOString().slice(0, 10);
const first = (n: string) => n.trim().split(' ')[0] || n;
const initialOf = (n: string) => (n.trim()[0] || '?').toUpperCase();
export const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export type Poi = {
  id: string; name: string; dist: string; diff: string; rating: number;
  trips: string; lat: number; lng: number; c1: string; c2: string;
};

// ---- Profile -------------------------------------------------------------
// No online read here: setDoc(merge) updates the local cache instantly (so the
// UI advances even with a flaky connection) and syncs to the server when online.
export async function ensureProfile(uid: string, name: string, city: string) {
  await setDoc(doc(db, 'users', uid), {
    uid, name, first: first(name), initial: initialOf(name), city,
    level: 1, tier: 'Turgåer', totalSteps: 0, goal: 10000, streak: 0,
    createdAt: serverTimestamp(),
  }, { merge: true });
  await setDoc(doc(db, 'leaderboard', uid), {
    name: first(name), initial: initialOf(name), color: '#FF8A47',
    steps: 0, region: city, scope: 'national', uid,
  }, { merge: true });
}

export async function updateProfile(uid: string, name: string, city: string) {
  await updateDoc(doc(db, 'users', uid), { name, first: first(name), initial: initialOf(name), city });
  await setDoc(doc(db, 'leaderboard', uid), { name: first(name), initial: initialOf(name), region: city }, { merge: true });
}

/** Sets the user's leaderboard visibility (privacy toggle in settings). */
export async function setLeaderboardVisible(uid: string, visible: boolean) {
  await setDoc(doc(db, 'leaderboard', uid), { scope: visible ? 'national' : 'hidden' }, { merge: true });
}

/** Updates the daily goal on the profile. */
export async function setGoal(uid: string, goal: number) {
  await updateDoc(doc(db, 'users', uid), { goal });
}

export function subscribeProfile(uid: string, cb: (p: Profile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (s) => cb(s.exists() ? (s.data() as Profile) : null));
}

// ---- Daily steps ---------------------------------------------------------
export async function saveDailySteps(uid: string, steps: number) {
  const day = todayKey();
  await setDoc(doc(db, 'users', uid, 'daily', day), {
    steps, distanceKm: +(steps * 0.00072).toFixed(1), kcal: Math.round(steps * 0.05),
    points: Math.round(steps / 24), updatedAt: serverTimestamp(),
  }, { merge: true });
  // Real leaderboard value = today's steps (no fake baseline).
  await setDoc(doc(db, 'leaderboard', uid), { steps }, { merge: true });
}

// ---- Leaderboard ---------------------------------------------------------
export function subscribeLeaderboard(scope: string, uid: string, cb: (rows: LbRow[]) => void) {
  // Filter by scope only (single-field, no composite index needed); sort client-side.
  const q = query(collection(db, 'leaderboard'), where('scope', '==', scope), limit(100));
  return onSnapshot(q, (snap) => {
    const rows: LbRow[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any), you: d.id === uid }) as LbRow)
      .sort((a, b) => b.steps - a.steps);
    cb(rows);
  });
}

// ---- Groups --------------------------------------------------------------
export function subscribeGroups(cb: (g: Group[]) => void) {
  return onSnapshot(query(collection(db, 'groups'), orderBy('order')), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Group[]);
  });
}

// ---- Group detail: standings + pot ledger --------------------------------
export function subscribeGroup(id: string, cb: (g: Group | null) => void) {
  return onSnapshot(doc(db, 'groups', id), (s) => cb(s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null));
}

export function subscribeStandings(groupId: string, uid: string, cb: (rows: Standing[]) => void) {
  return onSnapshot(collection(db, 'groups', groupId, 'standings'), (snap) => {
    const rows = snap.docs
      .map((d) => { const data = d.data() as any; return { id: d.id, ...data, you: data.you || d.id === uid } as Standing; })
      .sort((a, b) => b.steps - a.steps);
    cb(rows);
  });
}

export function subscribeLedger(groupId: string, uid: string, cb: (rows: LedgerEntry[]) => void) {
  return onSnapshot(collection(db, 'groups', groupId, 'ledger'), (snap) => {
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any), you: d.id === uid }) as LedgerEntry)
      .sort((a, b) => a.order - b.order);
    cb(rows);
  });
}

export async function setPaid(groupId: string, entryId: string, paid: boolean) {
  await updateDoc(doc(db, 'groups', groupId, 'ledger', entryId), { paid });
}

export type InviteMember = { id: string; name: string; initial: string; color: string; avg: number };
export type NewGroup = {
  type: 'comp' | 'team';
  name: string;
  durationDays?: number;     // comp only
  potStake?: number;         // comp only; 0 = no pot
  members: InviteMember[];   // invited, excluding the creator
  creatorUid: string;
  creatorInitial: string;
};

/** Creates a brand-new group (+ standings, + ledger if it has a pot) and returns its id. */
export async function createGroup(g: NewGroup): Promise<string> {
  const ref = doc(collection(db, 'groups'));
  const id = ref.id;
  const memberCount = g.members.length + 1;
  const stake = g.type === 'comp' ? (g.potStake ?? 0) : 0;
  const potTotal = stake * memberCount;
  const [c1, c2] = g.type === 'team' ? ['#3a6fd8', '#5b8def'] : ['#FF8A47', '#E2480A'];
  const endsIn = g.durationDays ? `${g.durationDays}d` : 'fast';
  const sub = g.type === 'team'
    ? `${memberCount} spillere · runde 1`
    : potTotal > 0 ? `kr ${potTotal} i pott` : `${memberCount} medl.`;

  const code = makeCode();
  const batch = writeBatch(db);
  batch.set(ref, {
    name: g.name, type: g.type, sub, pos: 1, of: memberCount,
    c1, c2, order: Date.now(), potTotal, potStake: stake, members: memberCount, endsIn, code,
    createdAt: serverTimestamp(),
  });

  const you = { name: 'Du', initial: g.creatorInitial, color: '#FF8A47', you: true };
  batch.set(doc(db, 'groups', id, 'standings', g.creatorUid), { ...you, steps: 0, note: 'det er deg', order: 0 });
  g.members.forEach((m, i) =>
    batch.set(doc(db, 'groups', id, 'standings', m.id), { name: m.name, initial: m.initial, color: m.color, steps: 0, order: i + 1 }));

  if (stake > 0) {
    batch.set(doc(db, 'groups', id, 'ledger', g.creatorUid), { ...you, paid: false, order: 0 });
    g.members.forEach((m, i) =>
      batch.set(doc(db, 'groups', id, 'ledger', m.id), { name: m.name, initial: m.initial, color: m.color, paid: false, order: i + 1 }));
  }

  // Lagkamp: register the team on the NATIONAL team leaderboard (team vs all teams).
  if (g.type === 'team') {
    batch.set(doc(db, 'teamboard', id), { name: g.name, steps: 0, members: memberCount, c1, c2, createdAt: serverTimestamp() });
  }

  await batch.commit();
  return id;
}

export type TeamRow = { id: string; name: string; steps: number; members: number; c1: string; c2: string };

/** National team leaderboard — every team competes against all other teams in Norway. */
export function subscribeTeamboard(cb: (rows: TeamRow[]) => void) {
  return onSnapshot(collection(db, 'teamboard'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).sort((a: any, b: any) => b.steps - a.steps) as TeamRow[]);
  });
}

/** Adds steps to every team the user belongs to (called as the user walks). */
export async function addTeamSteps(teamIds: string[], delta: number) {
  await Promise.all(teamIds.map((id) => updateDoc(doc(db, 'teamboard', id), { steps: increment(delta) }).catch(() => {})));
}

/** Join a group by its invite code. Returns the group id, or null if not found. */
export async function joinGroupByCode(code: string, uid: string, name: string): Promise<string | null> {
  const snap = await getDocs(query(collection(db, 'groups'), where('code', '==', code.trim().toUpperCase()), limit(1)));
  if (snap.empty) return null;
  const g = snap.docs[0];
  const data = g.data() as any;
  const you = { name: 'Du', initial: initialOf(name), color: '#FF8A47', you: true };
  await setDoc(doc(db, 'groups', g.id, 'standings', uid), { ...you, steps: 0, note: 'det er deg', order: 99 }, { merge: true });
  if ((data.potStake ?? 0) > 0) {
    await setDoc(doc(db, 'groups', g.id, 'ledger', uid), { ...you, paid: false, order: 99 }, { merge: true });
  }
  await updateDoc(doc(db, 'groups', g.id), { members: (data.members ?? 1) + 1, of: (data.of ?? 1) + 1 });
  return g.id;
}

// ---- Tursteder (POIs) ----------------------------------------------------
export function subscribePois(cb: (p: Poi[]) => void) {
  return onSnapshot(collection(db, 'pois'), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Poi[]));
}

export async function addPoi(p: Omit<Poi, 'id'>) {
  await addDoc(collection(db, 'pois'), { ...p, createdAt: serverTimestamp() });
}

// ---- Zones (fog of war) --------------------------------------------------
export async function revealCells(uid: string, cellIds: string[]) {
  const batch = writeBatch(db);
  cellIds.forEach((id) => batch.set(doc(db, 'users', uid, 'zones', id), { at: serverTimestamp() }, { merge: true }));
  await batch.commit();
}

export function subscribeZones(uid: string, cb: (cells: string[]) => void) {
  return onSnapshot(collection(db, 'users', uid, 'zones'), (snap) => cb(snap.docs.map((d) => d.id)));
}

// No seed data — the app starts empty and fills with real users & activity.
