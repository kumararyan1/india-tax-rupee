import { breakdown } from "../data/breakdown.js";

export const MAX_TAX_AMOUNT = 1000000000;

export function clampTaxAmount(rawValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return null;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.min(parsed, MAX_TAX_AMOUNT);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  })
    .format(value)
    .replace("₹", "Rs ");
}

export function buildSegments() {
  let current = 0;

  return breakdown
    .map((item) => {
      const start = current;
      current += item.share;
      return `${item.color} ${start}% ${current}%`;
    })
    .join(", ");
}

export function itemAmount(total, share) {
  return Math.round((total * share) / 100);
}

export function buildAllocation(total) {
  return breakdown.map((item) => ({
    ...item,
    amount: itemAmount(total, item.share)
  }));
}

export function readTaxFromLocation(locationLike) {
  const url = new URL(locationLike.href);
  return clampTaxAmount(url.searchParams.get("tax"));
}

export function writeTaxToHistory(total, locationLike, historyLike) {
  const url = new URL(locationLike.href);

  if (total === null) {
    url.searchParams.delete("tax");
  } else {
    url.searchParams.set("tax", String(total));
  }

  historyLike.replaceState({}, "", url);
}
