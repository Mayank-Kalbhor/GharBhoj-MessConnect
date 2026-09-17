'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  IconMessageReport,
  IconStarFilled,
  IconCheck,
  IconTrash,
  IconShieldCheck,
  IconAlertCircle
} from '@tabler/icons-react';

interface FlaggedReview {
  id: string;
  messName: string;
  customerName: string;
  isVerifiedSubscriber: boolean;
  ratings: {
    taste: number;
    hygiene: number;
    quantity: number;
    punctuality: number;
    overall: number;
  };
  comment: string;
  flagReason: string;
  createdAt: string;
}

const FALLBACK_DISPUTES: FlaggedReview[] = [
  {
    id: 'rev_dispute_101',
    messName: 'Indore Annapurna Mess',
    customerName: 'Kunal Singhal',
    isVerifiedSubscriber: true,
    ratings: {
      taste: 2,
      hygiene: 3,
      quantity: 4,
      punctuality: 2,
      overall: 2.75
    },
    comment: 'Food arrived lukewarm and dal was salty today. Normally better.',
    flagReason: 'Vendor claims delivery delay was caused by rain in Bhawarkua area.',
    createdAt: '2026-09-14'
  }
];

export default function ReviewDisputesPage() {
  const [disputes, setDisputes] = useState<FlaggedReview[]>(FALLBACK_DISPUTES);
  const [alert, setAlert] = useState<string | null>(null);

  const handleDismiss = (id: string) => {
    setDisputes(prev => prev.filter(d => d.id !== id));
    setAlert('Flag dismissed. Review remains published with 1.5x subscriber weighting.');
  };

  const handleDelete = (id: string) => {
    setDisputes(prev => prev.filter(d => d.id !== id));
    setAlert('Review deleted. Mess ratings recomputed per Rule 7.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-text-primary">Review Dispute & Moderation Queue</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit customer feedback flagged by Indore mess owners
          </p>
        </div>
        <Badge variant="muted" size="md">
          {disputes.length} Flagged
        </Badge>
      </div>

      {alert && (
        <div className="p-3 bg-success-bg border border-success-text/30 rounded-card flex items-center gap-2 text-xs text-success-text">
          <IconCheck size={16} stroke={2} />
          <span>{alert}</span>
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="bg-bg-card border border-border-default rounded-card p-8 text-center space-y-2">
          <IconCheck size={32} stroke={1.5} className="text-success-text mx-auto" />
          <h2 className="text-sm font-medium text-text-primary">Dispute Queue Clear</h2>
          <p className="text-xs text-text-secondary">
            No customer reviews are currently flagged for moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(dispute => (
            <div
              key={dispute.id}
              className="bg-bg-card border border-border-default rounded-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-border-default">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-medium text-text-primary">{dispute.messName}</h2>
                    <span className="text-text-secondary text-xs">•</span>
                    <span className="text-xs text-text-primary">{dispute.customerName}</span>
                    {dispute.isVerifiedSubscriber && (
                      <Badge variant="primary" size="sm">
                        Verified Subscriber (1.5x Weighted)
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-text-secondary mt-0.5 block">
                    Posted on {dispute.createdAt}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm font-medium text-brand-accent">
                  <IconStarFilled size={15} />
                  <span>{dispute.ratings.overall.toFixed(2)} Overall</span>
                </div>
              </div>

              {/* Multi-Axis Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-bg-screen rounded border border-border-default">
                  <span className="text-[10px] text-text-secondary block">Taste</span>
                  <span className="font-medium text-text-primary">{dispute.ratings.taste} / 5</span>
                </div>
                <div className="p-2 bg-bg-screen rounded border border-border-default">
                  <span className="text-[10px] text-text-secondary block">Hygiene</span>
                  <span className="font-medium text-text-primary">{dispute.ratings.hygiene} / 5</span>
                </div>
                <div className="p-2 bg-bg-screen rounded border border-border-default">
                  <span className="text-[10px] text-text-secondary block">Quantity</span>
                  <span className="font-medium text-text-primary">{dispute.ratings.quantity} / 5</span>
                </div>
                <div className="p-2 bg-bg-screen rounded border border-border-default">
                  <span className="text-[10px] text-text-secondary block">Punctuality</span>
                  <span className="font-medium text-text-primary">{dispute.ratings.punctuality} / 5</span>
                </div>
              </div>

              {/* Review Comment */}
              <div className="p-3 bg-bg-screen rounded-badge text-xs space-y-1">
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">
                  Customer Review Comment:
                </span>
                <p className="text-text-primary italic">&ldquo;{dispute.comment}&rdquo;</p>
              </div>

              {/* Vendor Dispute Claim */}
              <div className="p-3 bg-danger-bg/50 border border-danger-border rounded-badge text-xs space-y-1">
                <span className="text-[10px] text-danger-text font-medium uppercase tracking-wider block">
                  Vendor Dispute Reason:
                </span>
                <p className="text-text-primary">{dispute.flagReason}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border-default flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleDismiss(dispute.id)}>
                  Dismiss Flag (Keep Review)
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(dispute.id)}>
                  Delete Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
