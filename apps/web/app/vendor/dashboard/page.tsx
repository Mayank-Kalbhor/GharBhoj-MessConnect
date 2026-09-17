'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MetricTile } from '@/components/shared/MetricTile';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus } from '@messconnect/shared-types';
import {
  IconReceipt,
  IconCoin,
  IconUsers,
  IconStarFilled,
  IconClock,
  IconToolsKitchen2,
  IconArrowRight,
  IconCheck
} from '@tabler/icons-react';

interface VendorDashboardData {
  todayOrdersCount: number;
  todayGrossRevenue: string;
  activeSubscribersCount: number;
  avgRating: number;
  consistencyScore: number;
  dailyMenu: {
    mealType: string;
    capacity: number;
    ordersPlaced: number;
    slotsRemaining: number;
    cutoffTime: string;
  };
  recentOrders: {
    id: string;
    customerName: string;
    mealType: string;
    status: OrderStatus;
    amount: string;
    itemsSummary: string;
  }[];
}

const FALLBACK_DASHBOARD: VendorDashboardData = {
  todayOrdersCount: 42,
  todayGrossRevenue: '5040.00',
  activeSubscribersCount: 28,
  avgRating: 4.8,
  consistencyScore: 94,
  dailyMenu: {
    mealType: 'LUNCH',
    capacity: 50,
    ordersPlaced: 36,
    slotsRemaining: 14,
    cutoffTime: '11:30 AM'
  },
  recentOrders: [
    {
      id: 'ord_indore_7812',
      customerName: 'Aarav Sharma',
      mealType: 'LUNCH',
      status: OrderStatus.PLACED,
      amount: '180.00',
      itemsSummary: 'Paneer Butter Masala, Phulka (4 pcs)'
    },
    {
      id: 'ord_indore_7811',
      customerName: 'Priya Joshi',
      mealType: 'LUNCH',
      status: OrderStatus.ACCEPTED,
      amount: '220.00',
      itemsSummary: 'Dal Tadka, Steamed Rice, Gulab Jamun'
    },
    {
      id: 'ord_indore_7810',
      customerName: 'Rohan Patel (Sub #42)',
      mealType: 'LUNCH',
      status: OrderStatus.PREPARING,
      amount: '0.00',
      itemsSummary: 'Daily Thali (Monthly Lunch Essential)'
    }
  ]
};

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboardData>(FALLBACK_DASHBOARD);
  const [orders, setOrders] = useState(FALLBACK_DASHBOARD.recentOrders);

  const advanceOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Kitchen Overview</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time daily operations for Indore Annapurna Mess
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/vendor/meal-count-sheet">
            <Button variant="secondary" size="sm">
              <IconToolsKitchen2 size={14} stroke={1.5} className="mr-1.5" />
              Meal Count Sheet
            </Button>
          </Link>
          <Link href="/vendor/menu-calendar">
            <Button variant="primary" size="sm">
              Publish Daily Menu
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Tiles per UI Spec Sheet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Today's Orders"
          value={data.todayOrdersCount}
          subtext="across Lunch & Dinner"
          icon={<IconReceipt size={18} stroke={1.5} />}
          trend={{ positive: true, text: '+8% vs yesterday' }}
        />
        <MetricTile
          label="Today's Gross Revenue"
          value={formatCurrency(data.todayGrossRevenue)}
          subtext="before 14% platform split"
          icon={<IconCoin size={18} stroke={1.5} />}
          trend={{ positive: true, text: 'Indore Launch' }}
        />
        <MetricTile
          label="Active Subscribers"
          value={data.activeSubscribersCount}
          subtext="recurring daily customers"
          icon={<IconUsers size={18} stroke={1.5} />}
          trend={{ positive: true, text: '+3 this week' }}
        />
        <MetricTile
          label="Kitchen Rating"
          value={`${data.avgRating.toFixed(1)} / 5.0`}
          subtext={`${data.consistencyScore}% on-time consistency`}
          icon={<IconStarFilled size={18} className="text-brand-accent" />}
        />
      </div>

      {/* Live Capacity & Demand Card */}
      <div className="bg-bg-card border border-border-default rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success-text" />
            <h2 className="text-sm font-medium text-text-primary">
              Live Meal Slot Capacity — Today&apos;s {data.dailyMenu.mealType}
            </h2>
          </div>
          <Badge variant={data.dailyMenu.slotsRemaining > 0 ? 'success' : 'danger'} size="sm">
            {data.dailyMenu.slotsRemaining > 0 ? `${data.dailyMenu.slotsRemaining} Slots Left` : 'Sold Out'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-bg-screen border border-border-default rounded-badge">
            <span className="text-xs text-text-secondary block">Kitchen Capacity Cap</span>
            <span className="text-base font-medium text-text-primary mt-1 block">
              {data.dailyMenu.capacity} meals maximum
            </span>
          </div>
          <div className="p-3 bg-bg-screen border border-border-default rounded-badge">
            <span className="text-xs text-text-secondary block">Orders Placed & Locked</span>
            <span className="text-base font-medium text-brand-primary mt-1 block">
              {data.dailyMenu.ordersPlaced} meals ({Math.round((data.dailyMenu.ordersPlaced / data.dailyMenu.capacity) * 100)}% full)
            </span>
          </div>
          <div className="p-3 bg-bg-screen border border-border-default rounded-badge">
            <span className="text-xs text-text-secondary block">Ordering Cutoff Time</span>
            <span className="text-base font-medium text-brand-accent mt-1 block">
              {data.dailyMenu.cutoffTime} (Strict Rule 6.2)
            </span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-bg-card border border-border-default rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-text-primary">Incoming & Active Orders</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Advance order status in kitchen sequence
            </p>
          </div>
          <Link href="/vendor/orders" className="text-xs text-brand-primary font-medium hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <IconArrowRight size={14} stroke={2} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary bg-bg-screen border-y border-border-default">
              <tr>
                <th className="py-2.5 px-3 font-medium">Order ID</th>
                <th className="py-2.5 px-3 font-medium">Customer</th>
                <th className="py-2.5 px-3 font-medium">Items</th>
                <th className="py-2.5 px-3 font-medium">Amount</th>
                <th className="py-2.5 px-3 font-medium">Current Status</th>
                <th className="py-2.5 px-3 font-medium text-right">Kitchen Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-bg-screen/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-text-primary">{order.id}</td>
                  <td className="py-3 px-3 font-medium text-text-primary">{order.customerName}</td>
                  <td className="py-3 px-3 text-text-secondary max-w-[220px] truncate">{order.itemsSummary}</td>
                  <td className="py-3 px-3 font-medium text-text-primary">{formatCurrency(order.amount)}</td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        order.status === OrderStatus.DELIVERED
                          ? 'success'
                          : order.status === OrderStatus.PREPARING
                          ? 'accent'
                          : 'primary'
                      }
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {order.status === OrderStatus.PLACED && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => advanceOrderStatus(order.id, OrderStatus.ACCEPTED)}
                      >
                        Accept Order
                      </Button>
                    )}
                    {order.status === OrderStatus.ACCEPTED && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => advanceOrderStatus(order.id, OrderStatus.PREPARING)}
                      >
                        Start Prep
                      </Button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => advanceOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                      >
                        Handover
                      </Button>
                    )}
                    {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => advanceOrderStatus(order.id, OrderStatus.DELIVERED)}
                      >
                        Delivered
                      </Button>
                    )}
                    {order.status === OrderStatus.DELIVERED && (
                      <span className="text-success-text text-[11px] font-medium flex items-center justify-end gap-1">
                        <IconCheck size={14} stroke={2} />
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
