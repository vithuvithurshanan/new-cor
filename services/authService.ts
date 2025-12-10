
import { User, UserRole } from '../types';
import { apiService } from './apiService';
import { auth } from '../firebaseClient';
import { firebaseService } from './firebaseService';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

  // Save user to Firestore
  try {
    await firebaseService.addUser(user);
  } catch (e) {
    console.error('Failed to save user to Firestore', e);
    // Consider whether to throw here or allow partial success
  }

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

  // Fetch user details (including role) from Firestore
  let user: User | null = null;
  try {
    user = await firebaseService.getUser(firebaseUser.uid);
  } catch (e) {
    console.error('Failed to fetch user from Firestore', e);
  }

  // Fallback if user not found in Firestore (e.g. legacy user or sync issue)
  if (!user) {
    console.warn('User not found in Firestore, using default customer role');
    user = {
      id: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
      phone: firebaseUser.phoneNumber || '',
      role: 'CUSTOMER', // Default fallback
      status: 'ACTIVE'
    };
  }

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
    try { await apiService.logout(); } catch (_) { }
    return;
  }
  // Clear local API token and sign out from Firebase
  try { apiService.setToken(null); } catch (_) { }
  await fbSignOut(auth);
};

// Google Sign-In (defaults to CUSTOMER role)
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const firebaseUser = cred.user;

  // Check if user already exists in Firestore
  let user: User | null = null;
  try {
    user = await firebaseService.getUser(firebaseUser.uid);
  } catch (e) {
    console.error('Failed to fetch user from Firestore', e);
  }

  // If user doesn't exist, create new user with CUSTOMER role
  if (!user) {
    user = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      phone: firebaseUser.phoneNumber || '',
      role: 'CUSTOMER', // Default to CUSTOMER for Google sign-ins
      status: 'ACTIVE'
    };

    // Save to Firestore
    try {
      await firebaseService.addUser(user);
    } catch (e) {
      console.error('Failed to save Google user to Firestore', e);
    }
  }

  // Set API token
  try {
    const token = await firebaseUser.getIdToken();
    apiService.setToken(token);
  } catch (e) {
    console.warn('Failed to get id token after Google sign in', e);
  }

  return user;
};
