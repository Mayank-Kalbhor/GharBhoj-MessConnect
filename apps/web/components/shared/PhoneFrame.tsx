'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconHome, IconCalendarRepeat, IconReceipt, IconWallet, IconWifi, IconBattery3 } from '@tabler/icons-react';

export const PhoneFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Explore', href: '/discovery', icon: IconHome },
    { label: 'Subs', href: '/subscriptions', icon: IconCalendarRepeat },
    { label: 'Orders', href: '/orders', icon: IconReceipt },
    { label: 'Wallet', href: '/wallet', icon: IconWallet }
  ];

  return (
    <div className="min-h-screen bg-[#F0EBE1] flex items-center justify-center p-4">
      {/* 340px Outer Mobile Bezel Container */}
      <div className="w-[340px] h-[720px] bg-bg-screen border-2 border-[#D8D2C4] rounded-[32px] flex flex-col overflow-hidden relative">
        {/* Status Bar */}
        <div className="h-9 px-5 pt-2 flex items-center justify-between text-[11px] font-medium text-text-primary select-none bg-bg-screen z-20">
          <span>9:41</span>
          {/* Camera Pill */}
          <div className="w-16 h-3 bg-text-primary/10 rounded-full" />
          <div className="flex items-center gap-1.5 text-text-secondary">
            <IconWifi size={13} stroke={1.5} />
            <IconBattery3 size={15} stroke={1.5} />
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto relative pb-16">
          {children}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 h-14 bg-bg-card border-t border-border-default flex items-center justify-around z-20 px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/discovery' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded transition-colors ${
                  isActive ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={18} stroke={1.5} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
