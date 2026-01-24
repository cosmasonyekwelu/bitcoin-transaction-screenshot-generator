import axios from "axios";

const ESPLORA_TARGETS = [
  "https://mempool.space/api/tx",
  "https://blockstream.info/api/tx",
];

export async function broadcastEverywhere({ rawHex }) {
  const results = {};

  // blockchain.info
  try {
    const body = new URLSearchParams({ tx: rawHex }).toString();
    const { data, status } = await axios.post(
      "https://blockchain.info/pushtx?cors=true",
      body,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000,
        validateStatus: () => true,
        withCredentials: false,
      }
    );
    results["blockchain.info"] = {
      ok: status >= 200 && status < 300,
      status,
      data,
    };
  } catch (e) {
    results["blockchain.info"] = {
      ok: false,
      status: null,
      error: e?.message || "request failed",
    };
  }

  // Esplora-compatible
  for (const url of ESPLORA_TARGETS) {
    const name = new URL(url).hostname;
    try {
      const { data, status } = await axios.post(url, rawHex, {
        headers: { "Content-Type": "text/plain" },
        timeout: 20000,
        validateStatus: () => true,
        withCredentials: false,
      });
      results[name] = { ok: status >= 200 && status < 300, status, data };
    } catch (e) {
      results[name] = {
        ok: false,
        status: null,
        error: e?.message || "request failed",
      };
    }
  }

  return results;
}
