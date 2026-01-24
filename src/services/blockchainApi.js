import axios from "axios";
import { API_CONFIG } from "../constants/apiConfig";

export const blockchainAPI = {
  getAddressBalance: (address) =>
    axios.get(
      `https://blockchain.info/q/addressbalance/${encodeURIComponent(
        address
      )}?confirmations=0&cors=true`,
      API_CONFIG
    ),
  getAddressReceived: (address) =>
    axios.get(
      `https://blockchain.info/q/getreceivedbyaddress/${encodeURIComponent(
        address
      )}?confirmations=0&cors=true`,
      API_CONFIG
    ),
  getAddressSent: (address) =>
    axios.get(
      `https://blockchain.info/q/getsentbyaddress/${encodeURIComponent(
        address
      )}?confirmations=0&cors=true`,
      API_CONFIG
    ),
  getTicker: () =>
    axios.get(`https://blockchain.info/ticker?cors=true`, API_CONFIG),
  getAddressTransactions: (address) =>
    axios.get(
      `https://blockchain.info/rawaddr/${encodeURIComponent(
        address
      )}?limit=10&cors=true`,
      API_CONFIG
    ),
  getTransaction: (txid) =>
    axios.get(
      `https://blockchain.info/rawtx/${encodeURIComponent(txid)}?cors=true`,
      API_CONFIG
    ),
  getBlockCount: () =>
    axios.get("https://blockchain.info/q/getblockcount?cors=true", API_CONFIG),
};
