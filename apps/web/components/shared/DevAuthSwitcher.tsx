'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@messconnect/shared-types';
import Link from 'next/link';
import { IconUser, IconBuildingStore, IconShield, IconExchange } from '@tabler/icons-react';

export const DevAuthSwitcher: React.FC = () => {
  // Hard compile-time and runtime gate
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH !== 'true'
  ) {
    return null;
  }

  const { user, role, switchDevRole } = useAuth();

  return (
    <div className="fixed bottom-3 right-3 z-50 bg-bg-card border border-border-default rounded-[12px] p-2 flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1 px-2 py-1 bg-brand-primary-tint rounded font-medium text-brand-primary">
        <IconExchange size={14} stroke={1.5} />
        <span>Dev Role: {role || 'None'}</span>
      </div>

      <div className="flex items-center gap-1 border-l border-border-default pl-2">
        <button
          onClick={() => switchDevRole(UserRole.CUSTOMER)}
          className={`px-2 py-1 rounded transition-colors ${
            role === UserRole.CUSTOMER
              ? 'bg-brand-primary text-white font-medium'
              : 'text-text-secondary hover:bg-bg-screen'
          }`}
          title="Switch to Customer: Aarav Sharma"
        >
          Customer
        </button>

        <button
          onClick={() => switchDevRole(UserRole.VENDOR)}
          className={`px-2 py-1 rounded transition-colors ${
            role === UserRole.VENDOR
              ? 'bg-brand-primary text-white font-medium'
              : 'text-text-secondary hover:bg-bg-screen'
          }`}
          title="Switch to Vendor: Rajesh Patidar (Indore Annapurna Mess)"
        >
          Vendor
        </button>

        <button
          onClick={() => switchDevRole(UserRole.ADMIN)}
          className={`px-2 py-1 rounded transition-colors ${
            role === UserRole.ADMIN
              ? 'bg-brand-primary text-white font-medium'
              : 'text-text-secondary hover:bg-bg-screen'
          }`}
          title="Switch to Admin: Platform Admin"
        >
          Admin
        </button>
      </div>

      <div className="flex items-center gap-1 border-l border-border-default pl-2">
        <Link
          href="/discovery"
          className="px-1.5 py-1 text-text-secondary hover:text-brand-primary hover:underline"
        >
          App
        </Link>
        <Link
          href="/vendor/dashboard"
          className="px-1.5 py-1 text-text-secondary hover:text-brand-primary hover:underline"
        >
          Vendor
        </Link>
        <Link
          href="/admin/dashboard"
          className="px-1.5 py-1 text-text-secondary hover:text-brand-primary hover:underline"
        >
          Admin
        </Link>
      </div>
    </div>
  );
};
