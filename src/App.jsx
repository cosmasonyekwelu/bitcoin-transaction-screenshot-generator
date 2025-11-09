import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useCallback,
} from "react";
import axios from "axios";
import { toPng } from "html-to-image";

/* =========================
   API CONFIG
========================= */
const API_CONFIG = {
  timeout: 15000,
  withCredentials: false,
};

/* =========================
   ERROR BOUNDARY
========================= */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-2xl mb-4">🚧 Something went wrong</div>
            <p className="text-neutral-400 mb-4">
              Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-900 rounded-xl px-4 py-2 font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* =========================
   API SERVICE
========================= */
const blockchainAPI = {
  getAddressBalance: (address) =>
    axios.get(
      `https://blockchain.info/q/addressbalance/${encodeURIComponent(
        address
      )}?confirmations=0&cors=true`,
      API_CONFIG
    ),
  getAddressReceived: (address) =>
    axios.get(
      `https://blockchain.info/q/getreceivedbyaddress/${encodeURIComponent(
        address
      )}?confirmations=0&cors=true`,
      API_CONFIG
    ),
  getAddressSent: (address) =>
    axios.get(
      `https://blockchain.info/q/getsentbyaddress/${encodeURIComponent(
        address
      )}?confirmations=0&cors=true`,
      API_CONFIG
    ),
  getTicker: () =>
    axios.get(`https://blockchain.info/ticker?cors=true`, API_CONFIG),
  getAddressTransactions: (address) =>
    axios.get(
      `https://blockchain.info/rawaddr/${encodeURIComponent(
        address
      )}?limit=10&cors=true`,
      API_CONFIG
    ),
  getTransaction: (txid) =>
    axios.get(
      `https://blockchain.info/rawtx/${encodeURIComponent(txid)}?cors=true`,
      API_CONFIG
    ),
  getBlockCount: () =>
    axios.get("https://blockchain.info/q/getblockcount?cors=true", API_CONFIG),
};

/* =========================
   RATE LIMIT HOOK
========================= */
const useRateLimit = (delay = 1000) => {
  const lastCallRef = useRef(0);
  return useCallback(
    (fn) => {
      const now = Date.now();
      if (now - lastCallRef.current > delay) {
        lastCallRef.current = now;
        return fn();
      }
    },
    [delay]
  );
};

/* =========================
   TOASTS (with cleanup)
========================= */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timeoutRefs = useRef(new Map());

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((t) => clearTimeout(t));
      timeoutRefs.current.clear();
    };
  }, []);

  const addToast = useCallback((text, type = "info", timeout = 4200) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, text, type }]);
    if (timeout) {
      const tid = setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
        timeoutRefs.current.delete(id);
      }, timeout);
      timeoutRefs.current.set(id, tid);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
  }, []);

  return { toasts, addToast, removeToast };
}

const Toasts = React.memo(({ toasts, onClose }) => (
  <div className="fixed z-[9999] bottom-4 right-4 flex flex-col gap-2 max-w-sm">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={[
          "rounded-xl border px-3 py-2 shadow-lg text-sm backdrop-blur",
          t.type === "success"
            ? "bg-emerald-500/10 border-emerald-700 text-emerald-200"
            : t.type === "error"
            ? "bg-rose-500/10 border-rose-700 text-rose-200"
            : "bg-neutral-800/70 border-neutral-700 text-neutral-100",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <span>{t.text}</span>
          <button
            onClick={() => onClose(t.id)}
            className="text-xs opacity-80 hover:opacity-100 transition-opacity"
            aria-label={`Close notification: ${t.text}`}
            onKeyDown={(e) => e.key === "Enter" && onClose(t.id)}
          >
            ✕
          </button>
        </div>
      </div>
    ))}
  </div>
));

/* =========================
   HELPERS
========================= */
const satsToBtc = (s) => Number(s || 0) / 1e8;
const fmtBtc = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
const fmtUSD = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
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

/* detectors */
const isLikelyTxid = (s) => !!s && /^[0-9a-fA-F]{64}$/.test(s.trim());
const isLikelyBtcAddress = (s) =>
  !!s && /^(bc1[a-z0-9]{10,}|[13][a-km-zA-HJ-NP-Z1-9]{20,})$/.test(s.trim());

