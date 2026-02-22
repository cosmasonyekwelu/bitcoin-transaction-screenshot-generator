# BTC Tx Screenshot Generator - React Native Mobile Blueprint

This document provides a comprehensive guide for migrating the BTC Tx Screenshot Generator from a web-based React application to a cross-platform React Native mobile application.

---

## 1. Project Overview
- **Purpose**: A mobile application that enables users to explore Bitcoin addresses, view detailed transaction histories, and generate high-quality, mobile-optimized screenshots of specific transactions. It also includes tools for transaction rebroadcasting (acceleration).
- **Current Web Tech Stack**:
  - **Framework**: React 19 (SPA)
  - **Build Tool**: Vite 7
  - **Styling**: Tailwind CSS 3
  - **Networking**: Axios
  - **Utilities**: `html-to-image` for screenshot generation.
- **Key Dependencies**:
  - `axios`: For API communication.
  - `blockchain.info` APIs: Primary data source.

---

## 2. Mobile App Requirements
- **Core Features**:
  - **Address Explorer**: Input BTC address to view balance, total received, and total sent.
  - **Transaction History**: List of the last 10 transactions with filtering (Incoming/Outgoing/All).
  - **Transaction Preview**: Detailed view of a single transaction (Amount, Fee, Status, Confirmations, Time, TXID).
  - **Screenshot Export**: Ability to save the transaction preview as an image to the device's gallery.
  - **Transaction Acceleration**: Rebroadcast unconfirmed transactions to multiple nodes.
  - **Currency Toggle**: Switch between BTC and USD values (using historical price data).
- **Web-Specific Adaptations**:
  - Replace "Device Frame" toggle with native screen layouts.
  - Convert hover states to active press states.
  - Implement mobile-friendly navigation (Tabs/Stack) instead of a single-page scrolling layout.
- **Target Platforms**: iOS and Android.
- **Device Considerations**: Support for various screen sizes (phones/tablets) and orientations.

---

## 3. Project Structure (Web vs. Mobile)
Recommended mapping for a React Native (Expo or Bare) project:

| Web Folder/File | Mobile (RN) Equivalent | Purpose |
|-----------------|------------------------|---------|
| `src/components/` | `src/components/` | Reusable UI components (Buttons, Inputs). |
| `src/components/layout/` | `src/components/layout/` | Layout wrappers (Safe Area, Headers). |
| `N/A` | `src/screens/` | Screen-level components (Home, Details, Settings). |
| `src/services/` | `src/services/` | API and business logic layers. |
| `src/hooks/` | `src/hooks/` | Custom React hooks. |
| `src/utils/` | `src/utils/` | Helper functions and formatters. |
| `src/constants/` | `src/constants/` | App constants and theme definitions. |
| `favicon.svg` | `assets/icon.png` | App icon. |
| `App.jsx` | `App.tsx` | App entry point and Navigation Container. |

---

## 4. Styling and Assets Translation
- **Styling Analysis**: The web app uses Tailwind CSS for a dark-themed, utility-first UI.
- **Translation Strategy**:
  - **Option A (NativeWind)**: Use NativeWind to preserve Tailwind-like utility classes in React Native.
  - **Option B (StyleSheet)**: Standard `StyleSheet.create` for maximum performance and predictability.
  - **Hover Effects**: Replace with `Pressable` component and its `pressed` state or `TouchableOpacity` with `activeOpacity`.
- **Images and Icons**:
  - **Icons**: Use `react-native-vector-icons` (MaterialCommunityIcons or Ionicons) instead of Unicode characters and CSS-drawn icons (as seen in `StatusBar.jsx`).
  - **Assets**:
    - `/favicon.svg`: Main application icon.
- **Fonts**: Default system fonts are used. If custom fonts are needed, they must be linked in `react-native.config.js` or managed via Expo Fonts.

---

## 5. Component Architecture
### Reusable Components & Props
| Component | Props | Purpose |
|-----------|-------|---------|
| `AddressInput` | `address`: string, `setAddress`: func, `copyAddress`: func, `fetchAddressTxs`: func, `loading`: bool, `error`: string | Handles BTC address entry and data fetching trigger. |
| `AddressSummary` | `address`: string, `summary`: object ({balanceSats, receivedSats, sentSats, usdPrice}), `addrLoading`: bool, `addrError`: string, `balanceUsd`: number, `receivedUsd`: number, `sentUsd`: number | Displays wallet statistics and balances. |
| `TransactionSelector` | `filteredTxs`: array, `loading`: bool, `selectedTxid`: string, `setSelectedTxid`: func | Lists transactions for the user to select one for preview. |
| `AccelerationForm` | `txid`: string, `currentFeeRate`: number, `onAccelerate`: func, `onCancel`: func, `addToast`: func | Rebroadcasts unconfirmed transactions. |
| `AccelerationHistory` | `accelerations`: array | Shows history of rebroadcast attempts. |
| `TransactionPreview` | `view`: object, `TARGET_CONF`: number, `copyTxid`: func, `addToast`: func | Visual representation of the selected transaction. |
| `DeviceFrame` | `device`: 'iphone' \| 'galaxy', `children`: node | (Web only) Mock device frame. Mobile app should replace with `SafeAreaView`. |
| `StatusBar` | `device`: 'iphone' \| 'galaxy' | (Web only) Mock status bar. Mobile app should use `StatusBar` from `react-native`. |

