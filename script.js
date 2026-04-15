const breakdown = [
  {
    label: "State share of taxes and duties",
    share: 22,
    color: "#cf9363"
  },
  {
    label: "Interest payments",
    share: 20,
    color: "#ba6e42"
  },
  {
    label: "Central sector schemes",
    share: 16,
    color: "#deb07c"
  },
  {
    label: "Defence",
    share: 8,
    color: "#7b8c96"
  },
  {
    label: "Finance Commission and other transfers",
    share: 8,
    color: "#6f8a82"
  },
  {
    label: "Other expenditure",
    share: 8,
    color: "#6c7794"
  },
  {
    label: "Centrally sponsored schemes",
    share: 8,
    color: "#8e8a9f"
  },
  {
    label: "Major subsidies",
    share: 6,
    color: "#b78865"
  },
  {
    label: "Pensions",
    share: 4,
    color: "#a89a74"
  }
];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const taxInput = document.querySelector("#tax-input");
const totalTax = document.querySelector("#total-tax");
const donutTotal = document.querySelector("#donut-total");
const donutChart = document.querySelector("#donut-chart");
const legendList = document.querySelector("#legend-list");
const presetButtons = document.querySelectorAll(".preset");
const results = document.querySelector("#results");

function formatCurrency(value) {
  return currencyFormatter.format(value).replace("₹", "Rs ");
}

function clampTaxAmount(rawValue) {
  if (rawValue === "") {
    return null;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
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

  if (total === null) {
    url.searchParams.delete("tax");
  } else {
    url.searchParams.set("tax", String(total));
  }

  window.history.replaceState({}, "", url);
}

function render(total) {
  if (total === null) {
    results.classList.add("is-hidden");
    legendList.innerHTML = "";
    updateQueryParam(null);
    return;
  }

  results.classList.remove("is-hidden");
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
      </div>
      <div>
        <span class="legend-share">${item.share} paise</span>
        <p class="legend-value">${formatCurrency(amount)}</p>
      </div>
    `;

    legendList.appendChild(listItem);
  });

  updateQueryParam(total);
}

function syncInput(total) {
  taxInput.value = total === null ? "" : String(total);
  render(total);
}

function onInput(event) {
  syncInput(clampTaxAmount(event.target.value));
}

function readInitialTax() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("tax");

  if (!fromQuery) {
    return null;
  }

  return clampTaxAmount(fromQuery);
}

taxInput.addEventListener("input", onInput);

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    syncInput(clampTaxAmount(button.dataset.amount));
  });
});

syncInput(readInitialTax());
