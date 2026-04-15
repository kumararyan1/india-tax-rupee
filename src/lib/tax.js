import { breakdown, totalExpenditureCrore } from "../data/breakdown.js";

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
    .format(value)
    .replace("₹", "Rs ");
}

export function formatPercent(value) {
  return `${value.toFixed(2)}%`;
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
    amount: itemAmount(total, item.share),
    percent: item.share
  }));
}

export function mapBudgetShareToAmount(total, share) {
  return (total * share) / 100;
}

export function ministryShareFromCrore(amountCrore) {
  return (amountCrore / totalExpenditureCrore) * 100;
}

export function buildArcPath(startPercent, endPercent, outerRadius = 96, innerRadius = 56) {
  const startAngle = (startPercent / 100) * Math.PI * 2 - Math.PI / 2;
  const endAngle = (endPercent / 100) * Math.PI * 2 - Math.PI / 2;

  const outerStartX = 120 + Math.cos(startAngle) * outerRadius;
  const outerStartY = 120 + Math.sin(startAngle) * outerRadius;
  const outerEndX = 120 + Math.cos(endAngle) * outerRadius;
  const outerEndY = 120 + Math.sin(endAngle) * outerRadius;

  const innerEndX = 120 + Math.cos(endAngle) * innerRadius;
  const innerEndY = 120 + Math.sin(endAngle) * innerRadius;
  const innerStartX = 120 + Math.cos(startAngle) * innerRadius;
  const innerStartY = 120 + Math.sin(startAngle) * innerRadius;

  const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0;

  return [
    `M ${outerStartX} ${outerStartY}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
    `L ${innerEndX} ${innerEndY}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
    "Z"
  ].join(" ");
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