/* friendly error */
function friendlyError(e, input, where = "address") {
  const status = e?.response?.status;
  const raw =
    e?.response?.data?.message || e?.response?.data || e?.message || "";
  const rawLower = String(raw).toLowerCase();

  if (isLikelyTxid(input) && where === "address") {
    return "Oga, that one na TXID, no be address. Paste a Bitcoin address (bc1…, 1…, 3…) to load history.";
  }
  if (!isLikelyBtcAddress(input) && where === "address") {
    return "Boss, this address no correct. Make sure e start with bc1…, 1… or 3…, no spaces.";
  }
  if (status === 404 || rawLower.includes("item not found")) {
    return "We no see this address for explorer o. Abeg cross-check am and try again.";
  }
  if (status === 400 || rawLower.includes("argument invalid")) {
    return "Format no pure. Use valid Bitcoin address, no typos, no emojis.";
  }
  if (status === 429) {
    return "Chill small—too many requests. Give am few seconds, try again.";
  }
  if (e?.code === "ECONNABORTED" || rawLower.includes("timeout")) {
    return "Network dey do shakara. Check your internet or try later.";
  }
  if (rawLower.includes("network error")) {
    return "Network wahala. One more try go solve am.";
  }
  const hint = raw ? ` (${String(raw).slice(0, 80)})` : "";
  return `Something no gel. Try again in a bit.${hint}`;
}

/* charts date utils */
const ymd = (d) => d.toISOString().slice(0, 10);
const dayStart = (unix, deltaDays = 0) => {
  const d = new Date(Number(unix) * 1000);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  d.setUTCHours(0, 0, 0, 0);
  return ymd(d);
};

/* =========================
   DEVICE FRAME
========================= */
const StatusBar = React.memo(({ device = "iphone" }) => {
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
                <div
                  key={i}
                  className="w-[3px] rounded-sm bg-neutral-300"
                  style={{ height: h }}
                />
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
              <div
                key={i}
                className="w-[3px] rounded-sm bg-neutral-300"
                style={{ height: h }}
              />
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
});

const DeviceFrame = React.memo(
  forwardRef(function DeviceFrame({ device = "iphone", children }, ref) {
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
  })
);

/* =========================
   MEMPOOL HELPERS
========================= */
async function getMempoolTxMeta(txid) {
  const { data } = await axios.get(
    `https://mempool.space/api/tx/${encodeURIComponent(txid)}`,
    { timeout: 15000 }
  );
  return {
    fee: typeof data?.fee === "number" ? data.fee : null,
    vsize: typeof data?.vsize === "number" ? data.vsize : null,
    replaceable: !!data?.status?.replaceable,
    confirmed: !!data?.status?.confirmed,
  };
}
async function getMempoolHex(txid) {
  const { data } = await axios.get(
    `https://mempool.space/api/tx/${encodeURIComponent(txid)}/hex`,
    { timeout: 15000 }
  );
  if (!data || typeof data !== "string" || !/^[0-9a-fA-F]+$/.test(data))
    throw new Error("Could not fetch raw hex.");
  return data.trim();
}
async function getMempoolFees() {
  const { data } = await axios.get(
    `https://mempool.space/api/v1/fees/recommended`,
    { timeout: 15000 }
  );
  return data || null;
}

/* =========================
   BROADCAST (REBROADCAST)
========================= */
const ESPLORA_TARGETS = [
  "https://mempool.space/api/tx",
  "https://blockstream.info/api/tx",
];

async function broadcastEverywhere({ rawHex }) {
  const results = {};

  // blockchain.info
  try {
    const body = new URLSearchParams({ tx: rawHex }).toString();
    const { data, status } = await axios.post(
      "https://blockchain.info/pushtx?cors=true",
      body,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000,
        validateStatus: () => true,
        withCredentials: false,
      }
    );
    results["blockchain.info"] = {
      ok: status >= 200 && status < 300,
      status,
      data,
    };
  } catch (e) {
    results["blockchain.info"] = {
      ok: false,
      status: null,
      error: e?.message || "request failed",
    };
  }

  // Esplora-compatible
  for (const url of ESPLORA_TARGETS) {
    const name = new URL(url).hostname;
    try {
      const { data, status } = await axios.post(url, rawHex, {
        headers: { "Content-Type": "text/plain" },
        timeout: 20000,
        validateStatus: () => true,
        withCredentials: false,
      });
      results[name] = { ok: status >= 200 && status < 300, status, data };
    } catch (e) {
      results[name] = {
        ok: false,
        status: null,
        error: e?.message || "request failed",
      };
    }
  }

  return results;
}

