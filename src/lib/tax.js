import { breakdown, detailAllocations, totalExpenditureCrore } from "../data/breakdown.js";

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

export function detailShare(item) {
  return item.share ?? ministryShareFromCrore(item.amountCrore);
}

export function detailAmount(total, item) {
  return mapBudgetShareToAmount(total, detailShare(item));
}

export function buildDetailAllocations(total, group) {
  return detailAllocations
    .filter((item) => item.group === group)
    .map((item) => ({
      ...item,
      percent: detailShare(item),
      amount: detailAmount(total, item)
    }))
    .sort((left, right) => right.percent - left.percent);
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

export function readAppState(locationLike) {
  const url = new URL(locationLike.href);

  return {
    tax: clampTaxAmount(url.searchParams.get("tax")),
    type: url.searchParams.get("type") ?? "income-tax",
    snapshot: url.searchParams.get("snapshot") === "1"
  };
}

export function writeAppStateToHistory(state, locationLike, historyLike) {
  const url = new URL(locationLike.href);

  if (state.tax === null) {
    url.searchParams.delete("tax");
  } else {
    url.searchParams.set("tax", String(state.tax));
  }

  if (state.type && state.type !== "income-tax") {
    url.searchParams.set("type", state.type);
  } else {
    url.searchParams.delete("type");
  }

  if (state.snapshot) {
    url.searchParams.set("snapshot", "1");
  } else {
    url.searchParams.delete("snapshot");
  }

  historyLike.replaceState({}, "", url);
}
