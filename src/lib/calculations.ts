/**
 * Financial calculation utilities for EV Charging billing documents.
 * Strictly aligned with official PEA VOLTA CONNEXT standards.
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
  return 3 // 3% for general services
}

export function calculateAllTotals(
  items: { quantity: number; unitPrice: number; amount?: number }[],
  enableVat: boolean = true,
  vatRate: number = 7,
  enableWht: boolean = false,
  whtRate: number = 0
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

/**
 * Smart PEA VOLTA Revenue Calculator (95% Rule)
 *
 * Rules from PEA VOLTA CONNEXT:
 * 1. Total_Excl_VAT = (kwh * ratePerKwh) OR rawAmount
 * 2. PEA Transaction Fee (5% Excl VAT) = Round(Total_Excl_VAT * 0.05, 2)
 * 3. 95% Claim Amount (Excl VAT) = Total_Excl_VAT - Fee_5_Percent
 * 4. If Non-VAT (บุคคลธรรมดา): Total = 95% Amount (No VAT line)
 *    If VAT 7% (นิติบุคคล): VAT 7% = Round(95% * 0.07, 2), Total = 95% + VAT
 */
export interface PeaVoltaCalculationResult {
  totalKwh: number
  ratePerKwh: number
  totalRawAmount: number // 100% Excl VAT
  peaFeeAmount: number   // 5% Fee Excl VAT
  totalClaim95: number   // 95% Claim Excl VAT
  vatAmount: number      // 7% VAT (if registered)
  grandTotal: number     // Total payable
  netPayable: number
  isVatRegistered: boolean
}

export function calculatePeaVoltaRevenue(params: {
  kwh?: number
  ratePerKwh?: number
  rawAmount?: number
  isVatRegistered: boolean
}): PeaVoltaCalculationResult {
  const kwh = params.kwh || 0
  const ratePerKwh = params.ratePerKwh || 0
  
  let totalRawAmount = 0
  if (params.rawAmount && params.rawAmount > 0) {
    totalRawAmount = roundTo2Decimals(params.rawAmount)
  } else if (kwh > 0 && ratePerKwh > 0) {
    totalRawAmount = roundTo2Decimals(kwh * ratePerKwh)
  }

  // 1. Fee 5% (Round 2 decimals)
  const peaFeeAmount = roundTo2Decimals(totalRawAmount * 0.05)
  // 2. 95% Claim Amount (Excl VAT)
  const totalClaim95 = roundTo2Decimals(totalRawAmount - peaFeeAmount)

  // 3. VAT calculation based on registration status
  let vatAmount = 0
  let grandTotal = totalClaim95

  if (params.isVatRegistered) {
    vatAmount = roundTo2Decimals(totalClaim95 * 0.07)
    grandTotal = roundTo2Decimals(totalClaim95 + vatAmount)
  }

  return {
    totalKwh: kwh,
    ratePerKwh,
    totalRawAmount,
    peaFeeAmount,
    totalClaim95,
    vatAmount,
    grandTotal,
    netPayable: grandTotal,
    isVatRegistered: params.isVatRegistered,
  }
}

/**
 * Generate official mandatory description for PEA VOLTA
 * Rule: "ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน .... ของสถานี ...."
 */
export function generatePeaVoltaDescription(monthName: string, yearTh: number, stationName: string): string {
  const cleanStation = stationName ? stationName.replace(/^สถานี(บริการ|ชาร์จ)?\s*/i, "").trim() : ""
  const displayStation = cleanStation || stationName || ""
  return `ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน ${monthName} ${yearTh} ของสถานี ${displayStation}`.trim()
}

/**
 * Calculate business days (excluding Sat & Sun) for PEA Payout SLA
 */
export function addBusinessDays(startDate: Date | string, days: number): Date {
  const date = new Date(startDate)
  let count = 0
  while (count < days) {
    date.setDate(date.getDate() + 1)
    const dayOfWeek = date.getDay()
    // 0 = Sun, 6 = Sat
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
  }
  return date
}

/**
 * Calculate remaining business days between today and target date
 */
export function getRemainingBusinessDays(targetDate: Date | string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)

  if (target < now) return 0

  let current = new Date(now)
  let businessDays = 0

  while (current < target) {
    current.setDate(current.getDate() + 1)
    const day = current.getDay()
    if (day !== 0 && day !== 6) {
      businessDays++
    }
  }

  return businessDays
}
