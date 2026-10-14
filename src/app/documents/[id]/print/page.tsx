"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Printer,
  ArrowLeft,
  Mail,
  FileCheck2,
  Loader2,
  Copy,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  formatCurrency,
  formatDate,
  formatThaiDateDots,
  PEA_HEADQUARTERS,
} from "@/lib/utils"
import { ThaiBahtText } from "@/lib/thai-baht-text"
import { getLocalDocument, saveLocalDocument } from "@/lib/client-storage"
import type { DocumentWithItems, OrganizationSettingsData } from "@/types"

export default function DocumentPrintPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [document, setDocument] = React.useState<DocumentWithItems | null>(null)
  const [settings, setSettings] = React.useState<OrganizationSettingsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [printCopyType, setPrintCopyType] = React.useState<"original" | "copy" | "both">("original")

  React.useEffect(() => {
    async function fetchData() {
      if (!id) return
      try {
        setLoading(true)
        const [docRes, setRes] = await Promise.all([
          fetch(`/api/documents/${id}`),
          fetch(`/api/settings`),
        ])

        let docData: DocumentWithItems | null = null

        if (docRes.ok) {
          docData = await docRes.json()
          saveLocalDocument(docData)
        } else {
          // Fallback to client localStorage
          const localDoc = getLocalDocument(id)
          if (localDoc) {
            docData = localDoc
            // Background re-sync to server
            fetch("/api/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localDoc),
            }).catch(() => {})
          }
        }

        setDocument(docData)
        if (setRes.ok) setSettings(await setRes.json())
      } catch (err) {
        console.error("Print page fetch error:", err)
        const localDoc = getLocalDocument(id)
        if (localDoc) {
          setDocument(localDoc)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 font-prompt">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>กำลังเตรียมเอกสารสำหรับพิมพ์...</span>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 font-prompt">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-slate-800">ไม่พบเอกสาร</h2>
          <Button onClick={() => router.push("/documents")}>กลับไปหน้ารายการ</Button>
        </div>
      </div>
    )
  }

  const isInvoice = document.docType.startsWith("INV")
  const isVat = document.isVatRegistered || (document.vatAmount && document.vatAmount > 0)
  const branchText = document.branchNumber ? ` (สาขาที่ ${document.branchNumber})` : settings?.branchNumber ? ` (สาขาที่ ${settings.branchNumber})` : ""

  const issuerName = `${settings?.companyName || document.stationName}${isVat ? branchText : ""}`

  const renderSingleDoc = (copyBadgeText: string, isOriginal: boolean) => {
    return (
      <div className="print-document bg-white text-black p-8 md:p-12 my-6 mx-auto shadow-xl border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Top Original/Copy Badge */}
        <div className="flex justify-end mb-2">
          <span className="border border-black px-3 py-0.5 text-xs font-bold tracking-wider uppercase">
            {copyBadgeText}
          </span>
        </div>

        {isInvoice ? (
          /* ========================================================= */
          /* TEMPLATE 1: PEA VOLTA INVOICE (ใบแจ้งหนี้)                 */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Top Left: Issuer Details */}
            <div className="text-sm leading-relaxed">
              <div className="font-bold text-base">{issuerName}</div>
              <div>ที่อยู่ {settings?.address || "88/8 หมู่ 5 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120"}</div>
              <div>โทรศัพท์ {settings?.phone || "02-123-4567"}</div>
              <div>เลขประจำตัวผู้เสียภาษี {settings?.taxId || "0105564012345"}</div>
            </div>

            {/* Center Title */}
            <div className="text-center py-2">
              <h1 className="text-2xl font-bold tracking-wide">ใบแจ้งหนี้</h1>
            </div>

            {/* Customer & Document Info Header */}
            <div className="grid grid-cols-12 gap-4 border-t border-b border-black py-3 text-sm">
              <div className="col-span-8 space-y-1">
                <div>
                  <span className="font-bold">ลูกค้า </span>
                  <span>{document.customerName || PEA_HEADQUARTERS.name}</span>
                </div>
                <div>
                  <span className="font-bold">ที่อยู่ </span>
                  <span>{document.customerAddress || PEA_HEADQUARTERS.address}</span>
                </div>
                <div>
                  <span className="font-bold">เลขประจำตัวผู้เสียภาษี </span>
                  <span className="font-mono">{document.customerTaxId || PEA_HEADQUARTERS.taxId}</span>
                </div>
              </div>

              <div className="col-span-4 text-right space-y-1">
                <div>
                  <span className="font-bold">วันที่ </span>
                  <span>{formatThaiDateDots(document.issueDate)}</span>
                </div>
                <div>
                  <span className="font-bold">เลขที่ : </span>
                  <span className="font-mono font-bold">{document.docNumber}</span>
                </div>
              </div>
            </div>

            {/* Table Columns: ลำดับ | รายการ | จำนวนหน่วย (Unit) | จำนวนเงิน (Bath) */}
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="border-b border-black bg-slate-50 print:bg-transparent text-center font-bold">
                  <th className="border-r border-black py-2.5 px-2 w-14">ลำดับ</th>
                  <th className="border-r border-black py-2.5 px-3 text-left">รายการ</th>
                  <th className="border-r border-black py-2.5 px-2 w-28 text-center leading-tight">
                    จำนวนหน่วย<br /><span className="text-xs font-normal">(Unit)</span>
                  </th>
                  <th className="py-2.5 px-3 w-36 text-right leading-tight">
                    จำนวนเงิน<br /><span className="text-xs font-normal">(Bath)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((it, idx) => (
                  <tr key={it.id || idx} className="border-b border-black">
                    <td className="border-r border-black py-3 px-2 text-center align-top font-medium">
                      {idx + 1}
                    </td>
                    <td className="border-r border-black py-3 px-3 align-top leading-relaxed">
                      {it.description}
                    </td>
                    <td className="border-r border-black py-3 px-2 text-center align-top font-mono">
                      {it.quantity}
                    </td>
                    <td className="py-3 px-3 text-right align-top font-mono font-medium">
                      {formatCurrency(it.amount)}
                    </td>
                  </tr>
                ))}
                {/* Empty rows to maintain formal document height */}
                {document.items.length < 3 && (
                  <tr className="border-b border-black h-16">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                {/* Table Footer with Thai Baht Text on Left, Calculations on Right */}
                <tr className="border-t border-black">
                  <td colSpan={2} className="border-r border-black p-3 align-top">
                    <div className="font-bold mb-1">จำนวนเงิน (ตัวอักษร)</div>
                    <div className="font-semibold text-slate-800">
                      {document.thaiBahtText || ThaiBahtText(document.grandTotal)}
                    </div>
                  </td>
                  <td colSpan={2} className="p-0 align-top">
                    <div className="text-sm">
                      {isVat ? (
                        <>
                          <div className="flex justify-between border-b border-black px-3 py-1.5 font-medium">
                            <span>รวมเป็นเงิน</span>
                            <span className="font-mono">{formatCurrency(document.subtotal)}</span>
                          </div>
                          <div className="flex justify-between border-b border-black px-3 py-1.5 font-medium">
                            <span>จำนวนภาษีมูลค่าเพิ่ม 7%</span>
                            <span className="font-mono">{formatCurrency(document.vatAmount)}</span>
                          </div>
                        </>
                      ) : null}

                      {document.whtAmount && document.whtAmount > 0 ? (
                        <div className="flex justify-between border-b border-black px-3 py-1.5 font-medium text-slate-700">
                          <span>หักภาษี ณ ที่จ่าย {document.whtRate}%</span>
                          <span className="font-mono">- {formatCurrency(document.whtAmount)}</span>
                        </div>
                      ) : null}

                      <div className="flex justify-between px-3 py-2 font-bold text-base bg-slate-50 print:bg-transparent">
                        <span>จำนวนเงินรวมทั้งสิ้น</span>
                        <span className="font-mono">{formatCurrency(document.netPayable || document.grandTotal)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Signature Section: ผู้วางบิล & ผู้รับวางบิล */}
            <div className="grid grid-cols-2 gap-8 pt-6 text-sm">
              <div className="text-center space-y-2">
                <div className="font-bold">ผู้วางบิล</div>
                <div className="pt-8">......................................................</div>
                <div>({settings?.signerName || "นายสมชาย รักษ์พลังงาน"})</div>
                <div>วันที่ ...../...../.....</div>
              </div>

              <div className="text-center space-y-2">
                <div className="font-bold">ผู้รับวางบิล</div>
                <div className="pt-8">......................................................</div>
                <div>(การไฟฟ้าส่วนภูมิภาค)</div>
                <div>วันที่ ...../...../.....</div>
              </div>
            </div>

            {/* Payment Instruction Footer (Official PEA Requirements) */}
            <div className="border border-black p-3.5 text-xs space-y-1.5 mt-6 bg-slate-50/40 print:bg-transparent">
              <div className="font-bold">
                กรุณาโอนเข้าบัญชี  {settings?.bankAccountName || settings?.companyName || "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด"}  ชื่อธนาคาร {settings?.bankName || "ธนาคารกสิกรไทย"} สาขา {settings?.bankBranch || "สาขาคลองหลวง"}
              </div>
              <div>
                บัญชี{settings?.bankAccountType === "CURRENT" ? "กระแสรายวัน" : "ออมทรัพย์"} เลขที่ {settings?.bankAccountNo || "123-4-56789-0"}
              </div>
              <div>
                โทร. คุณ {settings?.contactPerson || "สมชาย"} เบอร์ {settings?.contactPhone || "081-234-5678"} (ฝ่ายบัญชี) Email : {settings?.email || "billing@company.co.th"}
              </div>
              <div className="text-[11px] text-slate-600 print:text-black italic pt-0.5">
                * หมายเหตุ: ธนาคารกรุงไทย (Direct Credit) ยกเว้นค่าธรรมเนียม / ต่างธนาคารไม่เกิน 2 ล้านบาท (Smart Credit) ยกเว้นค่าธรรมเนียมการโอน
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* TEMPLATE 2: PEA VOLTA RECEIPT / TAX INVOICE               */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Center Title */}
            <div className="text-center py-1">
              <h1 className="text-2xl font-bold tracking-wide">
                {isVat ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "ใบเสร็จรับเงิน"}
              </h1>
            </div>

            {/* Top Section: Issuer Info per PEA template */}
            <div className="text-sm space-y-1 leading-relaxed border-b border-black pb-3">
              <div>
                <span className="font-bold">ชื่อผู้ประกอบการ : </span>
                <span>{issuerName}</span>
              </div>
              <div>
                <span className="font-bold">เลขประจำตัวผู้เสียภาษีอากร : </span>
                <span className="font-mono">{settings?.taxId || document.customerTaxId}</span>
              </div>
              <div>
                <span className="font-bold">ชื่อสถานีบริการ : </span>
                <span>{document.stationName || settings?.companyName}</span>
              </div>
              <div>
                <span className="font-bold">ที่อยู่ : </span>
                <span>{settings?.address || document.customerAddress}</span>
              </div>
            </div>

            {/* Customer & Document Info Header */}
            <div className="grid grid-cols-12 gap-4 border-b border-black pb-3 text-sm">
              <div className="col-span-8 space-y-1">
                <div>
                  <span className="font-bold">เลขที่บัญชีลูกค้า : </span>
                  <span className="font-mono">{document.contractRef || "-"}</span>
                </div>
                <div>
                  <span className="font-bold">ชื่อลูกค้า : </span>
                  <span>{document.customerName || PEA_HEADQUARTERS.name}</span>
                </div>
                <div>
                  <span className="font-bold">ที่อยู่ลูกค้า : </span>
                  <span>{document.customerAddress || PEA_HEADQUARTERS.address}</span>
                </div>
                <div>
                  <span className="font-bold">เลขประจำตัวผู้เสียภาษี : </span>
                  <span className="font-mono">{document.customerTaxId || PEA_HEADQUARTERS.taxId}</span>
                </div>
              </div>

              <div className="col-span-4 text-right space-y-1">
                <div>
                  <span className="font-bold">เลขที่เอกสาร : </span>
                  <span className="font-mono font-bold">{document.docNumber}</span>
                </div>
                <div>
                  <span className="font-bold">วันที่ </span>
                  <span>{formatThaiDateDots(document.issueDate)}</span>
                </div>
              </div>
            </div>

            {/* Table Columns: ลำดับ | รายการ | มูลค่า (บาท) - strictly NO unit column */}
            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="border-b border-black bg-slate-50 print:bg-transparent text-center font-bold">
                  <th className="border-r border-black py-2.5 px-2 w-14">ลำดับ</th>
                  <th className="border-r border-black py-2.5 px-3 text-left">รายการ</th>
                  <th className="py-2.5 px-3 w-40 text-right leading-tight">
                    มูลค่า<br /><span className="text-xs font-normal">(บาท)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((it, idx) => (
                  <tr key={it.id || idx} className="border-b border-black">
                    <td className="border-r border-black py-3 px-2 text-center align-top font-medium">
                      {idx + 1}
                    </td>
                    <td className="border-r border-black py-3 px-3 align-top leading-relaxed">
                      {it.description}
                    </td>
                    <td className="py-3 px-3 text-right align-top font-mono font-medium">
                      {formatCurrency(it.amount)}
                    </td>
                  </tr>
                ))}
                {document.items.length < 3 && (
                  <tr className="border-b border-black h-20">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                {/* Table Footer with Thai Baht Text & VAT Breakdown */}
                <tr className="border-t border-black">
                  <td colSpan={2} className="border-r border-black p-3 align-top">
                    <div className="font-bold mb-1">จำนวนเงิน (ตัวอักษร)</div>
                    <div className="font-semibold text-slate-800">
                      ({document.thaiBahtText ? document.thaiBahtText.replace(/[()]/g, "") : ThaiBahtText(document.grandTotal).replace(/[()]/g, "")})
                    </div>
                  </td>
                  <td className="p-0 align-top">
                    <div className="text-sm">
                      {isVat ? (
                        <>
                          <div className="flex justify-between border-b border-black px-3 py-1.5 font-medium">
                            <span>รวมเป็นเงิน</span>
                            <span className="font-mono">{formatCurrency(document.subtotal)}</span>
                          </div>
                          <div className="flex justify-between border-b border-black px-3 py-1.5 font-medium">
                            <span>จำนวนภาษีมูลค่าเพิ่ม 7 %</span>
                            <span className="font-mono">{formatCurrency(document.vatAmount)}</span>
                          </div>
                        </>
                      ) : null}

                      <div className="flex justify-between px-3 py-2 font-bold text-base bg-slate-50 print:bg-transparent">
                        <span>จำนวนเงินรวมทั้งสิ้น</span>
                        <span className="font-mono">{formatCurrency(document.grandTotal)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Bottom Right Signature: ผู้รับเงิน */}
            <div className="flex justify-end pt-12 pr-4 text-sm">
              <div className="text-center space-y-3">
                <div>ผู้รับเงิน  ________________________________________</div>
                <div className="text-xs text-slate-600 print:text-black">
                  ({settings?.signerName || "นายสมชาย รักษ์พลังงาน"})
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sarabun text-slate-900 pb-16">
      {/* Print Controls Header (Hidden in Print) */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-md print:hidden font-prompt">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/documents/${id}`)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้ารายละเอียด
          </Button>

          <div className="hidden sm:block text-sm">
            <span className="font-semibold text-slate-900">{document.docNumber}</span>
            <span className="text-slate-400 mx-2">&bull;</span>
            <span className="text-slate-600">
              {isInvoice ? "ใบแจ้งหนี้ กฟภ." : isVat ? "ใบเสร็จ/ใบกำกับภาษี กฟภ." : "ใบเสร็จรับเงิน กฟภ."}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              onClick={() => setPrintCopyType("original")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                printCopyType === "original"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ต้นฉบับ
            </button>
            <button
              onClick={() => setPrintCopyType("copy")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                printCopyType === "copy"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              สำเนา
            </button>
            <button
              onClick={() => setPrintCopyType("both")}
              className={`px-2.5 py-1 rounded font-medium transition ${
                printCopyType === "both"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ทั้งสองแบบ
            </button>
          </div>

          {/* Envelope Cover Sheet Shortcut */}
          <Link href={`/envelope?docId=${document.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Mail className="h-4 w-4 text-purple-600" />
              ใบปะหน้าซอง กฟภ.
            </Button>
          </Link>

          {/* Print Button */}
          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-semibold text-sm"
          >
            <Printer className="h-4 w-4" />
            พิมพ์เอกสาร / บันทึก PDF (A4)
          </Button>
        </div>
      </div>

      {/* Render Document(s) for Screen and Print */}
      <div className="max-w-[210mm] mx-auto print:max-w-none">
        {printCopyType === "original" && renderSingleDoc("ต้นฉบับ (ORIGINAL)", true)}
        {printCopyType === "copy" && renderSingleDoc("สำเนา (COPY)", false)}
        {printCopyType === "both" && (
          <>
            {renderSingleDoc("ต้นฉบับ (ORIGINAL)", true)}
            <div className="page-break" style={{ pageBreakBefore: "always" }} />
            {renderSingleDoc("สำเนา (COPY)", false)}
          </>
        )}
      </div>
    </div>
  )
}
