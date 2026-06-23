/** Parse check-size filter query values into whole-dollar amounts (supports 2k, 1.5m, etc.). */
export const parseInvestmentAmount = (raw) => {
  if (raw == null || raw === "") return null;
  const cleaned = String(raw).trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!cleaned) return null;

  const match = cleaned.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!match) {
    const digitsOnly = cleaned.replace(/[^\d]/g, "");
    if (!digitsOnly) return null;
    const parsed = Number.parseInt(digitsOnly, 10);
    return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
  }

  let amount = Number.parseFloat(match[1]);
  if (Number.isNaN(amount) || amount < 0) return null;

  if (match[2] === "k") amount *= 1000;
  if (match[2] === "m") amount *= 1_000_000;

  return Math.round(amount);
};
