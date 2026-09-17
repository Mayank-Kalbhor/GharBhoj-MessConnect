'use client';

import React, { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MetricTile } from '@/components/shared/MetricTile';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconCoin,
  IconBuildingBank,
  IconCheck,
  IconClock,
  IconDownload,
  IconShieldCheck
} from '@tabler/icons-react';

interface PayoutRecord {
  id: string;
  period: string;
  grossAmount: string;
  commissionPercent: string;
  commissionAmount: string;
  netAmount: string;
  status: 'PROCESSED' | 'PENDING';
  processedAt?: string;
  payoutRef?: string;
}

const SETTLEMENTS: PayoutRecord[] = [
  {
    id: 'payout_wk_37',
    period: '08 Sep 2026 – 14 Sep 2026',
    grossAmount: '40000.00',
    commissionPercent: '14.00',
    commissionAmount: '5600.00',
    netAmount: '34400.00',
    status: 'PROCESSED',
    processedAt: '2026-09-15T06:00:00Z',
    payoutRef: 'pout_indore_9981'
  },
  {
    id: 'payout_wk_36',
    period: '01 Sep 2026 – 07 Sep 2026',
    grossAmount: '32000.00',
    commissionPercent: '14.00',
    commissionAmount: '4480.00',
    netAmount: '27520.00',
    status: 'PROCESSED',
    processedAt: '2026-09-08T06:00:00Z',
    payoutRef: 'pout_indore_9844'
  },
  {
    id: 'payout_wk_38_current',
    period: '15 Sep 2026 – 21 Sep 2026 (In Progress)',
    grossAmount: '15400.00',
    commissionPercent: '14.00',
    commissionAmount: '2156.00',
    netAmount: '13244.00',
    status: 'PENDING'
  }
];

export default function VendorPayoutsPage() {
  const [settlements] = useState<PayoutRecord[]>(SETTLEMENTS);

  const totalPaidOut = settlements
    .filter(s => s.status === 'PROCESSED')
    .reduce((sum, s) => sum + parseFloat(s.netAmount), 0);

  const pendingSettlement = settlements.find(s => s.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Weekly Payouts & Settlements</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Transparent net payouts after fixed 14.00% platform commission for Indore
          </p>
        </div>
        <Badge variant="accent" size="md">
          Indore SLA: 14.00% Commission
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricTile
          label="Total Net Transferred"
          value={formatCurrency(totalPaidOut)}
          subtext="settled directly to bank"
          icon={<IconCoin size={18} stroke={1.5} />}
        />
        <MetricTile
          label="Pending Current Cycle"
          value={formatCurrency(pendingSettlement?.netAmount || '0.00')}
          subtext="auto-settles next Monday"
          icon={<IconClock size={18} stroke={1.5} />}
        />
        <div className="bg-bg-card border border-border-default rounded-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-medium">Direct Bank Transfer</span>
            <IconBuildingBank size={18} stroke={1.5} className="text-brand-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary mt-1">
              HDFC Bank ••••4812
            </div>
            <span className="text-[10px] text-text-secondary">
              IFSC: HDFC0001234 • Rajesh Patidar
            </span>
          </div>
          <div className="pt-2 border-t border-border-default flex items-center gap-1 text-[11px] text-success-text font-medium">
            <IconCheck size={12} stroke={2} />
            <span>Bank Account Verified</span>
          </div>
        </div>
      </div>

      {/* Settlements Ledger */}
      <div className="bg-bg-card border border-border-default rounded-card overflow-hidden">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-primary">Historical Settlement Records</h2>
          <Button variant="secondary" size="sm">
            <IconDownload size={14} stroke={1.5} className="mr-1.5" />
            Download Statements
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary bg-bg-screen border-b border-border-default">
              <tr>
                <th className="py-3 px-4 font-medium">Settlement Cycle</th>
                <th className="py-3 px-4 font-medium">Gross Sales</th>
                <th className="py-3 px-4 font-medium">Platform Fee (14.00%)</th>
                <th className="py-3 px-4 font-medium">Net Transferred</th>
                <th className="py-3 px-4 font-medium">Payout Status</th>
                <th className="py-3 px-4 font-medium text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {settlements.map(item => (
                <tr key={item.id} className="hover:bg-bg-screen/40 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-text-primary">
                    {item.period}
                  </td>
                  <td className="py-3.5 px-4 text-text-primary">
                    {formatCurrency(item.grossAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-danger-text font-medium">
                    - {formatCurrency(item.commissionAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-brand-primary text-sm">
                    {formatCurrency(item.netAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={item.status === 'PROCESSED' ? 'success' : 'accent'} size="sm">
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[11px] text-text-secondary">
                    {item.payoutRef || 'Pending Settlement'}
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
