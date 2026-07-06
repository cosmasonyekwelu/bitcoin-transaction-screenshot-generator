# BTC Tx Screenshot Generator

A single-page React app built with Vite and Tailwind that lets you inspect a Bitcoin address or transaction, preview it in a mobile-style frame, and export the result as a PNG screenshot.

## What it does

- **Address explorer**
  - Shows current balance, total received, total sent, and the latest BTC/USD price.
  - Lists recent transactions for the address with incoming/outgoing/all filters.

- **Transaction preview**
  - Classifies the transaction as incoming or outgoing based on the selected address.
  - Displays the transferred value, fee, fee rate, confirmations, timestamp, TXID, and quick explorer links.

- **Mobile preview + export**
  - Switches between iPhone and Samsung Galaxy device frames.
  - Exports the preview as a PNG using html-to-image.

- **Transaction acceleration / rebroadcast**
  - Offers a rebroadcast flow for unconfirmed transactions using mempool.space data and broadcast endpoints.
  - Keeps a local history of acceleration/rebroadcast attempts in the UI.

## Tech stack

- React 19
- Vite 7
- Tailwind CSS 3
- Axios and html-to-image

## Data sources

- **Blockchain.com** endpoints are used for address balances, transaction history, transaction details, chain height, and market price data.
- **mempool.space** is used for rebroadcast guidance and transaction broadcast attempts.

> Note: The app is client-side only. No backend service or API key is required.

## Local development

```bash
npm install
npm run dev
```

## Build / preview

```bash
npm run build
npm run preview
```

## Deployment

The repository includes deployment workflows for both Vercel and Netlify:

- Vercel: use the workflow in [.github/workflows/deploy-vercel.yml](.github/workflows/deploy-vercel.yml) or deploy from the Vercel dashboard with the build command `npm run build` and output directory `dist`.
- Netlify: use the workflow in [.github/workflows/deploy-netlify.yml](.github/workflows/deploy-netlify.yml).

## Privacy & security

- All requests are made directly from the browser.
- No addresses, transactions, or screenshots are stored by the app.
- See [SECURITY.md](SECURITY.md) for more details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and open a PR using the repository template.

## License

MIT — see [LICENSE](LICENSE).
