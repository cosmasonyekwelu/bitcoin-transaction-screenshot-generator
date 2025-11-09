# **Changelog**

All notable changes to this project are documented in this file.

---

## **[0.4.0] - 2025-11-09**

### **Added**

- **Transaction Accuracy**

  - Implemented **correct net value calculation** (`outputs-to-you − inputs-from-you`) for accurate received/sent detection.
  - Added better handling of **self-change outputs** to prevent undercounting of received amounts.
  - Improved detection of **incoming vs outgoing** transactions for all address types.

- **Rebroadcast (Acceleration) Enhancements**

  - Integrated **multi-endpoint broadcast** (`mempool.space`, `blockstream.info`, `blockchain.info`) with live status reporting.
  - Added **fee rate detection** (`fee/vsize`) with auto-calculated “target” fee rate suggestions.
  - Included **mempool.space fee recommendations** (fastest, 30min, 60min, min).
  - Implemented **rich result table** for rebroadcast results (OK/Fail per endpoint).

- **Screenshot & Copy UX**

  - Added one-click **“Copy Transaction ID”** and **“Copy Address”** with feedback toasts.
  - Improved **PNG export** performance and reliability with high-resolution `html-to-image`.

- **Error Handling**

  - Added context-aware, **localized (“Naija-style”) friendly error messages** for user clarity.
  - Toast notifications for network and validation issues.

- **Accessibility**

  - Focus management for forms and buttons in the acceleration dialog.
  - Added `aria-label`, `role`, and keyboard support for all interactive elements.

- **Performance Optimizations**

  - Introduced **rate-limiting hook** to prevent API spam during user typing.
  - Memoized classification, filtered lists, and UI computations.
  - Reduced re-renders using `React.memo`, `useCallback`, and stable dependency arrays.

---

### **Changed**

- **Architecture**

  - Simplified transaction classifier to use a **single source of truth** (net value).
  - Unified all API calls into the **`blockchainAPI` service layer** for consistency.
  - Optimized React component tree for reduced re-renders and better modularity.

- **Data Handling**

  - Refactored **USD value fetching** to use historical daily BTC price near TX date via Blockchain.com Charts.
  - Improved transaction hydration (block height, confirmations, fee rate).
  - Replaced old fee/amount logic with more robust and accurate math.

- **UI/UX**

  - Enhanced device frames with realistic iPhone/Samsung status bars and notch shapes.
  - Improved toast visibility, animations, and auto-dismiss behavior.
  - Redesigned error boundaries for full-page recovery with “Refresh Page” CTA.
  - Updated confirmation progress bars and status badges with color-coded feedback.

---

### **Fixed**

- **Transaction Accuracy**

  - Fixed incorrect incoming/outgoing detection for addresses with self-change outputs.
  - Corrected BTC/fiat conversion edge cases for small-value transactions.

- **Memory Leaks**

  - Added cleanup for all `AbortController` instances and timeouts in `useEffect` hooks.
  - Prevented potential leaks in async `fetchUsdFromBlockchainCharts` and rebroadcast calls.

- **Performance**

  - Eliminated redundant state updates and expensive recomputations in filtered transactions.
  - Improved rendering speed when switching filters or devices.

- **Accessibility**

  - Fixed keyboard focus and screen reader accessibility across all form inputs and buttons.
  - Added missing `aria-describedby` for form field hints.

- **Error Recovery**

  - Improved network error retry behavior and timeout handling.
  - Added fallback for null/undefined API responses.

---

## **[0.3.0] - 2025-11-09**

### Added

- Performance optimizations via memoization (`React.memo`, `useCallback`, `useMemo`).
- API rate limiting and request throttling.
- AbortController cleanup for API calls.
- Toast timeout cleanup to prevent leaks.
- Accessibility with ARIA labels, focus traps, and semantic HTML.
- ErrorBoundary for graceful recovery.
- Centralized API service layer.

### Changed

- Moved toast and rate-limit logic into custom hooks.
- Refactored blockchain API calls into dedicated service.
- Improved UX with smoother transitions and consistent state handling.

### Fixed

- Memory leaks and race conditions in async operations.
- Accessibility issues in keyboard navigation.
- Better error handling for invalid inputs and network failures.

---

## **[0.2.0] - 2025-09-09**

### Added

- Bitcoin Address Explorer with full summary (balance, received, sent, BTC→USD).
- Transaction filters (All / Incoming / Outgoing).
- Fee rate calculation and confirmation progress bars.
- Device frame polish for PNG screenshots.

### Changed

- USD pricing switched to Blockchain.com Charts for historical accuracy.

---

## **[0.1.0] - 2025-09-09**

### Added

- Initial Vite + React + Tailwind project setup.
- Address transaction fetching via Blockchain.com API.
- iPhone and Galaxy mobile frame previews.
- PNG screenshot export feature.

---

