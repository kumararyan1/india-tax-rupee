export const breakdown = [
  { label: "State share of taxes and duties", share: 22, color: "#cf9363" },
  { label: "Interest payments", share: 20, color: "#ba6e42" },
  { label: "Central sector schemes", share: 16, color: "#deb07c" },
  { label: "Defence", share: 8, color: "#7b8c96" },
  { label: "Finance Commission and other transfers", share: 8, color: "#6f8a82" },
  { label: "Other expenditure", share: 8, color: "#6c7794" },
  { label: "Centrally sponsored schemes", share: 8, color: "#8e8a9f" },
  { label: "Major subsidies", share: 6, color: "#b78865" },
  { label: "Pensions", share: 4, color: "#a89a74" }
];

export const totalExpenditureCrore = 5065345;

export const entryModes = [
  {
    id: "income-tax",
    label: "Income Tax",
    helper: "Enter your annual income tax estimate or the amount from your return."
  },
  {
    id: "gst-estimate",
    label: "GST Estimate",
    helper: "Use an annual GST-heavy tax estimate if that is how you want to model spending."
  },
  {
    id: "custom",
    label: "Custom Estimate",
    helper: "Use any annual tax estimate you want to map across the Union Budget."
  }
];

export const federalSplit = [
  {
    label: "Direct state tax share",
    share: 22,
    description: "Tax devolution to states"
  },
  {
    label: "State-linked flows",
    share: 38,
    description: "State share, Finance Commission transfers, and centrally sponsored schemes"
  },
  {
    label: "Union-retained spending",
    share: 62,
    description: "Interest, defence, central schemes, subsidies, pensions, and other Union spending"
  }
];

export const detailGroups = [
  { id: "states", label: "States" },
  { id: "welfare", label: "Welfare" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "defence", label: "Defence" },
  { id: "debt", label: "Debt" }
];

export const detailAllocations = [
  {
    label: "State share of taxes and duties",
    share: 22,
    group: "states",
    description: "Direct devolution from the divisible tax pool to states"
  },
  {
    label: "Finance Commission and other transfers",
    share: 8,
    group: "states",
    description: "Finance Commission grants and other transfer flows"
  },
  {
    label: "Centrally sponsored schemes",
    share: 8,
    group: "states",
    description: "Schemes largely implemented with states"
  },
  {
    label: "Rural Development",
    amountCrore: 187754.53,
    group: "welfare",
    description: "Department of Rural Development"
  },
  {
    label: "Fertilisers",
    amountCrore: 156502.44,
    group: "welfare",
    description: "Department of Fertilisers"
  },
  {
    label: "Agriculture and Farmers Welfare",
    amountCrore: 127290.16,
    group: "welfare",
    description: "Department of Agriculture and Farmers Welfare"
  },
  {
    label: "Health and Family Welfare",
    amountCrore: 95957.87,
    group: "welfare",
    description: "Department of Health and Family Welfare"
  },
  {
    label: "Major subsidies",
    share: 6,
    group: "welfare",
    description: "Food, fertilizer, and petroleum subsidy support"
  },
  {
    label: "Road Transport and Highways",
    amountCrore: 287333.16,
    group: "infrastructure",
    description: "Ministry of Road Transport and Highways"
  },
  {
    label: "Railways",
    amountCrore: 255445.18,
    group: "infrastructure",
    description: "Ministry of Railways"
  },
  {
    label: "Telecommunications",
    amountCrore: 81005.24,
    group: "infrastructure",
    description: "Department of Telecommunications"
  },
  {
    label: "Central sector schemes",
    share: 16,
    group: "infrastructure",
    description: "Broader Union scheme spending, including infrastructure-linked outlays"
  },
  {
    label: "Defence aggregate",
    amountCrore: 652527.3,
    group: "defence",
    description: "Defence Services revenue, capital outlay, defence pensions, and defence civil"
  },
  {
    label: "Interest payments",
    share: 20,
    group: "debt",
    description: "Servicing outstanding government debt"
  },
  {
    label: "Pensions",
    share: 4,
    group: "debt",
    description: "Civil and defence pension obligations"
  },
  {
    label: "Revenue",
    amountCrore: 132844.36,
    group: "debt",
    description: "Department of Revenue"
  }
];
