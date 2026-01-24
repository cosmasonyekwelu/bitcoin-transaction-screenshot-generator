import React from "react";
import { shorten } from "../../utils/formatters";

export const AccelerationHistory = React.memo(({ accelerations }) => {
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
