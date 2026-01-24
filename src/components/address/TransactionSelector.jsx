import React from "react";
import { shorten, fmtDateTime } from "../../utils/formatters";

export const TransactionSelector = ({
  filteredTxs,
  loading,
  selectedTxid,
  setSelectedTxid,
}) => {
  return (
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
  );
};
