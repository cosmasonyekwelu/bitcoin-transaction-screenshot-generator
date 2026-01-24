import React from "react";

export const Toasts = React.memo(({ toasts, onClose }) => (
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
