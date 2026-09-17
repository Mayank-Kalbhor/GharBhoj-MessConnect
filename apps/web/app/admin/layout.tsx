'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconChartInfographic,
  IconBuildingStore,
  IconId,
  IconMessageReport,
  IconShieldCheck,
  IconSparkles
} from '@tabler/icons-react';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // NOTE: City-config link is COMPLETELY OMITTED from navigation per ENABLE_CITY_CONFIG_UI=false
  const navItems = [
    { label: 'Platform GMV', href: '/admin/dashboard', icon: IconChartInfographic },
    { label: 'Mess Approvals', href: '/admin/vendor-approvals', icon: IconBuildingStore },
    { label: 'Student IDs', href: '/admin/student-verifications', icon: IconId },
    { label: 'Disputes & Reviews', href: '/admin/disputes', icon: IconMessageReport }
  ];

  return (
    <div className="min-h-screen bg-bg-screen flex">
      {/* 150px Fixed Dark Charcoal Sidebar (#22302B) per UI Spec Sheet */}
      <aside className="w-[150px] bg-sidebar-dark text-white flex flex-col justify-between fixed inset-y-0 left-0 z-30 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-1 text-[11px] font-medium tracking-wide">
              <IconShieldCheck size={15} stroke={1.5} className="text-brand-accent-bg" />
              <span>GharBhoj Admin</span>
            </div>
            <span className="text-[9px] uppercase tracking-wider text-white/60 block mt-0.5">
              Operations Center
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} stroke={1.5} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer */}
        <div className="p-3 border-t border-white/10 text-[10px] text-white/70">
          <div className="font-medium text-white truncate">Platform Ops</div>
          <span className="text-[9px] text-white/50 block">Launch City: Indore</span>
        </div>
      </aside>

      {/* Main Content Viewport (Offset by 150px) */}
      <div className="flex-1 ml-[150px] flex flex-col min-h-screen">
        <header className="h-12 bg-bg-card border-b border-border-default px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-secondary">Admin Console:</span>
            <span className="font-medium text-text-primary">Indore Launch Operations</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[11px] bg-bg-screen border border-border-muted px-2 py-0.5 rounded text-text-secondary">
              City Config UI: Disabled (V1 Flag)
            </span>
            <span className="w-2 h-2 rounded-full bg-success-text" />
            <span className="text-text-secondary text-[11px]">System Nominal</span>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
