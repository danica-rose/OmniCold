'use client';

import { FrostCard } from '@/components/shared/FrostCard';
import { PackageIcon, TruckIcon, RadioIcon } from '@/components/icons';
import type { IconProps } from '@/components/icons';

interface RoleCardData {
  Icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
}

const ROLES: RoleCardData[] = [
  {
    Icon: PackageIcon,
    title: 'Shipper',
    description: 'Create shipments with temperature thresholds and bond requirements',
  },
  {
    Icon: TruckIcon,
    title: 'Provider',
    description: 'Deposit USDC bonds and monitor shipment compliance in transit',
  },
  {
    Icon: RadioIcon,
    title: 'Oracle',
    description: 'Report IoT temperature readings and trigger automated enforcement',
  },
];

/**
 * RoleCards — three frosted-glass cards showcasing the three OmniCold user roles.
 * Arranged in a responsive grid: single column on mobile, three columns on desktop.
 */
export function RoleCards() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto"
      role="list"
      aria-label="OmniCold user roles"
    >
      {ROLES.map((role) => (
        <FrostCard
          key={role.title}
          className="p-6 flex flex-col items-center text-center gap-4 group"
        >
          <div
            role="listitem"
            className="flex flex-col items-center gap-4 w-full"
          >
            {/* Role icon with circular background */}
            <div className="bg-frost-cyan/10 rounded-full p-4 transition-all duration-300 group-hover:bg-frost-cyan/20 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]" aria-hidden="true">
              <role.Icon className="w-10 h-10 text-frost-cyan" />
            </div>

            {/* Role title */}
            <h3 className="text-lg font-semibold text-frost-white tracking-wide">
              {role.title}
            </h3>

            {/* Role description */}
            <p className="text-sm text-frost-gray leading-relaxed">
              {role.description}
            </p>
          </div>
        </FrostCard>
      ))}
    </div>
  );
}

export default RoleCards;
