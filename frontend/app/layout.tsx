import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/shared/ToastNotification';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OmniCold',
  description: 'IoT-integrated escrow dApp for cold-chain logistics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