**`TransactionPreview` view prop structure:**
```typescript
{
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

### Hooks & HOCs
- **useToasts**: Preserve logic but adapt for native toast libraries.
- **useRateLimit**: Preserve logic to throttle API calls on mobile.

---

## 6. Navigation (Web Routing vs. Mobile Navigation)
The web app is a single-page layout. For mobile, use **React Navigation**:
- **Root Stack**:
  - `HomeScreen`: Contains the Address Input and Summary.
  - `TransactionDetailsScreen`: The detailed preview for screenshotting.
  - `AccelerationModal`: A modal for the rebroadcast feature.
- **Tab Navigator** (Optional): If expanding to include an "Address Book" or "Settings".
- **Deep Linking**: Implement `btc-screenshot://address/{address}` to open the app directly to an address summary.

---

## 7. State Management
- **Local State**: `useState` and `useMemo` in `App.jsx` can be moved to a Screen or a dedicated `AddressProvider` using Context API.
- **Persistence**: Replicate `localStorage` usage with `@react-native-async-storage/async-storage` for saving recent searches.
- **Offline Capabilities**: Use `NetInfo` to detect connectivity and show appropriate "Offline" states.

---

## 8. API Integration

### Endpoints and Response Shapes

**1. Blockchain.info (Public Queries)**
- `getAddressBalance(address)`: `GET blockchain.info/q/addressbalance/{address}?confirmations=0&cors=true`
  - **Response**: `number` (satoshis) as string.
- `getAddressReceived(address)`: `GET blockchain.info/q/getreceivedbyaddress/{address}?confirmations=0&cors=true`
  - **Response**: `number` (satoshis) as string.
- `getTicker()`: `GET blockchain.info/ticker?cors=true`
  - **Response**: `{ [currency: string]: { last: number, "15m": number, ... } }`
- `getAddressTransactions(address)`: `GET blockchain.info/rawaddr/{address}?limit=10&cors=true`
  - **Response**: `{ txs: Array<{ hash: string, time: number, fee: number, out: Array<{addr, value}>, inputs: Array<{prev_out: {addr, value}}> }> }`
- `getTransaction(txid)`: `GET blockchain.info/rawtx/{txid}?cors=true`
  - **Response**: `{ block_height: number, size: number, weight: number }`
- `getBlockCount()`: `GET blockchain.info/q/getblockcount?cors=true`
  - **Response**: `number` (current tip) as string.

**2. Mempool.space (Acceleration Tools)**
- `getMempoolTxMeta(txid)`: `GET mempool.space/api/tx/{txid}`
  - **Response**: `{ fee: number, vsize: number, status: { replaceable: boolean, confirmed: boolean } }`
- `getMempoolHex(txid)`: `GET mempool.space/api/tx/{txid}/hex`
  - **Response**: `string` (raw hex).
- `getMempoolFees()`: `GET mempool.space/api/v1/fees/recommended`
  - **Response**: `{ fastestFee: number, halfHourFee: number, hourFee: number, minimumFee: number }`

**3. Blockchain.info Charts (Historical Price)**
- `GET api.blockchain.info/charts/market-price?start={start}&timespan=60days&format=json&cors=true`
  - **Response**: `{ values: Array<{ x: number, y: number }> }` (x: timestamp, y: USD price).

### Networking Adaptations
- Remove `?cors=true` from all URLs for native requests.
- Use `axios` for all calls with `timeout: 15000`.

---

## 9. Security Considerations
- **Secure Storage**: Use `react-native-keychain` or `expo-secure-store` if adding user-private features.
- **Token Management**: Public APIs, no tokens required.
- **Input Validation**: Maintain Regex validation for BTC addresses and TXIDs.
- **HTTPS**: Enforce HTTPS for all network traffic (default).

---

## 10. Environment Variables
Manage via `react-native-config` or `expo-constants`:
- `VITE_BLOCKCHAIN_API_BASE`: `https://blockchain.info`
- `VITE_MEMPOOL_API_BASE`: `https://mempool.space`

---

## 11. Build and Configuration
- **Project Setup**: Recommended using **Expo (Managed Workflow)**.
- **Libraries to Replace Web-Specific ones**:
  - `html-to-image` → `react-native-view-shot`.
  - `toPng` (download) → `expo-media-library` to save to the Photos gallery.

---

## 12. Platform-Specific Adaptations
- **Form Handling**: Use `KeyboardAvoidingView` for inputs.
- **SafeArea**: Use `react-native-safe-area-context`.
- **Gestures**: Implement `RefreshControl` for "Pull to Refresh".
- **Sharing**: Use `Share` API from `react-native` to export screenshots.

---

## 13. Performance Considerations
- **List Rendering**: Use `<FlatList>` for the transaction history.
- **Memoization**: Continue using `React.memo` for the preview component.

---

## 14. Testing Strategy
- **Unit Testing**: Jest for `utils/` and `services/`.
- **Component Testing**: `react-native-testing-library`.
- **E2E Testing**: Detox.

---

## 15. Future Enhancements
- **Address Book**: Save and label addresses locally.
- **Price Alerts**: FCM push notifications for BTC price movements.
- **Biometric Lock**: Secure the app with FaceID/TouchID.
