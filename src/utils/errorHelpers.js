import { isLikelyTxid, isLikelyBtcAddress } from "./validators";

/* friendly error */
export function friendlyError(e, input, where = "address") {
  const status = e?.response?.status;
  const raw =
    e?.response?.data?.message || e?.response?.data || e?.message || "";
  const rawLower = String(raw).toLowerCase();

  if (isLikelyTxid(input) && where === "address") {
    return "Oga, that one na TXID, no be address. Paste a Bitcoin address (bc1…, 1…, 3…) to load history.";
  }
  if (!isLikelyBtcAddress(input) && where === "address") {
    return "Boss, this address no correct. Make sure e start with bc1…, 1… or 3…, no spaces.";
  }
  if (status === 404 || rawLower.includes("item not found")) {
    return "We no see this address for explorer o. Abeg cross-check am and try again.";
  }
  if (status === 400 || rawLower.includes("argument invalid")) {
    return "Format no pure. Use valid Bitcoin address, no typos, no emojis.";
  }
  if (status === 429) {
    return "Chill small—too many requests. Give am few seconds, try again.";
  }
  if (e?.code === "ECONNABORTED" || rawLower.includes("timeout")) {
    return "Network dey do shakara. Check your internet or try later.";
  }
  if (rawLower.includes("network error")) {
    return "Network wahala. One more try go solve am.";
  }
  const hint = raw ? ` (${String(raw).slice(0, 80)})` : "";
  return `Something no gel. Try again in a bit.${hint}`;
}
