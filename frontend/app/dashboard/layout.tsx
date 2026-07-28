'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavHeader } from '@/components/layout/NavHeader';
import { useWalletStore } from '@/stores/walletStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected } = useWalletStore();

  useEffect(() => {
    if (!isConnected) {
      router.replace('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null; // Prevent flash of dashboard content before redirect
  }

  return (
    <div className="min-h-screen bg-arctic-navy flex flex-col">
      <NavHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
