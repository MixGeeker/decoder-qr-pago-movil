import { describe, expect, it } from "bun:test";
import { decodeQr, encodeQr } from "../index";
import type { QrData, KeyMaps } from "../index";

describe("exports", () => {
  it("decodeQr es una función exportada", () => {
    expect(typeof decodeQr).toBe("function");
  });

  it("encodeQr es una función exportada", () => {
    expect(typeof encodeQr).toBe("function");
  });

  it("tipos QrData y KeyMaps son exportables (type-only check)", () => {
    const data: QrData = {
      dni: "V12345678",
      phone: "584120000000",
      bank: "0114",
    };
    expect(data.dni).toBe("V12345678");

    const keyMaps: KeyMaps = {
      aesKeys: {},
      rsaKeys: {},
    };
    expect(keyMaps).toBeDefined();
  });
});
