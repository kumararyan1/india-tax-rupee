const breakdown = [
  {
    label: "State share of taxes and duties",
    share: 22,
    color: "#d9652b",
    description: "Devolution transferred to states from the divisible tax pool."
  },
  {
    label: "Interest payments",
    share: 20,
    color: "#ba4a1b",
    description: "Servicing past borrowings."
  },
  {
    label: "Central sector schemes",
    share: 16,
    color: "#e59354",
    description: "Union-run schemes, excluding defence capital outlay and major subsidies."
  },
  {
    label: "Defence",
    share: 8,
    color: "#264653",
    description: "Defence services and related expenditure."
  },
  {
    label: "Finance Commission and other transfers",
    share: 8,
    color: "#2a9d8f",
    description: "Transfers recommended or routed to states and other authorities."
  },
  {
    label: "Other expenditure",
    share: 8,
    color: "#457b9d",
    description: "Residual expenditure heads outside the highlighted buckets."
  },
  {
    label: "Centrally sponsored schemes",
    share: 8,
    color: "#8d99ae",
    description: "Schemes jointly implemented with states."
  },
  {
    label: "Major subsidies",
    share: 6,
    color: "#f4a261",
    description: "Food, fertilizer, and petroleum-related subsidy support."
  },
  {
    label: "Pensions",
    share: 4,
    color: "#e9c46a",
    description: "Pension obligations."
  }
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1
});

const taxInput = document.querySelector("#tax-input");
const taxRange = document.querySelector("#tax-range");
const totalTax = document.querySelector("#total-tax");
const donutTotal = document.querySelector("#donut-total");
const donutChart = document.querySelector("#donut-chart");
const legendList = document.querySelector("#legend-list");
const taxRupee = document.querySelector("#tax-rupee");
const presetButtons = document.querySelectorAll(".preset");
const sourceIntro = document.querySelector("#source-intro");

function formatCurrency(value) {
  return currencyFormatter.format(value).replace("₹", "Rs ");
}

function formatCompact(value) {
  if (value >= 10000000) {
    return `${compactFormatter.format(value / 10000000)} crore`;
  }

  if (value >= 100000) {
    return `${compactFormatter.format(value / 100000)} lakh`;
  }

  if (value >= 1000) {
    return `${compactFormatter.format(value / 1000)} thousand`;
  }

  return `${compactFormatter.format(value)}`;
}

function clampTaxAmount(rawValue) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, 1000000000);
}

function buildSegments() {
  let current = 0;

  return breakdown
    .map((item) => {
      const start = current;
      current += item.share;
      return `${item.color} ${start}% ${current}%`;
    })
    .join(", ");
}

function itemAmount(total, share) {
  return Math.round((total * share) / 100);
}

function updateQueryParam(total) {
  const url = new URL(window.location.href);
  url.searchParams.set("tax", String(total));
  window.history.replaceState({}, "", url);
}

function render(total) {
  totalTax.textContent = formatCurrency(total);
  donutTotal.textContent = formatCurrency(total);
  donutChart.style.setProperty("--segments", buildSegments());
  legendList.innerHTML = "";

  breakdown.forEach((item) => {
    const amount = itemAmount(total, item.share);
    const listItem = document.createElement("li");

    listItem.innerHTML = `
      <span class="swatch" style="background:${item.color}"></span>
      <div>
        <p class="legend-title">${item.label}</p>
        <p class="legend-copy">${item.description}</p>
      </div>
      <div>
        <span class="legend-share">${item.share} paise</span>
        <p class="legend-value">${formatCurrency(amount)}</p>
      </div>
    `;

    legendList.appendChild(listItem);
  });

  const lead = breakdown[0];
  const leadAmount = itemAmount(total, lead.share);
  taxRupee.textContent = `For every rupee, the Union Budget assigns ${lead.share} paise to ${lead.label.toLowerCase()}. In your case that is ${formatCurrency(leadAmount)}.`;
  sourceIntro.textContent = `Illustrative amount: ${formatCompact(total)} in taxes mapped to official Union Budget FY 2025-26 shares.`;

  updateQueryParam(total);
}

function syncInput(total) {
  taxInput.value = String(total);
  taxRange.value = String(Math.min(total, Number(taxRange.max)));
  render(total);
}

function onInput(event) {
  syncInput(clampTaxAmount(event.target.value));
}

function readInitialTax() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("tax");

  if (!fromQuery) {
    return 100000;
  }

  return clampTaxAmount(fromQuery);
}

taxInput.addEventListener("input", onInput);
taxRange.addEventListener("input", onInput);

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    syncInput(clampTaxAmount(button.dataset.amount));
  });
});

syncInput(readInitialTax());
