# Release Notes

## [Unreleased]

- Documentation refresh for the current feature set and deployment options.
- README and release notes aligned with the latest app capabilities.

## [0.4.0] - 2025-11-09

### Added

- More accurate transaction classification using net value calculation for incoming vs outgoing detection.
- Rebroadcast and acceleration workflow with multi-endpoint broadcast status and fee-rate guidance.
- Copy-to-clipboard actions for transaction IDs and addresses.
- Improved PNG export reliability and richer toast/error feedback.

### Changed

- Unified transaction and blockchain API handling through a dedicated service layer.
- Improved address/transaction hydration and USD valuation logic.
- Refined the preview UI with better device frames, confirmation indicators, and accessibility support.

### Fixed

- Corrected incoming/outgoing classification for change/self-send edge cases.
- Reduced rendering overhead and improved performance when switching filters or device frames.
- Fixed memory leak and race-condition risks in async API flows.

## [0.3.0] - 2025-11-09

### Added

- Memoized rendering for better performance.
- API rate limiting and request throttling.
- AbortController cleanup for async requests.
- Accessibility improvements including ARIA labels and keyboard support.
- Error boundary handling for graceful recovery.

### Changed

- Moved toast and rate-limit behavior into dedicated hooks.
- Refactored blockchain requests into a central API service.
- Improved state handling and transition smoothness in the UI.

### Fixed

- Memory leak issues and async race conditions.
- Better handling for invalid inputs and network errors.

## [0.2.0] - 2025-09-09

### Added

- Address Explorer with summary and ticker price.
- Fee rate display, confirmation indicators, and incoming/outgoing/all transaction filters.
- Historical USD valuation via Blockchain.com Charts.

## [0.1.0] - 2025-09-09

### Added

- Initial public preview built with Vite, React, and Tailwind.
- Address transaction fetching and mobile-style device frame previews.
- PNG screenshot export support.
