/* =========================
   FORMATTERS
========================= */
export const satsToBtc = (s) => Number(s || 0) / 1e8;

export const fmtBtc = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

export const fmtUSD = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

export const fmtDateTime = (unix) =>
  new Date(Number(unix || 0) * 1000).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const shorten = (s, head = 12, tail = 6) =>
  !s ? "" : s.length <= head + tail + 3 ? s : `${s.slice(0, head)}..${s.slice(-tail)}`;
