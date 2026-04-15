import { describe, expect, it } from "vitest";
import { buildAllocation, buildSegments, clampTaxAmount, readTaxFromLocation } from "../src/lib/tax.js";

describe("clampTaxAmount", () => {
  it("returns null for empty input", () => {
    expect(clampTaxAmount("")).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(clampTaxAmount("abc")).toBeNull();
    expect(clampTaxAmount(-100)).toBeNull();
  });

  it("returns the parsed number for valid input", () => {
    expect(clampTaxAmount("100000")).toBe(100000);
  });
});

describe("buildAllocation", () => {
  it("maps all categories to amounts", () => {
    const items = buildAllocation(100000);
    expect(items).toHaveLength(9);
    expect(items[0]).toMatchObject({
      label: "State share of taxes and duties",
      share: 22,
      amount: 22000
    });
    expect(items[8]).toMatchObject({
      label: "Pensions",
      share: 4,
      amount: 4000
    });
  });
});

describe("buildSegments", () => {
  it("returns a conic gradient segment string", () => {
    expect(buildSegments()).toContain("#cf9363 0% 22%");
  });
});

describe("readTaxFromLocation", () => {
  it("reads tax from the query string", () => {
    expect(readTaxFromLocation({ href: "https://example.com/india-tax-rupee/?tax=100000" })).toBe(100000);
  });
});
