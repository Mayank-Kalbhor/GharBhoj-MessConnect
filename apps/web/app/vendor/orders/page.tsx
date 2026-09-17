'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus } from '@messconnect/shared-types';
import {
  IconReceipt,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';

interface VendorOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  mealType: string;
  scheduledDate: string;
  status: OrderStatus;
  amount: string;
  orderType: 'ONE_TIME' | 'SUBSCRIPTION';
  items: { name: string; quantity: number }[];
}

const FALLBACK_VENDOR_ORDERS: VendorOrder[] = [
  {
    id: 'ord_indore_7812',
    customerName: 'Aarav Sharma',
    phone: '+919876543210',
    address: 'Flat 302, Student Residency, Bhanwarkuan, Indore',
    mealType: 'LUNCH',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: OrderStatus.PLACED,
    amount: '180.00',
    orderType: 'ONE_TIME',
    items: [
      { name: 'Paneer Butter Masala', quantity: 1 },
      { name: 'Whole Wheat Phulka (4 pcs)', quantity: 1 }
    ]
  },
  {
    id: 'ord_indore_7811',
    customerName: 'Priya Joshi',
    phone: '+919876543222',
    address: 'Room 14, Girls Hostel, Tower Square, Indore',
    mealType: 'LUNCH',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: OrderStatus.ACCEPTED,
    amount: '220.00',
    orderType: 'ONE_TIME',
    items: [
      { name: 'Dal Tadka Special', quantity: 1 },
      { name: 'Steamed Jeera Rice', quantity: 1 },
      { name: 'Gulab Jamun (2 pcs)', quantity: 1 }
    ]
  },
  {
    id: 'ord_indore_7810',
    customerName: 'Rohan Patel',
    phone: '+919876543233',
    address: 'B-12, Navlakha Main Road, Indore',
    mealType: 'LUNCH',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: OrderStatus.PREPARING,
    amount: '0.00',
    orderType: 'SUBSCRIPTION',
    items: [{ name: 'Monthly Lunch Essential Thali', quantity: 1 }]
  },
  {
    id: 'ord_indore_7809',
    customerName: 'Kavita Mehta',
    phone: '+919876543244',
    address: 'Sapna Sangeeta, Indore',
    mealType: 'LUNCH',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: OrderStatus.OUT_FOR_DELIVERY,
    amount: '140.00',
    orderType: 'ONE_TIME',
    items: [{ name: 'Dal Fry & Roti Combo', quantity: 1 }]
  },
  {
    id: 'ord_indore_7808',
    customerName: 'Sunil Rao',
    phone: '+919876543255',
    address: 'Geeta Bhawan Square, Indore',
    mealType: 'LUNCH',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    status: OrderStatus.DELIVERED,
    amount: '160.00',
    orderType: 'ONE_TIME',
    items: [{ name: 'Executive Thali', quantity: 1 }]
  }
];

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>(FALLBACK_VENDOR_ORDERS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const advanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: nextStatus });
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    } catch (err) {
      // Local UI update fallback
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Order Management</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Advance orders sequentially: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            {orders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED).length} Active Orders
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-bg-card border border-border-default rounded-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <IconSearch size={16} stroke={1.5} className="absolute left-3 top-2.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-screen border border-border-default rounded-[8px] focus:outline-none focus:border-brand-primary text-text-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-screen text-text-secondary border border-border-default hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-bg-card border border-border-default rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary bg-bg-screen border-b border-border-default">
              <tr>
                <th className="py-3 px-4 font-medium">Order ID & Date</th>
                <th className="py-3 px-4 font-medium">Customer & Address</th>
                <th className="py-3 px-4 font-medium">Dishes Ordered</th>
                <th className="py-3 px-4 font-medium">Type & Value</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Progress Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-bg-screen/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-text-primary block">{order.id}</span>
                    <span className="text-[10px] text-text-secondary">{formatDate(order.scheduledDate)} • {order.mealType}</span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[200px]">
                    <span className="font-medium text-text-primary block">{order.customerName}</span>
                    <span className="text-[10px] text-text-secondary truncate block">{order.address}</span>
                  </td>

                  <td className="py-3.5 px-4 max-w-[220px]">
                    <div className="space-y-0.5">
                      {order.items.map(item => (
                        <div key={item.name} className="text-text-secondary">
                          {item.name} <span className="text-text-primary font-medium">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-brand-primary block">{formatCurrency(order.amount)}</span>
                    <span className="text-[10px] text-text-secondary block">
                      {order.orderType === 'SUBSCRIPTION' ? 'Subscription' : 'One-Time'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        order.status === OrderStatus.DELIVERED
                          ? 'success'
                          : order.status === OrderStatus.CANCELLED
                          ? 'danger'
                          : order.status === OrderStatus.PREPARING
                          ? 'accent'
                          : 'primary'
                      }
                      size="sm"
                    >
                      {order.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {order.status === OrderStatus.PLACED && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => advanceStatus(order.id, OrderStatus.ACCEPTED)}
                      >
                        Accept Order
                      </Button>
                    )}
                    {order.status === OrderStatus.ACCEPTED && (
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => advanceStatus(order.id, OrderStatus.PREPARING)}
                      >
                        Start Cooking
                      </Button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => advanceStatus(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                      >
                        Hand to Delivery
                      </Button>
                    )}
                    {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => advanceStatus(order.id, OrderStatus.DELIVERED)}
                      >
                        Mark Delivered
                      </Button>
                    )}
                    {order.status === OrderStatus.DELIVERED && (
                      <span className="text-success-text font-medium flex items-center justify-end gap-1 text-[11px]">
                        <IconCheck size={14} stroke={2} />
                        Fulfilled
                      </span>
                    )}
                    {order.status === OrderStatus.CANCELLED && (
                      <span className="text-danger-text text-[11px]">Cancelled</span>
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
