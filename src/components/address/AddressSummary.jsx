import React from "react";
import { shorten, fmtUSD, fmtBtc, satsToBtc } from "../../utils/formatters";

export const AddressSummary = ({
  address,
  summary,
  addrLoading,
  addrError,
  balanceUsd,
  receivedUsd,
  sentUsd,
}) => {
  return (
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
  );
};
