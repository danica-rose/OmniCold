# Implementation Plan: OmniCold Frontend Dashboard

## Overview

Build the OmniCold Frontend as a Next.js 14 App Router application with TypeScript, Tailwind CSS arctic dark theme, Zustand state management, and Framer Motion animations. The frontend communicates directly with the OmniCold Soroban smart contract via RPC — no backend required. Implementation proceeds from project scaffolding through core libraries, state management, services, shared components, layout, pages, role views, animations, responsiveness, and property-based testing.

## Tasks

- [x] 1. Project Setup and Scaffolding
  - [x] 1.1 Initialize Next.js 14 project with TypeScript and App Router
    - Create `frontend/` directory with `package.json` including all dependencies: next, react, react-dom, @stellar/stellar-sdk, @stellar/freighter-api, framer-motion, recharts, zustand, tailwindcss, postcss, autoprefixer
    - Add dev dependencies: typescript, @types/react, @types/node, vitest, @testing-library/react, @testing-library/jest-dom, fast-check, jsdom
    - Create `tsconfig.json` with strict mode, path aliases (`@/` → `./`)
    - Create `next.config.js` with default App Router configuration
    - Create `postcss.config.js` with tailwindcss and autoprefixer plugins
    - _Requirements: 18.5_

  - [x] 1.2 Create base directory structure and placeholder files
    - Create all directories: `app/`, `app/dashboard/shipper/`, `app/dashboard/provider/`, `app/dashboard/oracle/`, `components/layout/`, `components/shipment/`, `components/forms/`, `components/shared/`, `components/landing/`, `stores/`, `services/`, `lib/`, `hooks/`, `public/icons/`
    - Create `app/globals.css` with Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) and custom frost-glass utility classes
    - _Requirements: 18.1, 18.5_


