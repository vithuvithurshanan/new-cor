
import { User, UserRole } from '../types';
import { apiService } from './apiService';
import { auth } from '../firebaseClient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, updateProfile } from 'firebase/auth';

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

// Mock Users Database
const MOCK_DB: Record<string, User> = {
  'customer': {
    id: 'U1', name: 'Alice Smith', role: 'CUSTOMER', email: 'alice@example.com', phone: '+1234567890', status: 'ACTIVE'
  },
  'rider': {
    id: 'U2', name: 'Bob Jones', role: 'RIDER', email: 'bob@courieros.com', phone: '+1987654321', status: 'ACTIVE'
  },
  'admin': {
    id: 'U3', name: 'Charlie Admin', role: 'ADMIN', email: 'admin@courieros.com', phone: '+1122334455', status: 'ACTIVE'
  },
  'hub': {
    id: 'U4', name: 'Hubert Manager', role: 'HUB_MANAGER', email: 'hub1@courieros.com', phone: '+1555666777', status: 'ACTIVE'
  }
};

export const sendOtp = async (identifier: string): Promise<boolean> => {
  if (USE_BACKEND) {
    await apiService.sendOtp(identifier);
    return true;
  }
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};

export const verifyOtp = async (identifier: string, otp: string, role: UserRole): Promise<User | null> => {
  if (USE_BACKEND) {
    const data = await apiService.verifyOtp(identifier, otp);
    return data.user;
  }
  await new Promise(resolve => setTimeout(resolve, 1500));

  // For demo purposes, any OTP '1234' works
  if (otp !== '1234') {
    throw new Error('Invalid OTP');
  }

  // Return a mock user based on the selected role for the demo
  // In a real app, we would look up by identifier
  if (role === 'ADMIN') return MOCK_DB['admin'];
  if (role === 'RIDER') return MOCK_DB['rider'];
  if (role === 'HUB_MANAGER') return MOCK_DB['hub'];

  return {
    ...MOCK_DB['customer'],
    email: identifier.includes('@') ? identifier : MOCK_DB['customer'].email,
    phone: !identifier.includes('@') ? identifier : MOCK_DB['customer'].phone
  };
};

// Email/Password signup using Firebase (client)
export const signUpWithEmail = async (email: string, password: string, role: UserRole = 'CUSTOMER', displayName?: string): Promise<User> => {
  if (USE_BACKEND) {
    // Backend signup not implemented; fallback to client flow or implement server endpoint
    throw new Error('Backend signup not implemented');
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      // Non-fatal
      console.warn('Failed to update displayName', e);
    }
  }

  const user: User = {
    id: cred.user.uid,
    email: cred.user.email || email,
    name: cred.user.displayName || displayName || email.split('@')[0],
    phone: cred.user.phoneNumber || '',
    role: role,
    status: 'ACTIVE'
  };

  // Set API token so backend requests are authenticated
  try {
    const token = await cred.user.getIdToken();
    apiService.setToken(token);
  } catch (e) {
    console.warn('Failed to get id token after signup', e);
  }

  return user;
};

// Email/Password sign-in using Firebase (client)
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (USE_BACKEND) {
    // If backend handles authentication, implement API call here
    throw new Error('Backend sign-in not implemented');
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = cred.user;

  const user: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || email,
    name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
    phone: firebaseUser.phoneNumber || '',
    role: 'CUSTOMER',
    status: 'ACTIVE'
  };

  // Set API token so backend requests are authenticated
  try {
    const token = await firebaseUser.getIdToken();
    apiService.setToken(token);
  } catch (e) {
    console.warn('Failed to get id token after sign in', e);
  }

  return user;
};

export const signOut = async (): Promise<void> => {
  if (USE_BACKEND) {
    // call backend logout if implemented
    try { await apiService.logout(); } catch (_) {}
    return;
  }
  // Clear local API token and sign out from Firebase
  try { apiService.setToken(null); } catch (_) {}
  await fbSignOut(auth);
};
