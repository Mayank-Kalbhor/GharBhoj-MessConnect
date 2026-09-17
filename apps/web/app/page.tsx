import { redirect } from 'next/navigation';
import Link from 'next/link';
import { IconDeviceMobile, IconBuildingStore, IconShieldCheck, IconArrowRight, IconSparkles } from '@tabler/icons-react';

export default function RootPage() {
  // Hard security gate: redirect to vendor dashboard in production or when dev auth is disabled
  const isDevAuthAllowed =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === 'true';

  if (!isDevAuthAllowed) {
    redirect('/vendor/dashboard');
  }

  return (
    <main className="min-h-screen bg-bg-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary-tint rounded-badge text-brand-primary text-xs font-medium mb-3">
            <IconSparkles size={14} stroke={1.5} />
            <span>GharBhoj (MessConnect) — Indore Launch V1</span>
          </div>
          <h1 className="text-2xl font-medium text-text-primary tracking-tight">
            Interactive Multi-Surface Portal
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Choose a surface to test and demo the platform against the live NestJS backend.
          </p>
        </div>

        {/* Surface Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Surface 1: Customer Preview */}
          <Link
            href="/discovery"
            className="bg-bg-card border border-border-default rounded-card p-5 hover:border-brand-primary transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-primary-tint flex items-center justify-center text-brand-primary mb-3">
                <IconDeviceMobile size={22} stroke={1.5} />
              </div>
              <h2 className="text-base font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                Customer App
              </h2>
              <span className="text-[10px] text-brand-accent font-medium uppercase tracking-wider block mt-0.5">
                340px Phone Bezel
              </span>
              <p className="text-xs text-text-secondary mt-2">
                Discover Indore messes, view daily menus, order meals, manage subscriptions and skip credits.
              </p>
            </div>
            <div className="flex items-center text-xs text-brand-primary font-medium mt-4 pt-3 border-t border-border-default">
              <span>Open Customer App</span>
              <IconArrowRight size={14} stroke={2} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Surface 2: Vendor Dashboard */}
          <Link
            href="/vendor/dashboard"
            className="bg-bg-card border border-border-default rounded-card p-5 hover:border-brand-primary transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-brand-primary-tint flex items-center justify-center text-brand-primary mb-3">
                <IconBuildingStore size={22} stroke={1.5} />
              </div>
              <h2 className="text-base font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                Vendor Dashboard
              </h2>
              <span className="text-[10px] text-brand-primary font-medium uppercase tracking-wider block mt-0.5">
                Desktop Web
              </span>
              <p className="text-xs text-text-secondary mt-2">
                Daily menu publisher, live kitchen meal count sheet, order progression stepper, and 14% payouts.
              </p>
            </div>
            <div className="flex items-center text-xs text-brand-primary font-medium mt-4 pt-3 border-t border-border-default">
              <span>Open Vendor Panel</span>
              <IconArrowRight size={14} stroke={2} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Surface 3: Admin Panel */}
          <Link
            href="/admin/dashboard"
            className="bg-bg-card border border-border-default rounded-card p-5 hover:border-sidebar-dark transition-colors flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sidebar-dark mb-3">
                <IconShieldCheck size={22} stroke={1.5} />
              </div>
              <h2 className="text-base font-medium text-text-primary group-hover:text-sidebar-dark transition-colors">
                Admin Panel
              </h2>
              <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block mt-0.5">
                Platform Console
              </span>
              <p className="text-xs text-text-secondary mt-2">
                Vendor onboarding approvals, FSSAI verification, review dispute moderation, and GMV analytics.
              </p>
            </div>
            <div className="flex items-center text-xs text-text-primary font-medium mt-4 pt-3 border-t border-border-default">
              <span>Open Admin Panel</span>
              <IconArrowRight size={14} stroke={2} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Architecture Note */}
        <div className="mt-8 p-3 bg-bg-card border border-border-default rounded-[10px] text-center text-xs text-text-secondary">
          <span>Backend API Connected: </span>
          <code className="bg-bg-screen px-1.5 py-0.5 rounded border border-border-muted font-mono text-[11px] text-text-primary">
            http://localhost:4000/v1
          </code>
          <span className="mx-2">•</span>
          <span>Launch City: </span>
          <span className="font-medium text-text-primary">Indore</span>
          <span className="mx-2">•</span>
          <span>Platform Commission: </span>
          <span className="font-medium text-text-primary">14.00%</span>
        </div>
      </div>
    </main>
  );
}
