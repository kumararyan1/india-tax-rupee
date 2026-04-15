import "./styles.css";
import { breakdown, detailGroups, entryModes, federalSplit } from "./data/breakdown.js";
import {
  buildAllocation,
  buildArcPath,
  buildDetailAllocations,
  clampTaxAmount,
  formatCurrency,
  formatPercent,
  mapBudgetShareToAmount,
  readAppState,
  writeAppStateToHistory
} from "./lib/tax.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page-shell">
    <section class="hero" aria-labelledby="page-title">
      <p class="eyebrow">India tax breakdown</p>
      <h1 id="page-title">Where did my tax go?</h1>
      <div class="mode-switcher" id="mode-switcher" role="tablist" aria-label="Tax type"></div>
      <p class="mode-helper" id="mode-helper"></p>
      <div class="input-stack">
        <label class="sr-only" for="tax-input">Tax paid in INR</label>
        <div class="input-row">
          <span class="currency-pill">Rs</span>
          <input
            id="tax-input"
            name="tax-input"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
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
        <div>
          <p class="summary-label">Tax entered</p>
          <p class="summary-value" id="total-tax">Rs 0.00</p>
        </div>
        <div class="action-row">
          <button class="action-button" id="copy-link" type="button">Copy link</button>
          <button class="action-button" id="snapshot-toggle" type="button">Snapshot mode</button>
          <button class="action-button" id="download-card" type="button">Download image</button>
        </div>
      </div>

      <div class="visual-panel">
        <div class="donut-wrap">
          <div class="chart-shell" id="chart-shell">
            <div class="chart-tooltip is-hidden" id="chart-tooltip"></div>
            <svg class="donut-chart" id="donut-chart" viewBox="0 0 240 240" aria-hidden="true"></svg>
          </div>
          <div class="donut-center">
            <span class="donut-label">Breakdown</span>
            <strong id="donut-total">Rs 0.00</strong>
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

        <section class="analysis-panel" aria-labelledby="detail-title">
          <div class="analysis-head">
            <p class="summary-label">Detailed allocation</p>
            <div class="analysis-title-row">
              <h2 id="detail-title">Where larger chunks land</h2>
              <button
                class="toggle-button"
                id="detail-toggle"
                type="button"
                aria-expanded="false"
                aria-controls="detail-panel"
              >
                Show detail
              </button>
            </div>
          </div>
          <div class="detail-panel is-collapsed" id="detail-panel">
            <div class="group-tabs" id="group-tabs" role="tablist" aria-label="Allocation groups"></div>
            <div class="ministry-list" id="ministry-list"></div>
          </div>
        </section>
      </div>

      <details class="methodology" id="methodology">
        <summary>Methodology and sources</summary>
        <div class="methodology-body">
          <p>
            Core budget shares come from the Government of India Union Budget FY 2025-26
            “Budget at a Glance” rupee allocation. Ministry-level figures come from the FY 2025-26
            “Expenditure of Ministries and Departments” tables. Grouped rows such as
            “state-linked flows” are derived by combining official published categories.
          </p>
          <ul>
            <li><a href="https://www.indiabudget.gov.in/budget2025-26/doc/Budget_at_Glance/bag1.pdf" target="_blank" rel="noreferrer">Budget at a Glance 2025-26</a></li>
            <li><a href="https://www.indiabudget.gov.in/budget2025-26/doc/eb/stat3a.pdf" target="_blank" rel="noreferrer">Expenditure of Ministries and Departments 2025-26</a></li>
            <li><a href="https://www.indiabudget.gov.in/" target="_blank" rel="noreferrer">India Budget portal</a></li>
          </ul>
        </div>
      </details>
    </section>
  </main>
