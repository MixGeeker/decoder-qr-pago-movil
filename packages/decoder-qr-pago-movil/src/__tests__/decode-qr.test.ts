import { describe, expect, it } from "bun:test";
import { decodeQr } from "../index";

const PAYLOADS = [
  {
    label: "AES merchantId=0114",
    value:
      "9fbRuC0tEp6n0rkkRa2TgAH55doZlBgAK1V9MWslgy5pCNLpLLQybP50FiM/5Dqta9hjUAC1LUyTsR/F4+pCpz1gUleC890g2o4E/V/RU8ztkNOxtspdVBRMt5poi4lYNefnkpkz6udpDD66oRR2DRwFzIpMcrWt9Lb5IVDyL1BtJtJd3WvZH0J0LsJGX7O86rIpQyj/X0txKu6GyKH8WA==?merchantId=0114&strong_id=1784217050",
  },
  {
    label: "RSA origin=web merchantId=0174",
    value:
      "gB88aL3CUERepSTW53QXcYVDP8wpjOm4gR37ktHh854bWeBE3gb/AGjf0JtOYHeRswp62Du2pLRoVw9HiyfUBXrvERIiVaXPsrNXf7+K4uHRW+lFoZbrPhyewkM22hZRztQcd8WvfCe6+pXIvcc4W4Apzw8Llo2D47Hu8fhNPJQvx/lLU4ieUV6ocESXox7oe5blQwxfDj39WJUwkme1tnB34/elsXYaDWzhMONboLsKfDuJjHBR29HYWvAK+ybSMk2DqO4YyyMg4FZNzLSKfs+xgRMPwRgjeWfl+y5QTKAWgutFpzQkmC40mmLBkq+BQwnV0RFtPNm6EuNm9X+Ulw==?merchantId=0174&strong_id=1784728017&origin=web",
  },
  {
    label: "AES merchantId=0191",
    value:
      "0qulBU0rBIKWt0pNRTm4thyvFWWkIE/7Uq+Jl+lw4WkLGfFCqAUzjvJqV/fUePYnRpeWmsJVXvvO9CjAka/mzlss2DwZIUoPfM6mkMZ/XhqUKZIjIv/68NAT864eghUXVn7sLYGvTfSJg23awA54zwe4obqRn2bGA+zdU//OFO/B8eyHlhaWOrT2i+8ellTuXp4OIhZNivNu35YuGNVanA==?merchantId=0191&strong_id=1784754275",
  },
  {
    label: "RSA origin=web merchantId=0105",
    value:
      "m28tuwbizhMer7LqTrXDR390LJYTLTMLxvAojSnPrZ2ese+vGGypN/1IfjBJVQyduC5qN+Hvyqa8FzYoP1xntmkI7PU6HlnAEpYgEZ1TSahnec0Ctt1Tpg3gK3rTG0ay5ST8h24YHsc6Q4aZtmxdLjtKyeChlbRhqq6v8e9qNlrpc/2nZ6HV0a1mcIOz7qm4GgpPQMaHW5ywzkuWE0ps9fMB9kCiyGPNj6G0SZomROybsNlMDevCMdpbGyz5w84MxNdomJwEgy8qhBYgKSEPlCn/cCmAdeZCtyFypu6Tr1tDgrlL0kLNRrv2CQKkLw3uHx8zxZohwuu3Cau0io4elA==?merchantId=0105&strong_id=260722171116&origin=web",
  },
];

describe("decodeQr", () => {
  for (const { label, value } of PAYLOADS) {
    it(`decodifica correctamente ${label}`, () => {
      const result = decodeQr(value);
      expect(result).toBeDefined();
      expect(result.dni).toBeDefined();
      expect(typeof result.dni).toBe("string");
      expect(result.phone).toBeDefined();
      expect(typeof result.phone).toBe("string");
      expect(result.bank).toBeDefined();
      expect(typeof result.bank).toBe("string");
      expect(result.name).toBeDefined();
      expect(typeof result.name).toBe("string");
    });
  }

  it("lanza error si el payload no tiene '?'", () => {
    expect(() => decodeQr("sinFormatoValido")).toThrow("Invalid QR payload format");
  });

  it("lanza error si merchantId no tiene clave AES", () => {
    expect(() => decodeQr("cGF5bG9hZF9pbnZhbGlkbw==?merchantId=9999")).toThrow("No AES key for merchant 9999");
  });
});
