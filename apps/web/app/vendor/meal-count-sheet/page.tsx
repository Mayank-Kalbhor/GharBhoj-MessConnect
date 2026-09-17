'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconToolsKitchen2,
  IconPrinter,
  IconCalendar,
  IconCheck,
  IconAlertCircle
} from '@tabler/icons-react';

interface MealCountRow {
  mealType: 'LUNCH' | 'DINNER';
  subscriptionOrders: number;
  oneTimeOrders: number;
  totalOrders: number;
  capacity: number;
  slotsRemaining: number;
  prepItems: { name: string; quantity: string }[];
}

const FALLBACK_COUNTS: MealCountRow[] = [
  {
    mealType: 'LUNCH',
    subscriptionOrders: 26,
    oneTimeOrders: 10,
    totalOrders: 36,
    capacity: 50,
    slotsRemaining: 14,
    prepItems: [
      { name: 'Whole Wheat Phulka', quantity: '144 pcs (4/meal)' },
      { name: 'Dal Tadka Special', quantity: '8.5 Litres' },
      { name: 'Paneer Butter Masala', quantity: '7.2 kg' },
      { name: 'Steamed Jeera Rice', quantity: '6.0 kg' },
      { name: 'Indori Gulab Jamun', quantity: '72 pcs (2/meal)' }
    ]
  },
  {
    mealType: 'DINNER',
    subscriptionOrders: 22,
    oneTimeOrders: 8,
    totalOrders: 30,
    capacity: 40,
    slotsRemaining: 10,
    prepItems: [
      { name: 'Whole Wheat Phulka', quantity: '120 pcs (4/meal)' },
      { name: 'Sev Tamatar Malwi', quantity: '6.0 kg' },
      { name: 'Moong Dal Khichdi', quantity: '5.5 kg' },
      { name: 'Fresh Curd & Salad', quantity: '30 bowls' }
    ]
  }
];

export default function MealCountSheetPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<MealCountRow[]>(FALLBACK_COUNTS);

  const totalKitchenMeals = rows.reduce((sum, r) => sum + r.totalOrders, 0);
  const totalCapacity = rows.reduce((sum, r) => sum + r.capacity, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Kitchen Meal Count Sheet</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Accurate daily preparation forecast based on subscriptions & locked one-time orders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-bg-card border border-border-default rounded-[8px] text-text-primary focus:outline-none focus:border-brand-primary"
          />
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <IconPrinter size={15} stroke={1.5} className="mr-1.5" />
            Print Sheet
          </Button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border-default rounded-card p-4">
          <span className="text-xs text-text-secondary block">Total Meals to Cook</span>
          <span className="text-2xl font-medium text-brand-primary mt-1 block">
            {totalKitchenMeals} meals
          </span>
          <span className="text-[11px] text-text-secondary mt-1 block">
            {Math.round((totalKitchenMeals / totalCapacity) * 100)}% of daily kitchen limit
          </span>
        </div>

        <div className="bg-bg-card border border-border-default rounded-card p-4">
          <span className="text-xs text-text-secondary block">Subscription Demand</span>
          <span className="text-2xl font-medium text-text-primary mt-1 block">
            {rows.reduce((sum, r) => sum + r.subscriptionOrders, 0)} meals
          </span>
          <span className="text-[11px] text-text-secondary mt-1 block">
            Guaranteed demand from Indore students & office goers
          </span>
        </div>

        <div className="bg-bg-card border border-border-default rounded-card p-4">
          <span className="text-xs text-text-secondary block">One-Time Locked Orders</span>
          <span className="text-2xl font-medium text-brand-accent mt-1 block">
            {rows.reduce((sum, r) => sum + r.oneTimeOrders, 0)} meals
          </span>
          <span className="text-[11px] text-text-secondary mt-1 block">
            Ordered before daily cutoff time
          </span>
        </div>
      </div>

      {/* Breakdown by Lunch & Dinner */}
      <div className="space-y-4">
        {rows.map(row => (
          <div
            key={row.mealType}
            className="bg-bg-card border border-border-default rounded-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-default">
              <div className="flex items-center gap-2">
                <IconToolsKitchen2 size={18} stroke={1.5} className="text-brand-primary" />
                <h2 className="text-sm font-medium text-text-primary">
                  {row.mealType} Service Demand
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {row.totalOrders} / {row.capacity} Meals Total
                </Badge>
                <Badge variant={row.slotsRemaining > 0 ? 'success' : 'danger'} size="sm">
                  {row.slotsRemaining} Slots Free
                </Badge>
              </div>
            </div>

            {/* Demand Breakdown Bar */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-bg-screen rounded-badge border border-border-default">
                <span className="text-[11px] text-text-secondary block">Subscriptions</span>
                <span className="text-lg font-medium text-text-primary mt-0.5 block">
                  {row.subscriptionOrders}
                </span>
              </div>
              <div className="p-3 bg-bg-screen rounded-badge border border-border-default">
                <span className="text-[11px] text-text-secondary block">One-Time Orders</span>
                <span className="text-lg font-medium text-text-primary mt-0.5 block">
                  {row.oneTimeOrders}
                </span>
              </div>
              <div className="p-3 bg-brand-primary-tint rounded-badge">
                <span className="text-[11px] text-brand-primary font-medium block">Total Cook Volume</span>
                <span className="text-lg font-medium text-brand-primary mt-0.5 block">
                  {row.totalOrders}
                </span>
              </div>
            </div>

            {/* Kitchen Prep Quantities */}
            <div className="pt-2">
              <span className="text-xs font-medium text-text-primary block mb-2">
                Raw Material Batch Calculation ({row.mealType}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {row.prepItems.map(item => (
                  <div
                    key={item.name}
                    className="p-2.5 bg-bg-screen border border-border-default rounded-[8px] flex items-center justify-between text-xs"
                  >
                    <span className="text-text-primary font-medium">{item.name}</span>
                    <span className="text-brand-primary font-mono">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