`;

const state = {
  tax: null,
  previousTax: 0,
  type: "income-tax",
  snapshot: false,
  activeGroup: "states",
  detailsExpanded: false,
  pinnedSliceIndex: null
};

const taxInput = document.querySelector("#tax-input");
const totalTax = document.querySelector("#total-tax");
const donutTotal = document.querySelector("#donut-total");
const donutChart = document.querySelector("#donut-chart");
const legendList = document.querySelector("#legend-list");
const presetButtons = document.querySelectorAll(".preset");
const results = document.querySelector("#results");
const chartTooltip = document.querySelector("#chart-tooltip");
const chartShell = document.querySelector("#chart-shell");
const federalCards = document.querySelector("#federal-cards");
const ministryList = document.querySelector("#ministry-list");
const detailToggle = document.querySelector("#detail-toggle");
const detailPanel = document.querySelector("#detail-panel");
const modeSwitcher = document.querySelector("#mode-switcher");
const modeHelper = document.querySelector("#mode-helper");
const snapshotToggle = document.querySelector("#snapshot-toggle");
const copyLinkButton = document.querySelector("#copy-link");
const downloadCardButton = document.querySelector("#download-card");
const groupTabs = document.querySelector("#group-tabs");

function currentUrlState() {
  return {
    tax: state.tax,
    type: state.type,
    snapshot: state.snapshot
  };
}

function writeUrlState() {
  writeAppStateToHistory(currentUrlState(), window.location, window.history);
}

function animateNumber(element, start, end, duration = 360) {
  const startedAt = performance.now();

  function frame(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatCurrency(start + (end - start) * eased);

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function animateAmountNodes(container, items, previousTotal) {
  [...container.querySelectorAll("[data-share-value]")].forEach((node, index) => {
    const share = Number(node.dataset.shareValue);
    const start = (previousTotal * share) / 100;
    const end = items[index]?.amount ?? 0;
    animateNumber(node, start, end, 420);
  });
}

function setSnapshotMode(enabled) {
  state.snapshot = enabled;
  document.body.classList.toggle("snapshot-mode", enabled);
  snapshotToggle.textContent = enabled ? "Exit snapshot" : "Snapshot mode";
  writeUrlState();
}

function renderModeSwitcher() {
  modeSwitcher.innerHTML = "";

  for (const mode of entryModes) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-chip";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(mode.id === state.type));
    button.textContent = mode.label;
    button.addEventListener("click", () => {
      state.type = mode.id;
      renderModeSwitcher();
      writeUrlState();
    });
    modeSwitcher.appendChild(button);
  }

  const activeMode = entryModes.find((mode) => mode.id === state.type) ?? entryModes[0];
  modeHelper.textContent = activeMode.helper;
}

function resetChartHighlight() {
  donutChart.classList.remove("is-dimmed");
  chartTooltip.classList.add("is-hidden");

  for (const slice of donutChart.querySelectorAll(".chart-slice")) {
    slice.classList.remove("is-active");
    slice.style.setProperty("--slice-scale", "1");
  }
}

function highlightSlice(index) {
  donutChart.classList.add("is-dimmed");

  for (const slice of donutChart.querySelectorAll(".chart-slice")) {
    const sliceIndex = Number(slice.dataset.index);
    slice.classList.toggle("is-active", sliceIndex === index);
    slice.style.setProperty("--slice-scale", sliceIndex === index ? "1.06" : "0.98");
  }
}

function setTooltip(text, x, y) {
  chartTooltip.textContent = text;
  chartTooltip.style.left = `${x}px`;
  chartTooltip.style.top = `${y}px`;
  chartTooltip.classList.remove("is-hidden");
}

function renderChart(total) {
  let startPercent = 0;
  const allocations = buildAllocation(total);
  donutChart.innerHTML = "";
  resetChartHighlight();

  allocations.forEach((item, index) => {
    const endPercent = startPercent + item.share;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", buildArcPath(startPercent, endPercent));
    path.setAttribute("fill", item.color);
    path.setAttribute("class", "chart-slice");
    path.dataset.index = String(index);

    path.addEventListener("pointerenter", (event) => {
      if (state.pinnedSliceIndex !== null && state.pinnedSliceIndex !== index) {
        return;
      }

      highlightSlice(index);
      const bounds = donutChart.getBoundingClientRect();
      setTooltip(
        `${item.label}: ${formatCurrency(item.amount)} (${formatPercent(item.percent)})`,
        event.clientX - bounds.left + 14,
        event.clientY - bounds.top + 14
      );
    });

    path.addEventListener("pointermove", (event) => {
      if (state.pinnedSliceIndex !== null && state.pinnedSliceIndex !== index) {
        return;
      }

      const bounds = donutChart.getBoundingClientRect();
      setTooltip(
        `${item.label}: ${formatCurrency(item.amount)} (${formatPercent(item.percent)})`,
        event.clientX - bounds.left + 14,
        event.clientY - bounds.top + 14
      );
    });

    path.addEventListener("pointerleave", () => {
      if (state.pinnedSliceIndex === null) {
        resetChartHighlight();
      }
    });

    path.addEventListener("click", (event) => {
      event.stopPropagation();
      const bounds = donutChart.getBoundingClientRect();

      if (state.pinnedSliceIndex === index) {
        state.pinnedSliceIndex = null;
        resetChartHighlight();
        return;
      }

      state.pinnedSliceIndex = index;
      highlightSlice(index);
      setTooltip(
        `${item.label}: ${formatCurrency(item.amount)} (${formatPercent(item.percent)})`,
        event.clientX - bounds.left + 14,
        event.clientY - bounds.top + 14
      );
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
  const items = buildAllocation(total);
  legendList.innerHTML = "";

  for (const item of items) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <div class="legend-top">
        <span class="swatch" style="background:${item.color}"></span>
        <div class="legend-copy">
          <p class="legend-title">${item.label}</p>
          <p class="legend-value" data-share-value="${item.percent}">${formatCurrency(item.amount)}</p>
        </div>
        <p class="legend-percent">${formatPercent(item.percent)}</p>
      </div>
      ${buildBar(item.percent)}
    `;
    legendList.appendChild(listItem);
  }

  animateAmountNodes(legendList, items, state.previousTax);
}

