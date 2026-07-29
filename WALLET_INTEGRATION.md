# Wallet Integration — OmniCold

## Stellar Wallet Library

**Package**: `@stellar/freighter-api` (v2.0.0+)  
**Location**: `frontend/package.json`  
**Import**: `import * as freighterApi from '@stellar/freighter-api'`

## Connect Wallet Functionality

**File**: `frontend/stores/walletStore.ts`  
**Function**: `connect()`

```typescript
connect: async () => {
  const freighterApi = await import('@stellar/freighter-api');
  const publicKey = await freighterApi.requestAccess();
  // Stores address in state, fetches XLM balance
}
```

**UI Component**: `frontend/components/layout/WalletButton.tsx`  
- Renders "Connect Wallet" button
- Calls `useWalletStore().connect()` on click
- Shows connected address after successful connection

## Disconnect Wallet

**File**: `frontend/stores/walletStore.ts`  
**Function**: `disconnect()`

```typescript
disconnect: () => {
  set({ address: null, isConnected: false, xlmBalance: null });
}
```

## Wallet Permissions, Address Retrieval, and Transaction Signing

### Address Retrieval (requestAccess / getAddress)

**File**: `frontend/services/freighter.ts`

```typescript
export async function connectWallet(): Promise<string> {
  const freighter = await import('@stellar/freighter-api');
  const publicKey = await freighter.requestAccess();
  return publicKey;
}
```

### Transaction Signing (signTransaction)

**File**: `frontend/services/freighter.ts`

```typescript
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
```

### Wallet Detection (isConnected / isAllowed)

**File**: `frontend/services/freighter.ts`

```typescript
export async function isFreighterInstalled(): Promise<boolean> {
  const freighter = await import('@stellar/freighter-api');
  return await freighter.isConnected();
}
```

## Transaction Flow (Frontend → Contract)

**File**: `frontend/stores/contractStore.ts`

1. Build unsigned transaction XDR (`SorobanService.buildInitializeShipment()`)
2. Sign with Freighter (`signTransaction(xdr, network)`)
3. Submit to Soroban RPC (`SorobanService.submitTransaction()`)
4. Poll for confirmation (`pollTransactionStatus()`)

## XLM Balance Display

**File**: `frontend/stores/walletStore.ts`  
**Function**: `fetchBalance()`

```typescript
fetchBalance: async () => {
  const horizonUrl = NETWORK_CONFIG[network].horizonUrl;
  const response = await fetch(`${horizonUrl}/accounts/${address}`);
  const data = await response.json();
  const nativeBalance = data.balances.find(b => b.asset_type === 'native');
  set({ xlmBalance: nativeBalance.balance });
}
```

Displayed in: `frontend/components/layout/WalletButton.tsx`

## Network Configuration

**File**: `frontend/lib/constants.ts`

- Testnet RPC: `https://soroban-testnet.stellar.org`
- Horizon: `https://horizon-testnet.stellar.org`
- Network Passphrase: `Test SDF Network ; September 2015`
