import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { toPng } from "html-to-image";

import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { Toasts } from "./components/common/Toasts";
import { Header } from "./components/layout/Header";
import { DeviceFrame } from "./components/preview/DeviceFrame";
import { TransactionPreview } from "./components/preview/TransactionPreview";
import { AccelerationForm } from "./components/acceleration/AccelerationForm";
import { AccelerationHistory } from "./components/acceleration/AccelerationHistory";
import { AddressInput } from "./components/address/AddressInput";
import { AddressSummary } from "./components/address/AddressSummary";
import { TransactionSelector } from "./components/address/TransactionSelector";

import { useRateLimit } from "./hooks/useRateLimit";
import { useToasts } from "./hooks/useToasts";

import { blockchainAPI } from "./services/blockchainApi";

import {
  satsToBtc,
  fmtBtc,
  fmtUSD,
  fmtDateTime,
  shorten,
} from "./utils/formatters";
import { isLikelyTxid, isLikelyBtcAddress } from "./utils/validators";
import { ymd, dayStart } from "./utils/dateUtils";
import { friendlyError } from "./utils/errorHelpers";

/* =========================
   MAIN APP
========================= */
function App() {
  const [device, setDevice] = useState("iphone");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { toasts, addToast, removeToast } = useToasts();
  const rateLimitedFetch = useRateLimit(2000);

  // Summary
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [summary, setSummary] = useState({
    balanceSats: null,
    receivedSats: null,
    sentSats: null,
    usdPrice: null,
  });

  // TXs
  const [txs, setTxs] = useState([]);
  const [selectedTxid, setSelectedTxid] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  // Hydrated details
  const [blockHeight, setBlockHeight] = useState(null);
  const [tipHeight, setTipHeight] = useState(null);
  const [usdDaily, setUsdDaily] = useState(null);
  const [txSize, setTxSize] = useState(null);

  // Acceleration
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [accelerationHistory, setAccelerationHistory] = useState([]);

  const TARGET_CONF = 4;
  const previewRef = useRef(null);

  /* ---------- CLASSIFY (fixed: net value) ---------- */
  const classify = useCallback(
    (t) => {
      const outToAddr =
        t.outs?.reduce((a, o) => a + (o.addr === address ? o.value : 0), 0) ||
        0;
      const inFromAddr =
        t.ins?.reduce((a, i) => a + (i.addr === address ? i.value : 0), 0) ||
        0;
      const netValue = outToAddr - inFromAddr; // key fix
      const isIncoming = netValue > 0;
      return { isIncoming, outToAddr, inFromAddr, netValue };
    },
    [address]
  );

  const selectedTx = useMemo(
    () => txs.find((t) => t.hash === selectedTxid) || null,
    [txs, selectedTxid]
  );

  const classifiedTxs = useMemo(
    () => txs.map((t) => ({ ...t, ...classify(t) })),
    [txs, classify]
  );

  /* ---------- USD (daily) price near tx time ---------- */
  const fetchUsdFromBlockchainCharts = useCallback(async (timestamp) => {
    const controller = new AbortController();
    try {
      const targetDate = new Date(Number(timestamp) * 1000);
      const targetYmd = ymd(targetDate);
      const start = dayStart(timestamp, -5);
      const url = `https://api.blockchain.info/charts/market-price?start=${start}&timespan=60days&format=json&cors=true`;
      const { data } = await axios.get(url, {
        timeout: 20000,
        signal: controller.signal,
      });
      const values = Array.isArray(data?.values) ? data.values : [];
      if (!values.length) return null;

      let exactMatch = null;
      let closestMatch = null;
      let minDiff = Infinity;

      for (const v of values) {
        const chartDate = new Date(Number(v?.x || 0) * 1000);
        const chartYmd = ymd(chartDate);
        if (chartYmd === targetYmd) {
          exactMatch = v;
          break;
        }
        const diff = Math.abs(chartDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestMatch = v;
        }
      }

      const best = exactMatch || closestMatch;
      return typeof best?.y === "number" ? best.y : null;
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.warn("Failed to fetch historical USD price:", error);
      }
      return null;
    }
  }, []);

  /* ---------- Summary ---------- */
  const fetchAddressSummary = useCallback(async () => {
    if (!address) return;
    const controller = new AbortController();
    setAddrError("");
    setAddrLoading(true);
    setSummary({
      balanceSats: null,
      receivedSats: null,
      sentSats: null,
      usdPrice: null,
    });

    try {
      const [balRes, recRes, sentRes, tickerRes] = await Promise.all([
        blockchainAPI.getAddressBalance(address),
        blockchainAPI.getAddressReceived(address),
        blockchainAPI.getAddressSent(address),
        blockchainAPI.getTicker(),
      ]);

      if (controller.signal.aborted) return;

      const balanceSats = Number(balRes.data);
      const receivedSats = Number(recRes.data);
      const sentSats = Number(sentRes.data);
      const usdPrice =
        tickerRes?.data?.USD?.last ?? tickerRes?.data?.USD?.["15m"] ?? null;

      setSummary({
        balanceSats: Number.isFinite(balanceSats) ? balanceSats : null,
        receivedSats: Number.isFinite(receivedSats) ? receivedSats : null,
        sentSats: Number.isFinite(sentSats) ? sentSats : null,
        usdPrice: Number.isFinite(usdPrice) ? usdPrice : null,
      });
    } catch (e) {
      if (!controller.signal.aborted) {
        setAddrError(friendlyError(e, address, "address"));
      }
    } finally {
      if (!controller.signal.aborted) {
        setAddrLoading(false);
      }
    }

    return () => controller.abort();
  }, [address]);

  /* ---------- Fetch TXs ---------- */
  const fetchAddressTxs = useCallback(async () => {
    if (!address) return;

    rateLimitedFetch(async () => {
      const controller = new AbortController();

      setError("");
      setLoading(true);
      setTxs([]);
      setSelectedTxid("");
      setBlockHeight(null);
      setTipHeight(null);
      setUsdDaily(null);
      setTxSize(null);

      addToast("Hold on small—we dey pull your address gist…", "info");

      if (isLikelyTxid(address) && !isLikelyBtcAddress(address)) {
        const msg = friendlyError({ response: {} }, address, "address");
        setError(msg);
        addToast(msg, "error");
        setLoading(false);
        return;
      }

      try {
        const [{ data }] = await Promise.all([
          blockchainAPI.getAddressTransactions(address),
          fetchAddressSummary(),
        ]);

        if (controller.signal.aborted) return;

        const list = Array.isArray(data?.txs) ? data.txs : [];
        const mapped = list.map((t) => {
          const outs = Array.isArray(t?.out)
            ? t.out.map((o) => ({
                addr: o?.addr || "",
                value: Number(o?.value || 0),
              }))
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

        // choose first by current filter on *classified* list
        const first = mapped
          .map((t) => ({ ...t, ...classify(t) }))
          .find((t) =>
            filterMode === "incoming"
              ? t.isIncoming
              : filterMode === "outgoing"
              ? !t.isIncoming
              : true
          );
        if (first) setSelectedTxid(first.hash);

        if (!mapped.length) {
          const msg = "Area still dry—no transactions for this address yet.";
          setError(msg);
          addToast(msg, "info");
        } else {
          addToast(
            `We don load ${mapped.length} transaction${
              mapped.length > 1 ? "s" : ""
            }.`,
            "success"
          );
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          const msg = friendlyError(e, address, "address");
          setError(msg);
          addToast(msg, "error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }

      return () => controller.abort();
    });
  }, [address, addToast, fetchAddressSummary, classify, filterMode, rateLimitedFetch]);

  /* ---------- Hydrate selected tx ---------- */
  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function hydrate() {
      setBlockHeight(null);
      setTipHeight(null);
      setUsdDaily(null);
      setTxSize(null);
      if (!selectedTx) return;

      try {
        const [{ data: txd }, tipRes] = await Promise.all([
          blockchainAPI.getTransaction(selectedTx.hash),
          blockchainAPI.getBlockCount(),
        ]);

        if (ignore || controller.signal.aborted) return;

        setBlockHeight(
          typeof txd?.block_height === "number" ? txd.block_height : null
        );
        const tip = Number(tipRes.data);
        setTipHeight(Number.isFinite(tip) ? tip : null);

        const sizeBytes =
          typeof txd?.size === "number"
            ? txd.size
            : typeof txd?.weight === "number"
            ? Math.round(Number(txd.weight) / 4)
            : null;
        setTxSize(sizeBytes);

        const price = await fetchUsdFromBlockchainCharts(selectedTx.time);
        if (!ignore && !controller.signal.aborted) {
          setUsdDaily(price);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Failed to hydrate transaction:", error);
        }
      }
    }

    hydrate();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedTx, fetchUsdFromBlockchainCharts]);

  /* ---------- Filtered list ---------- */
  const filteredTxs = useMemo(() => {
    if (!classifiedTxs.length) return [];
    return classifiedTxs.filter((t) => {
      if (filterMode === "incoming") return t.isIncoming;
      if (filterMode === "outgoing") return !t.isIncoming;
      return true;
    });
  }, [classifiedTxs, filterMode]);

  /* ---------- Derived view (uses net value) ---------- */
  const view = useMemo(() => {
    if (!selectedTx) return null;

    const outToAddr =
      selectedTx.outs?.reduce(
        (a, o) => a + (o.addr === address ? o.value : 0),
        0
      ) || 0;
    const inFromAddr =
      selectedTx.ins?.reduce(
        (a, i) => a + (i.addr === address ? i.value : 0),
        0
      ) || 0;
    const netValue = outToAddr - inFromAddr; // key difference
    const isIncoming = netValue > 0;

    const valueSats = Math.abs(netValue);
    const amountBtc = satsToBtc(valueSats);
    const feeBtc = satsToBtc(selectedTx.fee);

    const conf =
      blockHeight == null || tipHeight == null
        ? 0
        : Math.max(0, tipHeight - blockHeight + 1);

    const statusPhrase =
      conf === 0
        ? "Pending"
        : conf >= TARGET_CONF
        ? "Completed"
        : `Confirming ${conf}/${TARGET_CONF}`;
    const confLabel = `${Math.min(conf, TARGET_CONF)}/${TARGET_CONF} confirmations`;

    const amountUsd = usdDaily != null ? amountBtc * usdDaily : null;
    const feeUsd = usdDaily != null ? feeBtc * usdDaily : null;
    const feeRate = txSize ? selectedTx.fee / txSize : null;

    return {
      title: `${isIncoming ? "Received" : "Sent"} BTC`,
      isIncoming,
      amountBtc,
      amountUsd,
      feeBtc,
      feeUsd,
      feeRate,
      statusPhrase,
      confLabel,
      confRaw: conf,
      timeLabel: fmtDateTime(selectedTx.time),
      txid: selectedTx.hash,
      isUnconfirmed: conf === 0,
    };
  }, [selectedTx, address, blockHeight, tipHeight, usdDaily, txSize]);

  /* ---------- Acceleration ---------- */
  const handleAccelerate = useCallback((accelerationData) => {
    setAccelerationHistory((prev) => [...prev, accelerationData]);
    setShowAcceleration(false);
  }, []);

  /* ---------- Copy & PNG ---------- */
  const copyTxid = useCallback(async () => {
    if (!view?.txid) return;
    try {
      await navigator.clipboard.writeText(view.txid);
      addToast("TXID don enter clipboard. Baba, you sabi!", "success");
    } catch {
      addToast("Copy fail—try again small.", "error");
    }
  }, [view?.txid, addToast]);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      addToast("Address don copy. You fit paste am anywhere now.", "success");
    } catch {
      addToast("Copy fail—try again small.", "error");
    }
  }, [address, addToast]);

  const downloadPNG = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      addToast("Saving screenshot—hold on small…", "info");
      const dataUrl = await toPng(previewRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `btc-tx-${shorten(selectedTxid || "preview")}.png`;
      a.click();
      addToast("PNG saved. Check your downloads.", "success");
    } catch {
      addToast(
        "Could not generate screenshot—e be like say canvas dey vex.",
        "error"
      );
    }
  }, [previewRef, selectedTxid, addToast]);

  /* ---------- USD helpers ---------- */
  const balanceUsd = useMemo(
    () =>
      summary.balanceSats != null && summary.usdPrice != null
        ? satsToBtc(summary.balanceSats) * summary.usdPrice
        : null,
    [summary.balanceSats, summary.usdPrice]
  );
  const receivedUsd = useMemo(
    () =>
      summary.receivedSats != null && summary.usdPrice != null
        ? satsToBtc(summary.receivedSats) * summary.usdPrice
        : null,
    [summary.receivedSats, summary.usdPrice]
  );
  const sentUsd = useMemo(
    () =>
      summary.sentSats != null && summary.usdPrice != null
        ? satsToBtc(summary.sentSats) * summary.usdPrice
        : null,
    [summary.sentSats, summary.usdPrice]
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <Toasts toasts={toasts} onClose={removeToast} />

        <Header
          device={device}
          setDevice={setDevice}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
        />

        <main className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
          {/* Controls */}
          <section className="space-y-4">
            <AddressInput
              address={address}
              setAddress={setAddress}
              copyAddress={copyAddress}
              fetchAddressTxs={fetchAddressTxs}
              loading={loading}
              error={error}
            />

            <AddressSummary
              address={address}
              summary={summary}
              addrLoading={addrLoading}
              addrError={addrError}
              balanceUsd={balanceUsd}
              receivedUsd={receivedUsd}
              sentUsd={sentUsd}
            />

            <TransactionSelector
              filteredTxs={filteredTxs}
              loading={loading}
              selectedTxid={selectedTxid}
              setSelectedTxid={setSelectedTxid}
            />

            {/* Acceleration */}
            {selectedTx && view?.isUnconfirmed && (
              <>
                {showAcceleration ? (
                  <AccelerationForm
                    txid={selectedTxid}
                    currentFeeRate={view?.feeRate}
                    onAccelerate={handleAccelerate}
                    onCancel={() => setShowAcceleration(false)}
                    addToast={addToast}
                  />
                ) : (
                  <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
                    <h3 className="text-sm font-semibold mb-3">
                      Transaction Acceleration
                    </h3>
                    <p className="text-xs text-neutral-400 mb-3">
                      This transaction is <b>unconfirmed</b>. Rebroadcast to
                      more nodes for better propagation. (To truly increase
                      fees, use RBF/CPFP.)
                    </p>
                    <button
                      onClick={() => setShowAcceleration(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-xl px-4 py-2 font-medium transition-colors"
                      aria-label="Open acceleration form"
                    >
                      Accelerate (Rebroadcast)
                    </button>
                  </div>
                )}
              </>
            )}

            <AccelerationHistory accelerations={accelerationHistory} />

            {/* Screenshot */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
              <button
                onClick={downloadPNG}
                className="bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-xl px-4 py-2 font-semibold transition-colors disabled:opacity-50"
                disabled={!selectedTx}
                aria-label="Generate screenshot as PNG"
              >
                Generate Screenshot (PNG)
              </button>
            </div>

            <p className="text-[11px] text-neutral-500">
              Amount = <b>real value moved</b> using{" "}
              <b>net change to your address</b> (outputs to you minus inputs
              from you). USD uses Blockchain.com daily market price near the
              transaction date.
            </p>
          </section>

          {/* Phone preview */}
          <section className="flex items-start justify-center">
            <DeviceFrame device={device} ref={previewRef}>
              <TransactionPreview
                view={view}
                TARGET_CONF={TARGET_CONF}
                copyTxid={copyTxid}
                addToast={addToast}
              />
            </DeviceFrame>
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