function renderFederal(total) {
  const items = federalSplit.map((item) => ({
    ...item,
    amount: mapBudgetShareToAmount(total, item.share)
  }));

  federalCards.innerHTML = "";

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "federal-card";
    card.innerHTML = `
      <p class="summary-label">${item.description}</p>
      <h3>${item.label}</h3>
      <p class="federal-amount" data-share-value="${item.share}">${formatCurrency(item.amount)}</p>
      <div class="federal-meta">
        <span>${formatPercent(item.share)}</span>
      </div>
      ${buildBar(item.share)}
    `;
    federalCards.appendChild(card);
  }

  animateAmountNodes(federalCards, items, state.previousTax);
}

function renderGroupTabs(total) {
  groupTabs.innerHTML = "";

  for (const group of detailGroups) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "group-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(group.id === state.activeGroup));
    button.textContent = group.label;
    button.addEventListener("click", () => {
      state.activeGroup = group.id;
      renderGroupTabs(total);
      renderDetails(total);
    });
    groupTabs.appendChild(button);
  }
}

function renderDetails(total) {
  const items = buildDetailAllocations(total, state.activeGroup);
  ministryList.innerHTML = "";

  for (const item of items) {
    const row = document.createElement("article");
    row.className = "ministry-row";
    row.innerHTML = `
      <div class="ministry-top">
        <div>
          <p class="legend-title">${item.label}</p>
          <p class="ministry-note">${item.description}</p>
        </div>
        <div class="ministry-metrics">
          <p class="legend-value" data-share-value="${item.percent}">${formatCurrency(item.amount)}</p>
          <p class="legend-percent">${formatPercent(item.percent)}</p>
        </div>
      </div>
      ${buildBar(item.percent)}
    `;
    ministryList.appendChild(row);
  }

  animateAmountNodes(ministryList, items, state.previousTax);
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyLinkButton.textContent = "Copied";
  } catch {
    copyLinkButton.textContent = "Copy failed";
  }

  window.setTimeout(() => {
    copyLinkButton.textContent = "Copy link";
  }, 1200);
}

function downloadSnapshot(total) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1600, 900);
  gradient.addColorStop(0, "#111111");
  gradient.addColorStop(1, "#1d1b18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1600, 900);

  ctx.fillStyle = "#b4ada3";
  ctx.font = "32px sans-serif";
  ctx.fillText("India tax breakdown", 110, 110);

  ctx.fillStyle = "#f3eee6";
  ctx.font = "88px serif";
  ctx.fillText("Where did my tax go?", 110, 210);

  ctx.font = "40px sans-serif";
  ctx.fillText(`Mode: ${entryModes.find((mode) => mode.id === state.type)?.label ?? "Income Tax"}`, 110, 290);

  ctx.font = "64px sans-serif";
  ctx.fillText(formatCurrency(total), 110, 390);

  const topItems = buildAllocation(total).slice(0, 5);
  let y = 500;
  topItems.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(110, y - 22, 18, 18);
    ctx.fillStyle = "#f3eee6";
    ctx.font = "34px sans-serif";
    ctx.fillText(item.label, 150, y);
    ctx.fillStyle = "#d5cec3";
    ctx.textAlign = "right";
    ctx.fillText(`${formatCurrency(item.amount)} · ${formatPercent(item.percent)}`, 1490, y);
    ctx.textAlign = "left";
    y += 82;
  });

  ctx.fillStyle = "#8f867a";
  ctx.font = "28px sans-serif";
  ctx.fillText("Source: Union Budget FY 2025-26, Government of India", 110, 820);
  ctx.fillText(window.location.href, 110, 860);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "india-tax-breakdown.png";
  link.click();
}

function render(total) {
  if (total === null) {
    results.classList.add("is-hidden");
    legendList.innerHTML = "";
    donutChart.innerHTML = "";
    federalCards.innerHTML = "";
    ministryList.innerHTML = "";
    writeUrlState();
    return;
  }

  results.classList.remove("is-hidden");
  animateNumber(totalTax, state.previousTax, total);
  animateNumber(donutTotal, state.previousTax, total);
  renderChart(total);
  renderLegend(total);
  renderFederal(total);
  renderGroupTabs(total);
  renderDetails(total);
  writeUrlState();
  state.previousTax = total;
}

function syncInput(total) {
  state.tax = total;
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

detailToggle.addEventListener("click", () => {
  state.detailsExpanded = !state.detailsExpanded;
  detailToggle.setAttribute("aria-expanded", String(state.detailsExpanded));
  detailToggle.textContent = state.detailsExpanded ? "Hide detail" : "Show detail";
  detailPanel.classList.toggle("is-collapsed", !state.detailsExpanded);
});

snapshotToggle.addEventListener("click", () => {
  setSnapshotMode(!state.snapshot);
});

copyLinkButton.addEventListener("click", () => {
  copyShareLink();
});

downloadCardButton.addEventListener("click", () => {
  if (state.tax !== null) {
    downloadSnapshot(state.tax);
  }
});

document.addEventListener("click", (event) => {
  if (!chartShell.contains(event.target)) {
    state.pinnedSliceIndex = null;
    resetChartHighlight();
  }
});

const initialState = readAppState(window.location);
state.tax = initialState.tax;
state.type = entryModes.some((mode) => mode.id === initialState.type) ? initialState.type : "income-tax";

renderModeSwitcher();
setSnapshotMode(initialState.snapshot);
syncInput(initialState.tax);
