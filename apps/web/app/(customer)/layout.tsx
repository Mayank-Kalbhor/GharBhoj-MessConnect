'use client';

import React from 'react';
import { PhoneFrame } from '@/components/shared/PhoneFrame';

export default function CustomerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <PhoneFrame>{children}</PhoneFrame>;
}
