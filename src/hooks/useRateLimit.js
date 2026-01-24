import { useCallback, useRef } from "react";

/* =========================
   RATE LIMIT HOOK
========================= */
export const useRateLimit = (delay = 1000) => {
  const lastCallRef = useRef(0);
  return useCallback(
    (fn) => {
      const now = Date.now();
      if (now - lastCallRef.current > delay) {
        lastCallRef.current = now;
        return fn();
      }
    },
    [delay]
  );
};
