// Indicative estimation for the (upcoming) client-facing summary section.

// Indicative annual rate by housing status (owners get the best rate).
const ANNUAL_RATE = { proprietaire: 0.039, locataire: 0.049, heberge: 0.054 };
const DEFAULT_RATE = 0.049;
const DEFAULT_DURATION_MONTHS = 120; // 10 ans

// Estimated monthly payment of the consolidated loan (standard amortization).
// Returns null until we at least know the amount to finance and the housing status.
export function estimateMonthlyPayment(state) {
  if (state.montantTotalCredits == null || !state.statutLogement) return null;
  const principal =
    (state.montantTotalCredits ?? 0) + (state.montantTresorerie ?? 0);
  if (principal <= 0) return null;
  const rate = ANNUAL_RATE[state.statutLogement] ?? DEFAULT_RATE;
  const n = state.dureeMois ?? DEFAULT_DURATION_MONTHS;
  const r = rate / 12;
  const monthlyPayment =
    r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  return Math.round(monthlyPayment * 100) / 100;
}

// Debt-to-income ratio (%) of the estimated payment, or null if not computable.
export function debtToIncomeRatio(state) {
  const monthlyPayment = estimateMonthlyPayment(state);
  if (monthlyPayment == null || !state.revenusMensuels) return null;
  return Math.round((monthlyPayment / state.revenusMensuels) * 100);
}
