'use client';

import { useState } from 'react';
import WalletButton from './WalletButton';
import RoleSwitcher from './RoleSwitcher';
import { SnowflakeIcon, MenuIcon, XIcon } from '@/components/icons';

/**
 * Top navigation bar with OmniCold branding and wallet/role controls.
 * On mobile (<768px) the right-side controls collapse into a hamburger menu.
 */
export function NavHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-arctic-deep/90 backdrop-blur-xl border-b border-frost-cyan/10">
      {/* Subtle frost texture overlay */}
      <div className="absolute inset-0 bg-frost-gradient pointer-events-none" aria-hidden="true" />
      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.15), transparent)' }}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between px-4 h-16 md:px-6">
        {/* Brand */}
        <a
          href="/"
          className="group flex items-center gap-2 flex-shrink-0"
          aria-label="OmniCold — home"
        >
          {/* Snowflake icon */}
          <SnowflakeIcon
            className="text-frost-cyan w-6 h-6 transition-transform duration-200 group-hover:scale-110"
            aria-hidden="true"
          />
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #00D4FF 0%, #F1FAEE 60%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            OmniCold
          </span>
        </a>

        {/* Desktop controls */}
        <nav
          className="hidden md:flex items-center gap-3"
          aria-label="Navigation controls"
        >
          <RoleSwitcher />
          <WalletButton />
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center min-h-11 min-w-11 rounded-lg
                     text-frost-gray hover:text-frost-white hover:bg-frost-cyan/10 transition-colors"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <XIcon size={22} aria-hidden="true" />
          ) : (
            <MenuIcon size={22} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden border-t border-frost-cyan/10 bg-arctic-deep px-4 py-4 flex flex-col gap-4"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-3">
            <RoleSwitcher />
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  );
}

export default NavHeader;
