# BTC Tx Screenshot Generator

A single-page React app (Vite + Tailwind) that generates a **pixel‑perfect mobile screenshot** for a selected **Bitcoin transaction**, using **Blockchain.com APIs only** (Explorer + Charts + Ticker).

## ✨ Features
- **Bitcoin Address Explorer**
  - Address summary: **Current balance**, **Total received**, **Total sent**, and **BTC price (USD)** from `blockchain.info/ticker`
  - Transaction history preview (last 10) with **Incoming/Outgoing/All** filter
- **Transaction preview**
  - Real value moved (incoming: outputs to your address; outgoing: outputs to others)
  - Network fee (BTC & USD), **fee rate (sat/vB)**, **status & confirmations**
  - Time, TXID (copy), quick **View on Explorer**
- **Mobile device frame**
  - Toggle **iPhone** / **Samsung Galaxy** CSS frame
  - Hidden inner scrollbars for crisp screenshots
- **Screenshot export**
  - Export the device frame + preview as **PNG** via `html-to-image`

## 🧰 Tech
- React 18, Vite 5, Tailwind 3
- Axios, html-to-image
- **APIs**: `blockchain.info` (Explorer + Charts + Ticker) — all requests include `?cors=true`

## 🔌 API Endpoints Used
- Address summary (satoshis)
  - `https://blockchain.info/q/addressbalance/{address}?confirmations=0&cors=true`
  - `https://blockchain.info/q/getreceivedbyaddress/{address}?confirmations=0&cors=true`
  - `https://blockchain.info/q/getsentbyaddress/{address}?confirmations=0&cors=true`
- Address transactions (last 10):  
  - `https://blockchain.info/rawaddr/{address}?limit=10&cors=true`
- TX detail (size/weight + block height):  
  - `https://blockchain.info/rawtx/{txid}?cors=true`
- Chain tip (confirmations):  
  - `https://blockchain.info/q/getblockcount?cors=true`
- Daily market price (USD, nearest to TX date):  
  - `https://api.blockchain.info/charts/market-price?start=YYYY-MM-DD&timespan=31days&format=json&cors=true`
- Current BTC price (USD):  
  - `https://blockchain.info/ticker?cors=true`

> **Note:** USD “value when transacted” is computed by multiplying the BTC amount by the **nearest daily price datapoint** from Blockchain.com Charts (not a per-block price).

## 🖥️ Local Development
```bash
npm i
npm run dev
```

## 🧪 Build / Preview
```bash
npm run build
npm run preview
```

## ▲ Deploy to Vercel
**Dashboard (easy):**
1. Push the repo to GitHub.
2. Go to https://vercel.com/new and import your repo.
3. Build Command: `npm run build`  
   Output Directory: `dist`
4. Deploy.

**GitHub Actions (optional):**
- Add repo **secrets**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Use the provided workflow in `.github/workflows/deploy-vercel.yml` (or deploy from the dashboard).

## 🔒 Privacy & Security
- All calls are **client-side** to `blockchain.info`. No API keys required.
- We do not store addresses or transactions. See [`SECURITY.md`](SECURITY.md).

## 🤝 Contributing
See [`CONTRIBUTING.md`](CONTRIBUTING.md) and open a PR using the template.

## 📜 License
MIT — see [`LICENSE`](LICENSE).
