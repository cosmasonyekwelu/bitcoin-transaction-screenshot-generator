import React, { useState, useEffect, useRef } from "react";
import { getMempoolFees, getMempoolTxMeta, getMempoolHex } from "../../services/mempoolApi";
import { broadcastEverywhere } from "../../services/broadcastService";
import { shorten } from "../../utils/formatters";

export const AccelerationForm = ({
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
