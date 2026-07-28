import { FREIGHTER_INSTALL_URL } from '@/lib/constants';
import type { StellarNetwork } from '@/lib/types';

/**
 * Check if the Freighter browser extension is installed and available.
 * Note: isConnected() checks if the extension can communicate, not if the user
 * has granted permission. A false result doesn't necessarily mean uninstalled.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const freighter = await import('@stellar/freighter-api');
    // Check if the module loaded and has the expected API
    if (typeof freighter.isConnected !== 'function') return false;
    return await freighter.isConnected();
  } catch {
    return false;
  }
}

/**
 * Request wallet connection. Returns the public key on success.
 * Throws if user rejects or Freighter is not available.
 */
export async function connectWallet(): Promise<string> {
  try {
    const freighter = await import('@stellar/freighter-api');
    const publicKey = await freighter.requestAccess();
    if (!publicKey || publicKey === '') {
      throw new Error('Freighter returned empty public key. Make sure the extension is unlocked.');
    }
    return publicKey;
  } catch (error) {
    if (error instanceof Error && error.message.includes('empty public key')) {
      throw error;
    }
    throw new Error(`Freighter wallet connection failed. Make sure the extension is installed and unlocked. Install at ${FREIGHTER_INSTALL_URL}`);
  }
}

/**
 * Sign a transaction XDR string using Freighter.
 * Returns the signed XDR.
 */
export async function signTransaction(
  xdr: string,
  network: StellarNetwork
): Promise<string> {
  const freighter = await import('@stellar/freighter-api');
  const signedXdr = await freighter.signTransaction(xdr, {
    networkPassphrase: network === 'testnet'
      ? 'Test SDF Network ; September 2015'
      : 'Public Global Stellar Network ; September 2015',
  });
  return signedXdr;
}

/**
 * Disconnect the wallet (client-side only, clears local state).
 * Freighter doesn't have a formal disconnect API — we just clear our state.
 */
export function disconnectWallet(): void {
  // No-op on Freighter side; the wallet store handles clearing state
}

/**
 * Get the Freighter install URL for display when extension is missing.
 */
export function getFreighterInstallUrl(): string {
  return FREIGHTER_INSTALL_URL;
}
