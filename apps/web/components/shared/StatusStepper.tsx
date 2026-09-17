import React from 'react';
import { OrderStatus } from '@messconnect/shared-types';
import { IconCheck, IconClock, IconX } from '@tabler/icons-react';

interface StatusStepperProps {
  currentStatus: OrderStatus;
}

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: OrderStatus.PLACED, label: 'Placed' },
  { status: OrderStatus.ACCEPTED, label: 'Accepted' },
  { status: OrderStatus.PREPARING, label: 'Preparing' },
  { status: OrderStatus.OUT_FOR_DELIVERY, label: 'On the way' },
  { status: OrderStatus.DELIVERED, label: 'Delivered' }
];

export const StatusStepper: React.FC<StatusStepperProps> = ({ currentStatus }) => {
  if (currentStatus === OrderStatus.CANCELLED) {
    return (
      <div className="p-3 bg-danger-bg border border-danger-border rounded-badge text-danger-text text-xs flex items-center gap-2">
        <IconX size={16} stroke={1.5} />
        <span className="font-medium">Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex(s => s.status === currentStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-3 inset-x-4 h-0.5 bg-border-default -z-0" />
        <div
          className="absolute top-3 left-4 h-0.5 bg-brand-primary -z-0 transition-all duration-300"
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 88}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step.status} className="flex flex-col items-center z-10">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                  isDone
                    ? 'bg-brand-primary text-white'
                    : isCurrent
                    ? 'bg-brand-primary text-white font-medium outline outline-2 outline-brand-primary-tint'
                    : 'bg-bg-card border border-border-muted text-text-secondary'
                }`}
              >
                {isDone ? (
                  <IconCheck size={12} stroke={2} />
                ) : isCurrent ? (
                  <IconClock size={12} stroke={2} />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[9px] mt-1.5 whitespace-nowrap text-center ${
                  isCurrent
                    ? 'font-medium text-brand-primary'
                    : isDone
                    ? 'text-text-primary'
                    : 'text-text-secondary'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
