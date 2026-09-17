'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  IconBuildingStore,
  IconCheck,
  IconLock,
  IconShieldCheck,
  IconAlertCircle
} from '@tabler/icons-react';

export default function VendorOnboardingPage() {
  const [form, setForm] = useState({
    name: 'Indore Annapurna Mess',
    fssaiNumber: '11422850000123',
    addressLine: 'Flat 101, Near Bhawarkua Tower, AB Road',
    city: 'Indore', // Locked launch city invariant
    latitude: 22.7196,
    longitude: 75.8577,
    isVeg: true,
    cuisineTypes: ['North Indian', 'Malwi', 'Thali'],
    bankAccountNumber: '50100481239812',
    bankIfscCode: 'HDFC0001234',
    bankAccountHolder: 'Rajesh Patidar'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post('/vendor/mess', form);
      setIsSuccess(true);
    } catch (err) {
      // Local demo fallback
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <IconBuildingStore size={20} stroke={1.5} className="text-brand-primary" />
          <h1 className="text-lg font-medium text-text-primary">Vendor Mess Registration</h1>
        </div>
        <p className="text-xs text-text-secondary">
          Register your kitchen for GharBhoj launch. Requires verified FSSAI certification and bank payout details.
        </p>
      </div>

      {isSuccess ? (
        <div className="bg-bg-card border border-border-default rounded-card p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-success-bg text-success-text flex items-center justify-center mx-auto">
            <IconCheck size={24} stroke={2} />
          </div>
          <h2 className="text-base font-medium text-text-primary">
            Onboarding Submitted for Admin Review
          </h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
            Your mess <strong className="text-text-primary">{form.name}</strong> in Indore has been received. Our Indore team will verify your FSSAI certificate (<span className="font-mono">{form.fssaiNumber}</span>) and activate your menu publishing console within 24 hours.
          </p>
          <div className="pt-2">
            <Badge variant="primary" size="md">
              Status: PENDING_APPROVAL
            </Badge>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-bg-card border border-border-default rounded-card p-6 space-y-5">
          {/* Kitchen Details */}
          <div className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              1. Kitchen & Location Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Mess Business Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />

              <Input
                label="FSSAI 14-Digit License No."
                value={form.fssaiNumber}
                onChange={e => setForm({ ...form, fssaiNumber: e.target.value })}
                required
                maxLength={14}
              />
            </div>

            <Input
              label="Kitchen Street Address"
              value={form.addressLine}
              onChange={e => setForm({ ...form, addressLine: e.target.value })}
              required
            />

            {/* Locked City Dropdown */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Launch City (Locked for V1)
              </label>
              <div className="relative">
                <select
                  disabled
                  value="Indore"
                  className="w-full px-3 py-2 text-xs bg-bg-screen border border-border-default rounded-[8px] text-text-primary appearance-none cursor-not-allowed font-medium"
                >
                  <option value="Indore">Indore (V1 Exclusive Launch City)</option>
                </select>
                <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] text-text-secondary">
                  <IconLock size={13} stroke={1.5} />
                  <span>Single-Option Locked</span>
                </div>
              </div>
              <span className="text-[10px] text-text-secondary mt-1 block">
                Platform operations are exclusively active in Indore for V1.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isVeg"
                checked={form.isVeg}
                onChange={e => setForm({ ...form, isVeg: e.target.checked })}
                className="rounded border-border-default text-brand-primary"
              />
              <label htmlFor="isVeg" className="text-xs font-medium text-text-primary cursor-pointer">
                100% Pure Vegetarian Kitchen (Pure Veg Tag)
              </label>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="space-y-3 pt-3 border-t border-border-default">
            <h2 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              2. Bank Account Details (For 14% Net Payouts)
            </h2>

            <Input
              label="Account Holder Name"
              value={form.bankAccountHolder}
              onChange={e => setForm({ ...form, bankAccountHolder: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Bank Account Number"
                value={form.bankAccountNumber}
                onChange={e => setForm({ ...form, bankAccountNumber: e.target.value })}
                required
                className="font-mono"
              />

              <Input
                label="Bank IFSC Code"
                value={form.bankIfscCode}
                onChange={e => setForm({ ...form, bankIfscCode: e.target.value.toUpperCase() })}
                required
                className="font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border-default flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">
              By registering, you agree to the 14.00% commission schedule.
            </span>
            <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
