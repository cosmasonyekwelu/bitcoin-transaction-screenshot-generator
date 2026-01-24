import React from "react";

export const AddressInput = ({
  address,
  setAddress,
  copyAddress,
  fetchAddressTxs,
  loading,
  error,
}) => {
  return (
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
  );
};
