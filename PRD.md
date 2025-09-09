# Product Requirements Document (PRD)
**Project:** BTC Tx Screenshot Generator  
**Status:** v0.2.0 (Public preview)

## 1. Objective
Create authentic-looking **mobile transaction screenshots** for Bitcoin using **only blockchain data** and provide a quick **address explorer** for context.

## 2. Personas
- Designers / content creators (authentic visuals)
- Analysts / educators (demos & training)
- Developers (wallet UX prototyping)

## 3. Requirements
### 3.1 Address Explorer
- Input BTC address
- Show Current Balance, Total Received, Total Sent (sats + BTC)
- Show BTC Price (USD) from `blockchain.info/ticker`
- Link to explorer page

### 3.2 Transactions
- Fetch last 10 via `rawaddr`
- Filter dropdown: All / Incoming / Outgoing
- Select tx by TXID + human date

### 3.3 Transaction Preview
- Real value moved computed from inputs/outputs
- Fee (BTC + USD), fee rate (sat/vB)
- Status + confirmations (using tip height)
- Time, shortened TXID (copy), explorer link

### 3.4 USD at Transaction Time
- Use Blockchain.com Charts `market-price` nearest daily price to tx timestamp

### 3.5 Mobile Frame & Export
- iPhone / Samsung Galaxy CSS frames
- Export as PNG via `html-to-image`

## 4. Non-Goals
- No non-blockchain price sources
- No server-side components
- No editing on-chain amounts/fees

## 5. User Flow
1. Paste address → **Fetch Transactions**
2. Address summary loads
3. Select a transaction
4. Preview shows BTC, fee, USD, confirmations, TXID
5. Choose device frame → **Generate Screenshot**

## 6. Acceptance Criteria
- Given a valid address, summary and transactions render
- Selecting a tx shows accurate BTC amounts and status
- USD is present when chart data is available
- Exported PNG contains the entire device frame + preview

## 7. Risks
- CORS availability (mitigated using `?cors=true`)
- Charts API may not always have a data point near the timestamp (graceful `—`)

## 8. Metrics (future)
- Time to first screenshot
- % tx with USD successfully resolved
