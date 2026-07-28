'use client';

import { useRouter } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import { PackageIcon, TruckIcon, ThermometerIcon } from '@/components/icons';
import type { UserRole } from '@/lib/types';
import type { IconProps } from '@/components/icons';

interface RoleOption {
  role: UserRole;
  label: string;
  Icon: React.ComponentType<IconProps>;
}

const ROLES: RoleOption[] = [
  { role: 'shipper', label: 'Shipper', Icon: PackageIcon },
  { role: 'provider', label: 'Provider', Icon: TruckIcon },
  { role: 'oracle', label: 'Oracle', Icon: ThermometerIcon },
];

/**
 * Three-pill role switcher: Shipper | Provider | Oracle.
 * Active pill gets Frost Cyan accent. Clicking navigates to /dashboard/{role}
 * and updates the uiStore activeRole.
 */
export function RoleSwitcher() {
  const router = useRouter();
  const { activeRole, setActiveRole } = useUIStore();

  const handleRoleSelect = (role: UserRole) => {
    if (role === activeRole) return;
    setActiveRole(role);
    router.push(`/dashboard/${role}`);
  };

  return (
    <nav
      className="flex rounded-lg border border-frost-cyan/20 overflow-hidden"
      aria-label="Role selector"
    >
      {ROLES.map(({ role, label, Icon }) => {
        const isActive = activeRole === role;
        return (
          <button
            key={role}
            onClick={() => handleRoleSelect(role)}
            className={[
              'group flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium min-h-9 transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frost-cyan focus-visible:ring-inset',
              isActive
                ? 'bg-frost-cyan/20 text-frost-cyan border-r border-frost-cyan/20 last:border-r-0'
                : 'bg-transparent text-frost-gray hover:text-frost-white hover:bg-frost-cyan/5 border-r border-frost-cyan/10 last:border-r-0',
            ].join(' ')}
            aria-pressed={isActive}
            aria-label={`Switch to ${label} role`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              size={14}
              className={`shrink-0 transition-colors duration-200 ${
                isActive ? 'text-frost-cyan' : 'text-frost-gray group-hover:text-frost-white'
              }`}
              aria-hidden="true"
            />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default RoleSwitcher;
