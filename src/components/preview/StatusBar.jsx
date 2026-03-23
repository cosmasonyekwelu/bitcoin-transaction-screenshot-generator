import React from "react";

const formatStatusTime = (dateLike) => {
  const date =
    dateLike instanceof Date ? dateLike : dateLike ? new Date(dateLike) : null;

  if (!date || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const StatusBar = React.memo(({ device = "iphone", currentTime }) => {
  const isIphone = device === "iphone";
  const statusTime = formatStatusTime(currentTime);
  return (
    <div className="relative h-10 px-4 text-xs text-neutral-300 flex items-center justify-between">
      <span>{statusTime}</span>
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
          <span className="text-[10px] text-neutral-400">45%</span>
        </div>
      )}
    </div>
  );
});
