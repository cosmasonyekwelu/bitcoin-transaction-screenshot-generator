# Historical BTC/USD Pricing

The transaction screenshot uses a dedicated historical pricing service:

```text
src/services/historicalPriceService.js
```

The service prioritizes timestamp accuracy:

1. Bitquery GraphQL transaction pricing
2. mempool.space historical BTC/USD price fallback

The app still computes the BTC amount from on-chain outputs for the selected
address. The historical service supplies the timestamp-accurate USD rate and,
when available, transaction-level fee USD from Bitquery.

## Environment

Create `.env.local` from `.env.example`:

```bash
VITE_BITQUERY_API_KEY=your_bitquery_token
```

Vite exposes `VITE_*` variables to browser JavaScript. For production, route
Bitquery calls through a backend or serverless proxy so the token is not shipped
to users.

## Primary Request

Endpoint:

```text
POST https://graphql.bitquery.io
```

Headers:

```http
Content-Type: application/json
Authorization: Bearer <VITE_BITQUERY_API_KEY>
```

Body:

```json
{
  "query": "query BitcoinTransactionValueUSD($txHash: String!) { bitcoin(network: bitcoin) { transactions(txHash: { is: $txHash }) { hash block { timestamp { time(format: \"%Y-%m-%d %H:%M:%S\") } } inputValue inputValueUSD: inputValue(in: USD) outputValue outputValueUSD: outputValue(in: USD) feeValue feeValueUSD: feeValue(in: USD) } } }",
  "variables": {
    "txHash": "TRANSACTION_HASH"
  }
}
```

Example normalized response:

```json
{
  "ok": true,
  "source": "bitquery",
  "data": {
    "hash": "TRANSACTION_HASH",
    "timestamp": 1700000000,
    "inputValueBTC": 1,
    "outputValueBTC": 0.999,
    "feeValueBTC": 0.001,
    "inputValueUSD": 35000,
    "outputValueUSD": 34965,
    "feeValueUSD": 35,
    "priceUSD": 35000
  },
  "error": null,
  "meta": {
    "cacheHit": false
  }
}
```

## Fallback Request

If Bitquery is unavailable or no token is configured, the service fetches the
raw transaction from Blockchain.com to obtain its exact transaction timestamp
and BTC totals, then asks mempool.space for the historical USD price.

Endpoint:

```text
GET https://mempool.space/api/v1/historical-price?currency=USD&timestamp=1700000000
```

Example normalized response:

```json
{
  "ok": true,
  "source": "mempool",
  "data": {
    "hash": "TRANSACTION_HASH",
    "timestamp": 1700000000,
    "inputValueBTC": 1,
    "outputValueBTC": 0.999,
    "feeValueBTC": 0.001,
    "inputValueUSD": 40000,
    "outputValueUSD": 39960,
    "feeValueUSD": 40,
    "priceUSD": 40000
  },
  "fallback": {
    "source": "bitquery",
    "code": "MISSING_API_KEY",
    "message": "Missing VITE_BITQUERY_API_KEY"
  }
}
```

## Public API

```js
getTransactionValueUSD(txHash);
getHistoricalBTCPrice(timestamp);
calculateUSDValue(btcAmount, timestamp);
getTransactionValuesUSDBatch(txHashes);
```

All functions return structured results:

```js
{
  ok: true,
  source: "bitquery",
  data: {},
  error: null,
  meta: {}
}
```

Failures return:

```js
{
  ok: false,
  source: "mempool",
  data: null,
  error: {
    code: "RATE_LIMITED",
    message: "Historical price lookup failed",
    status: 429,
    retryable: true
  }
}
```

## Reliability

- GraphQL variables are used for transaction hashes.
- Bitquery and mempool requests use exponential backoff retries.
- Rate limits, network failures, GraphQL errors, and missing price data are
  normalized into structured errors.
- Transaction lookups and timestamp price lookups are cached in memory.
- Duplicate in-flight requests share a single promise.
- Batch lookup deduplicates repeated transaction hashes.

## Migration Notes

The previous implementation used Blockchain.com Charts daily market price data.
That can drift from the actual transaction-time value because it is a daily
series, not transaction-level pricing.

The new implementation improves accuracy by using Bitquery transaction-level
USD values first. When Bitquery is unavailable, mempool.space is queried with
the exact Unix transaction timestamp and the app multiplies the address-specific
BTC amount by that historical BTC/USD price.
