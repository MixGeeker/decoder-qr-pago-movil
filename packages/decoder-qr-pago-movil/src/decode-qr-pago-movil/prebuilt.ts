import { QrCodec } from "./decrypt";
import type { MerchantId, QrData } from "./decrypt";
import { aesKeys, rsaKeys } from "./keys-processed";
const keys = { aesKeys, rsaKeys };
const decoder = new QrCodec(keys);

export function decodeQr(payload: string): QrData {
  return decoder.decode(payload);
}

export function encodeQr(data: QrData): string {
  return decoder.encode(data);
}
