# Requirements Document

## Introduction

OmniCold Frontend Dashboard is a web-based user interface for interacting with the already-deployed OmniCold Soroban escrow smart contract on Stellar. The frontend communicates directly with the on-chain contract via Soroban RPC — no backend server is required. The dashboard provides role-based views for Shippers (pharmaceutical distributors), Logistics Providers (cold-chain carriers), and Oracles (IoT sensor interfaces) to manage the full shipment lifecycle: initialization, bond deposits, temperature monitoring, breach detection, and delivery confirmation.

The UI follows a dark-mode-first arctic aesthetic designed for professionals operating in warehouses, pharmaceutical distribution centers, and cold-chain control rooms. The visual language evokes ice, frost, and subzero environments through a Deep Arctic Blue and Frost Cyan palette, reinforcing the cold-chain domain at every interaction point. Real-time state visualization with animated transitions provides immediate situational awareness, while Freighter wallet integration enables secure on-chain transaction signing without exposing private keys.

## Glossary

- **Dashboard**: The OmniCold Frontend web application built with Next.js 14 that provides role-based interfaces for interacting with the OmniCold smart contract
- **Shipper_View**: The Dashboard interface presented to Shipper users for creating shipments, monitoring active cargo, confirming delivery, and viewing breach alerts
- **Provider_View**: The Dashboard interface presented to Logistics Provider users for viewing pending shipments, depositing bonds, monitoring shipments in transit, and tracking bond status
- **Oracle_View**: The Dashboard interface presented to Oracle users for reporting temperature readings, viewing live temperature feeds, and monitoring breach detection status
- **Wallet_Connection**: A session established between the Dashboard and the Freighter browser extension that provides the connected Stellar address and transaction signing capability
- **Freighter**: A Stellar wallet browser extension that manages private keys and signs Soroban transactions on behalf of the user
- **Shipment_Pipeline**: A horizontal progress tracker UI component that visualizes the shipment lifecycle states (Created, Active, Delivered, Breached) as a sequential pipeline
- **Temperature_Gauge**: A radial gauge UI component that displays the current temperature reading relative to the configured minimum and maximum thresholds with color-coded zones
- **Bond_Status_Card**: A card UI component that displays the escrowed USDC amount, current bond status (Held, Released, Slashed), and animated state transitions
- **Transaction_History**: A timeline UI component that displays all contract interactions for a shipment with links to Stellar transaction records
- **Role_Switcher**: A top-level navigation component that allows users to switch between Shipper_View, Provider_View, and Oracle_View
- **Toast_Notification**: A transient message overlay that provides success or failure feedback for user-initiated transactions
- **Skeleton_Loader**: A placeholder animation displayed in place of content while data is being fetched from the Stellar network
- **Network_Selector**: A toggle component that switches the Dashboard connection between Stellar Testnet and Mainnet
- **Contract_State**: The current on-chain state of the OmniCold smart contract including Shipment_State, participant addresses, temperature thresholds, and bond amount
- **Color_Zone**: A visual region on the Temperature_Gauge classified as Safe (Mint Green), Warning (Amber), or Breach (Red) based on proximity to temperature thresholds
- **Arctic_Theme**: The Dashboard color palette built around Deep Arctic Blue (#1B2A4A), Frost Cyan (#00D4FF), Dark Navy (#0F1923), and Ice White (#F1FAEE) with dark-mode-first design, frosted-glass card effects, and ice-inspired microinteractions
- **Landing_Page**: The initial view displayed to unauthenticated users featuring the OmniCold brand identity, value proposition, and wallet connect call-to-action
- **Frost_Animation**: A family of ice-themed motion effects (crystallization, thaw, dissolve, frost-spread) implemented with Framer Motion to reinforce the cold-chain visual identity during state transitions

## Requirements

### Requirement 1: Wallet Connection and Authentication

**User Story:** As a user, I want to connect my Freighter wallet to the Dashboard, so that I can authenticate my Stellar identity and sign transactions for contract interactions.

#### Acceptance Criteria

1. WHEN the user clicks the wallet connect button, THE Dashboard SHALL invoke the Freighter API to request wallet connection and display the connected Stellar public address upon successful authorization
2. WHEN the Freighter wallet is connected, THE Dashboard SHALL display the truncated public address (first 4 and last 4 characters) in the navigation header with a visual connection indicator
3. WHEN the user clicks the disconnect button, THE Dashboard SHALL terminate the Freighter session, clear the stored address from application state, and return the UI to the unauthenticated state
4. IF the Freighter extension is not installed in the browser, THEN THE Dashboard SHALL display a message directing the user to install the Freighter extension with a link to the official download page
5. IF the Freighter connection request is rejected by the user, THEN THE Dashboard SHALL display a Toast_Notification indicating that wallet connection was denied and remain in the unauthenticated state
6. WHILE no wallet is connected, THE Dashboard SHALL disable all transaction-initiating buttons and display a prompt to connect a wallet before interacting with the contract

### Requirement 2: Network Selection

**User Story:** As a user, I want to switch between Stellar Testnet and Mainnet, so that I can test interactions on Testnet before executing on Mainnet.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Network_Selector toggle in the navigation header that allows switching between Stellar Testnet and Mainnet
2. WHEN the user switches the network, THE Dashboard SHALL update the Soroban RPC endpoint, re-fetch all Contract_State from the selected network, and display the active network name with a distinct visual indicator (Frost Cyan for Testnet, Mint Green for Mainnet)
3. IF the user switches the network while a transaction is pending, THEN THE Dashboard SHALL block the network switch and display a Toast_Notification indicating that the network cannot be changed during an active transaction
4. THE Dashboard SHALL persist the selected network preference in browser local storage and restore the selection on subsequent page loads

### Requirement 3: Shipper — Create New Shipment

**User Story:** As a Shipper, I want to create a new shipment by specifying temperature thresholds, selecting a Logistics Provider, designating an Oracle, and defining a bond amount, so that the contract enforces cold-chain compliance for my cargo.

#### Acceptance Criteria

1. WHEN the Shipper navigates to the create shipment form in Shipper_View, THE Dashboard SHALL display input fields for minimum temperature (integer, centidegrees Celsius), maximum temperature (integer, centidegrees Celsius), Logistics_Provider Stellar address, Oracle Stellar address, USDC token contract address, and bond amount (USDC)
2. WHEN the Shipper submits the create shipment form with valid inputs, THE Dashboard SHALL construct the `initialize_shipment` Soroban transaction, invoke Freighter for signing, submit the signed transaction to the Stellar network, and display a Toast_Notification with the transaction result
3. IF the minimum temperature input is greater than or equal to the maximum temperature input, THEN THE Dashboard SHALL display an inline validation error on the temperature fields before submission and prevent form submission
4. IF the bond amount input is less than or equal to zero, THEN THE Dashboard SHALL display an inline validation error on the bond amount field before submission and prevent form submission
5. IF the Logistics_Provider address or Oracle address matches the connected Shipper wallet address, THEN THE Dashboard SHALL display an inline validation error indicating that participant addresses must be distinct
6. IF the contract returns an AlreadyInitialized error after transaction submission, THEN THE Dashboard SHALL display a Toast_Notification informing the Shipper that a shipment already exists for this contract instance
7. WHILE the transaction is being submitted and confirmed, THE Dashboard SHALL display a loading indicator on the submit button and disable form inputs until the transaction resolves

### Requirement 4: Shipper — Monitor Active Shipments

**User Story:** As a Shipper, I want to monitor my active shipments with live temperature readings and state visualization, so that I can track cold-chain compliance in real time.

#### Acceptance Criteria

1. WHEN the Shipper opens the Shipper_View dashboard, THE Dashboard SHALL fetch the current Contract_State from the Soroban RPC and display the Shipment_Pipeline showing the current Shipment_State (Created, Active, Delivered, or Breached) as the highlighted stage
2. WHEN the Contract_State indicates a Shipment_State of Active, THE Dashboard SHALL display the Temperature_Gauge component showing the last reported temperature reading relative to the configured minimum and maximum thresholds
3. THE Temperature_Gauge SHALL render three Color_Zones: Safe zone (Mint Green #2EC4B6) for readings within thresholds, Warning zone (Amber #FF9F1C) for readings within 10% of a threshold boundary, and Breach zone (Red #E63946) for readings outside thresholds
4. THE Dashboard SHALL display the Bond_Status_Card showing the escrowed USDC amount, current bond status (Held while Active, Released when Delivered, Slashed when Breached), and the Logistics_Provider address
5. WHEN the Shipment_State transitions from Active to Breached, THE Dashboard SHALL display a breach alert banner with the Breach Red (#E63946) color, the breaching temperature reading, and the timestamp of the breach event

### Requirement 5: Shipper — Confirm Delivery

**User Story:** As a Shipper, I want to confirm successful delivery with a single action, so that the Logistics Provider bond is released and the shipment lifecycle completes.

#### Acceptance Criteria

1. WHILE the Shipment_State is Active, THE Dashboard SHALL display a "Confirm Delivery" button in the Shipper_View that is enabled and visually prominent (Mint Green #2EC4B6 background)
2. WHEN the Shipper clicks the "Confirm Delivery" button, THE Dashboard SHALL construct the `confirm_delivery` Soroban transaction, invoke Freighter for signing, and submit the signed transaction to the Stellar network
3. WHEN the `confirm_delivery` transaction succeeds, THE Dashboard SHALL update the Shipment_Pipeline to show the Delivered state, transition the Bond_Status_Card to Released status with a success animation, and display a Toast_Notification confirming delivery
4. IF the contract returns a NotShipper error, THEN THE Dashboard SHALL display a Toast_Notification indicating that only the designated Shipper can confirm delivery
5. IF the contract returns an InvalidState error, THEN THE Dashboard SHALL display a Toast_Notification indicating that the shipment is not in a deliverable state
6. WHILE the Shipment_State is not Active, THE Dashboard SHALL disable the "Confirm Delivery" button and display a tooltip explaining that delivery confirmation is only available for active shipments

### Requirement 6: Logistics Provider — View Pending Shipments

**User Story:** As a Logistics Provider, I want to view shipments awaiting my bond deposit, so that I can identify which contracts require my action.

#### Acceptance Criteria

1. WHEN the Logistics Provider opens the Provider_View, THE Dashboard SHALL query the Contract_State and display any shipment where the Shipment_State is Created and the stored Logistics_Provider address matches the connected wallet address
2. THE Dashboard SHALL display each pending shipment with the following details: Shipper address, minimum and maximum temperature thresholds, required bond amount in USDC, and Oracle address
3. IF no pending shipments exist for the connected wallet address, THEN THE Dashboard SHALL display an empty state message indicating that no shipments are awaiting bond deposit

### Requirement 7: Logistics Provider — Deposit Bond

**User Story:** As a Logistics Provider, I want to deposit my USDC bond into the contract escrow with a single action, so that the shipment becomes active and transit can begin.

#### Acceptance Criteria

1. WHEN the Logistics Provider views a pending shipment in Provider_View, THE Dashboard SHALL display a "Deposit Bond" button alongside the required bond amount in USDC
2. WHEN the Logistics Provider clicks the "Deposit Bond" button, THE Dashboard SHALL construct the `deposit_bond` Soroban transaction, invoke Freighter for signing, and submit the signed transaction to the Stellar network
3. WHEN the `deposit_bond` transaction succeeds, THE Dashboard SHALL update the Shipment_Pipeline to show the Active state, transition the Bond_Status_Card to Held status, and display a Toast_Notification confirming the bond deposit
4. IF the contract returns a NotLogisticsProvider error, THEN THE Dashboard SHALL display a Toast_Notification indicating that only the designated Logistics Provider can deposit the bond
5. IF the contract returns an InvalidState error, THEN THE Dashboard SHALL display a Toast_Notification indicating that the shipment is not in the correct state for bond deposit
6. WHILE the transaction is being submitted, THE Dashboard SHALL display a loading indicator on the "Deposit Bond" button and disable the button until the transaction resolves

### Requirement 8: Logistics Provider — Monitor Active Shipments

**User Story:** As a Logistics Provider, I want to monitor my active shipments showing current temperature and time in transit, so that I can verify cold-chain compliance during transport.

#### Acceptance Criteria

1. WHEN the Logistics Provider opens Provider_View with an active shipment, THE Dashboard SHALL display the Shipment_Pipeline showing the Active state, the Temperature_Gauge with the last reported reading, and the temperature thresholds
2. THE Dashboard SHALL display the bond amount currently held in escrow on the Bond_Status_Card with USDC denomination and the contract address holding the funds
3. WHEN the Shipment_State transitions to Delivered, THE Dashboard SHALL update the Bond_Status_Card to Released status with a Mint Green (#2EC4B6) success indicator and display a Toast_Notification confirming bond release
4. WHEN the Shipment_State transitions to Breached, THE Dashboard SHALL update the Bond_Status_Card to Slashed status with a Breach Red (#E63946) indicator and display a breach alert with the offending temperature reading

### Requirement 9: Logistics Provider — Track Bond Status and History

**User Story:** As a Logistics Provider, I want to track my bond status and view historical performance, so that I can manage my financial exposure and demonstrate my track record.

#### Acceptance Criteria

1. THE Dashboard SHALL display the Bond_Status_Card in Provider_View showing one of three states: Held (bond in escrow, Frost Cyan indicator), Released (bond returned after delivery, Mint Green indicator), or Slashed (bond transferred to Shipper, Breach Red indicator)
2. THE Dashboard SHALL display the USDC bond amount with proper decimal formatting on the Bond_Status_Card
3. THE Dashboard SHALL display a Transaction_History component in Provider_View showing all contract interactions (bond deposit, temperature reports, delivery confirmation or breach) with timestamps and links to Stellar Explorer transaction pages

### Requirement 10: Oracle — Report Temperature

**User Story:** As an Oracle operator, I want to manually submit temperature readings to the contract, so that I can report sensor data or perform testing overrides.

#### Acceptance Criteria

1. WHEN the Oracle user opens Oracle_View, THE Dashboard SHALL display a temperature input field (integer, centidegrees Celsius) and a "Report Temperature" submit button
2. WHEN the Oracle submits a temperature reading, THE Dashboard SHALL construct the `report_temperature` Soroban transaction with the provided temperature value, invoke Freighter for signing, and submit the signed transaction to the Stellar network
3. WHEN the `report_temperature` transaction succeeds and the reading is within thresholds, THE Dashboard SHALL display a Toast_Notification confirming the reading was accepted and update the Temperature_Gauge to reflect the new value
4. WHEN the `report_temperature` transaction succeeds and the reading triggers a breach, THE Dashboard SHALL display a breach alert banner with the Breach Red color, update the Shipment_Pipeline to Breached state, and display a Toast_Notification indicating that slashing was triggered
5. IF the contract returns a NotOracle error, THEN THE Dashboard SHALL display a Toast_Notification indicating that the connected wallet is not the authorized Oracle for this shipment
6. IF the contract returns an InvalidState error, THEN THE Dashboard SHALL display a Toast_Notification indicating that temperature reporting is only permitted while the shipment is Active

### Requirement 11: Oracle — Live Feed and Breach Detection Display

**User Story:** As an Oracle operator, I want to see a live temperature feed and breach detection indicator, so that I can monitor sensor output and verify correct oracle authorization.

#### Acceptance Criteria

1. WHEN the Oracle user opens Oracle_View with an active shipment, THE Dashboard SHALL display the Temperature_Gauge with the last reported reading, the configured thresholds, and Color_Zones indicating safe, warning, and breach regions
2. THE Dashboard SHALL display a connection status indicator in Oracle_View showing whether the connected wallet address matches the stored Oracle address for the current contract (authorized: Mint Green indicator, unauthorized: Breach Red indicator)
3. THE Dashboard SHALL display the minimum and maximum temperature thresholds alongside the Temperature_Gauge with clear numeric labels in centidegrees Celsius
4. WHEN the Temperature_Gauge reading enters the Warning Color_Zone (within 10% of threshold boundary), THE Dashboard SHALL animate the gauge border with a pulsing Amber (#FF9F1C) effect

### Requirement 12: Role-Based Navigation

**User Story:** As a user, I want to switch between role-specific views, so that I can access the interface relevant to my participation in the shipment.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Role_Switcher component in the top-level navigation that provides selectable options for Shipper_View, Provider_View, and Oracle_View
2. WHEN the user selects a role from the Role_Switcher, THE Dashboard SHALL render the corresponding view with role-specific components, re-fetch Contract_State relevant to that role, and highlight the active role in the navigation
3. THE Dashboard SHALL persist the selected role in browser session storage and restore the selection on page refresh within the same session
4. THE Dashboard SHALL allow any connected wallet to access any role view without restriction, enabling users who participate in multiple roles to switch freely

### Requirement 13: Shipment Pipeline Visualization

**User Story:** As a user, I want to see the shipment lifecycle as a visual pipeline, so that I can immediately understand the current state and progression of the shipment.

#### Acceptance Criteria

1. THE Shipment_Pipeline SHALL render four sequential stages (Created, Active, Delivered, Breached) as a horizontal progress tracker with connected nodes, where each node displays an icon (snowflake for Created, thermometer for Active, checkmark for Delivered, alert triangle for Breached) and the current stage is visually highlighted with a glowing ring effect
2. WHEN the Shipment_State is Created, THE Shipment_Pipeline SHALL highlight the Created node with a Frost Cyan (#00D4FF) glow and pulsing animation, show connecting lines to subsequent stages as dimmed dashed lines (Cool Gray #94A3B8), and display "Awaiting Bond" as a sub-label
3. WHEN the Shipment_State is Active, THE Shipment_Pipeline SHALL highlight Created and Active nodes with solid Frost Cyan, render the connecting line between them as a filled gradient, show a pulsing frost particle animation along the active segment, and display "In Transit" as a sub-label on the Active node
4. WHEN the Shipment_State is Delivered, THE Shipment_Pipeline SHALL highlight the Created, Active, and Delivered nodes with Mint Green (#2EC4B6), render all connecting lines as solid green gradients, and display a brief snowflake-dissolve celebration animation on completion
5. WHEN the Shipment_State is Breached, THE Shipment_Pipeline SHALL highlight Created and Active with Frost Cyan, the Breached node with Breach Red (#E63946) and a cracked-ice visual effect, and render the Active-to-Breached connection with a red gradient line
6. WHEN the Shipment_State transitions between states, THE Shipment_Pipeline SHALL animate the transition using Framer Motion with a frost-spreading effect along the connecting line lasting between 400ms and 600ms
7. THE Shipment_Pipeline SHALL display elapsed time since the last state transition below the current active node in a human-readable format (e.g., "2h 34m in transit")

### Requirement 14: Transaction History and Explorer Links

**User Story:** As a user, I want to view a timeline of all contract interactions with links to Stellar Explorer, so that I can audit the on-chain history of the shipment.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Transaction_History component showing all contract invocations for the current shipment in reverse chronological order
2. THE Transaction_History SHALL display for each entry: the operation type (Initialize, Deposit Bond, Report Temperature, Confirm Delivery, Breach Slash), the invoking address (truncated), the timestamp, and the transaction status (success or failure)
3. WHEN the user clicks a transaction entry in the Transaction_History, THE Dashboard SHALL open the corresponding transaction page on Stellar Expert or StellarChain explorer in a new browser tab using the transaction hash
4. THE Transaction_History SHALL visually distinguish successful transactions (Mint Green left border) from failed transactions (Breach Red left border)

### Requirement 15: Loading States and Data Fetching

**User Story:** As a user, I want to see loading indicators while blockchain data is being fetched, so that I understand the Dashboard is working and not stalled.

#### Acceptance Criteria

1. WHILE the Dashboard is fetching Contract_State from the Soroban RPC endpoint, THE Dashboard SHALL display Skeleton_Loader animations in place of the Shipment_Pipeline, Bond_Status_Card, Temperature_Gauge, and Transaction_History components
2. WHEN a Contract_State fetch completes successfully, THE Dashboard SHALL replace all Skeleton_Loaders with the populated components using a fade-in transition
3. IF a Contract_State fetch fails due to network error or RPC unavailability, THEN THE Dashboard SHALL display an error state with a descriptive message and a "Retry" button that re-initiates the fetch
4. WHILE a user-initiated transaction is pending confirmation on the Stellar network, THE Dashboard SHALL display a loading spinner on the action button that initiated the transaction and disable all other transaction buttons until resolution

### Requirement 16: Error Handling and User Feedback

**User Story:** As a user, I want to receive clear, understandable error messages when contract interactions fail, so that I can diagnose issues and take corrective action.

#### Acceptance Criteria

1. WHEN a Soroban transaction returns a contract error, THE Dashboard SHALL map the numeric error code to a human-readable message: AlreadyInitialized (1) → "A shipment has already been created for this contract", InvalidTempRange (2) → "Minimum temperature must be less than maximum temperature", InvalidBondAmount (3) → "Bond amount must be greater than zero", DuplicateParticipant (4) → "All participant addresses must be unique", NotLogisticsProvider (5) → "Only the designated Logistics Provider can perform this action", NotOracle (6) → "Only the authorized Oracle can report temperatures", NotShipper (7) → "Only the Shipper can confirm delivery", InvalidState (8) → "This action is not available in the current shipment state", TransferFailed (9) → "USDC transfer failed — check balance and allowance"
2. THE Dashboard SHALL display all error messages as Toast_Notifications with the Breach Red (#E63946) color scheme, persisting for a minimum of 5 seconds or until manually dismissed by the user
3. THE Dashboard SHALL display all success messages as Toast_Notifications with the Mint Green (#2EC4B6) color scheme, auto-dismissing after 4 seconds
4. IF a transaction fails due to a network timeout or RPC connection error, THEN THE Dashboard SHALL display a Toast_Notification with the Warning Amber (#FF9F1C) color indicating a network issue and suggesting the user retry

### Requirement 17: Responsive Design

**User Story:** As a field operator, I want to use the Dashboard on mobile devices, so that I can monitor shipments and perform actions from warehouse floors and loading docks.

#### Acceptance Criteria

1. THE Dashboard SHALL render all views in a single-column layout on viewport widths below 768px, stacking the Shipment_Pipeline vertically, and displaying the Temperature_Gauge, Bond_Status_Card, and Transaction_History as full-width cards
2. THE Dashboard SHALL render all views in a multi-column layout on viewport widths at or above 1024px, with the Shipment_Pipeline spanning full width and the Temperature_Gauge, Bond_Status_Card, and action panels arranged in a grid
3. THE Dashboard SHALL ensure all interactive elements (buttons, inputs, toggle switches) have a minimum touch target size of 44x44 CSS pixels on viewports below 768px
4. THE Dashboard SHALL maintain text legibility with a minimum font size of 16px for body text on all viewport sizes to prevent browser zoom on mobile input focus

### Requirement 18: Visual Theme and Color System

**User Story:** As a user working in a warehouse or control room, I want a dark-mode interface with a cold-chain arctic color theme, so that the Dashboard reduces eye strain and visually reinforces the cold-chain domain context.

#### Acceptance Criteria

1. THE Dashboard SHALL use Dark Navy (#0F1923) as the primary background color and Slate (#1E293B) as the surface color for cards and panels across all views, with subtle frosted-glass (backdrop-blur) effects on elevated card surfaces to create depth
2. THE Dashboard SHALL use Ice White (#F1FAEE) as the primary text color and Cool Gray (#94A3B8) as the secondary text color for supplementary information
3. THE Dashboard SHALL apply the Arctic_Theme color palette consistently: Deep Arctic Blue (#1B2A4A) for navigation and headers, Frost Cyan (#00D4FF) for active states and primary interactive elements, Warning Amber (#FF9F1C) for warning indicators, Breach Red (#E63946) for error states and breach alerts, and Mint Green (#2EC4B6) for success states
4. THE Dashboard SHALL ensure all text and interactive elements meet WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for normal text, 3:1 for large text) against their background colors
5. THE Dashboard SHALL implement all color values using Tailwind CSS custom theme configuration with semantic naming (e.g., `bg-arctic-navy`, `text-frost-white`, `border-frost-cyan`, `accent-breach-red`)
6. THE Dashboard SHALL apply a subtle frost/ice texture gradient overlay on the navigation header area to reinforce the cold-chain branding
7. THE Dashboard SHALL use Frost Cyan (#00D4FF) drop shadows with low opacity (10-15%) on interactive cards on hover to create a cold-glow effect
8. THE Dashboard SHALL render all card borders with a 1px border using a gradient from transparent to Frost Cyan at 20% opacity, creating a subtle icy edge appearance

### Requirement 21: Landing Page and Onboarding

**User Story:** As a first-time user, I want a visually striking landing page that communicates the OmniCold value proposition, so that I understand what the platform does and feel confident connecting my wallet.

#### Acceptance Criteria

1. WHILE no wallet is connected, THE Dashboard SHALL display a landing page featuring the OmniCold brand identity with an animated ice-crystal logo, a headline communicating the cold-chain escrow value proposition, and a prominent "Connect Wallet" call-to-action button
2. THE landing page SHALL display an animated arctic aurora background effect using CSS gradients and Framer Motion, cycling through Frost Cyan and Deep Arctic Blue with gentle wave motion
3. THE landing page SHALL include a visual overview section showing the three user roles (Shipper, Provider, Oracle) as frosted cards with iconography (package icon, truck icon, sensor icon) and brief one-line descriptions
4. WHEN the user connects a wallet from the landing page, THE Dashboard SHALL transition to the role selection view with a smooth frost-fade animation lasting 500ms

### Requirement 22: Temperature Gauge Detailed Design

**User Story:** As a user monitoring cold-chain compliance, I want a visually rich temperature gauge that immediately communicates safety status through color and motion, so that I can assess compliance at a glance without reading numeric values.

#### Acceptance Criteria

1. THE Temperature_Gauge SHALL render as a 270-degree radial arc with the open segment at the bottom, displaying the current temperature as a large numeric value in the center with "°C" unit label (converted from centidegrees to degrees with one decimal place)
2. THE Temperature_Gauge arc SHALL be segmented into three Color_Zones with smooth gradients: Breach Red (#E63946) for the outer extremes beyond thresholds, Warning Amber (#FF9F1C) for a 10% buffer zone approaching each threshold, and Mint Green (#2EC4B6) for the safe zone between thresholds
3. THE Temperature_Gauge SHALL render threshold markers as tick marks on the arc at the minimum and maximum temperature positions, with numeric labels showing the threshold values
4. THE Temperature_Gauge needle SHALL be styled as a frost-blue (#00D4FF) pointer with a glowing tip effect, animating smoothly to new positions using spring physics (Framer Motion spring with stiffness 100, damping 15)
5. WHEN the temperature reading is in the Safe zone, THE Temperature_Gauge center background SHALL display a subtle Mint Green radial glow
6. WHEN the temperature reading is in the Warning zone, THE Temperature_Gauge center background SHALL pulse with Warning Amber at 1-second intervals
7. WHEN the temperature reading is in the Breach zone, THE Temperature_Gauge center background SHALL flash Breach Red with a rapid 0.5-second pulse and the numeric value SHALL increase in font weight to bold
8. THE Temperature_Gauge SHALL display a small trend indicator arrow (up/down/stable) next to the numeric reading showing the direction of temperature change compared to the previous reading

### Requirement 23: Bond Status Card Detailed Design

**User Story:** As a user with financial exposure in the escrow, I want the bond status card to prominently display the USDC amount with clear visual states, so that I always know the disposition of the escrowed funds.

#### Acceptance Criteria

1. THE Bond_Status_Card SHALL display the USDC amount as a large numeric value with proper decimal formatting (2 decimal places), a USDC icon/label, and the equivalent status label (Held, Released, Slashed)
2. WHILE the bond status is Held, THE Bond_Status_Card SHALL display a Frost Cyan (#00D4FF) border accent and a subtle frost-crystal animation in the card background indicating funds are frozen in escrow
3. WHEN the bond status transitions to Released, THE Bond_Status_Card SHALL animate a thaw effect (frost crystals dissolving) transitioning the border to Mint Green (#2EC4B6), and display a checkmark icon with the label "Bond Released to Provider"
4. WHEN the bond status transitions to Slashed, THE Bond_Status_Card SHALL animate a crack effect on the card surface transitioning the border to Breach Red (#E63946), display a slash icon with the label "Bond Slashed to Shipper", and show the recipient address
5. THE Bond_Status_Card SHALL display the contract address holding the escrowed funds as a truncated address with a copy-to-clipboard button
6. THE Bond_Status_Card SHALL include a small status history showing the timestamp of the last status change

### Requirement 24: Animated Microinteractions

**User Story:** As a user, I want smooth, purposeful animations throughout the interface, so that state changes are immediately visible and the interface feels responsive and polished.

#### Acceptance Criteria

1. WHEN a transaction is submitted for signing, THE Dashboard SHALL animate the action button with a frost-crystallization loading effect (Frost Cyan particles converging) replacing the standard spinner
2. WHEN a Toast_Notification appears, THE Dashboard SHALL animate it sliding in from the top-right with a frost-trail effect and fading out with a dissolve on dismissal
3. WHEN the user switches roles via the Role_Switcher, THE Dashboard SHALL animate the view transition with a horizontal frost-wipe effect lasting 300ms
4. WHEN data loads after a Skeleton_Loader, THE Dashboard SHALL reveal content with a frost-thaw animation (content appearing as if ice is melting away) lasting 400ms
5. THE Dashboard SHALL use Framer Motion `layoutId` for shared elements (like the Bond_Status_Card) that persist across role views, enabling smooth position animations when switching contexts
6. THE Dashboard SHALL limit all animations to `prefers-reduced-motion: no-preference` and disable animations for users who have enabled reduced motion in their operating system accessibility settings

### Requirement 19: State Management and Data Synchronization

**User Story:** As a user, I want the Dashboard to maintain consistent state across all components and automatically reflect on-chain changes, so that I always see accurate, up-to-date shipment information.

#### Acceptance Criteria

1. THE Dashboard SHALL use Zustand as the global state management library with separate stores for wallet connection state, contract state, and UI preferences
2. WHEN any transaction is successfully submitted and confirmed, THE Dashboard SHALL automatically re-fetch the full Contract_State from the Soroban RPC and update all displayed components to reflect the new on-chain state
3. THE Dashboard SHALL poll the Soroban RPC endpoint for Contract_State updates at a maximum interval of 15 seconds while the user has the Dashboard tab focused and a shipment is in Active state
4. WHEN the browser tab loses focus, THE Dashboard SHALL pause RPC polling and resume polling when the tab regains focus to conserve network resources
5. IF the fetched Contract_State differs from the locally cached state, THEN THE Dashboard SHALL update the UI with animated transitions on all affected components (Shipment_Pipeline, Bond_Status_Card, Temperature_Gauge)

### Requirement 20: Contract Status Display

**User Story:** As a user, I want to see the current contract status at a glance including all participants and configuration, so that I can verify I am interacting with the correct shipment contract.

#### Acceptance Criteria

1. THE Dashboard SHALL display a contract information panel styled as a frosted-glass card showing the contract address, current Shipment_State (with matching color indicator), configured temperature thresholds (min and max displayed in degrees Celsius with one decimal), bond amount in USDC, and the active Stellar network (Testnet or Mainnet) badge
2. THE Dashboard SHALL display all participant addresses (Shipper, Logistics_Provider, Oracle) in the contract information panel as labeled rows, each with truncated format (first 4 and last 4 characters), a role icon (package, truck, sensor), and a copy-to-clipboard button
3. WHEN the user clicks a participant address copy button, THE Dashboard SHALL copy the full untruncated Stellar address to the clipboard and display a brief Toast_Notification confirming the copy action
4. THE contract information panel SHALL display the contract deployment network with a visual badge (Frost Cyan background for Testnet with "TEST" label, Mint Green background for Mainnet with "LIVE" label)
