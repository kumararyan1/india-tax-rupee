import "./styles.css";
import { federalSplit, ministryAllocations } from "./data/breakdown.js";
import {
  buildAllocation,
  buildArcPath,
  clampTaxAmount,
  formatCurrency,
  formatPercent,
  mapBudgetShareToAmount,
  ministryShareFromCrore,
  readTaxFromLocation,
  writeTaxToHistory
} from "./lib/tax.js";

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
          <div class="chart-shell">
            <div class="chart-tooltip is-hidden" id="chart-tooltip"></div>
            <svg class="donut-chart" id="donut-chart" viewBox="0 0 240 240" aria-hidden="true"></svg>
          </div>
          <div class="donut-center">
            <span class="donut-label">Breakdown</span>
            <strong id="donut-total">Rs 0</strong>
          </div>
        </div>
        <ol class="legend" id="legend-list" aria-label="Budget allocation"></ol>
      </div>

      <div class="analysis-grid">
        <section class="analysis-panel" aria-labelledby="federal-title">
          <div class="analysis-head">
            <p class="summary-label">State vs center</p>
            <h2 id="federal-title">Federal split</h2>
          </div>
          <div class="federal-cards" id="federal-cards"></div>
        </section>

        <section class="analysis-panel" aria-labelledby="ministry-title">
          <div class="analysis-head">
            <p class="summary-label">Major allocations</p>
            <h2 id="ministry-title">Ministries and departments</h2>
          </div>
          <div class="ministry-list" id="ministry-list"></div>
        </section>
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
const chartTooltip = document.querySelector("#chart-tooltip");
const federalCards = document.querySelector("#federal-cards");
const ministryList = document.querySelector("#ministry-list");

function getSliceScale(index, activeIndex) {
  if (activeIndex === null) {
    return 1;
  }

  return activeIndex === index ? 1.06 : 0.98;
}

function renderChart(total) {
  let startPercent = 0;
  donutChart.innerHTML = "";
  donutChart.classList.remove("is-dimmed");

  buildAllocation(total).forEach((item, index) => {
    const endPercent = startPercent + item.share;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", buildArcPath(startPercent, endPercent));
    path.setAttribute("fill", item.color);
    path.setAttribute("class", "chart-slice");
    path.dataset.index = String(index);
    path.style.setProperty("--slice-scale", "1");

    path.addEventListener("pointerenter", () => {
      donutChart.classList.add("is-dimmed");

      for (const slice of donutChart.querySelectorAll(".chart-slice")) {
        const sliceIndex = Number(slice.dataset.index);
        slice.classList.toggle("is-active", sliceIndex === index);
        slice.style.setProperty("--slice-scale", String(getSliceScale(sliceIndex, index)));
      }

      chartTooltip.textContent = `${item.label}: ${formatCurrency(item.amount)} (${formatPercent(item.percent)})`;
      chartTooltip.classList.remove("is-hidden");
    });

    path.addEventListener("pointermove", (event) => {
      const bounds = donutChart.getBoundingClientRect();
      chartTooltip.style.left = `${event.clientX - bounds.left + 14}px`;
      chartTooltip.style.top = `${event.clientY - bounds.top + 14}px`;
    });

    path.addEventListener("pointerleave", () => {
      donutChart.classList.remove("is-dimmed");
      chartTooltip.classList.add("is-hidden");

      for (const slice of donutChart.querySelectorAll(".chart-slice")) {
        slice.classList.remove("is-active");
        slice.style.setProperty("--slice-scale", "1");
      }
    });

    donutChart.appendChild(path);
    startPercent = endPercent;
  });
}

function buildBar(percent) {
  return `
    <div class="progress-track" aria-hidden="true">
      <span class="progress-fill" style="width:${percent}%"></span>
    </div>
  `;
}

function renderLegend(total) {
  legendList.innerHTML = "";

  for (const item of buildAllocation(total)) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <div class="legend-top">
        <span class="swatch" style="background:${item.color}"></span>
        <div class="legend-copy">
          <p class="legend-title">${item.label}</p>
          <p class="legend-value">${formatCurrency(item.amount)}</p>
        </div>
        <p class="legend-percent">${formatPercent(item.percent)}</p>
      </div>
      ${buildBar(item.percent)}
    `;

    legendList.appendChild(listItem);
  }
}

function renderFederal(total) {
  federalCards.innerHTML = "";

  for (const item of federalSplit) {
    const amount = mapBudgetShareToAmount(total, item.share);
    const card = document.createElement("article");
    card.className = "federal-card";
    card.innerHTML = `
      <p class="summary-label">${item.description}</p>
      <h3>${item.label}</h3>
      <p class="federal-amount">${formatCurrency(amount)}</p>
      <div class="federal-meta">
        <span>${formatPercent(item.share)}</span>
      </div>
      ${buildBar(item.share)}
    `;
    federalCards.appendChild(card);
  }
}

function renderMinistries(total) {
  ministryList.innerHTML = "";

  for (const item of ministryAllocations) {
    const share = ministryShareFromCrore(item.amountCrore);
    const amount = mapBudgetShareToAmount(total, share);
    const row = document.createElement("article");
    row.className = "ministry-row";
    row.innerHTML = `
      <div class="ministry-top">
        <div>
          <p class="legend-title">${item.label}</p>
          <p class="ministry-note">${item.description}</p>
        </div>
        <div class="ministry-metrics">
          <p class="legend-value">${formatCurrency(amount)}</p>
          <p class="legend-percent">${formatPercent(share)}</p>
        </div>
      </div>
      ${buildBar(share)}
    `;
    ministryList.appendChild(row);
  }
}

function render(total) {
  if (total === null) {
    results.classList.add("is-hidden");
    legendList.innerHTML = "";
    donutChart.innerHTML = "";
    federalCards.innerHTML = "";
    ministryList.innerHTML = "";
    writeTaxToHistory(null, window.location, window.history);
    return;
  }

  results.classList.remove("is-hidden");
  totalTax.textContent = formatCurrency(total);
  donutTotal.textContent = formatCurrency(total);
  renderChart(total);
  renderLegend(total);
  renderFederal(total);
  renderMinistries(total);
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
