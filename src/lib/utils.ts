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

export function formatThaiDateDots(date: string | Date): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear() + 543
  return `${day} / ${month} / ${year}`
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

export const PAYOUT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  WAITING_SEND: { label: "1. รอส่งเอกสาร", color: "bg-amber-100 text-amber-800 border-amber-200" },
  SENT: { label: "2. ส่งเอกสารแล้ว", color: "bg-blue-100 text-blue-800 border-blue-200" },
  PEA_RECEIVED: { label: "3. กฟภ. ได้รับแล้ว", color: "bg-purple-100 text-purple-800 border-purple-200" },
  PAID: { label: "4. ได้รับเงินแล้ว", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
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

/**
 * Official PEA Headquarters Billing Details
 */
export const PEA_HEADQUARTERS = {
  name: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
  address: "เลขที่ 200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900",
  taxId: "0994000165501",
  branch: "สำนักงานใหญ่",
}

/**
 * Official Mailing Address for PEA VOLTA Billing Documents
 */
export const PEA_ENVELOPE_RECIPIENT = {
  contactName: "นางสาวระวีพร บุญพิทักษ์ (ปลื้ม)",
  department: "กองธุรกิจบริหารสินทรัพย์ ฝ่ายพัฒนาธุรกิจ ชั้น 5 อาคาร LED",
  organization: "การไฟฟ้าส่วนภูมิภาค (สำนักงานใหญ่)",
  address: "เลขที่ 200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ",
  postalCode: "10900",
  phone: "065-9546885",
}

/**
 * Official Google Drive link for PEA VOLTA Connext guidelines & sample documents
 */
export const PEA_GOOGLE_DRIVE_URL =
  "https://drive.google.com/drive/folders/1BXsj0hRlBY6JhHEgUEdNjPNgL6VJDc79?usp=sharing"

/**
 * Generate LINE notification message to send to PEA Officer with tracking number
 */
export function generatePeaLineMessage(params: {
  stationName: string
  billingMonthYear: string
  invNumber: string
  recNumber?: string
  amount: number
  trackingNumber: string
  carrier?: string
}): string {
  const carrier = params.carrier || "ไปรษณีย์ไทย EMS"
  return `เรียน คุณระวีพร (การไฟฟ้าส่วนภูมิภาค / PEA VOLTA)

ขอแจ้งจัดส่งเอกสารตัวจริงเพื่อเบิกจ่ายค่าบริการอัดประจุไฟฟ้า ประจำงวด ${params.billingMonthYear}
- สถานีบริการ: ${params.stationName}
- เลขที่ใบแจ้งหนี้: ${params.invNumber}${params.recNumber ? `\n- เลขที่ใบเสร็จรับเงิน/ใบกำกับภาษี: ${params.recNumber}` : ""}
- ยอดเงินขอเบิก: ${formatCurrency(params.amount)} บาท
- ขนส่ง: ${carrier}
- เลขพัสดุ (Tracking No.): ${params.trackingNumber}

รบกวนตรวจสอบและดำเนินการตามขั้นตอนให้ด้วยนะคะ/ครับ ขอบพระคุณมากค่ะ/ครับ`.trim()
}

/**
 * Generate LINE notification message when submitting monthly fee payment receipt to PEA
 */
export function generatePeaMonthlyFeeLineMessage(params: {
  monthYear: string
  stationName: string
  ref1: string
  ref2: string
  amount: number
  channel: string
}): string {
  return `เรียน คุณระวีพร (การไฟฟ้าส่วนภูมิภาค / PEA VOLTA)

ขอส่งภาพหลักฐานใบเสร็จรับเงินค่าบริการรายเดือน เพื่อนำมาแนบประกอบการเบิกเงินค่าอัดประจุไฟฟ้าค่ะ/ครับ
- ประจำงวด: ${params.monthYear}
- สถานีบริการ: ${params.stationName}
- หมายเลขบัญชีสัญญา (Ref.1): ${params.ref1}
- หมายเลขใบแจ้งหนี้ (Ref.2): ${params.ref2}
- ยอดเงินที่ชำระ: ${formatCurrency(params.amount)} บาท
- ช่องทางการชำระ: ${params.channel}

(แนบรูปภาพใบเสร็จรับเงินด้านล่างนี้แล้วค่ะ/ครับ)
รบกวนแนบประกอบการเบิกจ่ายให้ด้วยนะคะ/ครับ ขอบพระคุณค่ะ/ครับ`.trim()
}

