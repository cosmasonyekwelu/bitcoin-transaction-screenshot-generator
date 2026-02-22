# BTC Transaction Screenshot Generator - Codebase Documentation

This document provides a comprehensive blueprint for rewriting the BTC Transaction Screenshot Generator application in TypeScript, following best security practices and preserving the original visual appearance and functionality.

---

## 1. Project Overview
- **Purpose**: A single-page React application that allows users to explore Bitcoin addresses, view transaction details, and generate pixel-perfect mobile-style screenshots of those transactions. It also features a transaction rebroadcast (acceleration) tool.
- **Tech Stack**:
  - **Framework**: React 19
  - **Build Tool**: Vite 7
  - **Styling**: Tailwind CSS 3
  - **HTTP Client**: Axios
  - **Image Generation**: html-to-image
- **Key Dependencies**:
  - `react`: `^19.2.3`
  - `react-dom`: `^19.2.3`
  - `axios`: `^1.13.2`
  - `html-to-image`: `^1.11.13`
  - `@vitejs/plugin-react`: `^5.1.2`
  - `tailwindcss`: `^3.4.10`

---

## 2. Project Structure
```
.
├── src/
│   ├── components/
│   │   ├── acceleration/
│   │   │   ├── AccelerationForm.jsx      # Form for rebroadcasting TXs
│   │   │   └── AccelerationHistory.jsx   # List of recent rebroadcasts
│   │   ├── address/
│   │   │   ├── AddressInput.jsx          # Address entry and fetching
│   │   │   ├── AddressSummary.jsx        # High-level address statistics
│   │   │   └── TransactionSelector.jsx   # Select from recent transactions
│   │   ├── common/
│   │   │   ├── ErrorBoundary.jsx         # Global error handling
│   │   │   └── Toasts.jsx                # Notification system
│   │   ├── layout/
│   │   │   └── Header.jsx                # Main navigation and selectors
│   │   └── preview/
│   │       ├── DeviceFrame.jsx           # Mobile device wrapper (iPhone/Samsung)
│   │       ├── StatusBar.jsx             # Mock mobile status bar
│   │       └── TransactionPreview.jsx    # Visual TX details for screenshot
│   ├── constants/
│   │   └── apiConfig.js                  # Global axios configuration
│   ├── hooks/
│   │   ├── useRateLimit.js               # Throttle API calls
│   │   └── useToasts.js                  # Manage notification state
│   ├── services/
│   │   ├── blockchainApi.js              # blockchain.info interactions
│   │   ├── mempoolApi.js                 # mempool.space interactions
│   │   └── broadcastService.js           # Multi-endpoint broadcast logic
│   ├── utils/
│   │   ├── dateUtils.js                  # Time and date formatting
│   │   ├── errorHelpers.js               # User-friendly error mapping
│   │   ├── formatters.js                 # Currency and string formatting
│   │   └── validators.js                 # BTC address and TXID regex
│   ├── App.jsx                           # Core logic and state management
│   ├── index.css                         # Tailwind imports and global styles
│   └── main.jsx                          # Application entry point
├── public/                               # Static assets (if any)
├── index.html                            # Root HTML template
├── package.json                          # Dependencies and scripts
├── tailwind.config.js                    # Tailwind configuration
└── vite.config.js                        # Vite configuration
```

---

## 3. Styling and Assets
- **Styling Methodology**: Tailwind CSS utility classes are used exclusively.
- **Global Styles**: Defined in `src/index.css`. Includes standard `@tailwind` directives and sets `color-scheme: dark`.
- **Theme**: Dark mode by default. Neutral-950 background, Neutral-100 text.
- **Responsive Design**: Uses Tailwind's responsive prefixes (e.g., `md:`, `lg:`). The layout transitions from a single column on mobile to a two-column grid on large screens.
- **Assets**:
  - `favicon.svg`: Main application icon.
  - Icons: Minimal usage of Unicode characters (₿, ↓, ↗, ✕) styled with Tailwind.
- **Fonts**: Default system sans-serif stack as per Tailwind's configuration.

---

## 4. Component Architecture

### Reusable Components
| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `ErrorBoundary` | Catches runtime errors in the component tree. | `children` |
| `Toasts` | Displays temporary status messages. | `toasts` (Array), `onClose` (Function) |
| `DeviceFrame` | Renders a mobile frame around children. | `device` ('iphone' \| 'galaxy'), `children` |
| `StatusBar` | Renders a fake mobile status bar. | `device` ('iphone' \| 'galaxy') |
| `AccelerationForm` | Interface for rebroadcasting a TX. | `txid`, `currentFeeRate`, `onAccelerate`, `onCancel`, `addToast` |
| `AccelerationHistory` | Displays a list of previous rebroadcast attempts. | `accelerations` (Array) |
| `AddressInput` | Form for entering a BTC address and initiating data fetch. | `address`, `setAddress`, `copyAddress`, `fetchAddressTxs`, `loading`, `error` |
| `AddressSummary` | Displays balance, received, and sent statistics for the address. | `address`, `summary`, `addrLoading`, `addrError`, `balanceUsd`, `receivedUsd`, `sentUsd` |
| `TransactionSelector` | Dropdown to choose a transaction from the filtered list. | `filteredTxs`, `loading`, `selectedTxid`, `setSelectedTxid` |
| `Header` | Main application header with device and filter selectors. | `device`, `setDevice`, `filterMode`, `setFilterMode` |
| `TransactionPreview` | The core visual representation of the BTC transaction. | `view`, `TARGET_CONF`, `copyTxid`, `addToast` |