/* =========================
   ACCELERATION UI
========================= */
const AccelerationForm = ({
  txid,
  currentFeeRate,
  onAccelerate,
  onCancel,
  addToast,
}) => {
  const [feeRate, setFeeRate] = useState(
    currentFeeRate ? Math.ceil(currentFeeRate * 1.5) : 20
  );
  const [accelerating, setAccelerating] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [fees, setFees] = useState(null);
  const [meta, setMeta] = useState(null);
  const feeInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    (async () => {
      try {
        const [f, m] = await Promise.all([
          getMempoolFees(),
          getMempoolTxMeta(txid),
        ]);
        if (ignore || controller.signal.aborted) return;
        setFees(f || null);
        setMeta(m || null);
        if (m?.fee && m?.vsize && !currentFeeRate) {
          setFeeRate(Math.ceil((m.fee / m.vsize) * 1.5));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Failed to fetch acceleration data:", error);
        }
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [txid, currentFeeRate]);

  useEffect(() => {
    // focus first interactive input on mount
    feeInputRef.current?.focus();
  }, []);

  const handleAccelerate = async () => {
    setAccelerating(true);
    setErr("");
    setResult(null);
    addToast?.(
      "We don dey rebroadcast your TX—make mempool hear am.",
      "info"
    );

    try {
      const m = meta || (await getMempoolTxMeta(txid));
      if (m?.confirmed) {
        const msg =
          "This transaction don confirm already—no need to rebroadcast.";
        setErr(msg);
        addToast?.(msg, "success");
        setAccelerating(false);
        return;
      }
      const hex = await getMempoolHex(txid);
      const results = await broadcastEverywhere({ rawHex: hex });
      setResult({ results, txid, hexPreview: shorten(hex, 12, 8) });

      const okCount = Object.values(results).filter((r) => r?.ok).length;
      const total = Object.keys(results).length;
      addToast?.(
        `Rebroadcast done: ${okCount}/${total} endpoints gree.`,
        okCount ? "success" : "error"
      );

      onAccelerate({
        txid,
        feeRate,
        accelerationId: "rebroadcast_" + Math.random().toString(36).slice(2, 10),
        timestamp: Date.now(),
        estimatedConfirmationTime: Math.floor(Math.random() * 6) + 1,
      });
    } catch (e) {
      const msg = e?.response?.data || e?.message || "Rebroadcast failed";
      setErr(msg);
      addToast?.("Rebroadcast fail—network dey whine. Try again soon.", "error");
    } finally {
      setAccelerating(false);
    }
  };

  const currSatVb =
    meta?.fee && meta?.vsize ? meta.fee / meta.vsize : currentFeeRate;

  return (
    <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
      <h3 className="text-sm font-semibold">Accelerate (Rebroadcast)</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Transaction ID
          </label>
          <div className="font-mono text-sm bg-neutral-800 p-2 rounded-lg">
            {shorten(txid)}
          </div>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">
            Detected Fee Rate
          </label>
          <div className="text-sm">
            {currSatVb ? `${currSatVb.toFixed(1)} sat/vB` : "—"}
          </div>
        </div>
        <div>
          <label
            htmlFor="fee-rate-input"
            className="block text-xs text-neutral-400 mb-1"
          >
            Target Fee Rate (UI hint)
          </label>
          <input
            ref={feeInputRef}
            id="fee-rate-input"
            type="number"
            min={currSatVb ? Math.ceil(currSatVb * 1.1) : 1}
            max={1000}
            value={feeRate}
            onChange={(e) => setFeeRate(Number(e.target.value))}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 outline-none"
            aria-describedby="fee-rate-help"
          />
          <div id="fee-rate-help" className="text-xs text-neutral-500 mt-1">
            Rebroadcasting no dey raise fees. Use <b>RBF</b> (if replaceable) or{" "}
            <b>CPFP</b> to truly speed up.
          </div>
        </div>
      </div>

      {!!fees && (
        <div className="rounded-xl border border-neutral-800 p-3 text-xs">
          <div className="text-neutral-400 mb-1">mempool.space fee guide</div>
          <ul className="space-y-1">
            <li>
              Fastest: <b>{fees.fastestFee}</b> sat/vB
            </li>
            <li>
              ~30 min: <b>{fees.halfHourFee}</b> sat/vB
            </li>
            <li>
              ~60 min: <b>{fees.hourFee}</b> sat/vB
            </li>
            <li>
              Minimum: <b>{fees.minimumFee}</b> sat/vB
            </li>
          </ul>
        </div>
      )}

      {err && (
        <div
          className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-300"
          role="alert"
          aria-live="polite"
        >
          {String(err).slice(0, 600)}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-neutral-800 text-neutral-300">
              <tr>
                <th className="text-left p-2">Service</th>
                <th className="text-left p-2">OK</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Message / Data</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.results).map(([name, r]) => (
                <tr key={name} className="border-t border-neutral-800">
                  <td className="p-2">{name}</td>
                  <td className="p-2">{r?.ok ? "✅" : "❌"}</td>
                  <td className="p-2">{r?.status ?? "—"}</td>
                  <td className="p-2">
                    <div className="max-w-[520px] whitespace-pre-wrap break-words text-neutral-300">
                      {typeof r?.data === "string"
                        ? r.data.slice(0, 400)
                        : JSON.stringify(r?.data ?? r?.error ?? "", null, 2).slice(
                            0,
                            400
                          )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 text-[11px] text-neutral-500">
            Raw hex preview: {result.hexPreview}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleAccelerate}
          disabled={accelerating || meta?.confirmed}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-900 rounded-xl px-4 py-2 font-medium transition-colors"
          aria-label={
            accelerating
              ? "Rebroadcasting transaction"
              : meta?.confirmed
              ? "Transaction already confirmed"
              : "Rebroadcast transaction"
          }
        >
          {accelerating
            ? "Rebroadcasting…"
            : meta?.confirmed
            ? "Already confirmed"
            : "Rebroadcast"}
        </button>
        <button
          onClick={onCancel}
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl px-4 py-2 transition-colors"
          aria-label="Cancel acceleration"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const AccelerationHistory = React.memo(({ accelerations }) => {
  if (!accelerations || accelerations.length === 0) return null;
  return (
    <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
      <h3 className="text-sm font-semibold mb-3">Acceleration History</h3>
      <div className="space-y-3">
        {accelerations.map((acc) => (
          <div
            key={`${acc.txid}-${acc.timestamp}`}
            className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-mono">
                  {shorten(acc.txid, 8, 4)}
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(acc.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{acc.feeRate} sat/vB</div>
                <div className="text-xs text-neutral-400">
                  Est: {acc.estimatedConfirmationTime} blocks
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

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

    const uniqueIns = [
      ...new Set((selectedTx.ins || []).map((i) => i.addr).filter(Boolean)),
    ];
    const uniqueOuts = [
      ...new Set((selectedTx.outs || []).map((o) => o.addr).filter(Boolean)),
    ];
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
      statusPhrase,
      confLabel,
      confRaw: conf,
      timeLabel: fmtDateTime(selectedTx.time),
      txid: selectedTx.hash,
      fromPeek,
      fromCount: uniqueIns.length,
      toPeek,
      toCount: uniqueOuts.length,
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

  const statusChipClasses = useCallback(
    (phrase) =>
      "text-[12px] px-2 py-[2px] rounded-md border " +
      (phrase === "Completed"
        ? "bg-emerald-500/10 border-emerald-600 text-emerald-300"
        : phrase.startsWith("Confirming")
        ? "bg-amber-500/10 border-amber-600 text-amber-300"
        : "bg-rose-500/10 border-rose-600 text-rose-300"),
    []
  );
  const barColor = useCallback(
    (phrase) =>
      phrase === "Completed"
        ? "bg-emerald-600"
        : phrase.startsWith("Confirming")
        ? "bg-amber-500"
        : "bg-rose-500",
    []
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <Toasts toasts={toasts} onClose={removeToast} />

        {/* Header */}
        <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
          <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 grid place-items-center text-neutral-900 font-bold">
                ₿
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  BTC Transaction Screenshot Generator
                </h1>
                <p className="text-xs text-neutral-400">
                  Blockchain.com explorer + charts (USD) • iPhone/Samsung frame
                  • PNG export • Rebroadcast
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="device-select" className="text-xs text-neutral-400">
                  Device
                </label>
                <select
                  id="device-select"
                  className="bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-sm outline-none"
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                >
                  <option value="iphone">iPhone</option>
                  <option value="galaxy">Samsung Galaxy</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="filter-select" className="text-xs text-neutral-400">
                  Filter
                </label>
                <select
                  id="filter-select"
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
          {/* Controls */}
          <section className="space-y-4">
            {/* Input + fetch */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="w-full">
                  <span className="block text-xs text-neutral-400 mb-1">
                    Bitcoin Address
                  </span>
                  <input
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 outline-none placeholder:text-neutral-500"
                    placeholder="bc1… / 1… / 3… (paste address — not TXID)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value.trim())}
                    spellCheck={false}
                    aria-describedby="address-help"
                  />
                </label>
                <div className="self-end flex gap-2">
                  <button
                    onClick={copyAddress}
                    disabled={!address}
                    className="bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
                    aria-label="Copy address to clipboard"
                  >
                    Copy
                  </button>
                  <button
                    onClick={fetchAddressTxs}
                    disabled={!address || loading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 font-medium transition-colors"
                    aria-label={
                      loading
                        ? "Fetching transactions"
                        : "Fetch transactions for address"
                    }
                  >
                    {loading ? "Fetching…" : "Fetch Transactions"}
                  </button>
                </div>
              </div>
              {error && (
                <div
                  className="text-sm text-red-300 bg-red-950/40 border border-red-800 rounded-xl px-3 py-2"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Address Summary</h2>
                {addrLoading && (
                  <span className="text-xs text-neutral-400">Loading…</span>
                )}
              </div>

              {addrError && (
                <div
                  className="mt-2 text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-xl px-3 py-2"
                  role="alert"
                >
                  {addrError}
                </div>
              )}

              <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                <div className="bg-neutral-850/40 border border-neutral-800 rounded-xl p-3">
                  <div className="text-neutral-400">Address</div>
                  <div className="font-mono text-neutral-200">
                    {address ? shorten(address, 16, 10) : "—"}
                  </div>
                </div>

                <div className="bg-neutral-850/40 border border-neutral-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-neutral-400">Current Balance</div>
                    <div className="font-medium">
                      {balanceUsd == null ? "—" : fmtUSD(balanceUsd)}
                    </div>
                    <div className="text-neutral-400 text-xs">
                      {summary.balanceSats == null
                        ? ""
                        : `${fmtBtc(satsToBtc(summary.balanceSats))} BTC`}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400">BTC Price (USD)</div>
                    <div className="font-medium">
                      {summary.usdPrice == null ? "—" : fmtUSD(summary.usdPrice)}
                    </div>
                    <div className="text-neutral-400 text-xs">
                      Source: blockchain.info/ticker
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-850/40 border border-neutral-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-neutral-400">Total Received</div>
                    <div className="font-medium">
                      {receivedUsd == null ? "—" : fmtUSD(receivedUsd)}
                    </div>
                    <div className="text-neutral-400 text-xs">
                      {summary.receivedSats == null
                        ? ""
                        : `${fmtBtc(satsToBtc(summary.receivedSats))} BTC`}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Total Sent</div>
                    <div className="font-medium">
                      {sentUsd == null ? "—" : fmtUSD(sentUsd)}
                    </div>
                    <div className="text-neutral-400 text-xs">
                      {summary.sentSats == null
                        ? ""
                        : `${fmtBtc(satsToBtc(summary.sentSats))} BTC`}
                    </div>
                  </div>
                </div>

                {address && (
                  <a
                    href={`https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(
                      address
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    aria-label="View address on Blockchain.com explorer"
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
                <p className="text-xs text-neutral-400">
                  {loading ? "Loading…" : "No transactions in this filter."}
                </p>
              ) : (
                <select
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 outline-none"
                  value={selectedTxid}
                  onChange={(e) => setSelectedTxid(e.target.value)}
                  aria-label="Select transaction to view details"
                >
                  {filteredTxs.map((t) => (
                    <option key={t.hash} value={t.hash}>
                      {shorten(t.hash, 12, 12)} • {fmtDateTime(t.time)}
                    </option>
                  ))}
                </select>
              )}
            </div>

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
              <div className="min-h-full bg-neutral-900">
                <div className="mx-3 mt-4 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
                  {/* header */}
                  <div className="relative">
                    <div className="h-10 bg-gradient-to-r from-purple-700/60 to-blue-600/55" />
                    <button
                      className="absolute right-3 -top-3 w-7 h-7 rounded-full bg-neutral-800/90 text-neutral-300 grid place-items-center border border-neutral-700 transition-colors"
                      aria-label="Close wallet view"
                      onClick={() => addToast("We dey here for you.", "info")}
                      onKeyDown={(e) =>
                        e.key === "Enter" && addToast("We dey here for you.", "info")
                      }
                    >
                      ✕
                    </button>
                  </div>

                  {/* title/status */}
                  <div className="px-5 pt-3 pb-1 flex items-center gap-2">
                    <span
                      className={`w-5 h-5 grid place-items-center rounded-full ${
                        view?.isIncoming ? "bg-emerald-700/40" : "bg-neutral-800"
                      }`}
                    >
                      {view?.isIncoming ? "↓" : "↗"}
                    </span>
                    <h3 className="text-base font-semibold">
                      {view?.title || "Sent BTC"}
                    </h3>
                  </div>

                  {/* amount */}
                  <div className="mx-4 mt-3 rounded-[22px] bg-neutral-850/40 border border-neutral-800 px-4 py-3 grid grid-cols-2 gap-4 items-center">
                    <div className="text-neutral-400">BTC</div>
                    <div className="text-right">
                      <div className="text-[17px] font-semibold">
                        {fmtBtc(view?.amountBtc || 0)} BTC
                      </div>
                      <div className="text-neutral-400 text-sm">
                        {view?.amountUsd != null ? fmtUSD(view.amountUsd) : "—"}
                      </div>
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
                          <div className="font-medium">
                            {fmtBtc(view?.feeBtc || 0)} BTC
                          </div>
                          <div className="text-neutral-400 text-sm">
                            {view?.feeUsd != null ? fmtUSD(view.feeUsd) : "—"}
                          </div>
                          {view?.feeRate != null && (
                            <div className="text-neutral-500 text-xs mt-1">
                              {view.feeRate.toFixed(1)} sat/vB
                            </div>
                          )}
                        </dd>
                      </div>

                      <div className="px-4 py-3">
                        <dt className="flex items-center justify-between">
                          <span className="text-neutral-400">Status</span>
                          <span className={statusChipClasses(view?.statusPhrase || "")}>
                            {view?.statusPhrase || "—"}
                          </span>
                        </dt>
                        <dd>
                          <div className="text-neutral-400 text-sm mt-1">
                            {view?.confLabel || "—"}
                          </div>
                          <div className="mt-2 h-2 rounded bg-neutral-800 overflow-hidden">
                            <div
                              className={`h-full ${barColor(
                                view?.statusPhrase || ""
                              )} transition-all duration-300`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((view?.confRaw || 0) / TARGET_CONF) * 100
                                )}%`,
                              }}
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
                            <span className="font-mono text-sm text-neutral-300">
                              {view?.txid ? shorten(view.txid, 12, 6) : "—"}
                            </span>
                            <button
                              onClick={copyTxid}
                              disabled={!view?.txid}
                              className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50 transition-colors"
                              aria-label={`Copy transaction ID: ${view?.txid}`}
                              onKeyDown={(e) => e.key === "Enter" && copyTxid()}
                            >
                              Copy Transaction ID
                            </button>
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="px-4 pb-5">
                    <a
                      href={
                        view?.txid
                          ? `https://www.blockchain.com/explorer/transactions/btc/${view.txid}`
                          : "#"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 transition-colors"
                      onClick={(e) => {
                        if (!view?.txid) e.preventDefault();
                        else addToast("Opening explorer—no wahala.", "info");
                      }}
                      aria-label="View transaction on Blockchain.com explorer"
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
    </ErrorBoundary>
  );
}

export default App;
