/**
 * Firebase Client & Real-time Cloud Synchronization
 * Sangkhlaburi Hospital Nursing Workload & Staffing Assessment System
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
  if (!auth.currentUser) {
    // If not signed in to Firebase, changes will remain safely in localStorage
    return;
  }

  const path = `daily_records/${record.id}`;
  try {
    const payload = {
      ...record,
      hospitalId: 'sangkhlaburi',
      userId: auth.currentUser.uid,
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
  if (!auth.currentUser) {
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
  if (!auth.currentUser) {
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
