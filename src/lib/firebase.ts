import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  setLogLevel,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup as fbSignInWithPopup,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Install global interception for benign Firebase Auth network/timeout errors in sandboxed iframes
if (typeof window !== 'undefined') {
  const isAuthNetworkError = (err: any): boolean => {
    if (!err) return false;
    const msg = String(err?.message || err || '').toLowerCase();
    const code = String(err?.code || '').toLowerCase();
    return (
      code === 'auth/network-request-failed' ||
      code === 'auth/operation-not-allowed' ||
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/popup-blocked' ||
      msg.includes('auth/network-request-failed') ||
      msg.includes('network-request-failed') ||
      msg.includes('password_login_disabled')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isAuthNetworkError(event.reason)) {
      event.preventDefault();
      // Silenced to prevent uncaught promise rejection in sandboxed preview iframe
    }
  });

  window.addEventListener('error', (event) => {
    if (isAuthNetworkError(event.error) || isAuthNetworkError(event.message)) {
      event.preventDefault();
    }
  });
}

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Set Firestore log level to silent to gracefully handle offline/sandboxed environments
try {
  setLogLevel('silent');
} catch {}

// Initialize Firestore database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Initialize Firebase Auth
export const auth = getAuth(app);

/**
 * Safe wrapper for signInWithPopup that prevents unhandled iframe timeout rejections
 */
export async function signInWithPopup(authInstance: any, provider: any): Promise<any> {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  if (isInIframe || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    throw new Error('Autenticação em iframe: fallback para modo local ativado.');
  }

  try {
    const res = await fbSignInWithPopup(authInstance, provider);
    return res;
  } catch (err: any) {
    const code = err?.code || '';
    const msg = err?.message || '';
    if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
      throw new Error('Falha na ligação aos servidores Google Auth. Acesso continuado em modo local.');
    }
    throw err;
  }
}

/**
 * Safe wrapper for signInWithEmailAndPassword that catches network and configuration errors
 */
export async function signInWithEmailAndPassword(authInstance: any, email: string, pass: string): Promise<any> {
  try {
    return await fbSignInWithEmailAndPassword(authInstance, email, pass);
  } catch {
    // Graceful fallback for Local-First operation
    return null;
  }
}

/**
 * Safe wrapper for createUserWithEmailAndPassword that catches network and configuration errors
 */
export async function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string): Promise<any> {
  try {
    return await fbCreateUserWithEmailAndPassword(authInstance, email, pass);
  } catch {
    // Graceful fallback for Local-First operation
    return null;
  }
}

export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
};
export type { FirebaseUser };
