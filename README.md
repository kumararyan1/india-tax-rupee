# Where Did My Tax Go? India

A minimal Vite-based web app that shows how a tax amount maps to the Indian Union Budget 2025-26 expenditure split.

## Stack

- Vite for local development and production builds
- Vanilla JavaScript modules for the UI and tax calculation logic
- Vitest for calculation tests
- GitHub Actions for GitHub Pages deployment

## Project structure

- `src/main.js` renders the app and wires events
- `src/lib/tax.js` contains the testable tax/query helpers
- `src/data/breakdown.js` contains the budget split data
- `tests/tax.test.js` verifies the core calculation and query parsing logic
- `.github/workflows/deploy.yml` builds, tests, and deploys to Pages

## Local usage

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test
npm run build
```

## Data source

The expenditure split is based on the Ministry of Finance's `Budget at a Glance 2025-26` `Rupee Goes To` allocation.

- https://www.indiabudget.gov.in/budget2025-26/doc/Budget_at_Glance/bag1.pdf
- https://www.indiabudget.gov.in/
