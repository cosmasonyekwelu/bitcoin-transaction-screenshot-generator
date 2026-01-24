import React from "react";

export const Header = ({ device, setDevice, filterMode, setFilterMode }) => {
  return (
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
              Blockchain.com explorer + charts (USD) • iPhone/Samsung frame •
              PNG export • Rebroadcast
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
  );
};
