/**
 * Firebase Client & Real-time Cloud Synchronization
 * Sangkhlaburi Hospital Nursing Workload & Staffing Assessment System
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DailyRecord, StandardWeightsConfig } from '../types/nursing';
import { DEFAULT_STANDARDS } from './calculator';

// Resolved configuration supporting both firebase-applet-config.json and Vercel VITE_* env vars
const effectiveFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

// Initialize Firebase App
export const app = initializeApp(effectiveFirebaseConfig);

// CRITICAL: Must pass effectiveFirebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, effectiveFirebaseConfig.firestoreDatabaseId);

// Auth instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Operation Types for Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on app boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
    } else {
      console.log('Firebase connection ping complete.');
    }
    return false;
  }
}

// Immediate connection test invocation
testConnection();

// Auto-connect to Firebase Auth
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    console.log('Connected to Firebase auth successfully:', cred.user.uid);
    // Write health check doc once signed in
    try {
      await setDoc(doc(db, 'test', 'connection'), {
        status: 'online',
        hospitalId: 'sangkhlaburi',
        firestoreDatabaseId: effectiveFirebaseConfig.firestoreDatabaseId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch {
      // Non-blocking ping
    }
    return cred.user;
  } catch (error) {
    console.warn('Firebase auto-auth note:', error);
    return null;
  }
}

// Initial background auth connection
ensureFirebaseAuth();

/**
 * Purge any previous test accounts and simulation records from Firebase Firestore
 */
