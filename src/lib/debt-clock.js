// Average Gregorian year; keep full precision until formatting in the UI.
export const SECONDS_PER_YEAR = 365.2425 * 24 * 60 * 60;

export function calculateDebtClock(valueFrom, valueTo) {
  if (!Number.isFinite(valueFrom) || !Number.isFinite(valueTo)) {
    throw new Error("Debt clock requires finite numeric observations.");
  }

  const change = valueTo - valueFrom;
  return {
    change,
    amount_per_second: change / SECONDS_PER_YEAR
  };
}
