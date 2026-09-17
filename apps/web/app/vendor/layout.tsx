'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconLayoutDashboard,
  IconToolsKitchen2,
  IconCalendarEvent,
  IconReceipt,
  IconCoin,
  IconBuildingStore,
  IconCheck,
  IconSparkles
} from '@tabler/icons-react';

export default function VendorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/vendor/dashboard', icon: IconLayoutDashboard },
    { label: 'Meal Prep Sheet', href: '/vendor/meal-count-sheet', icon: IconToolsKitchen2 },
    { label: 'Daily Menu', href: '/vendor/menu-calendar', icon: IconCalendarEvent },
    { label: 'Live Orders', href: '/vendor/orders', icon: IconReceipt },
    { label: 'Payouts (14%)', href: '/vendor/payouts', icon: IconCoin },
    { label: 'Onboarding', href: '/vendor/onboarding', icon: IconBuildingStore }
  ];

  return (
    <div className="min-h-screen bg-bg-screen flex">
      {/* 150px Fixed Teal Sidebar per UI Design Spec Sheet */}
      <aside className="w-[150px] bg-brand-primary text-white flex flex-col justify-between fixed inset-y-0 left-0 z-30 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-1 text-[11px] font-medium tracking-wide">
              <IconSparkles size={14} stroke={1.5} className="text-brand-accent-bg" />
              <span>GharBhoj</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-white/70 block mt-0.5">
              Vendor Console
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-brand-primary'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} stroke={1.5} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mess Profile Footer */}
        <div className="p-3 border-t border-white/10 text-[10px] text-white/80">
          <div className="font-medium text-white truncate">Indore Annapurna</div>
          <div className="flex items-center gap-1 text-brand-accent-bg mt-0.5">
            <IconCheck size={11} stroke={2} />
            <span>FSSAI Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Offset by 150px) */}
      <div className="flex-1 ml-[150px] flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-12 bg-bg-card border-b border-border-default px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary">Vendor:</span>
            <span className="font-medium text-text-primary">Rajesh Patidar</span>
            <span className="text-text-secondary">•</span>
            <span className="text-text-secondary">City:</span>
            <span className="font-medium text-brand-primary">Indore (V1 Launch)</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[11px] bg-brand-primary-tint text-brand-primary px-2 py-0.5 rounded font-medium">
              Commission SLA: 14.00%
            </span>
            <span className="w-2 h-2 rounded-full bg-success-text" />
            <span className="text-text-secondary text-[11px]">Kitchen Online</span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
