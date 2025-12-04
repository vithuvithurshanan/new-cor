
import { User, UserRole } from '../types';

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
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};

export const verifyOtp = async (identifier: string, otp: string, role: UserRole): Promise<User | null> => {
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
