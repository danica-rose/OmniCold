'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';

export default function DashboardPage() {
  const router = useRouter();
  const { activeRole } = useUIStore();

  useEffect(() => {
    router.replace(`/dashboard/${activeRole}`);
  }, [activeRole, router]);

  return null;
}
