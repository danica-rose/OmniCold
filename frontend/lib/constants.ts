export const NETWORK_CONFIG = {
  testnet: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
    contractId: process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ID || 'CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO',
    explorerUrl: 'https://stellar.expert/explorer/testnet',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
  mainnet: {
    rpcUrl: 'https://soroban-rpc.mainnet.stellar.gateway.fm',
    passphrase: 'Public Global Stellar Network ; September 2015',
    contractId: process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ID || '',
    explorerUrl: 'https://stellar.expert/explorer/public',
    horizonUrl: 'https://horizon.stellar.org',
  },
} as const;

export const POLLING_INTERVAL_MS = 15_000;
export const TOAST_DURATION_SUCCESS_MS = 4_000;
export const TOAST_DURATION_ERROR_MS = 5_000;
export const MIN_TOUCH_TARGET_PX = 44;
export const FREIGHTER_INSTALL_URL = 'https://www.freighter.app/';
