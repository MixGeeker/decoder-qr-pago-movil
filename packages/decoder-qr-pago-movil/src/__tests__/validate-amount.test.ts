import { describe, expect, it } from "bun:test";
import { validateAmount } from "../decode-qr-pago-movil/helpers/validate-amount";

describe("validateAmount", () => {
  it("acepta formato válido con coma", () => {
    expect(validateAmount("150,00")).toBe("150,00");
  });

  it("auto-corrige punto a coma (150.00 → 150,00)", () => {
    expect(validateAmount("150.00")).toBe("150,00");
  });

  it("auto-corrige sin decimales agregando ,00 (150 → 150,00)", () => {
    expect(validateAmount("150")).toBe("150,00");
  });

  it("auto-corrige un solo decimal agregando 0 (150,5 → 150,50)", () => {
    expect(validateAmount("150,5")).toBe("150,50");
  });

  it("auto-corrige punto + un decimal (150.5 → 150,50)", () => {
    expect(validateAmount("150.5")).toBe("150,50");
  });

  it("permite monto mínimo (0,01 con 2 dígitos enteros)", () => {
    expect(validateAmount("00,01")).toBe("00,01");
  });

  it("permite monto máximo 8 dígitos enteros (99999999,99)", () => {
    expect(validateAmount("99999999,99")).toBe("99999999,99");
  });

  it("lanza error si monto es 0,00", () => {
    expect(() => validateAmount("00,00")).toThrow("El monto debe ser mayor a 0");
  });

  it("lanza error si monto es negativo", () => {
    expect(() => validateAmount("-5,00")).toThrow("Monto inválido");
  });

  it("lanza error si tiene más de 8 dígitos enteros (9 dígitos)", () => {
    expect(() => validateAmount("100000000,00")).toThrow("Monto inválido");
  });

  it("lanza error si tiene más de 2 decimales", () => {
    expect(() => validateAmount("150,001")).toThrow("Monto inválido");
  });

  it("lanza error si string vacío", () => {
    expect(() => validateAmount("")).toThrow("Monto inválido");
  });
});
