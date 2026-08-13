import forge from "node-forge";
import type { aesKeys } from "./keys-processed";
import { validateAmount } from "./helpers/validate-amount";
import { ALLOWED_DNI_PREFIXES, DEFAULT_DNI_PREFIX } from "./dni-prefixes";

export type MerchantId = keyof typeof aesKeys;

export interface QrData {
  dni: string;
  phone: string;
  bank: MerchantId;
  prefix?: string;
  name?: string;
  amount?: string;
  description?: string;
  bdv?: string;
}

export interface KeyMaps {
  aesKeys: Record<string, { key: string; iv: string }>;
  rsaKeys: Record<string, string>;
}

function normalize(raw: Record<string, any>): QrData {
  const id = String(raw.id ?? "");
  return {
    dni: /^[A-Za-z]/.test(id) ? id : DEFAULT_DNI_PREFIX + id,
    phone: String(raw.phone ?? ""),
    bank: String(raw.bank ?? "") as MerchantId,
    name: String(raw.name ?? ""),
    ...(raw.amount != null && { amount: String(raw.amount) }),
    ...(raw.description != null && { description: String(raw.description) }),
    ...(raw.bdv != null && { bdv: String(raw.bdv) }),
  };
}

function aesDecrypt(
  qrData: string,
  merchantId: string,
  aesKeys: KeyMaps["aesKeys"],
): string {
  const k = aesKeys[merchantId];
  if (!k) throw new Error(`No AES key for merchant ${merchantId}`);

  const decipher = forge.cipher.createDecipher(
    "AES-CBC",
    forge.util.createBuffer(k.key),
  );
  decipher.start({ iv: forge.util.createBuffer(k.iv) });
  decipher.update(forge.util.createBuffer(forge.util.decode64(qrData)));
  if (!decipher.finish()) throw new Error("AES decryption failed");
  return decipher.output.toString();
}

function rsaDecrypt(
  qrData: string,
  merchantId: string,
  rsaKeys: KeyMaps["rsaKeys"],
): string {
  const pem = rsaKeys[merchantId];
  if (!pem) throw new Error(`No RSA key for merchant ${merchantId}`);

  const asn1 = forge.asn1.fromDer(
    forge.util.createBuffer(forge.util.decode64(pem)),
  );
  const privateKey = forge.pki.privateKeyFromAsn1(asn1);
  return privateKey.decrypt(forge.util.decode64(qrData), "RSAES-PKCS1-V1_5");
}

function aesEncrypt(
  jsonStr: string,
  merchantId: string,
  aesKeys: KeyMaps["aesKeys"],
): string {
  const k = aesKeys[merchantId];
  if (!k) throw new Error(`No AES key for merchant ${merchantId}`);

  const cipher = forge.cipher.createCipher(
    "AES-CBC",
    forge.util.createBuffer(k.key),
  );
  cipher.start({ iv: forge.util.createBuffer(k.iv) });
  cipher.update(forge.util.createBuffer(jsonStr));
  cipher.finish();
  return forge.util.encode64(cipher.output.getBytes());
}

function parseDni(dni: string): string {
  const match = /^(\d+)$/.exec(dni);
  if (!match) {
    throw new Error(`DNI inválido: "${dni}". Debe contener solo dígitos.`);
  }
  return match[1] ?? "";
}

function resolvePrefix(prefix: string | undefined): string {
  const normalized = (prefix ?? DEFAULT_DNI_PREFIX).toUpperCase();
  if (!ALLOWED_DNI_PREFIXES.has(normalized)) {
    throw new Error(
      `Prefijo de DNI no admitido: "${prefix}". Prefijos válidos: ${[...ALLOWED_DNI_PREFIXES].join(", ")}.`,
    );
  }
  return normalized;
}

export class QrCodec {
  constructor(private keys: KeyMaps) {}

  decode(payload: string): QrData {
    const qi = payload.indexOf("?");
    if (qi === -1) throw new Error("Invalid QR payload format");
    const qrData = payload.substring(0, qi);
    const params = new URLSearchParams(payload.substring(qi + 1));
    const merchantId = params.get("merchantId") || "";
    const origin = params.get("origin") || "app";

    const decrypted =
      origin === "web"
        ? rsaDecrypt(qrData, merchantId, this.keys.rsaKeys)
        : aesDecrypt(qrData, merchantId, this.keys.aesKeys);

    return normalize(JSON.parse(decrypted));
  }

  encode(data: QrData): string {
    const merchantId = data.bank;
    const dniNumber = parseDni(data.dni);
    const prefix = resolvePrefix(data.prefix);
    const json: Record<string, string> = {
      id: prefix + dniNumber,
      phone: data.phone,
      bank: merchantId,
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.bdv && { bdv: data.bdv }),
    };

    if (data.amount) json.amount = validateAmount(data.amount.toString());

    const encrypted = aesEncrypt(
      JSON.stringify(json),
      merchantId,
      this.keys.aesKeys,
    );

    return `${encrypted}?merchantId=${merchantId}&origin=app`;
  }
}