- [x] 2. Design Tokens and Tailwind Theme Configuration
  - [x] 2.1 Create `tailwind.config.ts` with arctic color palette and custom utilities
    - Define `colors.arctic` (navy: #0F1923, deep: #1B2A4A, slate: #1E293B)
    - Define `colors.frost` (cyan: #00D4FF, white: #F1FAEE, gray: #94A3B8)
    - Define `colors.status` (safe: #2EC4B6, warning: #FF9F1C, breach: #E63946)
    - Add `boxShadow` tokens: `frost-glow`, `frost-hover`
    - Add `backgroundImage` tokens: `frost-gradient`, `card-border`
    - Add `animation` keyframes: `pulse-amber`, `pulse-breach`, `frost-spread`
    - Configure `darkMode: 'class'` with content paths for all component directories
    - _Requirements: 18.1, 18.2, 18.3, 18.5, 18.6, 18.7, 18.8_

- [x] 3. Core Libraries — Types, Constants, Utilities, and Errors
  - [x] 3.1 Create `lib/types.ts` with all shared TypeScript types
    - Define `ShipmentStatus`, `StellarNetwork`, `UserRole`, `BondStatus`, `TemperatureZone` types
    - Define `ContractState`, `TransactionEntry`, `InitializeShipmentParams`, `TemperatureReading` interfaces
    - Define component prop interfaces: `ShipmentPipelineProps`, `TemperatureGaugeProps`, `BondStatusCardProps`, `TransactionHistoryProps`, `RoleSwitcherProps`, `NetworkSelectorProps`, `CreateShipmentFormProps`
    - _Requirements: 4.1, 9.1, 13.1, 14.2_

  - [x] 3.2 Create `lib/constants.ts` with network configuration and app constants
    - Define `NETWORK_CONFIG` object with testnet/mainnet RPC URLs, passphrases, contract IDs (from env vars), and explorer URLs
    - Define polling interval constant (15 seconds)
    - Define toast durations (success: 4s, error: 5s)
    - Define touch target minimum (44px)
    - _Requirements: 2.1, 2.2, 2.4, 14.3, 15.4, 16.2, 16.3_

  - [x] 3.3 Create `lib/errors.ts` with contract error code mapping
    - Define `CONTRACT_ERROR_MAP` mapping error codes 1–9 to human-readable messages with severity levels
    - Implement `mapContractError(code: number): string` function returning mapped message or generic fallback for unknown codes
    - _Requirements: 16.1_

  - [x] 3.4 Create `lib/utils.ts` with utility functions
    - Implement `truncateAddress(address: string): string` — returns first 4 + "…" + last 4 characters
    - Implement `formatUsdcAmount(stroops: bigint): string` — formats to 2 decimal places
    - Implement `classifyTemperatureZone(temp: number, min: number, max: number): TemperatureZone` — returns 'breach', 'warning', or 'safe'
    - Implement `formatElapsedTime(timestamp: number): string` — human-readable elapsed time (e.g., "2h 34m")
    - Implement `centidegreesToDisplay(centidegrees: number): string` — divides by 100, formats to 1 decimal place
    - Implement `classifyTrend(current: number, previous: number): 'up' | 'down' | 'stable'`
    - _Requirements: 1.2, 4.3, 9.2, 13.7, 22.1, 22.8_

  - [x] 3.5 Create `lib/animations.ts` with Framer Motion variant definitions
    - Define `frostWipe`, `frostThaw`, `toastEnter`, `pipelineTransition`, `gaugeNeedle`, `crystallize`, `bondThaw`, `bondCrack` animation variants
    - Implement `useAnimationVariant` hook that respects `prefers-reduced-motion`
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.6_

- [x] 4. State Management — Zustand Stores
  - [x] 4.1 Create `stores/walletStore.ts` for wallet connection state
    - Implement `WalletState` interface with: `address`, `isConnected`, `isConnecting`, `network`
    - Implement `connect()` action that invokes Freighter API `requestAccess()`
    - Implement `disconnect()` action that clears address and resets state
    - Implement `setNetwork()` action that persists selection to localStorage
    - Load persisted network preference on store initialization
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.4, 19.1_

  - [x] 4.2 Create `stores/contractStore.ts` for contract state management
    - Implement `ContractStoreState` interface with: `contractState`, `isLoading`, `error`, `lastFetchedAt`, `transactions`, `isTransactionPending`
    - Implement `fetchContractState()` action that calls SorobanService and updates state
    - Implement `submitTransaction()` action that manages pending state, invokes signing, submits, and re-fetches
    - _Requirements: 15.1, 15.2, 15.3, 19.2, 19.5_

  - [x] 4.3 Create `stores/uiStore.ts` for UI preferences
    - Implement `UIState` interface with: `activeRole`, `reducedMotion`
    - Implement `setActiveRole()` action that persists to sessionStorage
    - Implement `setReducedMotion()` action
    - Load persisted role from sessionStorage on initialization
    - _Requirements: 12.3, 19.1, 24.6_

- [x] 5. Service Layer — Soroban, Freighter, and Polling
  - [x] 5.1 Create `services/soroban.ts` with `SorobanService` class
    - Initialize `SorobanRpc.Server` from network config
    - Implement `getContractState()` to read on-chain storage keys and return typed `ContractState`
    - Implement `buildInitializeShipment(params)` to construct unsigned transaction XDR
    - Implement `buildDepositBond(logisticsProvider)` to construct unsigned transaction XDR
    - Implement `buildReportTemperature(oracle, temperature)` to construct unsigned transaction XDR
    - Implement `buildConfirmDelivery(shipper)` to construct unsigned transaction XDR
    - Implement `submitTransaction(signedXdr)` to send to RPC and return result
    - Implement `parseContractError(error)` to extract error code from failed transaction
    - _Requirements: 3.2, 5.2, 7.2, 10.2, 16.1_

  - [x] 5.2 Create `services/freighter.ts` with Freighter wallet wrapper
    - Implement `isFreighterInstalled()` check
    - Implement `connectWallet()` that calls `requestAccess()` and returns public key
    - Implement `signTransaction(xdr, network)` that invokes Freighter signing
    - Implement `disconnectWallet()` cleanup
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 5.3 Create `services/polling.ts` with `PollingService`
    - Implement start/stop polling with configurable interval (default 15s)
    - Implement tab visibility detection (pause on blur, resume on focus)
    - Implement state-diff check to trigger animated updates only when state changes
    - _Requirements: 19.3, 19.4, 19.5_

- [x] 6. Checkpoint — Core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Shared Components
  - [x] 7.1 Create `components/shared/FrostCard.tsx`
    - Implement frosted-glass card wrapper with `backdrop-blur`, arctic-slate background, gradient border (transparent to frost-cyan at 20% opacity)
    - Support `variant` prop for status-colored borders (default, success, warning, error)
    - Apply frost-glow box-shadow on hover
    - _Requirements: 18.1, 18.7, 18.8_

  - [x] 7.2 Create `components/shared/ToastNotification.tsx`
    - Implement toast container with slide-in animation from top-right (Framer Motion `toastEnter` variant)
    - Support three types: success (Mint Green, 4s auto-dismiss), error (Breach Red, 5s+ persistent), warning (Amber, persistent until retry)
    - Include dismiss button and auto-dismiss timer
    - _Requirements: 16.2, 16.3, 16.4, 24.2_

  - [x] 7.3 Create `components/shared/SkeletonLoader.tsx`
    - Implement animated placeholder shapes (rectangle, circle, pipeline-shaped)
    - Use frost-gradient pulse animation for loading state
    - Support configurable width/height for different component placeholders
    - _Requirements: 15.1, 15.2_

  - [x] 7.4 Create `components/shared/TruncatedAddress.tsx`
    - Display truncated Stellar address using `truncateAddress()` utility
    - Include copy-to-clipboard button with toast confirmation
    - Show full address in tooltip on hover
    - _Requirements: 1.2, 20.2, 20.3_

  - [x] 7.5 Create `components/shared/LoadingButton.tsx`
    - Implement button with frost-crystallization loading animation
    - Support disabled state while `isLoading` is true
    - Accept color variant props (primary/frost-cyan, success/mint-green, danger/breach-red)
    - Enforce 44px minimum touch target on mobile viewports
    - _Requirements: 3.7, 7.6, 15.4, 17.3, 24.1_

  - [x] 7.6 Create `components/shared/ContractInfoPanel.tsx`
    - Display contract address, current ShipmentState with color indicator, temperature thresholds (degrees Celsius, 1 decimal), bond amount (USDC, 2 decimals), network badge
    - Display participant addresses (Shipper, Provider, Oracle) with role icons and copy buttons
    - Use FrostCard wrapper with frosted-glass styling
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [x] 8. Layout Components — Navigation and Dashboard Shell
  - [x] 8.1 Create `app/layout.tsx` (RootLayout) with dark mode and global providers
    - Set `<html>` with `dark` class for Tailwind dark mode
    - Apply Dark Navy (#0F1923) background, Ice White (#F1FAEE) text color globally
    - Import globals.css, set up font configuration
    - Wrap children with toast provider context
    - _Requirements: 18.1, 18.2_

  - [x] 8.2 Create `components/layout/NavHeader.tsx` with navigation bar
    - Render OmniCold logo/brand text with frost texture gradient overlay
    - Slot in WalletButton, NetworkSelector, and RoleSwitcher components
    - Apply Deep Arctic Blue (#1B2A4A) background with frost texture
    - Responsive: collapse to hamburger menu on mobile
    - _Requirements: 12.1, 18.3, 18.6_

  - [x] 8.3 Create `components/layout/WalletButton.tsx`
    - Show "Connect Wallet" CTA when disconnected
    - Show truncated address with connection indicator when connected
    - Show disconnect option on click when connected
    - Handle Freighter not-installed state with install link
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 8.4 Create `components/layout/NetworkSelector.tsx`
    - Render toggle between Testnet (Frost Cyan indicator) and Mainnet (Mint Green indicator)
    - Display active network name with visual badge
    - Disable switching while transaction is pending with toast explanation
    - Persist selection to localStorage
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 8.5 Create `components/layout/RoleSwitcher.tsx`
    - Render selectable tabs/pills for Shipper, Provider, Oracle roles
    - Highlight active role with Frost Cyan accent
    - Navigate to corresponding dashboard route on selection
    - Persist selected role to sessionStorage
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 8.6 Create `app/dashboard/layout.tsx` (DashboardLayout)
    - Render NavHeader at top, content area below
    - Guard: redirect to landing page if wallet not connected
    - Provide layout wrapper with responsive padding/margins
    - _Requirements: 1.6, 12.1_

- [x] 9. Landing Page
  - [x] 9.1 Create `components/landing/AuroraBackground.tsx`
    - Implement animated arctic aurora gradient effect using CSS gradients and Framer Motion
    - Cycle through Frost Cyan and Deep Arctic Blue with gentle wave motion
    - Respect `prefers-reduced-motion` (static gradient fallback)
    - _Requirements: 21.2, 24.6_

  - [x] 9.2 Create `components/landing/RoleCards.tsx`
    - Render three frosted cards for Shipper (package icon), Provider (truck icon), Oracle (sensor icon)
    - Each card with brief one-line description of the role
    - Apply FrostCard styling with hover glow effect
    - _Requirements: 21.3_

  - [x] 9.3 Create `components/landing/LandingHero.tsx` and wire `app/page.tsx`
    - Render OmniCold brand identity with ice-crystal logo animation
    - Display cold-chain escrow value proposition headline
    - Render prominent "Connect Wallet" CTA button
    - Integrate AuroraBackground and RoleCards
    - On wallet connect, transition to dashboard with frost-fade animation (500ms)
    - _Requirements: 21.1, 21.3, 21.4_

- [x] 10. Shipment Components
  - [x] 10.1 Create `components/shipment/ShipmentPipeline.tsx`
    - Render four sequential stages (Created, Active, Delivered, Breached) as horizontal progress tracker
    - Display icons per stage: snowflake, thermometer, checkmark, alert triangle
    - Highlight current stage with glowing ring effect; dim future stages with dashed lines
    - Animate state transitions with frost-spread effect (400–600ms) using Framer Motion
    - Display elapsed time since last transition below active node
    - Render sub-labels: "Awaiting Bond", "In Transit", "Delivered", "Breached"
    - Handle each state's unique visual: Created (Frost Cyan pulse), Active (filled gradient + frost particles), Delivered (Mint Green gradient + snowflake-dissolve), Breached (Red + cracked-ice)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 10.2 Create `components/shipment/TemperatureGauge.tsx`
    - Render 270-degree radial arc with open segment at bottom
    - Display current temperature as large numeric center value (°C, 1 decimal from centidegrees)
    - Segment arc into three Color_Zones: Breach Red (outer extremes), Warning Amber (10% buffer), Mint Green (safe)
    - Render threshold markers as tick marks with numeric labels
    - Animate needle with spring physics (stiffness 100, damping 15) styled as frost-blue pointer with glowing tip
    - Implement zone-based center glow: Safe (Mint Green), Warning (Amber pulse 1s), Breach (Red flash 0.5s + bold text)
    - Display trend indicator arrow (up/down/stable) next to reading
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 4.3_

  - [x] 10.3 Create `components/shipment/BondStatusCard.tsx`
    - Display USDC amount (large, 2 decimals) with USDC label and status label (Held/Released/Slashed)
    - Held state: Frost Cyan border + frost-crystal background animation
    - Released state: thaw animation, Mint Green border, checkmark icon, "Bond Released to Provider"
    - Slashed state: crack animation, Breach Red border, slash icon, "Bond Slashed to Shipper", recipient address
    - Display contract address with truncated format + copy button
    - Show timestamp of last status change
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 4.4_

  - [x] 10.4 Create `components/shipment/TransactionHistory.tsx`
    - Render all contract invocations in reverse chronological order
    - Display operation type, invoker address (truncated), timestamp, status (success/failure)
    - Color-code: Mint Green left border for success, Breach Red for failure
    - Link each entry to Stellar Explorer (new tab) using transaction hash and network-specific explorer URL
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 11. Checkpoint — Components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Role Views — Shipper
  - [x] 12.1 Create `components/forms/CreateShipmentForm.tsx`
    - Render input fields: min temperature, max temperature, Logistics Provider address, Oracle address, USDC token address, bond amount
    - Implement client-side validation: minTemp < maxTemp, bondAmount > 0, addresses distinct from connected wallet, valid Stellar addresses
    - Display inline validation errors on fields before submission
    - On valid submit: build `initialize_shipment` TX → sign via Freighter → submit → toast result
    - Show loading state on submit button; disable inputs while pending
    - Handle contract errors: AlreadyInitialized toast
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 12.2 Create `app/dashboard/shipper/page.tsx` (ShipperView)
    - Compose: CreateShipmentForm, ShipmentPipeline, TemperatureGauge, BondStatusCard, ConfirmDeliveryButton, TransactionHistory, ContractInfoPanel
    - Fetch contract state on mount; show SkeletonLoaders during loading
    - Display breach alert banner when state is Breached (Breach Red, temperature, timestamp)
    - Render "Confirm Delivery" button: enabled only when Active, Mint Green, constructs `confirm_delivery` TX
    - Handle contract errors: NotShipper, InvalidState
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 13. Role Views — Logistics Provider
  - [x] 13.1 Create `app/dashboard/provider/page.tsx` (ProviderView)
    - Display pending shipments where state is Created and provider matches connected wallet
    - For each pending shipment: show Shipper address, temp thresholds, bond amount, Oracle address
    - Render "Deposit Bond" button with required amount; on click: build `deposit_bond` TX → sign → submit → toast
    - Show loading state on button; disable while pending
    - Display empty state message when no pending shipments
    - For active shipments: render ShipmentPipeline (Active), TemperatureGauge, BondStatusCard (Held)
    - Handle bond status transitions: Released (Mint Green toast), Slashed (Breach Red alert)
    - Display TransactionHistory with all interactions, timestamps, explorer links
    - Handle contract errors: NotLogisticsProvider, InvalidState
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3_

- [x] 14. Role Views — Oracle
  - [x] 14.1 Create `components/forms/TemperatureInputForm.tsx`
    - Render temperature input field (integer, centidegrees Celsius) with "Report Temperature" submit button
    - On submit: build `report_temperature` TX → sign via Freighter → submit
    - On success (within thresholds): toast confirmation + update TemperatureGauge
    - On success (breach triggered): breach alert banner + pipeline to Breached + slash toast
    - Handle contract errors: NotOracle, InvalidState
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 14.2 Create `app/dashboard/oracle/page.tsx` (OracleView)
    - Compose: TemperatureInputForm, TemperatureGauge, ShipmentPipeline, AuthorizationIndicator, TransactionHistory
    - Display authorization indicator: Mint Green if connected wallet matches stored Oracle, Breach Red if not
    - Display temperature thresholds with numeric labels alongside gauge
    - Animate gauge border with pulsing Amber when reading enters Warning zone
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 15. Hooks Layer
  - [x] 15.1 Create custom hooks: `useWallet`, `useContractState`, `useTransaction`, `usePolling`
    - `useWallet`: wraps walletStore with connect/disconnect/network helpers
    - `useContractState`: wraps contractStore, triggers initial fetch, exposes loading/error
    - `useTransaction`: provides typed transaction submission with loading state and error handling
    - `usePolling`: starts/stops polling based on tab visibility and shipment state (Active = poll, otherwise stop)
    - _Requirements: 1.1, 15.1, 19.2, 19.3, 19.4_

- [x] 16. Animations and Microinteractions
  - [x] 16.1 Implement Framer Motion animation integration across components
    - Apply `frostWipe` variant to role view transitions in DashboardLayout
    - Apply `frostThaw` variant to content reveal after SkeletonLoaders
    - Apply `toastEnter` variant to ToastNotification mount/unmount
    - Apply `crystallize` variant to LoadingButton loading state
    - Apply `bondThaw` and `bondCrack` variants to BondStatusCard transitions
    - Apply `pipelineTransition` variant to ShipmentPipeline state changes
    - Apply `gaugeNeedle` spring variant to TemperatureGauge needle
    - Use Framer Motion `layoutId` for BondStatusCard shared across role views
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

  - [x] 16.2 Implement reduced-motion support
    - Detect `prefers-reduced-motion: reduce` via `useReducedMotion()` hook
    - Disable all Framer Motion animations when reduced motion is preferred
    - Replace animated transitions with instant state changes
    - Store preference in uiStore
    - _Requirements: 24.6_

- [x] 17. Responsive Design
  - [x] 17.1 Implement responsive layouts across all views
    - Mobile (<768px): single-column, ShipmentPipeline vertical, cards full-width, 44px touch targets, 16px min font
    - Tablet (768–1023px): two-column layout, pipeline horizontal, side-by-side cards
    - Desktop (≥1024px): multi-column grid, pipeline full-width span, 3-column grid below
    - NavHeader collapses to hamburger on mobile
    - All interactive elements enforce `min-h-11 min-w-11` on mobile
    - Body text uses `text-base` (16px) minimum on all viewports
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 18. Checkpoint — UI complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Property-Based Tests
  - [x]* 19.1 Write property test for `truncateAddress`
    - **Property 1: Address Truncation Preserves Endpoints**
    - For any valid 56-char Stellar public key starting with 'G', verify output contains first 4 chars + ellipsis + last 4 chars
    - Generator: random 56-char strings matching Stellar address format
    - **Validates: Requirements 1.2**

  - [x]* 19.2 Write property test for network preference persistence
    - **Property 2: Network Preference Persistence Round-Trip**
    - For any network value ('testnet' | 'mainnet'), store to localStorage then read back, verify equality
    - Generator: `fc.constantFrom('testnet', 'mainnet')`
    - **Validates: Requirements 2.4**

  - [x]* 19.3 Write property test for `validateCreateShipmentForm`
    - **Property 3: Create Shipment Form Validation Correctness**
    - For any combination of form inputs, verify rejection iff: minTemp >= maxTemp OR bondAmount <= 0 OR any address equals connected wallet
    - Generator: random integers for temps, random bigints for amount, random address strings
    - **Validates: Requirements 3.3, 3.4, 3.5**

  - [x]* 19.4 Write property test for `classifyTemperatureZone`
    - **Property 4: Temperature Zone Classification**
    - For any temperature and valid threshold pair (min < max), verify zones are mutually exclusive and collectively exhaustive
    - Generator: random integers for temp, constrained pairs where min < max
    - **Validates: Requirements 4.3, 11.1, 22.2**

  - [x]* 19.5 Write property test for `formatUsdcAmount`
    - **Property 5: USDC Bond Amount Formatting**
    - For any non-negative bigint (0 to 999_999_999_999), verify output has 2 decimal places and round-trips correctly
    - Generator: `fc.bigInt(0n, 999_999_999_999n)`
    - **Validates: Requirements 9.2, 23.1**

  - [x]* 19.6 Write property test for `formatElapsedTime`
    - **Property 6: Elapsed Time Formatting**
    - For any timestamp 1s to 365d in the past, verify non-empty output with numeric value + time unit, monotonically non-decreasing
    - Generator: random timestamps in valid range
    - **Validates: Requirements 13.7**

  - [x]* 19.7 Write property test for `mapContractError`
    - **Property 7: Contract Error Code Mapping Completeness**
    - For codes 1–9, verify non-empty non-generic message; for codes outside 1–9, verify generic fallback
    - Generator: `fc.integer()` covering full range
    - **Validates: Requirements 16.1**

  - [x]* 19.8 Write property test for `centidegreesToDisplay`
    - **Property 8: Centidegree to Display Degree Conversion Round-Trip**
    - For any integer centidegree (-10000 to 10000), verify round-trip within ±5 of original
    - Generator: `fc.integer(-10000, 10000)`
    - **Validates: Requirements 22.1**

  - [x]* 19.9 Write property test for `classifyTrend`
    - **Property 9: Temperature Trend Classification**
    - For any two integers, verify: current > previous → 'up', current < previous → 'down', equal → 'stable'
    - Generator: pairs of `fc.integer()`
    - **Validates: Requirements 22.8**

- [x] 20. Integration and Final Polish
  - [x] 20.1 Wire up `app/dashboard/page.tsx` with default role redirect
    - Redirect to `/dashboard/shipper` (or persisted role) when user navigates to `/dashboard`
    - Ensure RoleSwitcher navigation works across all role routes
    - Verify wallet guard redirects unauthenticated users to landing
    - _Requirements: 12.2, 12.3_

  - [x]* 20.2 Write integration tests for full transaction lifecycle
    - Test: build → simulate → sign → submit → re-fetch state flow with mocked Stellar SDK
    - Test: RPC polling starts/stops on tab visibility
    - Test: network switching triggers state re-fetch
    - Test: contract error codes correctly mapped and displayed as toasts
    - _Requirements: 3.2, 5.2, 7.2, 10.2, 16.1, 19.2, 19.3, 19.4_

  - [x]* 20.3 Run accessibility audit
    - Verify WCAG 2.1 AA contrast ratios across all color combinations (4.5:1 normal text, 3:1 large text)
    - Verify keyboard navigation through RoleSwitcher, forms, and action buttons
    - Verify reduced-motion disables all animations
    - Verify touch targets are 44px minimum on mobile
    - _Requirements: 17.3, 18.4, 24.6_

- [x] 21. Final Checkpoint — All features integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementation tasks use TypeScript
- All Soroban contract interaction uses `@stellar/stellar-sdk` and `@stellar/freighter-api`
- The frontend has no backend server — all state comes from on-chain via Soroban RPC

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 8, "tasks": ["12.1", "12.2", "13.1", "14.1", "14.2"] },
    { "id": 9, "tasks": ["15.1"] },
    { "id": 10, "tasks": ["16.1", "16.2", "17.1"] },
    { "id": 11, "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5", "19.6", "19.7", "19.8", "19.9"] },
    { "id": 12, "tasks": ["20.1", "20.2", "20.3"] }
  ]
}
```
