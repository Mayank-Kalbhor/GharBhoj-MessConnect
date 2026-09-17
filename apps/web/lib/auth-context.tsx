'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@messconnect/shared-types';
import { apiClient } from './api-client';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isStudentVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  switchDevRole: (role: UserRole) => Promise<void>;
  isDevAuthAllowed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isDevAuthAllowed =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === 'true';

export const DEV_USERS: Record<UserRole, { token: string; user: AuthUser }> = isDevAuthAllowed
  ? {
      [UserRole.CUSTOMER]: {
        token: 'user_customer_test',
        user: {
          id: 'user_customer_test',
          fullName: 'Aarav Sharma',
          phone: '+919876543210',
          role: UserRole.CUSTOMER,
          isStudentVerified: true
        }
      },
      [UserRole.VENDOR]: {
        token: 'user_vendor_test',
        user: {
          id: 'user_vendor_test',
          fullName: 'Rajesh Patidar (Indore Annapurna Mess)',
          phone: '+919876543211',
          role: UserRole.VENDOR
        }
      },
      [UserRole.ADMIN]: {
        token: 'user_admin_test',
        user: {
          id: 'user_admin_test',
          fullName: 'Platform Admin',
          phone: '+919876543212',
          role: UserRole.ADMIN
        }
      },
      [UserRole.DELIVERY_PARTNER]: {
        token: 'user_delivery_test',
        user: {
          id: 'user_delivery_test',
          fullName: 'Vikram Delivery',
          phone: '+919876543213',
          role: UserRole.DELIVERY_PARTNER
        }
      }
    }
  : ({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDevAuthAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === 'true';

  useEffect(() => {
    // Initialize session from localStorage
    const savedToken = localStorage.getItem('messconnect_token');
    const savedUser = localStorage.getItem('messconnect_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsed);
        apiClient.setToken(savedToken);
      } catch (err) {
        localStorage.removeItem('messconnect_token');
        localStorage.removeItem('messconnect_user');
      }
    } else if (isDevAuthAllowed) {
      // Default to customer session in dev mode if nothing saved
      const defaultDev = DEV_USERS[UserRole.CUSTOMER];
      setToken(defaultDev.token);
      setUser(defaultDev.user);
      apiClient.setToken(defaultDev.token);
      localStorage.setItem('messconnect_token', defaultDev.token);
      localStorage.setItem('messconnect_user', JSON.stringify(defaultDev.user));
    }
    setIsLoading(false);
  }, [isDevAuthAllowed]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    apiClient.setToken(newToken);
    localStorage.setItem('messconnect_token', newToken);
    localStorage.setItem('messconnect_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
    localStorage.removeItem('messconnect_token');
    localStorage.removeItem('messconnect_user');
  };

  const switchDevRole = async (targetRole: UserRole) => {
    if (!isDevAuthAllowed) return;

    const devProfile = DEV_USERS[targetRole];
    if (!devProfile) return;

    try {
      // Authenticate with backend mock auth gate
      const response: any = await apiClient.post('/auth/verify', {
        firebaseIdToken: devProfile.token
      });

      if (response && response.accessToken) {
        login(response.accessToken, response.user || devProfile.user);
      } else {
        // Fallback to local dev mock token
        login(devProfile.token, devProfile.user);
      }
    } catch (e) {
      // Direct dev session set
      login(devProfile.token, devProfile.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isLoading,
        login,
        logout,
        switchDevRole,
        isDevAuthAllowed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
