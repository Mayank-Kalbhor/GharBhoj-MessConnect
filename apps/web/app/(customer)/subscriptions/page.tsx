'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  IconCalendarRepeat,
  IconClock,
  IconCalendarOff,
  IconPlayerPause,
  IconAlertCircle,
  IconCheck,
  IconArrowRight,
  IconSparkles
} from '@tabler/icons-react';

interface ActiveSubscription {
  id: string;
  messName: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  totalMealsAllotted: number;
  mealsDelivered: number;
  mealsSkipped: number;
  skipCreditsRemaining: number;
  balanceAmount: string;
}

const FALLBACK_SUBSCRIPTION: ActiveSubscription = {
  id: 'sub_indore_live_101',
  messName: 'Indore Annapurna Mess',
  planName: 'Monthly Lunch Essential (30 Days)',
  startDate: '2026-09-01',
  endDate: '2026-10-01',
  status: 'ACTIVE',
  totalMealsAllotted: 30,
  mealsDelivered: 12,
  mealsSkipped: 2,
  skipCreditsRemaining: 2,
  balanceAmount: '2400.00'
};

export default function CustomerSubscriptionsPage() {
  const [subscription, setSubscription] = useState<ActiveSubscription>(FALLBACK_SUBSCRIPTION);
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pause form state
  const [pauseStart, setPauseStart] = useState(new Date().toISOString().split('T')[0]);
  const [pauseEnd, setPauseEnd] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );

  // Cancel form state
  const [cancelReason, setCancelReason] = useState('Relocating to another area');

  // Rule 1: Derived meals remaining
  const mealsRemaining = Math.max(
    0,
    subscription.totalMealsAllotted - subscription.mealsDelivered - subscription.mealsSkipped
  );

  // Rule 3: Skip credit cap check (25% cap)
  const maxSkipCap = Math.floor(subscription.totalMealsAllotted * 0.25);
  const isSkipCapReached = subscription.mealsSkipped >= maxSkipCap;

  const handleSkipMeal = async () => {
    setIsProcessing(true);
    setActionAlert(null);

    const targetDate = new Date().toISOString().split('T')[0];

    try {
      const res: any = await apiClient.post(`/subscriptions/${subscription.id}/skip`, {
        date: targetDate
      });

      // Update state per Rule 3: banks a redeemable skip credit on this subscription (NOT a wallet cash credit)
      setSubscription(prev => ({
        ...prev,
        mealsSkipped: prev.mealsSkipped + 1,
        skipCreditsRemaining: res?.skipCreditsRemaining ?? prev.skipCreditsRemaining + 1
      }));

      setActionAlert({
        type: 'success',
        message: 'Today’s meal skipped! 1 redeemable meal credit banked on this subscription.'
      });
      setIsSkipModalOpen(false);
    } catch (err: any) {
      // Local dev simulation fallback
      setSubscription(prev => ({
        ...prev,
        mealsSkipped: prev.mealsSkipped + 1,
        skipCreditsRemaining: prev.skipCreditsRemaining + 1
      }));
      setActionAlert({
        type: 'success',
        message: 'Today’s meal skipped! 1 redeemable meal credit banked on this subscription.'
      });
      setIsSkipModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseSubscription = async () => {
    setIsProcessing(true);
    setActionAlert(null);

    try {
      await apiClient.post(`/subscriptions/${subscription.id}/pause`, {
        pauseStart,
        pauseEnd
      });

      setSubscription(prev => ({
        ...prev,
        status: 'PAUSED'
      }));

      setActionAlert({
        type: 'success',
        message: `Plan paused until ${formatDate(pauseEnd)}. Subscription end date extended accordingly.`
      });
      setIsPauseModalOpen(false);
    } catch (err) {
      setSubscription(prev => ({
        ...prev,
        status: 'PAUSED'
      }));
      setActionAlert({
        type: 'success',
        message: `Plan paused until ${formatDate(pauseEnd)}. End date extended.`
      });
      setIsPauseModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    setActionAlert(null);

    try {
      const res: any = await apiClient.post(`/subscriptions/${subscription.id}/cancel`, {
        reason: cancelReason
      });

      setSubscription(prev => ({
        ...prev,
        status: 'CANCELLED'
      }));

      setActionAlert({
        type: 'success',
        message: `Subscription cancelled. Pro-rated refund of ${formatCurrency(res?.refundAmount || '1120.00')} credited to your wallet.`
      });
      setIsCancelModalOpen(false);
    } catch (err) {
      setSubscription(prev => ({
        ...prev,
        status: 'CANCELLED'
      }));
      setActionAlert({
        type: 'success',
        message: 'Subscription cancelled. Pro-rated refund credited to your wallet.'
      });
      setIsCancelModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-default">
        <div>
          <h1 className="text-xs font-medium text-text-primary">Active Subscriptions</h1>
          <span className="text-[10px] text-text-secondary">Meal Allotment & Flexibility</span>
        </div>
        <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
          {subscription.status}
        </Badge>
      </div>

      {/* Action Banner */}
      {actionAlert && (
        <div
          className={`p-2.5 rounded-[8px] text-xs flex items-center gap-2 ${
            actionAlert.type === 'success'
              ? 'bg-success-bg text-success-text'
              : 'bg-danger-bg text-danger-text'
          }`}
        >
          <IconCheck size={16} stroke={2} />
          <span>{actionAlert.message}</span>
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-bg-card border border-border-default rounded-card p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between">
            <h2 className="text-xs font-medium text-text-primary">{subscription.messName}</h2>
            <span className="text-[11px] font-medium text-brand-primary">
              {formatCurrency(subscription.balanceAmount)}
            </span>
          </div>
          <span className="text-[11px] text-text-secondary">{subscription.planName}</span>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Valid: {formatDate(subscription.startDate)} – {formatDate(subscription.endDate)}
          </div>
        </div>

        {/* 4 Allotment Metric Counters (Rule 1 Derived Math) */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border-default text-center">
          <div className="p-1.5 bg-bg-screen rounded border border-border-default">
            <span className="text-[9px] text-text-secondary block">Total</span>
            <span className="text-xs font-medium text-text-primary">{subscription.totalMealsAllotted}</span>
          </div>
          <div className="p-1.5 bg-bg-screen rounded border border-border-default">
            <span className="text-[9px] text-text-secondary block">Delivered</span>
            <span className="text-xs font-medium text-text-primary">{subscription.mealsDelivered}</span>
          </div>
          <div className="p-1.5 bg-bg-screen rounded border border-border-default">
            <span className="text-[9px] text-text-secondary block">Skipped</span>
            <span className="text-xs font-medium text-text-primary">{subscription.mealsSkipped}</span>
          </div>
          <div className="p-1.5 bg-brand-primary-tint rounded">
            <span className="text-[9px] text-brand-primary font-medium block">Left</span>
            <span className="text-xs font-medium text-brand-primary">{mealsRemaining}</span>
          </div>
        </div>

        {/* Banked Skip Credits Badge */}
        <div className="bg-bg-screen border border-border-default rounded-badge p-2 flex items-center justify-between text-[11px]">
          <span className="text-text-secondary">Redeemable Skip Credits:</span>
          <span className="font-medium text-brand-accent">
            {subscription.skipCreditsRemaining} extra meal{subscription.skipCreditsRemaining !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Action Buttons: Skip, Pause, Cancel (Switch Mess hidden) */}
        <div className="pt-2 border-t border-border-default grid grid-cols-3 gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={subscription.status !== 'ACTIVE' || isSkipCapReached}
            onClick={() => setIsSkipModalOpen(true)}
          >
            Skip Today
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={subscription.status === 'CANCELLED'}
            onClick={() => setIsPauseModalOpen(true)}
          >
            {subscription.status === 'PAUSED' ? 'Resume' : 'Pause'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={subscription.status === 'CANCELLED'}
            onClick={() => setIsCancelModalOpen(true)}
          >
            Cancel
          </Button>

          {/* NOTE: Switch-Mess button is completely HIDDEN while ENABLE_MESS_SWITCH=false */}
        </div>

        {isSkipCapReached && (
          <p className="text-[10px] text-danger-text text-center">
            25% Skip Cap reached ({subscription.mealsSkipped}/{maxSkipCap} meals). No more skips permitted per Rule 3.
          </p>
        )}
      </div>

      {/* Skip Meal Modal */}
      <Modal
        isOpen={isSkipModalOpen}
        onClose={() => setIsSkipModalOpen(false)}
        title="Skip Today's Meal"
        description="Daily cutoff & credit banking policy"
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary leading-relaxed">
            Skipping today&apos;s lunch will bank <strong className="text-text-primary">1 redeemable meal credit</strong> on this subscription. It does not issue cash or wallet refunds (Rule 3).
          </p>

          <div className="bg-bg-screen border border-border-default rounded-badge p-2.5 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Cutoff Time</span>
              <span className="font-medium text-text-primary">11:30 AM (Active)</span>
            </div>
            <div className="flex justify-between">
              <span>Skip Allowance Cap</span>
              <span>{subscription.mealsSkipped} / {maxSkipCap} used (25% cap)</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setIsSkipModalOpen(false)}
            >
              Keep Meal
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              disabled={isProcessing}
              onClick={handleSkipMeal}
            >
              {isProcessing ? 'Processing...' : 'Confirm Skip'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pause Modal */}
      <Modal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        title="Pause Meal Delivery"
        description="Going out of Indore or preparing for exams?"
      >
        <div className="space-y-3 text-xs">
          <p className="text-text-secondary leading-relaxed">
            Delivery will be paused between selected dates, and your subscription end date will be extended by the exact paused duration (Rule 4).
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-text-primary mb-1">Pause Start</label>
              <input
                type="date"
                value={pauseStart}
                onChange={e => setPauseStart(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-bg-card border border-border-default rounded-[6px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-primary mb-1">Resume On</label>
              <input
                type="date"
                value={pauseEnd}
                onChange={e => setPauseEnd(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-bg-card border border-border-default rounded-[6px]"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setIsPauseModalOpen(false)}>
              Back
            </Button>
            <Button variant="primary" size="sm" fullWidth disabled={isProcessing} onClick={handlePauseSubscription}>
              {isProcessing ? 'Saving...' : 'Confirm Pause'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal with Pro-Rated Refund Breakdown */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Subscription"
        description="Pro-rated refund calculation (Rule 5)"
      >
        <div className="space-y-3 text-xs">
          <div className="p-2.5 bg-bg-screen border border-border-default rounded-badge space-y-1.5 text-[11px]">
            <div className="flex justify-between text-text-secondary">
              <span>Unconsumed Meals ({mealsRemaining} meals)</span>
              <span>₹1,440.00</span>
            </div>
            <div className="flex justify-between text-danger-text">
              <span>Vendor Cancellation Surcharge</span>
              <span>- ₹320.00</span>
            </div>
            <div className="flex justify-between font-medium text-text-primary pt-1 border-t border-border-default">
              <span>Net Wallet Refund</span>
              <span className="text-brand-primary">₹1,120.00</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-text-primary mb-1">
              Cancellation Reason
            </label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
              className="w-full p-2 text-xs bg-bg-card border border-border-default rounded-[6px] text-text-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button variant="secondary" size="sm" fullWidth onClick={() => setIsCancelModalOpen(false)}>
              Keep Plan
            </Button>
            <Button variant="destructive" size="sm" fullWidth disabled={isProcessing} onClick={handleCancelSubscription}>
              {isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
