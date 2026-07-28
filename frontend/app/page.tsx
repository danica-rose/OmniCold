import { LandingHero } from '@/components/landing/LandingHero';

/**
 * Root page — renders the LandingHero for unauthenticated users.
 * LandingHero is a client component that handles wallet connection
 * and navigates to /dashboard on successful connect.
 */
export default function RootPage() {
  return <LandingHero />;
}
