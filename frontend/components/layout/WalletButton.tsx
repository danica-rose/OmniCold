'use client';

import { useRef, useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { FREIGHTER_INSTALL_URL } from '@/lib/constants';
import { usePrices } from '@/hooks/usePrices';

/** Truncates a Stellar address to first 4 + … + last 4 chars */
function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

/**
 * Wallet connect/disconnect button.
 *
 * States:
 * - Freighter not installed → install link
 * - Disconnected → "Connect Wallet" button
 * - Connecting → loading spinner
 * - Connected → truncated address + green dot + disconnect dropdown
 */
export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, xlmBalance } = useWalletStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [freighterMissing, setFreighterMissing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleConnect = async () => {
    // Check if Freighter extension exists in the browser
    try {
      const freighterApi = await import('@stellar/freighter-api');
      // isConnected checks if the extension is installed and reachable
      // It may return false if the extension exists but hasn't been set up yet
      // We still try requestAccess in that case since it will prompt the user
      if (typeof freighterApi.isConnected !== 'function') {
        setFreighterMissing(true);
        return;
      }
    } catch {
      setFreighterMissing(true);
      return;
    }
    setFreighterMissing(false);
    await connect();
  };

  const handleDisconnect = () => {
    setDropdownOpen(false);
    disconnect();
  };

  // Freighter not installed
  if (freighterMissing) {
    return (
      <a
        href={FREIGHTER_INSTALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-frost-cyan underline underline-offset-4 hover:text-frost-white transition-colors min-h-11 flex items-center px-2"
        aria-label="Install Freighter wallet extension"
      >
        Install Freighter ↗
      </a>
    );
  }

  // Connecting — spinner
  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg border border-frost-cyan/40
                   text-frost-cyan text-sm font-medium cursor-not-allowed opacity-70"
        aria-label="Connecting wallet…"
        aria-busy="true"
      >
        {/* Spinning ring */}
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        Connecting…
      </button>
    );
  }

  // Connected — truncated address + green dot + dropdown
  if (isConnected && address) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg border border-frost-cyan/30
                     bg-arctic-deep hover:bg-frost-cyan/10 text-frost-white text-sm font-mono
                     transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frost-cyan"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          aria-label={`Connected as ${address}`}
        >
          {/* Green connected indicator */}
          <span
            className="h-2 w-2 rounded-full bg-status-safe flex-shrink-0"
            aria-hidden="true"
          />
          {truncate(address)}
          {/* Chevron */}
          <svg
            className={`h-3 w-3 text-frost-gray transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-52 rounded-lg border border-frost-cyan/20
                       bg-arctic-slate/95 backdrop-blur-md shadow-frost-glow py-1"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-frost-cyan/10">
              <p className="text-xs text-frost-gray">Connected</p>
              <p className="text-xs text-frost-white font-mono truncate">{truncate(address)}</p>
              {xlmBalance !== null && (
                <XlmBalanceDisplay balance={xlmBalance} />
              )}
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-3 py-2 text-sm text-status-breach
                         hover:bg-status-breach/10 transition-colors min-h-11 flex items-center"
              role="menuitem"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Disconnected — Connect Wallet button
  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 min-h-11 rounded-lg border border-frost-cyan
                 text-frost-cyan text-sm font-medium
                 hover:bg-frost-cyan/10 hover:shadow-frost-hover
                 transition-all duration-200
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frost-cyan"
      aria-label="Connect Freighter wallet"
    >
      Connect Wallet
    </button>
  );
}

export default WalletButton;

function XlmBalanceDisplay({ balance }: { balance: string }) {
  const { prices } = usePrices();
  const xlm = parseFloat(balance);
  const phpEquiv = (xlm * prices.xlmUsd * prices.usdPhp).toFixed(2);
  const usdEquiv = (xlm * prices.xlmUsd).toFixed(2);
  
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      <p className="text-xs text-frost-cyan font-mono">{balance} XLM</p>
      <p className="text-[10px] text-frost-gray font-mono">≈ ${usdEquiv} / ₱{phpEquiv}</p>
    </div>
  );
}
