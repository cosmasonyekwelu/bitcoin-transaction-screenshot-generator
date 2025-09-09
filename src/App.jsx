import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import axios from "axios";
import { toPng } from "html-to-image";

/* ---------------- helpers ---------------- */
const satsToBtc = (s) => Number(s || 0) / 1e8;
const fmtBtc = (n) =>
  Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
const fmtUSD = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const fmtDateTime = (unix) =>
  new Date(Number(unix || 0) * 1000).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const shorten = (s, head = 12, tail = 6) =>
  !s ? "" : s.length <= head + tail + 3 ? s : `${s.slice(0, head)}..${s.slice(-tail)}`;

/* date utils for Blockchain.com chart API */
const ymd = (d) => d.toISOString().slice(0, 10);
const dayStart = (unix, deltaDays = 0) => {
  const d = new Date(Number(unix) * 1000);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  d.setUTCHours(0, 0, 0, 0);
  return ymd(d);
};

/* ---------------- Device frame ---------------- */
const StatusBar = ({ device = "iphone" }) => {
  const isIphone = device === "iphone";
  return (
    <div className="relative h-10 px-4 text-xs text-neutral-300 flex items-center justify-between">
      <span>4:13</span>
      {isIphone ? (
        <>
          <div className="absolute left-1/2 -translate-x-1/2 top-[6px] w-[120px] h-[26px] bg-black rounded-b-2xl" />
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px]">
              {[4, 7, 10, 13].map((h, i) => (
                <div key={i} className="w-[3px] rounded-sm bg-neutral-300" style={{ height: h }} />
              ))}
            </div>
            <span>LTE</span>
            <div className="relative w-[26px] h-[12px] rounded-[4px] border border-neutral-400">
              <div className="absolute -right-[3px] top-[3px] w-[2px] h-[6px] rounded-sm bg-neutral-400" />
              <div className="h-full w-[77%] bg-green-500" />
            </div>
            <span className="text-[10px] text-neutral-400">77%</span>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 ml-auto">
          <div className="absolute left-1/2 -translate-x-1/2 top-[6px] w-16 h-[6px] bg-black/70 rounded-full" />
          <div className="absolute right-[105px] top-[6px] w-[8px] h-[8px] bg-black/80 rounded-full border border-neutral-700" />
          <div className="flex items-end gap-[2px]">
            {[4, 7, 10, 13].map((h, i) => (
              <div key={i} className="w-[3px] rounded-sm bg-neutral-300" style={{ height: h }} />
            ))}
          </div>
          <span>LTE</span>
          <div className="relative w-[26px] h-[12px] rounded-[4px] border border-neutral-400">
            <div className="absolute -right-[3px] top-[3px] w-[2px] h-[6px] rounded-sm bg-neutral-400" />
            <div className="h-full w-[77%] bg-green-500" />
          </div>
          <span className="text-[10px] text-neutral-400">77%</span>
        </div>
      )}
    </div>
  );
};

const DeviceFrame = forwardRef(function DeviceFrame({ device = "iphone", children }, ref) {
  const isIphone = device === "iphone";
  return (
    <div
      ref={ref}
      className={[
        "relative bg-neutral-950 border border-neutral-800",
        isIphone ? "rounded-[36px]" : "rounded-[32px]",
        "shadow-[0_0_0_10px_rgba(0,0,0,0.7),0_50px_100px_-20px_rgba(0,0,0,0.7)]",
        "w-[392px] max-w-full",
      ].join(" ")}
      style={{ aspectRatio: "9/19.5" }}
    >
      <div className="absolute inset-0 m-[10px] rounded-[28px] overflow-hidden bg-neutral-900 border border-neutral-800">
        <StatusBar device={device} />
        <div className="h-[calc(100%-12px)] overflow-auto bg-neutral-900 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-[5px] rounded-full bg-neutral-700/80" />
      </div>
    </div>
  );
});

