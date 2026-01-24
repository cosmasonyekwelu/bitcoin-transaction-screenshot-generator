import React from "react";
import { fmtBtc, fmtUSD, shorten } from "../../utils/formatters";

const statusChipClasses = (phrase) =>
  "text-[12px] px-2 py-[2px] rounded-md border " +
  (phrase === "Completed"
    ? "bg-emerald-500/10 border-emerald-600 text-emerald-300"
    : phrase.startsWith("Confirming")
    ? "bg-amber-500/10 border-amber-600 text-amber-300"
    : "bg-rose-500/10 border-rose-600 text-rose-300");

const barColor = (phrase) =>
  phrase === "Completed"
    ? "bg-emerald-600"
    : phrase.startsWith("Confirming")
    ? "bg-amber-500"
    : "bg-rose-500";

export const TransactionPreview = ({
  view,
  TARGET_CONF,
  copyTxid,
  addToast,
}) => {
  return (
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
  );
};
