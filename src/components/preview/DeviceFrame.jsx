import React, { forwardRef } from "react";
import { StatusBar } from "./StatusBar";

export const DeviceFrame = React.memo(
  forwardRef(function DeviceFrame(
    { device = "iphone", currentTime, children },
    ref
  ) {
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
          <StatusBar device={device} currentTime={currentTime} />
          <div className="h-[calc(100%-12px)] overflow-auto bg-neutral-900 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {children}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-[5px] rounded-full bg-neutral-700/80" />
        </div>
      </div>
    );
  })
);
