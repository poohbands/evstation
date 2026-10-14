/**
 * Financial calculation utilities for EV Charging billing documents.
 */

export function roundTo2Decimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100
}

export function calculateSubtotal(
  items: { quantity: number; unitPrice: number; amount?: number }[]
): number {
  const sum = items.reduce((acc, item) => {
    const itemTotal =
      typeof item.amount === "number" && !isNaN(item.amount) && item.amount !== 0
        ? item.amount
        : (item.quantity || 0) * (item.unitPrice || 0)
    return acc + itemTotal
  }, 0)
  return roundTo2Decimals(sum)
}

export function calculateVat(subtotal: number, vatRate: number, enabled: boolean): number {
  if (!enabled || subtotal <= 0 || !vatRate) return 0
  return roundTo2Decimals(subtotal * (vatRate / 100))
}

export function calculateWht(subtotal: number, whtRate: number, enabled: boolean): number {
  if (!enabled || subtotal <= 0 || !whtRate) return 0
  return roundTo2Decimals(subtotal * (whtRate / 100))
}

export function calculateGrandTotal(subtotal: number, vatAmount: number): number {
  return roundTo2Decimals(subtotal + vatAmount)
}

export function calculateNetPayable(grandTotal: number, whtAmount: number): number {
  return roundTo2Decimals(grandTotal - whtAmount)
}

export function getDefaultWhtRate(docType: string): number {
  if (docType === "INV_RENT" || docType === "REC_RENT" || docType.includes("RENT")) {
    return 5 // 5% for rental services in Thailand
  }
  return 3 // 3% for services / electricity difference
}

export function calculateAllTotals(
  items: { quantity: number; unitPrice: number; amount?: number }[],
  enableVat: boolean = true,
  vatRate: number = 7,
  enableWht: boolean = true,
  whtRate: number = 3
) {
  const subtotal = calculateSubtotal(items)
  const vatAmount = calculateVat(subtotal, vatRate, enableVat)
  const whtAmount = calculateWht(subtotal, whtRate, enableWht)
  const grandTotal = calculateGrandTotal(subtotal, vatAmount)
  const netPayable = calculateNetPayable(grandTotal, whtAmount)

  return {
    subtotal,
    vatRate,
    vatAmount,
    whtRate,
    whtAmount,
    grandTotal,
    netPayable,
  }
}
