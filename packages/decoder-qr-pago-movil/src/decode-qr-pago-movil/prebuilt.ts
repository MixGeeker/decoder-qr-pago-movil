import { QrCodec } from "./decrypt";
import type { QrData } from "./decrypt";
import { aesKeys, rsaKeys } from "./keys-processed";
const keys = { aesKeys, rsaKeys };
const decoder = new QrCodec(keys);

export const bankList = Object.keys(aesKeys).sort((a, b) => parseInt(a) - parseInt(b));

export function decodeQr(payload: string): QrData {
  return decoder.decode(payload);
}

export function encodeQr(data: QrData): string {
  return decoder.encode(data);
}
