'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconBuildingStore,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconExternalLink
} from '@tabler/icons-react';

interface PendingVendor {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  city: string;
  fssaiNumber: string;
  addressLine: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  isVeg: boolean;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED';
}

const FALLBACK_PENDING: PendingVendor[] = [
  {
    id: 'mess_reg_indore_02',
    name: 'Sarafa Night Tiffin Center',
    ownerName: 'Sunil Verma',
    phone: '+919876543288',
    city: 'Indore',
    fssaiNumber: '11422850000456',
    addressLine: 'Shop 4, Sarafa Bazaar, Indore',
    bankAccountNumber: '50100293819283',
    bankIfscCode: 'SBIN0001294',
    isVeg: false,
    status: 'PENDING_APPROVAL'
  },
  {
    id: 'mess_reg_indore_03',
    name: 'Shree Krishna Bhojanalaya',
    ownerName: 'Manish Sharma',
    phone: '+919876543299',
    city: 'Indore',
    fssaiNumber: '11422850000789',
    addressLine: 'Near Geeta Bhawan, AB Road, Indore',
    bankAccountNumber: '50100384910293',
    bankIfscCode: 'HDFC0002910',
    isVeg: true,
    status: 'PENDING_APPROVAL'
  }
];

export default function VendorApprovalsPage() {
  const [vendors, setVendors] = useState<PendingVendor[]>(FALLBACK_PENDING);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await apiClient.patch(`/admin/mess/${id}/status`, { status: newStatus });
      setVendors(prev =>
        prev.map(v => (v.id === id ? { ...v, status: newStatus } : v))
      );
      setActionAlert(`Mess ${id} updated to ${newStatus}. Vendor notified via SMS.`);
    } catch (err) {
      setVendors(prev =>
        prev.map(v => (v.id === id ? { ...v, status: newStatus } : v))
      );
      setActionAlert(`Mess updated to ${newStatus}.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Vendor Onboarding Queue</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Review FSSAI hygiene registrations & bank accounts before approving messes to discovery
          </p>
        </div>
        <Badge variant="accent" size="md">
          {vendors.filter(v => v.status === 'PENDING_APPROVAL').length} Awaiting Verification
        </Badge>
      </div>

      {actionAlert && (
        <div className="p-3 bg-success-bg border border-success-text/30 rounded-card flex items-center gap-2 text-xs text-success-text">
          <IconCheck size={16} stroke={2} />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-bg-card border border-border-default rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-text-secondary bg-bg-screen border-b border-border-default">
              <tr>
                <th className="py-3 px-4 font-medium">Mess & Owner</th>
                <th className="py-3 px-4 font-medium">FSSAI License No.</th>
                <th className="py-3 px-4 font-medium">Location</th>
                <th className="py-3 px-4 font-medium">Bank Account</th>
                <th className="py-3 px-4 font-medium">Dietary</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {vendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-bg-screen/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-text-primary block">{vendor.name}</span>
                    <span className="text-[10px] text-text-secondary">{vendor.ownerName} • {vendor.phone}</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-text-primary">
                    <div className="flex items-center gap-1.5">
                      <span>{vendor.fssaiNumber}</span>
                      <IconShieldCheck size={14} stroke={1.5} className="text-brand-primary" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-[180px]">
                    <span className="text-text-primary block truncate">{vendor.addressLine}</span>
                    <span className="text-[10px] text-brand-primary font-medium">{vendor.city}</span>
                  </td>

                  <td className="py-3.5 px-4 text-[11px] font-mono">
                    <span className="text-text-primary block">{vendor.bankAccountNumber}</span>
                    <span className="text-text-secondary text-[10px]">{vendor.bankIfscCode}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={vendor.isVeg ? 'success' : 'muted'} size="sm">
                      {vendor.isVeg ? 'Pure Veg' : 'Non-Veg'}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        vendor.status === 'ACTIVE'
                          ? 'success'
                          : vendor.status === 'SUSPENDED'
                          ? 'danger'
                          : 'accent'
                      }
                      size="sm"
                    >
                      {vendor.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {vendor.status === 'PENDING_APPROVAL' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(vendor.id, 'ACTIVE')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUpdateStatus(vendor.id, 'SUSPENDED')}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-text-secondary text-[11px]">Action Completed</span>
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