/* ---------------- Main App ---------------- */
export default function App() {
  const [device, setDevice] = useState("iphone"); // 'iphone' | 'galaxy'
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // NEW: Address Summary state
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [summary, setSummary] = useState({
    balanceSats: null,
    receivedSats: null,
    sentSats: null,
    usdPrice: null,
  });

  const [txs, setTxs] = useState([]); // rawaddr list w/ I/O
  const [selectedTxid, setSelectedTxid] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'incoming' | 'outgoing'

  const [blockHeight, setBlockHeight] = useState(null);
  const [tipHeight, setTipHeight] = useState(null);
  const [usdDaily, setUsdDaily] = useState(null); // daily USD close to tx date
  const [txSize, setTxSize] = useState(null); // bytes for fee rate calc

  const TARGET_CONF = 4;
  const previewRef = useRef(null);

  const selectedTx = useMemo(() => txs.find((t) => t.hash === selectedTxid) || null, [txs, selectedTxid]);

  const classify = (t) => {
    const outToAddr = t.outs?.reduce((a, o) => a + (o.addr === address ? o.value : 0), 0) || 0;
    const inFromAddr = t.ins?.reduce((a, i) => a + (i.addr === address ? i.value : 0), 0) || 0;
    const isIncoming = outToAddr > 0 && inFromAddr === 0;
    return { isIncoming, outToAddr, inFromAddr };
  };

  /* ---- Blockchain.com charts: daily USD near the tx date (closest point) ---- */
  const fetchUsdFromBlockchainCharts = async (timestamp) => {
    try {
      const start = dayStart(timestamp, -15);
      const url = `https://api.blockchain.info/charts/market-price?start=${start}&timespan=31days&format=json&cors=true`;
      const { data } = await axios.get(url, { timeout: 20000 });
      const values = Array.isArray(data?.values) ? data.values : [];
      if (!values.length) return null;

      const ts = Number(timestamp);
      let best = null,
        bestDiff = Infinity;
      for (const v of values) {
        const diff = Math.abs(Number(v?.x || 0) - ts);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = v;
        }
      }
      return typeof best?.y === "number" ? best.y : null;
    } catch {
      return null;
    }
  };

  /* ---- NEW: fetch address summary (balance, total received, total sent, USD price) ---- */
  async function fetchAddressSummary() {
    if (!address) return;
    setAddrError("");
    setAddrLoading(true);
    setSummary({ balanceSats: null, receivedSats: null, sentSats: null, usdPrice: null });

    try {
      const balURL = `https://blockchain.info/q/addressbalance/${encodeURIComponent(address)}?confirmations=0&cors=true`;
      const recURL = `https://blockchain.info/q/getreceivedbyaddress/${encodeURIComponent(address)}?confirmations=0&cors=true`;
      const sentURL = `https://blockchain.info/q/getsentbyaddress/${encodeURIComponent(address)}?confirmations=0&cors=true`;
      const tickerURL = `https://blockchain.info/ticker?cors=true`;

      const [balRes, recRes, sentRes, tickerRes] = await Promise.all([
        axios.get(balURL, { timeout: 15000, transformResponse: (x) => x }),
        axios.get(recURL, { timeout: 15000, transformResponse: (x) => x }),
        axios.get(sentURL, { timeout: 15000, transformResponse: (x) => x }),
        axios.get(tickerURL, { timeout: 15000 }),
      ]);

      const balanceSats = Number(balRes.data);
      const receivedSats = Number(recRes.data);
      const sentSats = Number(sentRes.data);
      const usdPrice =
        tickerRes?.data?.USD?.last ??
        tickerRes?.data?.USD?.["15m"] ??
        null;

      setSummary({
        balanceSats: Number.isFinite(balanceSats) ? balanceSats : null,
        receivedSats: Number.isFinite(receivedSats) ? receivedSats : null,
        sentSats: Number.isFinite(sentSats) ? sentSats : null,
        usdPrice: Number.isFinite(usdPrice) ? usdPrice : null,
      });
    } catch (e) {
      setAddrError(e?.message || "Failed to load address summary.");
    } finally {
      setAddrLoading(false);
    }
  }

  /* ---- Fetch last 10 txs w/ I/O so we can compute real moved value ---- */
  async function fetchAddressTxs() {
    if (!address) return;
    setError("");
    setLoading(true);
    setTxs([]);
    setSelectedTxid("");
    setBlockHeight(null);
    setTipHeight(null);
    setUsdDaily(null);
    setTxSize(null);

    try {
      // in parallel with summary
      const txURL = `https://blockchain.info/rawaddr/${encodeURIComponent(address)}?limit=10&cors=true`;
      const [{ data }] = await Promise.all([axios.get(txURL, { timeout: 20000 }), fetchAddressSummary()]);
      const list = Array.isArray(data?.txs) ? data.txs : [];

      const mapped = list.map((t) => {
        const outs = Array.isArray(t?.out)
          ? t.out.map((o) => ({ addr: o?.addr || "", value: Number(o?.value || 0) }))
          : [];
        const ins = Array.isArray(t?.inputs)
          ? t.inputs.map((i) => ({
              addr: i?.prev_out?.addr || "",
              value: Number(i?.prev_out?.value || 0),
            }))
          : [];
        return {
          hash: t?.hash || "",
          time: Number(t?.time || 0),
          fee: Number(t?.fee || 0),
          outs,
          ins,
        };
      });

      setTxs(mapped);
      const first = mapped.find((t) => {
        const { isIncoming } = classify(t);
        if (filterMode === "incoming") return isIncoming;
        if (filterMode === "outgoing") return !isIncoming;
        return true;
      });
      if (first) setSelectedTxid(first.hash);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  }

  /* ---- Hydrate selection: block height, tip, daily USD near date, size ---- */
  useEffect(() => {
    let ignore = false;
    async function hydrate() {
      setBlockHeight(null);
      setTipHeight(null);
      setUsdDaily(null);
      setTxSize(null);
      if (!selectedTx) return;

      try {
        const rawtxURL = `https://blockchain.info/rawtx/${encodeURIComponent(selectedTx.hash)}?cors=true`;
        const [{ data: txd }, tipRes] = await Promise.all([
          axios.get(rawtxURL, { timeout: 20000 }),
          axios.get("https://blockchain.info/q/getblockcount?cors=true", {
            timeout: 15000,
            transformResponse: (x) => x,
          }),
        ]);
        if (ignore) return;

        setBlockHeight(typeof txd?.block_height === "number" ? txd.block_height : null);
        const tip = Number(tipRes.data);
        setTipHeight(Number.isFinite(tip) ? tip : null);

        const sizeBytes =
          typeof txd?.size === "number" ? txd.size : typeof txd?.weight === "number" ? Math.round(Number(txd.weight) / 4) : null;
        setTxSize(sizeBytes);

        const price = await fetchUsdFromBlockchainCharts(selectedTx.time);
        setUsdDaily(price);
      } catch (e) {
        // swallow
      }
    }
    hydrate();
    return () => {
      ignore = true;
    };
  }, [selectedTx]);

  /* ---- Filtered tx list for dropdown ---- */
  const filteredTxs = useMemo(() => {
    if (!txs.length) return [];
    return txs.filter((t) => {
      const { isIncoming } = classify(t);
      if (filterMode === "incoming") return isIncoming;
      if (filterMode === "outgoing") return !isIncoming;
      return true;
    });
  }, [txs, filterMode, address]);

  /* ---- Compute the real "value when transacted" + extras ---- */
  const view = useMemo(() => {
    if (!selectedTx) return null;

    const outToAddr = selectedTx.outs?.reduce((a, o) => a + (o.addr === address ? o.value : 0), 0) || 0;
    const inFromAddr = selectedTx.ins?.reduce((a, i) => a + (i.addr === address ? i.value : 0), 0) || 0;
    const isIncoming = outToAddr > 0 && inFromAddr === 0; // strict
    const outToOthers = selectedTx.outs?.reduce((a, o) => a + (o.addr !== address ? o.value : 0), 0) || 0;

    const valueSats = isIncoming ? outToAddr : outToOthers;
    const amountBtc = satsToBtc(valueSats);
    const feeBtc = satsToBtc(selectedTx.fee);

    let conf = 0;
    if (blockHeight != null && tipHeight != null) conf = Math.max(0, tipHeight - blockHeight + 1);
    const status = conf >= TARGET_CONF ? "Confirmed" : "Confirming";
    const confLabel = `${Math.min(conf, TARGET_CONF)}/${TARGET_CONF} confirmations`;

    const amountUsd = usdDaily != null ? amountBtc * usdDaily : null;
    const feeUsd = usdDaily != null ? feeBtc * usdDaily : null;

    const feeRate = txSize ? selectedTx.fee / txSize : null; // sats/byte

    const uniqueIns = [...new Set((selectedTx.ins || []).map((i) => i.addr).filter(Boolean))];
    const uniqueOuts = [...new Set((selectedTx.outs || []).map((o) => o.addr).filter(Boolean))];
    const fromPeek = uniqueIns.filter((a) => a !== address).slice(0, 2);
    const toPeek = uniqueOuts.filter((a) => a !== address).slice(0, 2);

    return {
      title: `${isIncoming ? "Received" : "Sent"} BTC`,
      isIncoming,
      amountBtc,
      amountUsd,
      feeBtc,
      feeUsd,
      feeRate,
      status,
      confLabel,
      confRaw: conf,
      timeLabel: fmtDateTime(selectedTx.time),
      txid: selectedTx.hash,
      fromPeek,
      fromCount: uniqueIns.length,
      toPeek,
      toCount: uniqueOuts.length,
    };
  }, [selectedTx, address, blockHeight, tipHeight, usdDaily, txSize]);

  /* ---- Copy & Screenshot ---- */
  async function copyTxid() {
    if (!view?.txid) return;
    try {
      await navigator.clipboard.writeText(view.txid);
      alert("Transaction ID copied");
    } catch {
      alert("Copy failed");
    }
  }
  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      alert("Address copied");
    } catch {
      alert("Copy failed");
    }
  }
  async function downloadPNG() {
    if (!previewRef.current) return;
    try {
      const dataUrl = await toPng(previewRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `btc-tx-${shorten(selectedTxid || "preview")}.png`;
      a.click();
    } catch (e) {
      alert("Could not generate screenshot.");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 grid place-items-center text-neutral-900 font-bold">₿</div>
            <div>
              <h1 className="text-lg font-semibold">BTC Transaction Screenshot Generator</h1>
              <p className="text-xs text-neutral-400">Blockchain.com explorer + charts (USD) • iPhone/Samsung frame • PNG export</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-400">Device</label>
              <select
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
              >
                <option value="iphone">iPhone</option>
                <option value="galaxy">Samsung Galaxy</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-neutral-400">Filter</label>
              <select
                className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="all">All</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        {/* Controls + Address Explorer */}
        <section className="space-y-4">
          {/* Input + fetch */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="w-full">
                <span className="block text-xs text-neutral-400 mb-1">Bitcoin Address</span>
                <input
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 outline-none placeholder:text-neutral-500"
                  placeholder="bc1q... (paste address)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value.trim())}
                  spellCheck={false}
                />
              </label>
              <div className="self-end flex gap-2">
                <button
                  onClick={() => (address ? copyAddress() : null)}
                  className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-2"
                  disabled={!address}
                >
                  Copy
                </button>
                <button
                  onClick={fetchAddressTxs}
                  disabled={!address || loading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 font-medium"
                >
                  {loading ? "Fetching…" : "Fetch Transactions"}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-3 py-2">{error}</div>}
          </div>

          {/* NEW: Address Summary card */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Address Summary</h2>
              {addrLoading && <span className="text-xs text-neutral-400">Loading…</span>}
            </div>

            {addrError && <div className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-3 py-2">{addrError}</div>}

            <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
              <div className="bg-neutral-850/40 border border-neutral-800 rounded-xl p-3">
                <div className="text-neutral-400">Address</div>
                <div className="font-mono text-neutral-200">{address ? shorten(address, 16, 10) : "—"}</div>
              </div>

              <div className="bg-neutral-850/40 border border-neutral-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-neutral-400">Current Balance</div>
                  <div className="font-medium">
                    {summary.balanceSats == null ? "—" : `${summary.balanceSats.toLocaleString()} sats`}
                  </div>
                  <div className="text-neutral-400 text-xs">
                    {summary.balanceSats == null ? "" : `${fmtBtc(satsToBtc(summary.balanceSats))} BTC`}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">BTC Price (USD)</div>
                  <div className="font-medium">
                    {summary.usdPrice == null ? "—" : fmtUSD(summary.usdPrice)}
                  </div>
                  <div className="text-neutral-400 text-xs">Source: blockchain.info/ticker</div>
                </div>
              </div>

              <div className="bg-neutral-850/40 border border-neutral-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-neutral-400">Total Received</div>
                  <div className="font-medium">
                    {summary.receivedSats == null ? "—" : `${summary.receivedSats.toLocaleString()} sats`}
                  </div>
                  <div className="text-neutral-400 text-xs">
                    {summary.receivedSats == null ? "" : `${fmtBtc(satsToBtc(summary.receivedSats))} BTC`}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Total Sent</div>
                  <div className="font-medium">
                    {summary.sentSats == null ? "—" : `${summary.sentSats.toLocaleString()} sats`}
                  </div>
                  <div className="text-neutral-400 text-xs">
                    {summary.sentSats == null ? "" : `${fmtBtc(satsToBtc(summary.sentSats))} BTC`}
                  </div>
                </div>
              </div>

              {address && (
                <a
                  href={`https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View address on Blockchain.com
                </a>
              )}
            </div>
          </div>

          {/* Tx selector */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
            <h2 className="text-sm font-semibold mb-2">Select Transaction</h2>
            {filteredTxs.length === 0 ? (
              <p className="text-xs text-neutral-400">{loading ? "Loading…" : "No transactions in this filter."}</p>
            ) : (
              <select
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 outline-none"
                value={selectedTxid}
                onChange={(e) => setSelectedTxid(e.target.value)}
              >
                {filteredTxs.map((t) => (
                  <option key={t.hash} value={t.hash}>
                    {shorten(t.hash, 12, 12)} • {fmtDateTime(t.time)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Screenshot */}
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
            <button
              onClick={downloadPNG}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-xl px-4 py-2 font-semibold"
              disabled={!selectedTx}
            >
              Generate Screenshot (PNG)
            </button>
          </div>

          <p className="text-[11px] text-neutral-500">
            Amount = <b>real value moved</b> (incoming: outputs to your address; outgoing: outputs to others). USD uses
            Blockchain.com daily market price near the transaction date.
          </p>
        </section>

        {/* Device + Wallet Sheet */}
        <section className="flex items-start justify-center">
          <DeviceFrame device={device} ref={previewRef}>
            <div className="min-h-full bg-neutral-900">
              <div className="mx-3 mt-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
                {/* header gradient + close */}
                <div className="relative">
                  <div className="h-10 bg-gradient-to-r from-purple-700/60 to-blue-600/55" />
                  <button className="absolute right-3 -top-3 w-7 h-7 rounded-full bg-neutral-800/90 text-neutral-300 grid place-items-center border border-neutral-700" aria-label="Close">✕</button>
                </div>

                {/* title / status */}
                <div className="px-5 pt-3 pb-1 flex items-center gap-2">
                  <span className={`w-5 h-5 grid place-items-center rounded-full ${view?.isIncoming ? "bg-emerald-700/40" : "bg-neutral-800"}`}>
                    {view?.isIncoming ? "↓" : "↗"}
                  </span>
                  <h3 className="text-base font-semibold">{view?.title || "Sent BTC"}</h3>
                </div>

                {/* big amount */}
                <div className="mx-4 mt-3 rounded-[22px] bg-neutral-850/40 border border-neutral-800 px-4 py-3 grid grid-cols-2 gap-4 items-center">
                  <div className="text-neutral-400">BTC</div>
                  <div className="text-right">
                    <div className="text-[17px] font-semibold">{fmtBtc(view?.amountBtc || 0)} BTC</div>
                    <div className="text-neutral-400 text-sm">{view?.amountUsd != null ? fmtUSD(view.amountUsd) : "—"}</div>
                  </div>
                </div>

                {/* details */}
                <div className="mx-4 my-4 rounded-[22px] bg-neutral-850/40 border border-neutral-800 overflow-hidden">
                  <dl className="divide-y divide-neutral-800">
                    <div className="flex items-center justify-between px-4 py-3">
                      <dt className="text-neutral-400">Network</dt>
                      <dd className="font-medium">Bitcoin</dd>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                      <dt className="text-neutral-400">Network fee</dt>
                      <dd className="text-right">
                        <div className="font-medium">{fmtBtc(view?.feeBtc || 0)} BTC</div>
                        <div className="text-neutral-400 text-sm">{view?.feeUsd != null ? fmtUSD(view.feeUsd) : "—"}</div>
                        {view?.feeRate != null && <div className="text-neutral-500 text-xs mt-1">{view.feeRate.toFixed(1)} sat/vB</div>}
                      </dd>
                    </div>

                    <div className="px-4 py-3">
                      <dt className="flex items-center justify-between">
                        <span className="text-neutral-400">Status</span>
                        <span
                          className={
                            "text-[12px] px-2 py-[2px] rounded-md border " +
                            (view?.status === "Confirmed"
                              ? "bg-emerald-500/10 border-emerald-600 text-emerald-300"
                              : "bg-amber-500/10 border-amber-600 text-amber-300")
                          }
                        >
                          {view?.status || "—"}
                        </span>
                      </dt>
                      <dd>
                        <div className="text-neutral-400 text-sm mt-1">{view?.confLabel || "—"}</div>
                        <div className="mt-2 h-2 rounded bg-neutral-800 overflow-hidden">
                          <div
                            className={`h-full ${view?.status === "Confirmed" ? "bg-emerald-600" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(100, ((view?.confRaw || 0) / TARGET_CONF) * 100)}%` }}
                          />
                        </div>
                      </dd>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                      <dt className="text-neutral-400">Time</dt>
                      <dd className="font-medium">{view?.timeLabel || "—"}</dd>
                    </div>

                    <div className="px-4 py-3">
                      <dt className="text-neutral-400">Transaction ID</dt>
                      <dd>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-sm text-neutral-300">{view?.txid ? shorten(view.txid, 12, 6) : "—"}</span>
                          <button onClick={copyTxid} disabled={!view?.txid} className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50">
                            Copy Transaction ID
                          </button>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="px-4 pb-5">
                  <a
                    href={view?.txid ? `https://www.blockchain.com/explorer/transactions/btc/${view.txid}` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3"
                    onClick={(e) => !view?.txid && e.preventDefault()}
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
              <div className="h-6" />
            </div>
          </DeviceFrame>
        </section>
      </main>
    </div>
  );
}
