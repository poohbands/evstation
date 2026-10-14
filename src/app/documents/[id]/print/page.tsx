"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Printer,
  ArrowLeft,
  FileCheck,
  Zap,
  Building,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  DOC_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  THAI_MONTHS,
} from "@/lib/utils"
import { ThaiBahtText } from "@/lib/thai-baht-text"
import type { DocumentWithItems, OrganizationSettingsData } from "@/types"

export default function DocumentPrintPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [document, setDocument] = React.useState<DocumentWithItems | null>(null)
  const [settings, setSettings] = React.useState<OrganizationSettingsData | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Copy type: 'original' | 'copy' | 'both'
  const [printCopyType, setPrintCopyType] = React.useState<"original" | "copy" | "both">("both")

  React.useEffect(() => {
    async function fetchData() {
      if (!id) return
      try {
        setLoading(true)
        const [docRes, setRes] = await Promise.all([
          fetch(`/api/documents/${id}`),
          fetch(`/api/settings`),
        ])
        if (docRes.ok) {
          const docData = await docRes.json()
          setDocument(docData)
        }
        if (setRes.ok) {
          const setData = await setRes.json()
          setSettings(setData)
        }
      } catch (err) {
        console.error("Print page fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">กำลังจัดเตรียมเอกสารสำหรับพิมพ์...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
        <h2 className="text-lg font-bold text-slate-800">ไม่พบเอกสาร</h2>
        <Button onClick={() => router.back()} className="mt-4">
          ย้อนกลับ
        </Button>
      </div>
    )
  }

  // Document Title by DocType
  const getDocumentTitle = (type: string) => {
    switch (type) {
      case "INV_ELEC":
        return "ใบแจ้งหนี้ / ใบเรียกเก็บเงินค่าส่วนต่างไฟฟ้า"
      case "REC_ELEC":
        return "ใบเสร็จรับเงินค่าส่วนต่างไฟฟ้า"
      case "INV_RENT":
        return "ใบแจ้งหนี้ / ใบเรียกเก็บเงินค่าเช่าพื้นที่"
      case "REC_RENT":
        return "ใบเสร็จรับเงินค่าเช่าพื้นที่"
      default:
        return DOC_TYPE_LABELS[type] || "เอกสารทางการเงิน"
    }
  }

  const isInvoice = document.docType.startsWith("INV_")
  const monthName =
    document.billingMonth && document.billingMonth >= 1 && document.billingMonth <= 12
      ? THAI_MONTHS[document.billingMonth - 1]
      : ""
  const yearThai = document.billingYear ? document.billingYear + 543 : ""

  // Render Single Sheet
  const renderDocumentSheet = (copyLabel: "ต้นฉบับ (ORIGINAL)" | "สำเนา (COPY)", key: string) => {
    const isOriginal = copyLabel.includes("ต้นฉบับ")
    const totalItems = document.items?.length || 0
    // Pad rows so table has a formal accounting height (minimum 5 rows)
    const emptyRowsCount = Math.max(0, 5 - totalItems)

    return (
      <div
        key={key}
        className="print-document bg-white text-slate-900 border border-slate-300 shadow-2xl mx-auto my-6 print:my-0 print:border-none print:shadow-none"
      >
        {/* Header: Issuer & Copy Badge */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xl print:border print:border-slate-800">
              <Zap className="h-7 w-7 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {settings?.companyName || "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด"}
              </h2>
              <p className="text-xs text-slate-600 max-w-lg mt-0.5 leading-snug">
                {settings?.address || "88/8 หมู่ 5 ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120"}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600">
                <span>เลขประจำตัวผู้เสียภาษี: {settings?.taxId || "0105564012345"}</span>
                {settings?.phone && <span>โทร: {settings.phone}</span>}
                {settings?.email && <span>อีเมล: {settings.email}</span>}
              </div>
            </div>
          </div>

          {/* Copy Badge */}
          <div className="text-right">
            <div
              className={`inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                isOriginal
                  ? "bg-slate-900 text-white print:bg-slate-900 print:text-white"
                  : "border-2 border-slate-700 text-slate-800 bg-slate-50"
              }`}
            >
              {copyLabel}
            </div>
          </div>
        </div>

        {/* Document Title Banner */}
        <div className="my-3 text-center border-b border-slate-200 pb-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {getDocumentTitle(document.docType)}
          </h1>
          <div className="mt-1 flex justify-center gap-6 text-xs text-slate-700">
            <div>
              <span className="font-semibold">เลขที่:</span>{" "}
              <span className="font-bold text-sm text-blue-900">{document.docNumber}</span>
            </div>
            <div>
              <span className="font-semibold">วันที่:</span> {formatDate(document.issueDate)}
            </div>
            {isInvoice && document.dueDate && (
              <div className="text-red-700 font-semibold">
                <span>ครบกำหนดชำระ:</span> {formatDate(document.dueDate)}
              </div>
            )}
          </div>
        </div>

        {/* Customer & Station Info Box */}
        <div className="mb-3 rounded border border-slate-300 p-2.5 text-xs">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-8">
              <div className="flex">
                <span className="w-24 font-semibold text-slate-700 shrink-0">ลูกค้า:</span>
                <span className="font-bold text-slate-900">{document.customerName || "-"}</span>
              </div>
              <div className="flex mt-1">
                <span className="w-24 font-semibold text-slate-700 shrink-0">ที่อยู่:</span>
                <span className="text-slate-800">{document.customerAddress || "-"}</span>
              </div>
              <div className="flex mt-1">
                <span className="w-24 font-semibold text-slate-700 shrink-0">เลขประจำตัวผู้เสียภาษี:</span>
                <span className="text-slate-800">
                  {document.customerTaxId || "-"} &nbsp;&nbsp;
                  <span className="font-semibold">สาขา:</span> {document.customerBranch || "สำนักงานใหญ่"}
                </span>
              </div>
            </div>

            <div className="col-span-4 border-l border-slate-200 pl-3">
              <div className="flex">
                <span className="w-20 font-semibold text-slate-700 shrink-0">สถานี:</span>
                <span className="font-medium text-slate-900 truncate">
                  {document.stationName || "-"}
                </span>
              </div>
              <div className="flex mt-1">
                <span className="w-20 font-semibold text-slate-700 shrink-0">เลขที่สัญญา:</span>
                <span className="text-slate-800">{document.contractRef || "-"}</span>
              </div>
              <div className="flex mt-1">
                <span className="w-20 font-semibold text-slate-700 shrink-0">ประจำเดือน:</span>
                <span className="font-bold text-slate-900">
                  {monthName} {yearThai}
                </span>
              </div>
              {document.refInvoice && (
                <div className="flex mt-1 text-slate-600">
                  <span className="w-20 font-semibold shrink-0">อ้างอิงใบแจ้งหนี้:</span>
                  <span>{document.refInvoice.docNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-3 overflow-hidden rounded border border-slate-400">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-400 bg-slate-100 font-bold text-slate-800 text-center">
                <th className="border-r border-slate-300 py-2 px-2 w-10">ลำดับ</th>
                <th className="border-r border-slate-300 py-2 px-3 text-left">รายการ</th>
                {document.docType.includes("ELEC") && (
                  <>
                    <th className="border-r border-slate-300 py-2 px-2 w-20 text-right">
                      มิเตอร์ก่อน
                    </th>
                    <th className="border-r border-slate-300 py-2 px-2 w-20 text-right">
                      มิเตอร์หลัง
                    </th>
                  </>
                )}
                <th className="border-r border-slate-300 py-2 px-2 w-16 text-right">จำนวน</th>
                <th className="border-r border-slate-300 py-2 px-2 w-14 text-center">หน่วย</th>
                <th className="border-r border-slate-300 py-2 px-2 w-24 text-right">ราคา/หน่วย</th>
                <th className="py-2 px-3 w-28 text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {document.items?.map((item) => (
                <tr key={item.id || item.itemOrder} className="border-b border-slate-200">
                  <td className="border-r border-slate-300 py-1.5 px-2 text-center text-slate-600">
                    {item.itemOrder}
                  </td>
                  <td className="border-r border-slate-300 py-1.5 px-3 font-medium text-slate-900">
                    {item.description}
                  </td>
                  {document.docType.includes("ELEC") && (
                    <>
                      <td className="border-r border-slate-300 py-1.5 px-2 text-right text-slate-700">
                        {item.meterPrevious != null ? formatCurrency(item.meterPrevious) : "-"}
                      </td>
                      <td className="border-r border-slate-300 py-1.5 px-2 text-right text-slate-700">
                        {item.meterCurrent != null ? formatCurrency(item.meterCurrent) : "-"}
                      </td>
                    </>
                  )}
                  <td className="border-r border-slate-300 py-1.5 px-2 text-right font-medium text-slate-900">
                    {item.quantity.toLocaleString("th-TH")}
                  </td>
                  <td className="border-r border-slate-300 py-1.5 px-2 text-center text-slate-600">
                    {item.unitName || "-"}
                  </td>
                  <td className="border-r border-slate-300 py-1.5 px-2 text-right text-slate-800">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}

              {/* Pad empty rows for standard A4 accounting look */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-slate-100 h-6">
                  <td className="border-r border-slate-300">&nbsp;</td>
                  <td className="border-r border-slate-300">&nbsp;</td>
                  {document.docType.includes("ELEC") && (
                    <>
                      <td className="border-r border-slate-300">&nbsp;</td>
                      <td className="border-r border-slate-300">&nbsp;</td>
                    </>
                  )}
                  <td className="border-r border-slate-300">&nbsp;</td>
                  <td className="border-r border-slate-300">&nbsp;</td>
                  <td className="border-r border-slate-300">&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations Section */}
        <div className="mb-3 grid grid-cols-12 gap-3 text-xs">
          {/* Left: Thai Baht Text Box & Notes */}
          <div className="col-span-7 flex flex-col justify-between space-y-2">
            <div className="rounded border border-slate-400 p-2.5 bg-slate-50/50">
              <span className="font-semibold text-slate-700">จำนวนเงินตัวอักษร:</span>
              <div className="mt-1 font-bold text-slate-900 text-sm">
                {document.thaiBahtText || ThaiBahtText(document.netPayable)}
              </div>
            </div>

            {/* Payment instructions or Notes */}
            {isInvoice ? (
              <div className="rounded border border-slate-300 p-2 text-[11px] bg-slate-50">
                <span className="font-bold text-slate-800">ข้อมูลการโอนชำระเงิน:</span>
                <div className="mt-0.5 text-slate-700">
                  ธนาคาร: <span className="font-semibold">{settings?.bankName || "ธนาคารกสิกรไทย"}</span> |
                  เลขที่บัญชี: <span className="font-bold">{settings?.bankAccountNo || "123-4-56789-0"}</span>
                </div>
                <div className="text-slate-700">
                  ชื่อบัญชี: {settings?.bankAccountName || settings?.companyName}
                </div>
                {document.notes && (
                  <div className="mt-1 text-slate-600 border-t pt-1">
                    หมายเหตุ: {document.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded border border-slate-300 p-2 text-[11px] bg-slate-50">
                <span className="font-bold text-slate-800">ข้อมูลการรับเงิน:</span>
                <div className="mt-0.5 text-slate-700">
                  วิธีการชำระ:{" "}
                  <span className="font-semibold">
                    {document.paymentMethod
                      ? PAYMENT_METHOD_LABELS[document.paymentMethod] || document.paymentMethod
                      : "โอนเงิน"}
                  </span>
                  {document.paymentDate && (
                    <span> | วันที่: {formatDate(document.paymentDate)}</span>
                  )}
                  {document.paymentRef && (
                    <span> | เลขที่อ้างอิง: {document.paymentRef}</span>
                  )}
                </div>
                {document.notes && (
                  <div className="mt-1 text-slate-600 border-t pt-1">
                    หมายเหตุ: {document.notes}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Calculations Totals Box */}
          <div className="col-span-5 rounded border border-slate-400 bg-white">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-3 text-slate-600 font-medium">รวมเป็นเงิน</td>
                  <td className="py-1 px-3 text-right font-semibold text-slate-900">
                    {formatCurrency(document.subtotal)}
                  </td>
                </tr>
                {document.enableVat && (
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-3 text-slate-600">ภาษีมูลค่าเพิ่ม {document.vatRate}%</td>
                    <td className="py-1 px-3 text-right font-semibold text-slate-900">
                      {formatCurrency(document.vatAmount)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <td className="py-1 px-3 text-slate-800 font-semibold">จำนวนเงินรวมทั้งสิ้น</td>
                  <td className="py-1 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(document.grandTotal)}
                  </td>
                </tr>
                {document.enableWht && (
                  <tr className="border-b border-slate-200 text-amber-800">
                    <td className="py-1 px-3">หักภาษี ณ ที่จ่าย {document.whtRate}%</td>
                    <td className="py-1 px-3 text-right font-semibold">
                      -{formatCurrency(document.whtAmount)}
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-800">
                  <td className="py-2 px-3 text-slate-900 text-sm">ยอดชำระสุทธิ</td>
                  <td className="py-2 px-3 text-right text-base text-blue-900 font-extrabold">
                    {formatCurrency(document.netPayable)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="mt-8 pt-4 border-t border-slate-300">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            {/* Left Signer */}
            <div>
              <p className="font-semibold text-slate-800">
                {isInvoice ? "ผู้วางบิล / ผู้มีอำนาจลงนาม" : "ผู้รับเงิน / ผู้มีอำนาจลงนาม"}
              </p>
              <div className="h-16 flex items-end justify-center">
                <span className="w-48 border-b border-dotted border-slate-600 block" />
              </div>
              <p className="mt-2 font-medium text-slate-800">
                ({settings?.signerName || "นายสมชาย รักษ์พลังงาน"})
              </p>
              <p className="text-slate-500 text-[11px]">
                {settings?.signerTitle || "กรรมการผู้จัดการ"}
              </p>
              <p className="mt-1 text-slate-400 text-[11px]">วันที่ _____/_____/_________</p>
              <p className="mt-2 text-[10px] text-slate-400">(ประทับตราบริษัท)</p>
            </div>

            {/* Right Signer */}
            <div>
              <p className="font-semibold text-slate-800">
                {isInvoice ? "ผู้รับวางบิล" : "ผู้จ่ายเงิน"}
              </p>
              <div className="h-16 flex items-end justify-center">
                <span className="w-48 border-b border-dotted border-slate-600 block" />
              </div>
              <p className="mt-2 font-medium text-slate-800">
                (_________________________________)
              </p>
              <p className="text-slate-500 text-[11px]">
                {document.customerName || "การไฟฟ้าส่วนภูมิภาค"}
              </p>
              <p className="mt-1 text-slate-400 text-[11px]">วันที่ _____/_____/_________</p>
              <p className="mt-2 text-[10px] text-slate-400">(ประทับตราหน่วยงาน)</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-200/70 py-6 print:bg-white print:py-0">
      {/* Control Bar - Hidden during print */}
      <div className="container mx-auto mb-6 max-w-4xl rounded-xl bg-white p-4 shadow-md print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                พิมพ์เอกสาร: {document.docNumber}
              </h2>
              <p className="text-xs text-slate-500">
                {DOC_TYPE_LABELS[document.docType]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sheet Copy Options */}
            <div className="flex items-center rounded-lg border bg-slate-50 p-1 text-xs">
              <button
                type="button"
                onClick={() => setPrintCopyType("original")}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  printCopyType === "original"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ต้นฉบับ
              </button>
              <button
                type="button"
                onClick={() => setPrintCopyType("copy")}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  printCopyType === "copy"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                สำเนา
              </button>
              <button
                type="button"
                onClick={() => setPrintCopyType("both")}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  printCopyType === "both"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ทั้งสองแบบ (ต้นฉบับ + สำเนา)
              </button>
            </div>

            {/* Print Button */}
            <Button
              onClick={handlePrint}
              className="gap-2 bg-blue-600 px-5 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              พิมพ์เอกสาร / บันทึก PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Documents Container */}
      <div className="print-area">
        {(printCopyType === "original" || printCopyType === "both") &&
          renderDocumentSheet("ต้นฉบับ (ORIGINAL)", "sheet-original")}

        {printCopyType === "both" && <div className="page-break" />}

        {(printCopyType === "copy" || printCopyType === "both") &&
          renderDocumentSheet("สำเนา (COPY)", "sheet-copy")}
      </div>

      {/* Print CSS Rules */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 6mm;
        }

        @media print {
          html,
          body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-document {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 6mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid;
          }

          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }

        .print-document {
          width: 210mm;
          min-height: 287mm;
          padding: 10mm;
          font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}
