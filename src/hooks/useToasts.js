import { useCallback, useEffect, useRef, useState } from "react";

/* =========================
   TOASTS (with cleanup)
========================= */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timeoutRefs = useRef(new Map());

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((t) => clearTimeout(t));
      timeoutRefs.current.clear();
    };
  }, []);

  const addToast = useCallback((text, type = "info", timeout = 4200) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, text, type }]);
    if (timeout) {
      const tid = setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
        timeoutRefs.current.delete(id);
      }, timeout);
      timeoutRefs.current.set(id, tid);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
  }, []);

  return { toasts, addToast, removeToast };
}