### Page-Level Logic (`App.jsx`)
- **State Management**:
  - `address`: Current BTC address.
  - `txs`: List of transactions for the address.
  - `selectedTxid`: Currently selected transaction ID.
  - `device`: Current preview frame ('iphone' \| 'galaxy').
  - `filterMode`: 'all' \| 'incoming' \| 'outgoing'.
  - `summary`: Object containing balance, received, sent, and USD price.
- **Key Effects**:
  - Hydrating the selected transaction with extra details (block height, size, USD price at time of TX).
  - Fetching address transactions and summary on user request.

---

## 5. Routing
- **Architecture**: Single Page Application (SPA).
- **Navigation**: Managed via local state toggles (e.g., `showAcceleration`).
- **Route Guards**: None (public application).

---

## 6. State Management
- **Method**: React Hooks (`useState`, `useReducer` - inferred via `useState` simplicity).
- **Global State**: Managed in `App.jsx` and passed via props.
- **Custom Hooks**:
  - `useToasts`: Handles the queue of notification messages with auto-dismiss.
  - `useRateLimit`: Prevents rapid-fire API requests from the user.

---

## 7. API Integration

### Services
1. **`blockchainAPI`**:
   - `getAddressBalance(address)`: `GET blockchain.info/q/addressbalance/{address}`
   - `getAddressTransactions(address)`: `GET blockchain.info/rawaddr/{address}`
   - `getTransaction(txid)`: `GET blockchain.info/rawtx/{txid}`
   - `getTicker()`: `GET blockchain.info/ticker`
2. **`mempoolAPI`**:
   - `getMempoolTxMeta(txid)`: `GET mempool.space/api/tx/{txid}`
   - `getMempoolHex(txid)`: `GET mempool.space/api/tx/{txid}/hex`
   - `getMempoolFees()`: `GET mempool.space/api/v1/fees/recommended`
3. **`broadcastService`**:
   - `broadcastEverywhere({ rawHex })`: Multi-post to `blockchain.info`, `mempool.space`, and `blockstream.info`.

### Patterns
- **CORS**: All Blockchain.info requests append `?cors=true`.
- **Cancellation**: `AbortController` is used in `useEffect` and callbacks to prevent memory leaks and race conditions.

---

## 8. Security Considerations
- **Authentication**: None required for public blockchain data.
- **Input Sanitization**:
  - Bitcoin addresses and TXIDs are validated via Regex before fetching.
  - URL parameters are properly encoded using `encodeURIComponent`.
- **XSS Protection**: Default React JSX escaping. No `dangerouslySetInnerHTML` usage.
- **External Links**: All external links use `rel="noreferrer"` for security and privacy.

---

## 9. Environment Variables
No environment variables are currently in use. Future variables should include:
- `VITE_BLOCKCHAIN_API_BASE`: `https://blockchain.info`
- `VITE_MEMPOOL_API_BASE`: `https://mempool.space`

---

## 10. Build and Configuration
- **Bundler**: Vite
- **Configuration**:
  - `vite.config.js`: Uses `@vitejs/plugin-react`.
  - `tailwind.config.js`: Scans `index.html` and all files in `src/`.
- **Output**: Production builds are optimized into the `dist/` directory.

---

## 11. TypeScript Rewrite Recommendations

### Essential Interfaces
```typescript
interface Transaction {
  hash: string;
  time: number;
  fee: number;
  outs: Array<{ addr: string; value: number }>;
  ins: Array<{ addr: string; value: number }>;
}

interface AddressSummary {
  balanceSats: number | null;
  receivedSats: number | null;
  sentSats: number | null;
  usdPrice: number | null;
}

interface TxView {
  title: string;
  isIncoming: boolean;
  amountBtc: number;
  amountUsd: number | null;
  feeBtc: number;
  feeUsd: number | null;
  feeRate: number | null;
  statusPhrase: string;
  confLabel: string;
  confRaw: number;
  timeLabel: string;
  txid: string;
  isUnconfirmed: boolean;
}
```

### Type Safety Improvements
- Use strict typing for component props to prevent "prop drilling" errors.
- Define Union Types for `device` ('iphone' | 'galaxy') and `filterMode` ('all' | 'incoming' | 'outgoing').
- Use exhaustive `switch` statements with `never` type for status rendering.

---

## 12. Security Best Practices for Rewrite
- **Strict Validation**: Implement `Zod` or `Valibot` for API response validation to ensure runtime data matches expected shapes.
- **Content Security Policy (CSP)**: Add a meta tag to restrict script execution and API connections.
- **Secure Storage**: If user preferences are added, use `sessionStorage` or HttpOnly cookies instead of `localStorage`.
- **Dependency Auditing**: Integrate `npm audit` or `Snyk` into the CI/CD pipeline.

---

## 13. Future Improvements
- **Performance**: Implement `React Query` (TanStack Query) for better API state management, caching, and retry logic.
- **Code Organization**: Split `App.jsx` into smaller, focused custom hooks (e.g., `useAddressData`, `useTransactionDetails`).
- **Accessibility**: Enhance ARIA labels and ensure keyboard navigability for all interactive elements (partially implemented).
- **Testing**: Add unit tests for utility formatters and validators, and integration tests for the core calculation logic.
