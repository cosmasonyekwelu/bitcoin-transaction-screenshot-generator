/* detectors */
export const isLikelyTxid = (s) => !!s && /^[0-9a-fA-F]{64}$/.test(s.trim());

export const isLikelyBtcAddress = (s) =>
  !!s && /^(bc1[a-z0-9]{10,}|[13][a-km-zA-HJ-NP-Z1-9]{20,})$/.test(s.trim());
