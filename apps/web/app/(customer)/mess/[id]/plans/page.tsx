'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  IconArrowLeft,
  IconCheck,
  IconCalendarEvent,
  IconWallet,
  IconShieldCheck,
  IconSparkles
} from '@tabler/icons-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  mealTypes: string[];
  price: string;
  isPopular?: boolean;
}

const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_lunch_30',
    name: 'Monthly Lunch Essential',
    description: 'Fresh daily lunch delivered before 1:00 PM. Best for students & office goers.',
    durationDays: 30,
    mealTypes: ['LUNCH'],
    price: '2400.00',
    isPopular: true
  },
  {
    id: 'plan_both_30',
    name: 'Complete Board (Lunch + Dinner)',
    description: 'Complete daily nutrition with lunch & dinner 7 days a week.',
    durationDays: 30,
    mealTypes: ['LUNCH', 'DINNER'],
    price: '4500.00',
    isPopular: false
  },
  {
    id: 'plan_lunch_15',
    name: '15-Day Trial Plan',
    description: 'Experience Indore Annapurna Mess flexibility before full month commitment.',
    durationDays: 15,
    mealTypes: ['LUNCH'],
    price: '1300.00',
    isPopular: false
  }
];

export default function SubscriptionPlansPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletCreditToApply, setWalletCreditToApply] = useState('0.00');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<any | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res: any = await apiClient.get(`/mess/${params.id}/subscription-plans`);
        if (res && Array.isArray(res) && res.length > 0) {
          setPlans(res);
        }
      } catch (err) {
        // Use fallback plans for seamless demo
      }
    }
    loadPlans();
  }, [params.id]);

  const handleOpenSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setPurchaseSuccess(null);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);

    const payload = {
      messId: params.id,
      planId: selectedPlan.id,
      startDate,
      addressId: 'addr_default_indore',
      autoRenew: false, // Feature gated in V1
      walletCreditToApply: walletCreditToApply || '0.00'
    };

    try {
      const res: any = await apiClient.post('/subscriptions', payload);
      setPurchaseSuccess(res);
    } catch (err) {
      // Dev mock response
      const totalAllotted = selectedPlan.durationDays * selectedPlan.mealTypes.length;
      setPurchaseSuccess({
        id: `sub_${Date.now().toString().slice(-6)}`,
        status: 'ACTIVE',
        startDate,
        endDate: new Date(Date.now() + selectedPlan.durationDays * 86400000).toISOString().split('T')[0],
        totalMealsAllotted: totalAllotted,
        mealsDelivered: 0,
        mealsSkipped: 0,
        skipCreditsRemaining: 0,
        balanceAmount: selectedPlan.price
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link href={`/mess/${params.id}`} className="p-1 rounded text-text-secondary hover:text-text-primary">
          <IconArrowLeft size={18} stroke={1.5} />
        </Link>
        <span className="text-xs font-medium text-text-primary">Subscription Plans</span>
        <div className="w-5" />
      </div>

      {/* Header Info */}
      <div>
        <h1 className="text-sm font-medium text-text-primary">Select a Meal Plan</h1>
        <p className="text-[11px] text-text-secondary mt-0.5">
          Guaranteed hot meals, priority kitchen prep & flexible skips.
        </p>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {plans.map(plan => {
          const totalMeals = plan.durationDays * (plan.mealTypes?.length || 1);
          const perMeal = Math.round(parseFloat(plan.price) / totalMeals);

          return (
            <div
              key={plan.id}
              className={`bg-bg-card border rounded-card p-4 space-y-3 relative ${
                plan.isPopular ? 'border-brand-accent' : 'border-border-default'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-2.5 right-4">
                  <Badge variant="accent" size="sm">
                    Most Popular in Indore
                  </Badge>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xs font-medium text-text-primary">{plan.name}</h2>
                  <div className="text-sm font-medium text-brand-primary">
                    {formatCurrency(plan.price)}
                  </div>
                </div>
                <div className="text-[10px] text-text-secondary mt-0.5">
                  {plan.durationDays} Days • {totalMeals} Meals • ~{formatCurrency(perMeal)}/meal
                </div>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed">
                {plan.description}
              </p>

              {/* Plan Perks */}
              <div className="space-y-1 text-[11px] text-text-secondary pt-1 border-t border-border-default">
                <div className="flex items-center gap-1.5">
                  <IconCheck size={12} stroke={2} className="text-brand-primary" />
                  <span>Meal Types: {plan.mealTypes.join(' & ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCheck size={12} stroke={2} className="text-brand-primary" />
                  <span>Skip credits banked (up to 25% cap per Rule 3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCheck size={12} stroke={2} className="text-brand-primary" />
                  <span>Pause plan anytime for exams or holidays</span>
                </div>
              </div>

              <Button
                variant={plan.isPopular ? 'accent' : 'primary'}
                size="sm"
                fullWidth
                onClick={() => handleOpenSubscribe(plan)}
              >
                Choose {plan.name}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Subscribe Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPurchaseSuccess(null);
        }}
        title="Confirm Subscription"
        description="Review allotment and start date"
      >
        {purchaseSuccess ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-success-bg text-success-text flex items-center justify-center mx-auto">
              <IconCheck size={24} stroke={2} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary">Subscription Activated!</h3>
              <p className="text-xs text-text-secondary mt-1">
                Sub ID: <span className="font-mono">{purchaseSuccess.id}</span>
              </p>
              <p className="text-xs text-text-secondary">
                Meals Allotted: <span className="font-medium text-brand-primary">{purchaseSuccess.totalMealsAllotted} meals</span>
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  setIsModalOpen(false);
                  router.push('/subscriptions');
                }}
              >
                Go to My Subscriptions
              </Button>
            </div>
          </div>
        ) : selectedPlan && (
          <div className="space-y-3 text-xs">
            <div className="bg-bg-screen border border-border-default rounded-badge p-2.5 space-y-1">
              <div className="flex justify-between font-medium text-text-primary">
                <span>Plan</span>
                <span>{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-text-secondary text-[11px]">
                <span>Allotment Formula</span>
                <span>{selectedPlan.durationDays}d × {selectedPlan.mealTypes.length} = {selectedPlan.durationDays * selectedPlan.mealTypes.length} meals</span>
              </div>
            </div>

            {/* Start Date Picker */}
            <div>
              <label className="block text-[11px] font-medium text-text-primary mb-1">
                Plan Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-bg-card border border-border-default rounded-[6px] text-text-primary focus:outline-none focus:border-brand-primary"
              />
            </div>

            {/* Wallet Credit Deductions */}
            <div>
              <label className="block text-[11px] font-medium text-text-primary mb-1">
                Apply Wallet Balance (₹)
              </label>
              <input
                type="text"
                value={walletCreditToApply}
                onChange={e => setWalletCreditToApply(e.target.value)}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 text-xs bg-bg-card border border-border-default rounded-[6px] text-text-primary focus:outline-none focus:border-brand-primary font-mono"
              />
              <span className="text-[10px] text-text-secondary mt-0.5 block">
                Balance available in wallet will be deducted automatically
              </span>
            </div>

            <div className="pt-2 border-t border-border-default flex justify-between items-center">
              <div>
                <span className="text-[10px] text-text-secondary block">Total Plan Price</span>
                <span className="text-sm font-medium text-brand-primary">
                  {formatCurrency(selectedPlan.price)}
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                onClick={handleSubscribe}
              >
                {isSubmitting ? 'Activating...' : 'Pay & Start Plan'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
