/**
 * Money formatting utilities for handling minor units (cents)
 */

/**
 * Convert minor units (cents) to major units (dollars/euros)
 * @param minorUnits - Amount in cents (e.g., 1000 = $10.00)
 * @returns Amount in major units
 */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Convert major units (dollars/euros) to minor units (cents)
 * @param majorUnits - Amount in dollars/euros (e.g., 10.5 = 1050 cents)
 * @returns Amount in cents, rounded
 */
export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

/**
 * Format minor units as currency string
 * @param minorUnits - Amount in cents
 * @param currency - ISO 4217 currency code (e.g., "eur", "usd")
 * @returns Formatted currency string (e.g., "€10.00")
 */
export function formatMoney(minorUnits: number, currency: string): string {
  const amount = toMajorUnits(minorUnits);
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is invalid
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol for a given currency code
 * @param currency - ISO 4217 currency code (e.g., "eur", "usd")
 * @returns Currency symbol (e.g., "€", "$")
 */
export function getCurrencySymbol(currency: string): string {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    // Extract symbol from formatted "0"
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find(part => part.type === 'currency');
    return symbolPart?.value || currency.toUpperCase();
  } catch (error) {
    // Fallback mappings
    const symbols: Record<string, string> = {
      eur: '€',
      usd: '$',
      gbp: '£',
      jpy: '¥',
      chf: 'CHF',
    };
    return symbols[currency.toLowerCase()] || currency.toUpperCase();
  }
}
