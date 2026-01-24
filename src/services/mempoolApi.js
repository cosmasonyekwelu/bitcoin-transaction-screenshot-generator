import axios from "axios";

export async function getMempoolTxMeta(txid) {
  const { data } = await axios.get(
    `https://mempool.space/api/tx/${encodeURIComponent(txid)}`,
    { timeout: 15000 }
  );
  return {
    fee: typeof data?.fee === "number" ? data.fee : null,
    vsize: typeof data?.vsize === "number" ? data.vsize : null,
    replaceable: !!data?.status?.replaceable,
    confirmed: !!data?.status?.confirmed,
  };
}

export async function getMempoolHex(txid) {
  const { data } = await axios.get(
    `https://mempool.space/api/tx/${encodeURIComponent(txid)}/hex`,
    { timeout: 15000 }
  );
  if (!data || typeof data !== "string" || !/^[0-9a-fA-F]+$/.test(data))
    throw new Error("Could not fetch raw hex.");
  return data.trim();
}

export async function getMempoolFees() {
  const { data } = await axios.get(
    `https://mempool.space/api/v1/fees/recommended`,
    { timeout: 15000 }
  );
  return data || null;
}
