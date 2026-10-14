"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Printer,
  ArrowLeft,
  Mail,
  CheckSquare,
  Building2,
  Phone,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PEA_ENVELOPE_RECIPIENT, PEA_HEADQUARTERS, PEA_GOOGLE_DRIVE_URL } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import type { OrganizationSettingsData, DocumentWithItems } from "@/types"

function EnvelopeCoverContent() {
  const searchParams = useSearchParams()
  const docId = searchParams.get("docId")
  const { toast } = useToast()

  const [settings, setSettings] = React.useState<OrganizationSettingsData | null>(null)
  const [doc, setDoc] = React.useState<DocumentWithItems | null>(null)
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  // Checklist states
  const [checkedItems, setCheckedItems] = React.useState({
    invoice: true,
    receipt: true,
    companyCert: false,
    idCard: false,
    pp20: false,
    bookBank: false,
    contract: false,
    transferForm: false,
  })

  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d))
      .catch((e) => console.error(e))

    if (docId) {
      fetch(`/api/documents/${docId}`)
        .then((r) => r.json())
        .then((d) => {
          setDoc(d)
          if (d.trackingNumber) setTrackingNumber(d.trackingNumber)
        })
        .catch((e) => console.error(e))
    }
  }, [docId])

  const toggleCheck = (key: keyof typeof checkedItems) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const copyAddress = () => {
    const text = `กรุณาส่ง: ${PEA_ENVELOPE_RECIPIENT.contactName}\n${PEA_ENVELOPE_RECIPIENT.department}\n${PEA_ENVELOPE_RECIPIENT.organization}\n${PEA_ENVELOPE_RECIPIENT.address}\nรหัสไปรษณีย์ ${PEA_ENVELOPE_RECIPIENT.postalCode}\nโทร. ${PEA_ENVELOPE_RECIPIENT.phone}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: "คัดลอกที่อยู่ กฟภ. เรียบร้อยแล้ว" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-100 font-prompt pb-16">
      {/* Control Bar (Hidden on print) */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <Link href={docId ? `/documents/${docId}` : "/documents"}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>ใบปะหน้าซองจดหมายส่ง กฟภ. & รายการตรวจสอบเอกสาร (Checklist)</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={PEA_GOOGLE_DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              ตัวอย่างเอกสาร กฟภ. (Drive)
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={copyAddress}
            className="gap-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            คัดลอกที่อยู่ส่ง กฟภ.
          </Button>

          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold text-sm shadow-sm"
          >
            <Printer className="h-4 w-4" />
            สั่งพิมพ์ใบปะหน้าซอง (A4)
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Printable Envelope Sheet Section */}
        <div className="print-document bg-white p-8 md:p-12 shadow-xl border border-slate-300 rounded-xl print:shadow-none print:border-none print:m-0 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-lg text-slate-900 uppercase tracking-wide">
                เอกสารสำคัญทางบัญชีและการเงิน &bull; การไฟฟ้าส่วนภูมิภาค (PEA)
              </div>
              <div className="text-xs text-slate-500">
                เอกสารวางบิลค่าบริการอัดประจุยานยนต์ไฟฟ้า PEA VOLTA CONNEXT
              </div>
            </div>
            <div className="border-2 border-red-600 px-3 py-1 rounded text-red-600 text-xs font-bold uppercase tracking-wider">
              ด่วนมาก / เอกสารต้นฉบับ
            </div>
          </div>

          {/* Grid Layout: Sender vs Recipient */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 text-sm">
            {/* Sender Box */}
            <div className="border-2 border-slate-300 rounded-xl p-5 space-y-2 bg-slate-50/50 print:bg-transparent">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b">
                <span>ชื่อและที่อยู่ผู้ส่ง (SENDER)</span>
              </div>
              <div className="font-bold text-base text-slate-900">
                {settings?.companyName || "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด"}
              </div>
              <div className="text-slate-700 leading-relaxed">
                {settings?.address || "88/8 หมู่ 5 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120"}
              </div>
              <div className="pt-2 text-xs text-slate-600 space-y-0.5">
                <div>ผู้ติดต่อ: {settings?.contactPerson || settings?.signerName || "สมชาย รักษ์พลังงาน"}</div>
                <div>โทรศัพท์: {settings?.contactPhone || settings?.phone || "02-123-4567"}</div>
                {doc && (
                  <div className="font-semibold text-blue-700 pt-1">
                    อ้างอิงเอกสาร: {doc.docNumber}
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Box (Large and Prominent for Courier) */}
            <div className="border-2 border-blue-600 rounded-xl p-5 space-y-2.5 bg-blue-50/40 print:bg-transparent shadow-sm">
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-blue-200">
                <span>กรุณาส่งถึงผู้รับ (RECIPIENT)</span>
              </div>
              <div className="text-lg font-bold text-slate-900 leading-tight">
                {PEA_ENVELOPE_RECIPIENT.contactName}
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {PEA_ENVELOPE_RECIPIENT.department}
              </div>
              <div className="text-sm font-bold text-blue-900">
                {PEA_ENVELOPE_RECIPIENT.organization}
              </div>
              <div className="text-sm text-slate-700 leading-relaxed">
                {PEA_ENVELOPE_RECIPIENT.address}
              </div>
              <div className="text-base font-bold text-blue-900 tracking-wider">
                รหัสไปรษณีย์ {PEA_ENVELOPE_RECIPIENT.postalCode}
              </div>
              <div className="pt-1 text-sm font-bold text-red-600 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>โทร. {PEA_ENVELOPE_RECIPIENT.phone}</span>
              </div>
            </div>
          </div>

          {/* Checklist on the cover sheet */}
          <div className="border-t-2 border-dashed border-slate-300 pt-6 mt-8">
            <div className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-600" />
              <span>รายการเอกสารแนบในซอง (DOCUMENT CHECKLIST):</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.invoice}
                  onChange={() => toggleCheck("invoice")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="font-semibold text-slate-900">ต้นฉบับใบแจ้งหนี้ (Original Invoice)</span>
                  <div className="text-[11px] text-slate-500">* วันที่ต้องเป็นวันที่ก่อนใบเสร็จรับเงิน (ตามกฎระเบียบ กฟภ.)</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.receipt}
                  onChange={() => toggleCheck("receipt")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="font-semibold text-slate-900">ต้นฉบับใบเสร็จรับเงิน / ใบกำกับภาษี</span>
                  <div className="text-[11px] text-slate-500">* นำส่งฉบับจริงพร้อมกันเพื่อเบิกจ่าย</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.companyCert}
                  onChange={() => toggleCheck("companyCert")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="text-slate-800">สำเนาหนังสือรับรองจดทะเบียนบริษัท (อายุไม่เกิน 1 เดือน)</span>
                  <div className="text-[11px] text-slate-500">พร้อมประทับตราและลงนามรับรอง (กรณีเบิกครั้งแรก)</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.idCard}
                  onChange={() => toggleCheck("idCard")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="text-slate-800">สำเนาบัตรประชาชนผู้มีอำนาจลงนาม</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.pp20}
                  onChange={() => toggleCheck("pp20")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="text-slate-800">สำเนา ภ.พ.20 / ทะเบียนภาษีมูลค่าเพิ่ม (ถ้ามี)</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.bookBank}
                  onChange={() => toggleCheck("bookBank")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="text-slate-800">สำเนาหน้าสมุดบัญชีเงินฝากธนาคาร (Book Bank)</span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50/40 print:border-none print:p-0">
                <input
                  type="checkbox"
                  checked={checkedItems.transferForm}
                  onChange={() => toggleCheck("transferForm")}
                  className="mt-0.5 rounded text-blue-600"
                />
                <div>
                  <span className="text-slate-800 font-semibold">หนังสือขอรับเงินโดยวิธีโอนเงินเข้าบัญชีเงินฝาก</span>
                  <div className="text-[11px] text-blue-600">
                    <Link href="/transfer-request" className="underline hover:text-blue-800">
                      คลิกเพื่อกรอกและพิมพ์แบบฟอร์มนี้
                    </Link>
                  </div>
                </div>
              </label>
            </div>

            {/* Official PEA SLA & Procedure Notes */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>
                <strong>&bull; กำหนดเวลาเบิกจ่ายเงิน (SLA):</strong> หลังจาก กฟภ. ได้รับเอกสารตัวจริงครบถ้วน กระบวนการเบิกจ่ายจะเริ่มต้นและใช้เวลาประมาณ <strong>35 วันทำการ</strong> (สำหรับ<strong>งวดแรก</strong>ใช้เวลาประมาณ <strong>45 วันทำการ</strong> หรืออย่างน้อย 1 เดือน)
              </div>
              <div>
                <strong>&bull; การแจ้งจัดส่ง:</strong> เมื่อจัดส่งเอกสารทางไปรษณีย์เรียบร้อยแล้ว รบกวนแจ้งหมายเลขพัสดุ (Tracking No.) ให้เจ้าหน้าที่ กฟภ. ทราบทาง LINE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnvelopeCoverPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลดข้อมูลใบปะหน้า...</div>}>
      <EnvelopeCoverContent />
    </React.Suspense>
  )
}
