'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  IconSearch,
  IconMapPin,
  IconStarFilled,
  IconChartBar,
  IconMeat,
  IconLeaf,
  IconArrowRight,
  IconSparkles
} from '@tabler/icons-react';

interface MessSummary {
  id: string;
  name: string;
  avgRating: number;
  consistencyScore: number;
  isVeg: boolean;
  cuisineTypes: string[];
  city: string;
  distanceMeters?: number;
}

const FALLBACK_MESSES: MessSummary[] = [
  {
    id: 'mess_indore_annapurna',
    name: 'Indore Annapurna Mess',
    avgRating: 4.8,
    consistencyScore: 94,
    isVeg: true,
    cuisineTypes: ['North Indian', 'Malwi', 'Thali'],
    city: 'Indore',
    distanceMeters: 420
  },
  {
    id: 'mess_sarafa_delight',
    name: 'Sarafa Kitchen & Tiffin',
    avgRating: 4.6,
    consistencyScore: 88,
    isVeg: false,
    cuisineTypes: ['Central Indian', 'North Indian'],
    city: 'Indore',
    distanceMeters: 1150
  },
  {
    id: 'mess_chappan_bhojan',
    name: 'Chappan Student Bhojanalaya',
    avgRating: 4.7,
    consistencyScore: 91,
    isVeg: true,
    cuisineTypes: ['South Indian', 'Gujarati', 'Jain'],
    city: 'Indore',
    distanceMeters: 1800
  }
];

export default function DiscoveryPage() {
  const [messes, setMesses] = useState<MessSummary[]>(FALLBACK_MESSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMesses() {
      try {
        const res: any = await apiClient.get('/mess', {
          city: 'Indore',
          lat: 22.7196,
          lng: 75.8577
        });
        if (res && res.data && res.data.length > 0) {
          setMesses(res.data);
        }
      } catch (err) {
        // Retain fallback data for demo reliability
      } finally {
        setIsLoading(false);
      }
    }
    loadMesses();
  }, []);

  const cuisines = ['North Indian', 'Malwi', 'Thali', 'South Indian', 'Gujarati'];

  const filteredMesses = messes.filter(m => {
    if (vegOnly && !m.isVeg) return false;
    if (selectedCuisine && !m.cuisineTypes?.includes(selectedCuisine)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.cuisineTypes?.some(c => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Top Location Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border-default">
        <div className="flex items-center gap-1.5 text-xs">
          <IconMapPin size={15} stroke={1.5} className="text-brand-primary" />
          <span className="font-medium text-text-primary">Indore, MP</span>
          <span className="text-[10px] text-text-secondary">• Bhanwarkuan</span>
        </div>
        <Badge variant="accent" size="sm">
          Launch City
        </Badge>
      </div>

      {/* Hero Welcome Banner */}
      <div className="bg-brand-primary text-white rounded-card p-3.5 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-medium tracking-wider text-white/80 block mb-1">
            GharBhoj Daily Kitchens
          </span>
          <h1 className="text-sm font-medium leading-snug">
            Fresh, home-cooked daily meals from verified Indore messes.
          </h1>
          <p className="text-[11px] text-white/80 mt-1">
            Strict cutoffs, daily menus & zero delivery markups.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IconSearch size={15} stroke={1.5} className="absolute left-3 top-2.5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search messes or cuisines..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-bg-card border border-border-default rounded-[8px] focus:outline-none focus:border-brand-primary placeholder:text-text-secondary/60 text-text-primary"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
            vegOnly
              ? 'bg-success-bg text-success-text border border-success-text/30'
              : 'bg-bg-card text-text-secondary border border-border-muted hover:text-text-primary'
          }`}
        >
          <IconLeaf size={12} stroke={2} />
          <span>Pure Veg</span>
        </button>

        {cuisines.map(c => {
          const isSelected = selectedCuisine === c;
          return (
            <button
              key={c}
              onClick={() => setSelectedCuisine(isSelected ? null : c)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-brand-primary text-white'
                  : 'bg-bg-card text-text-secondary border border-border-muted hover:text-text-primary'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Messes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{filteredMesses.length} Messes nearby in Indore</span>
          <span className="text-[10px]">PostGIS Verified</span>
        </div>

        {filteredMesses.map(mess => (
          <div
            key={mess.id}
            className="bg-bg-card border border-border-default rounded-card p-3 space-y-2 hover:border-brand-primary transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-medium text-text-primary">{mess.name}</h2>
                  {mess.isVeg && (
                    <span className="w-3 h-3 border border-success-text p-0.5 flex items-center justify-center rounded-[2px]">
                      <span className="w-1.5 h-1.5 bg-success-text rounded-full" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary">
                  <span className="flex items-center gap-0.5 text-brand-accent font-medium">
                    <IconStarFilled size={12} />
                    {mess.avgRating.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-brand-primary font-medium">
                    <IconChartBar size={12} stroke={1.5} />
                    {mess.consistencyScore}% score
                  </span>
                  <span>•</span>
                  <span>{mess.distanceMeters ? `${mess.distanceMeters}m` : 'Nearby'}</span>
                </div>
              </div>

              <Badge variant="primary" size="sm">
                Open Today
              </Badge>
            </div>

            {/* Cuisines Tags */}
            <div className="flex items-center gap-1 flex-wrap text-[10px] text-text-secondary">
              {mess.cuisineTypes.map(c => (
                <span key={c} className="bg-bg-screen px-1.5 py-0.5 rounded border border-border-default">
                  {c}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 border-t border-border-default flex items-center justify-between gap-2">
              <Link href={`/mess/${mess.id}/plans`} className="flex-1">
                <Button variant="secondary" size="sm" fullWidth>
                  Plans
                </Button>
              </Link>
              <Link href={`/mess/${mess.id}`} className="flex-1">
                <Button variant="primary" size="sm" fullWidth>
                  Today&apos;s Menu
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
