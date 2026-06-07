import { describe, it, expect } from "vitest";
import { parsePrice, formatCurrency } from "./currency";

describe("parsePrice", () => {
  it("parses ¥ prefix", () => {
    expect(parsePrice("¥100")).toBe(100);
  });

  it("parses comma thousands", () => {
    expect(parsePrice("1,234.56")).toBe(1234.56);
  });

  it("returns 0 for empty string", () => {
    expect(parsePrice("")).toBe(0);
  });

  it("returns 0 for invalid input", () => {
    expect(parsePrice("abc")).toBe(0);
  });

  it("parses plain number", () => {
    expect(parsePrice("99.99")).toBe(99.99);
  });
});

describe("formatCurrency", () => {
  it("adds ¥ prefix", () => {
    expect(formatCurrency(100)).toBe("¥100");
  });

  it("rounds decimals", () => {
    expect(formatCurrency(99.5)).toBe("¥100");
    expect(formatCurrency(99.4)).toBe("¥99");
  });

  it("adds thousands separator", () => {
    expect(formatCurrency(1234567)).toBe("¥1,234,567");
  });
});