export async function purgeCloudTestData(): Promise<{
  deletedUsers: number;
  deletedRecords: number;
}> {
  let deletedUsers = 0;
  let deletedRecords = 0;
  try {
    const user = await ensureFirebaseAuth();
    if (!user) return { deletedUsers: 0, deletedRecords: 0 };

    // 1. Delete test user documents from Firestore
    const testIds = [
      'user-admin-01',
      'user-director-01',
      'user-head-er-01',
      'user-head-opd-01',
      'user-head-ipd1-01',
      'user-head-ipd2-01',
      'user-head-lr-01',
    ];
    for (const tid of testIds) {
      try {
        await deleteDoc(doc(db, 'users', tid));
        deletedUsers++;
      } catch {
        // Doc might not exist
      }
    }

    // 2. Scan and delete simulation records
    const q = query(collection(db, 'daily_records'), where('hospitalId', '==', 'sangkhlaburi'));
    const snaps = await getDocs(q);
    for (const snap of snaps.docs) {
      const data = snap.data();
      if (
        data.notes?.includes('รพ.พหลฯ') ||
        data.notes?.includes('สถานการณ์เวรปกติ') ||
        data.id?.includes('seed') ||
        snap.id.includes('seed')
      ) {
        await deleteDoc(doc(db, 'daily_records', snap.id));
        deletedRecords++;
      }
    }
    console.log(`Purged Firestore cloud test data: ${deletedUsers} test users, ${deletedRecords} simulation records`);
  } catch (err) {
    console.warn('purgeCloudTestData note:', err);
  }
  return { deletedUsers, deletedRecords };
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Failed to sign in with Google:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Real-time listener for Daily Records in Sangkhlaburi Hospital
export function subscribeToDailyRecords(
  callback: (records: DailyRecord[]) => void
): Unsubscribe | null {
  if (!auth.currentUser) {
    return null;
  }

  const path = 'daily_records';
  try {
    const q = query(collection(db, path), where('hospitalId', '==', 'sangkhlaburi'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records: DailyRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          records.push({
            id: data.id || docSnap.id,
            date: data.date,
            recorderName: data.recorderName || '',
            recorderPosition: data.recorderPosition || '',
            recorderPhone: data.recorderPhone || '',
            notes: data.notes || '',
            shiftType: data.shiftType || 'all_day',
            er: data.er,
            opd: data.opd,
            ipd1: data.ipd1,
            ipd2: data.ipd2,
            lr: data.lr,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        });

        // Sort descending by date
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        callback(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Cloud Save/Update Record
export async function saveRecordToCloud(record: DailyRecord): Promise<void> {
  const user = auth.currentUser || (await ensureFirebaseAuth());
  if (!user) {
    return;
  }

  const path = `daily_records/${record.id}`;
  try {
    const payload = {
      ...record,
      hospitalId: 'sangkhlaburi',
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'daily_records', record.id), payload, { merge: true });
    console.log(`Record ${record.id} synced to Firebase Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Cloud Delete Record
export async function deleteRecordFromCloud(recordId: string): Promise<void> {
  const user = auth.currentUser || (await ensureFirebaseAuth());
  if (!user) {
    return;
  }

  const path = `daily_records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'daily_records', recordId));
    console.log(`Record ${recordId} deleted from Firebase Firestore.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Cloud Save Standards Config
export async function saveStandardsToCloud(config: StandardWeightsConfig): Promise<void> {
  const user = auth.currentUser || (await ensureFirebaseAuth());
  if (!user) {
    return;
  }

  const path = 'standards_config/sangkhlaburi_standards';
  try {
    await setDoc(
      doc(db, 'standards_config', 'sangkhlaburi_standards'),
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('Standards configuration synced to Firebase Firestore.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Real-time listener for Standards Config
export function subscribeToStandardsCloud(
  callback: (config: StandardWeightsConfig) => void
): Unsubscribe | null {
  if (!auth.currentUser) {
    return null;
  }

  const path = 'standards_config/sangkhlaburi_standards';
  try {
    const unsub = onSnapshot(
      doc(db, 'standards_config', 'sangkhlaburi_standards'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.er && data.opd && data.ipd && data.lr) {
            callback({
              er: data.er,
              opd: data.opd,
              ipd: data.ipd,
              lr: data.lr,
              general: data.general || DEFAULT_STANDARDS.general,
            });
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
    return unsub;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Sync all current local data (Records, Standards Config, Registered Users) to Firebase Firestore
 */
export async function syncAllLocalDataToFirebase(): Promise<{
  success: boolean;
  recordsCount: number;
  usersCount: number;
  message: string;
}> {
  try {
    const user = await ensureFirebaseAuth();
    if (!user) {
      return {
        success: false,
        recordsCount: 0,
        usersCount: 0,
        message: 'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตน Firebase Auth ได้ในขณะนี้',
      };
    }

    // 1. Sync Standards Config
    const localStandardsRaw = localStorage.getItem('sangkhlaburi_nursing_standards_v2');
    if (localStandardsRaw) {
      try {
        const standards = JSON.parse(localStandardsRaw);
        await saveStandardsToCloud(standards);
      } catch (e) {
        console.warn('Standards sync error:', e);
      }
    }

    // 2. Sync Daily Records
    const localRecordsRaw = localStorage.getItem('sangkhlaburi_nursing_records_v2');
    let recordsCount = 0;
    if (localRecordsRaw) {
      try {
        const records = JSON.parse(localRecordsRaw);
        if (Array.isArray(records)) {
          for (const rec of records) {
            await saveRecordToCloud(rec);
            recordsCount++;
          }
        }
      } catch (e) {
        console.warn('Records sync error:', e);
      }
    }

    // 3. Sync Registered Users
    const localUsersRaw = localStorage.getItem('sangkhlaburi_nursing_users_v1');
    let usersCount = 0;
    if (localUsersRaw) {
      try {
        const users = JSON.parse(localUsersRaw);
        if (Array.isArray(users)) {
          for (const u of users) {
            if (u && u.id) {
              await setDoc(
                doc(db, 'users', u.id),
                {
                  ...u,
                  hospitalId: 'sangkhlaburi',
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
              usersCount++;
            }
          }
        }
      } catch (e) {
        console.warn('Users sync error:', e);
      }
    }

    return {
      success: true,
      recordsCount,
      usersCount,
      message: `เชื่อมต่อและซิงค์ฐานข้อมูลไปยัง Firebase สำเร็จเรียบร้อย (ข้อมูลเวร: ${recordsCount} รายการ, ผู้ใช้งาน: ${usersCount} บัญชี, เกณฑ์มาตรฐาน สธ.)`,
    };
  } catch (err) {
    console.error('Failed to sync all data to Firebase:', err);
    return {
      success: false,
      recordsCount: 0,
      usersCount: 0,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อและส่งข้อมูลไปยัง Firebase',
    };
  }
}
