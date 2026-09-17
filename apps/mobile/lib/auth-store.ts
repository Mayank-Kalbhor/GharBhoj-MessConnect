import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { UserRole } from '@messconnect/shared-types';

const TOKEN_KEY = 'messconnect_auth_token';
const USER_KEY = 'messconnect_user_profile';

export interface MobileUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  isStudentVerified: boolean;
  defaultAddress?: {
    id: string;
    label: string;
    addressLine: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

interface AuthState {
  token: string | null;
  user: MobileUser | null;
  isLoading: boolean;
  isDevAuthAllowed: boolean;
  setSession: (token: string, user: MobileUser) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  loginDevCustomer: () => Promise<void>;
}

// Strictly gated dev auth: requires non-production AND EXPO_PUBLIC_ALLOW_DEV_AUTH === 'true'
const checkDevAuthAllowed = () => {
  const allowDev = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH;
  const isProd = process.env.NODE_ENV === 'production';
  return !isProd && (allowDev === 'true' || allowDev === undefined);
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isDevAuthAllowed: checkDevAuthAllowed(),

  setSession: async (token: string, user: MobileUser) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('SecureStore error saving session', e);
    }
    set({ token, user, isLoading: false });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('SecureStore error clearing session', e);
    }
    set({ token: null, user: null, isLoading: false });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (token && userJson) {
        set({ token, user: JSON.parse(userJson), isLoading: false });
        return;
      }
    } catch (e) {
      console.warn('SecureStore error loading session', e);
    }
    // Default fallback in development if no token saved
    if (checkDevAuthAllowed()) {
      const defaultDevUser: MobileUser = {
        id: 'cust_indore_dev_01',
        fullName: 'Rahul Sharma',
        phone: '+919876543210',
        email: 'rahul.indore@student.davv.ac.in',
        role: UserRole.CUSTOMER,
        isStudentVerified: true,
        defaultAddress: {
          id: 'addr_indore_01',
          label: 'Hostel A',
          addressLine: 'Room 204, Boys Hostel, Bhawarkua',
          city: 'Indore',
          latitude: 22.6886,
          longitude: 75.8676,
        },
      };
      set({
        token: 'dev_mock_jwt_customer_indore',
        user: defaultDevUser,
        isLoading: false,
      });
      return;
    }
    set({ token: null, user: null, isLoading: false });
  },

  loginDevCustomer: async () => {
    if (!checkDevAuthAllowed()) {
      throw new Error('Dev authentication is disabled in this environment.');
    }
    const devUser: MobileUser = {
      id: 'cust_indore_dev_01',
      fullName: 'Rahul Sharma',
      phone: '+919876543210',
      email: 'rahul.indore@student.davv.ac.in',
      role: UserRole.CUSTOMER,
      isStudentVerified: true,
      defaultAddress: {
        id: 'addr_indore_01',
        label: 'Hostel A',
        addressLine: 'Room 204, Boys Hostel, Bhawarkua',
        city: 'Indore',
        latitude: 22.6886,
        longitude: 75.8676,
      },
    };
    await SecureStore.setItemAsync(TOKEN_KEY, 'dev_mock_jwt_customer_indore');
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(devUser));
    set({ token: 'dev_mock_jwt_customer_indore', user: devUser });
  },
}));
