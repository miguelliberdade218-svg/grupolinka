// Currency conversion utilities for Mozambique Metical (MZN)
// Exchange rate: 1 USD ≈ 64 MZN (approximate, would be dynamic in real app)

const USD_TO_MZN_RATE = 64;

export function convertUsdToMzn(usdAmount: number): number {
  return Math.round(usdAmount * USD_TO_MZN_RATE);
}

export function formatMzn(amount: number): string {
  return `${amount.toLocaleString('pt-MZ')} MT`;
}

export function formatUsdAsMzn(usdAmount: number): string {
  const mznAmount = convertUsdToMzn(usdAmount);
  return formatMzn(mznAmount);
}

// For displaying prices that are already in cents (like ride prices "18.25")
export function formatPriceStringAsMzn(priceString: string): string {
  const usdAmount = parseFloat(priceString);
  return formatUsdAsMzn(usdAmount);
}