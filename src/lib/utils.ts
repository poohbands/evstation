import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatShortDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  INV_ELEC: "ใบแจ้งหนี้ค่าส่วนต่างไฟฟ้า",
  REC_ELEC: "ใบเสร็จรับเงินค่าส่วนต่างไฟฟ้า",
  INV_RENT: "ใบแจ้งหนี้ค่าเช่าพื้นที่",
  REC_RENT: "ใบเสร็จรับเงินค่าเช่าพื้นที่",
}

export const DOC_TYPE_PREFIXES: Record<string, string> = {
  INV_ELEC: "INV-EV",
  REC_ELEC: "REC-EV",
  INV_RENT: "INV-RENT",
  REC_RENT: "REC-RENT",
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอชำระ",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  TRANSFER: "โอนเงิน",
  CHEQUE: "เช็ค",
  CASH: "เงินสด",
}

export const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
]
