import { describe, expect, it } from "bun:test";
import { QrCodec } from "../decode-qr-pago-movil/decrypt";
import { aesKeys, rsaKeys } from "../decode-qr-pago-movil/keys-processed";

const keys = { aesKeys, rsaKeys };
const codec = new QrCodec(keys);

describe("QrCodec class", () => {
  it("decode() — payload AES merchantId=0114", () => {
    const payload =
      "9fbRuC0tEp6n0rkkRa2TgAH55doZlBgAK1V9MWslgy5pCNLpLLQybP50FiM/5Dqta9hjUAC1LUyTsR/F4+pCpz1gUleC890g2o4E/V/RU8ztkNOxtspdVBRMt5poi4lYNefnkpkz6udpDD66oRR2DRwFzIpMcrWt9Lb5IVDyL1BtJtJd3WvZH0J0LsJGX7O86rIpQyj/X0txKu6GyKH8WA==?merchantId=0114&strong_id=1784217050";
    const result = codec.decode(payload);

    expect(result.dni).toBeDefined();
    expect(result.phone).toBeDefined();
    expect(result.bank).toBe("0114");
    expect(result.name).toBeDefined();
  });

  it("encode() — genera payload decodificable sin name", () => {
    const payload = codec.encode({
      dni: "12345678",
      phone: "584120000000",
      bank: "0114",
    });
    const decoded = codec.decode(payload);

    expect(decoded.dni).toBe("V12345678");
    expect(decoded.phone).toBe("584120000000");
    expect(decoded.bank).toBe("0114");
  });

  it("encode() — con name opcional se preserva", () => {
    const payload = codec.encode({
      dni: "12345678",
      phone: "584120000000",
      bank: "0114",
      name: "Juan Perez",
    });
    const decoded = codec.decode(payload);

    expect(decoded.dni).toBe("V12345678");
    expect(decoded.name).toBe("Juan Perez");
  });

  it("decode() lanza error si el payload no tiene '?'", () => {
    expect(() => codec.decode("sinFormatoValido")).toThrow(
      "Invalid QR payload format",
    );
  });

  it("encode() lanza error si merchantId no tiene clave", () => {
    expect(() =>
      codec.encode({
        dni: "12345678",
        phone: "584120000000",
        bank: "9999" as any,
      }),
    ).toThrow("No AES key for merchant 9999");
  });
});
