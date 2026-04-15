import "./styles.css";
import { buildAllocation, buildSegments, clampTaxAmount, formatCurrency, readTaxFromLocation, writeTaxToHistory } from "./lib/tax.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <section class="hero" aria-labelledby="page-title">
      <p class="eyebrow">India tax breakdown</p>
      <h1 id="page-title">Where did my tax go?</h1>
      <div class="input-stack">
        <label class="sr-only" for="tax-input">Tax paid in INR</label>
        <div class="input-row">
          <span class="currency-pill">Rs</span>
          <input
            id="tax-input"
            name="tax-input"
            type="number"
            inputmode="numeric"
            min="0"
            step="100"
            placeholder="Enter tax paid"
          />
        </div>
        <div class="preset-row" aria-label="Preset amounts">
          <button class="preset" data-amount="12000">12k</button>
          <button class="preset" data-amount="50000">50k</button>
          <button class="preset" data-amount="100000">1 lakh</button>
          <button class="preset" data-amount="500000">5 lakh</button>
        </div>
      </div>
    </section>

    <section class="results is-hidden" id="results" aria-live="polite">
      <div class="summary-strip">
        <p class="summary-label">Tax entered</p>
        <p class="summary-value" id="total-tax">Rs 0</p>
      </div>

      <div class="visual-panel">
        <div class="donut-wrap">
          <div class="donut" id="donut-chart" aria-hidden="true">
            <div class="donut-center">
              <span class="donut-label">Breakdown</span>
              <strong id="donut-total">Rs 0</strong>
            </div>
          </div>
        </div>
        <ol class="legend" id="legend-list" aria-label="Budget allocation"></ol>
      </div>
    </section>
  </main>
`;

const taxInput = document.querySelector("#tax-input");
const totalTax = document.querySelector("#total-tax");
const donutTotal = document.querySelector("#donut-total");
const donutChart = document.querySelector("#donut-chart");
const legendList = document.querySelector("#legend-list");
const presetButtons = document.querySelectorAll(".preset");
const results = document.querySelector("#results");

function render(total) {
  if (total === null) {
    results.classList.add("is-hidden");
    legendList.innerHTML = "";
    writeTaxToHistory(null, window.location, window.history);
    return;
  }

  results.classList.remove("is-hidden");
  totalTax.textContent = formatCurrency(total);
  donutTotal.textContent = formatCurrency(total);
  donutChart.style.setProperty("--segments", buildSegments());
  legendList.innerHTML = "";

  for (const item of buildAllocation(total)) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span class="swatch" style="background:${item.color}"></span>
      <div>
        <p class="legend-title">${item.label}</p>
      </div>
      <div>
        <span class="legend-share">${item.share} paise</span>
        <p class="legend-value">${formatCurrency(item.amount)}</p>
      </div>
    `;
    legendList.appendChild(listItem);
  }

  writeTaxToHistory(total, window.location, window.history);
}

function syncInput(total) {
  taxInput.value = total === null ? "" : String(total);
  render(total);
}

taxInput.addEventListener("input", (event) => {
  syncInput(clampTaxAmount(event.target.value));
});

for (const button of presetButtons) {
  button.addEventListener("click", () => {
    syncInput(clampTaxAmount(button.dataset.amount));
  });
}

syncInput(readTaxFromLocation(window.location));
