import React from 'react';

// ─── Base icon props ──────────────────────────────────────────────────────────

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

function iconDefaults(size: number = 24, className?: string, rest?: Partial<React.SVGProps<SVGSVGElement>>) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    ...rest,
  };
}

// ─── SnowflakeIcon ────────────────────────────────────────────────────────────

export function SnowflakeIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
      {/* Crystal branches */}
      <line x1="12" y1="2" x2="10" y2="4" />
      <line x1="12" y1="2" x2="14" y2="4" />
      <line x1="12" y1="22" x2="10" y2="20" />
      <line x1="12" y1="22" x2="14" y2="20" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="7.76" />
      <line x1="19.07" y1="4.93" x2="17.66" y2="7.76" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="16.24" />
      <line x1="19.07" y1="19.07" x2="17.66" y2="16.24" />
    </svg>
  );
}

// ─── ThermometerIcon ──────────────────────────────────────────────────────────

export function ThermometerIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

// ─── CheckCircleIcon ──────────────────────────────────────────────────────────

export function CheckCircleIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// ─── AlertTriangleIcon ────────────────────────────────────────────────────────

export function AlertTriangleIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ─── PackageIcon ──────────────────────────────────────────────────────────────

export function PackageIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

// ─── TruckIcon ────────────────────────────────────────────────────────────────

export function TruckIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

// ─── RadioIcon ────────────────────────────────────────────────────────────────

export function RadioIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
      <path d="M7.76 16.24a6 6 0 0 1 0-8.49" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

// ─── WalletIcon ───────────────────────────────────────────────────────────────

export function WalletIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <rect x="1" y="5" width="22" height="16" rx="2" ry="2" />
      <path d="M1 10h22" />
    </svg>
  );
}

// ─── LinkExternalIcon ─────────────────────────────────────────────────────────

export function LinkExternalIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ─── CopyIcon ─────────────────────────────────────────────────────────────────

export function CopyIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ─── LockIcon ─────────────────────────────────────────────────────────────────

export function LockIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ─── UnlockIcon ───────────────────────────────────────────────────────────────

export function UnlockIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

// ─── SlashIcon ────────────────────────────────────────────────────────────────

export function SlashIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

// ─── ChevronDownIcon ──────────────────────────────────────────────────────────

export function ChevronDownIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── MenuIcon ─────────────────────────────────────────────────────────────────

export function MenuIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

// ─── XIcon ────────────────────────────────────────────────────────────────────

export function XIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── ArrowUpIcon ──────────────────────────────────────────────────────────────

export function ArrowUpIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

// ─── ArrowDownIcon ────────────────────────────────────────────────────────────

export function ArrowDownIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

// ─── MinusIcon ────────────────────────────────────────────────────────────────

export function MinusIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── ClockIcon ────────────────────────────────────────────────────────────────

export function ClockIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── ZapIcon ──────────────────────────────────────────────────────────────────

export function ZapIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// ─── CoinsIcon ────────────────────────────────────────────────────────────────

export function CoinsIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <line x1="7" y1="6" x2="7.01" y2="6" />
      <line x1="9" y1="10" x2="9.01" y2="10" />
    </svg>
  );
}

// ─── SensorIcon (wave/signal) ─────────────────────────────────────────────────

export function SensorIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6 12a6 6 0 0 1 12 0" />
      <path d="M9 12a3 3 0 0 1 6 0" />
      <line x1="12" y1="12" x2="12" y2="20" />
    </svg>
  );
}

// ─── ClipboardIcon (for empty states) ─────────────────────────────────────────

export function ClipboardIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

// ─── PauseIcon ────────────────────────────────────────────────────────────────

export function PauseIcon({ size, className, ...rest }: IconProps) {
  return (
    <svg {...iconDefaults(size, className, rest)}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
