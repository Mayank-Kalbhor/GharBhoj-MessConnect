'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { MetricTile } from '@/components/shared/MetricTile';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconChartInfographic,
  IconCoin,
  IconBuildingStore,
  IconUsers,
  IconArrowRight,
  IconShieldCheck,
  IconAlertCircle
} from '@tabler/icons-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Platform Analytics & Growth</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Key operational metrics for Indore V1 launch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/vendor-approvals">
            <Button variant="primary" size="sm">
              Review Pending Messes (2)
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Analytics Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Total Platform GMV"
          value={formatCurrency('248500.00')}
          subtext="Indore gross meal transaction volume"
          icon={<IconChartInfographic size={18} stroke={1.5} />}
          trend={{ positive: true, text: '+22% this week' }}
        />
        <MetricTile
          label="Platform Commission (14.00%)"
          value={formatCurrency('34790.00')}
          subtext="earned platform revenue"
          icon={<IconCoin size={18} stroke={1.5} className="text-brand-primary" />}
          trend={{ positive: true, text: '14% Take Rate' }}
        />
        <MetricTile
          label="Active Subscriptions"
          value="184"
          subtext="recurring student & office plans"
          icon={<IconUsers size={18} stroke={1.5} />}
          trend={{ positive: true, text: '4.2% churn' }}
        />
        <MetricTile
          label="Active Messes in Indore"
          value="12"
          subtext="FSSAI verified kitchens"
          icon={<IconBuildingStore size={18} stroke={1.5} />}
          trend={{ positive: true, text: '2 pending review' }}
        />
      </div>

      {/* City Expansion Table */}
      <div className="bg-bg-card border border-border-default rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-text-primary">Launch City Operations</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Current market unit economics and commission tier
            </p>
          </div>
          <Badge variant="primary" size="sm">
            V1 Market Focus
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary bg-bg-screen border-y border-border-default">
              <tr>
                <th className="py-2.5 px-3 font-medium">City Name</th>
                <th className="py-2.5 px-3 font-medium">Platform Commission</th>
                <th className="py-2.5 px-3 font-medium">Active Kitchens</th>
                <th className="py-2.5 px-3 font-medium">Monthly GMV</th>
                <th className="py-2.5 px-3 font-medium">Kitchen Consistency</th>
                <th className="py-2.5 px-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              <tr className="hover:bg-bg-screen/40 transition-colors">
                <td className="py-3 px-3 font-medium text-text-primary">
                  Indore, Madhya Pradesh
                </td>
                <td className="py-3 px-3 font-medium text-brand-primary">
                  14.00% (Seeded CityConfig)
                </td>
                <td className="py-3 px-3 text-text-primary">
                  12 Active Kitchens
                </td>
                <td className="py-3 px-3 font-medium text-text-primary">
                  {formatCurrency('248500.00')}
                </td>
                <td className="py-3 px-3 text-text-primary">
                  92.4% on-time prep
                </td>
                <td className="py-3 px-3 text-right">
                  <Badge variant="success" size="sm">
                    Active Launch
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Action Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-default rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-text-primary">Vendor Approvals Queue</h3>
            <Badge variant="accent" size="sm">2 Pending</Badge>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            New kitchen registrations in Bhanwarkuan and Vijay Nagar awaiting FSSAI certificate validation.
          </p>
          <Link href="/admin/vendor-approvals">
            <Button variant="secondary" size="sm" fullWidth>
              Open Approvals Console
            </Button>
          </Link>
        </div>

        <div className="bg-bg-card border border-border-default rounded-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-text-primary">Review Dispute Queue</h3>
            <Badge variant="muted" size="sm">1 Flagged</Badge>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Customer reviews flagged by vendors for moderation across hygiene and taste rating axes.
          </p>
          <Link href="/admin/disputes">
            <Button variant="secondary" size="sm" fullWidth>
              Open Disputes Console
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
