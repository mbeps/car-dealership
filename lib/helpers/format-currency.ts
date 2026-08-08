/**
 * Formats car prices as GBP currency without decimal places.
 *
 * Used for listing and card views where prices are stored as whole pound amounts.
 *
 * @param amount - Price amount to format.
 * @returns Formatted GBP price string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
