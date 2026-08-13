// Works in Bun, Node.js, and browser (Vite/React)
export { decodeQr, encodeQr, bankList } from "./decode-qr-pago-movil/prebuilt";
export {
  ALLOWED_DNI_PREFIXES,
  DEFAULT_DNI_PREFIX,
} from "./decode-qr-pago-movil/dni-prefixes";
export type { QrData, KeyMaps } from "./decode-qr-pago-movil/decrypt";
