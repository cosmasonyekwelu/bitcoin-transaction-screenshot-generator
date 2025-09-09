# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-09-09
### Added
- **Bitcoin Address Explorer** with Address Summary:
  - Current Balance, Total Received, Total Sent (sats + BTC)
  - BTC Price (USD) via `blockchain.info/ticker`
- Incoming/Outgoing/All filter in transaction selector
- Fee rate (sat/vB) using `rawtx.size` (or `weight/4` fallback)
- Confirmations progress bar + improved status badges
- Clean device frame scrollbar hiding for crisp screenshots

### Changed
- USD “value when transacted” now sourced from **Blockchain.com Charts** nearest daily price (no CoinGecko).

## [0.1.0] - 2025-09-09
### Added
- Initial Vite + React + Tailwind app
- Fetch last 10 transactions for a given address (Blockchain.com Explorer)
- Mobile device frames (iPhone / Galaxy) and PNG screenshot export
