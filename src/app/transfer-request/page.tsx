"use client"

import * as React from "react"
import Link from "next/link"
import { Printer, ArrowLeft, Building2, Save, FileCheck2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { PEA_HEADQUARTERS, formatDate } from "@/lib/utils"
import type { OrganizationSettingsData } from "@/types"

export default function TransferRequestPage() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<OrganizationSettingsData | null>(null)

  // Form Fields
  const [docDate, setDocDate] = React.useState(new Date().toISOString().split("T")[0])
  const [companyName, setCompanyName] = React.useState("")
  const [taxId, setTaxId] = React.useState("")
  const [signerName, setSignerName] = React.useState("")
  const [signerTitle, setSignerTitle] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [contractRef, setContractRef] = React.useState("สัญญาเลขที่ EV-PEA-2025/089")

  // Bank Info
  const [bankAccountType, setBankAccountType] = React.useState<"SAVINGS" | "CURRENT">("SAVINGS")
  const [bankAccountNo, setBankAccountNo] = React.useState("")
  const [bankAccountNameTh, setBankAccountNameTh] = React.useState("")
  const [bankAccountNameEn, setBankAccountNameEn] = React.useState("")
  const [bankNameTh, setBankNameTh] = React.useState("")
  const [bankNameEn, setBankNameEn] = React.useState("")
  const [bankBranchTh, setBankBranchTh] = React.useState("")
  const [bankBranchEn, setBankBranchEn] = React.useState("")

  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data)
        if (data.companyName) {
          setCompanyName(data.companyName)
          setBankAccountNameTh(data.bankAccountName || data.companyName)
        }
        if (data.taxId) setTaxId(data.taxId)
        if (data.signerName) setSignerName(data.signerName)
        if (data.signerTitle) setSignerTitle(data.signerTitle)
        if (data.address) setAddress(data.address)
        if (data.contactPerson) setContactPerson(data.contactPerson)
        if (data.contactPhone || data.phone) setPhone(data.contactPhone || data.phone)
        if (data.email) setEmail(data.email)
        if (data.bankName) setBankNameTh(data.bankName)
        if (data.bankBranch) setBankBranchTh(data.bankBranch)
        if (data.bankAccountNo) setBankAccountNo(data.bankAccountNo)
        if (data.bankAccountType) setBankAccountType(data.bankAccountType)
      })
      .catch((e) => console.error(e))
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 font-sarabun text-slate-900 pb-16">
      {/* Control Bar (Hidden on print) */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-6 py-3 shadow-md print:hidden font-prompt">
        <div className="flex items-center gap-3">
          <Link href="/documents">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              <span>แบบฟอร์มหนังสือแจ้งความประสงค์ขอรับเงินโดยวิธีโอนเงินเข้าบัญชี (กฟภ.)</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold text-sm shadow-sm"
          >
            <Printer className="h-4 w-4" />
            พิมพ์แบบฟอร์ม (A4)
          </Button>
        </div>
      </div>

      {/* Printable Official PEA Form */}
      <div className="max-w-[210mm] mx-auto bg-white p-10 md:p-14 my-6 shadow-xl border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-0 text-sm leading-relaxed">
        {/* Form Header */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="font-bold text-base md:text-lg">
            หนังสือแจ้งความประสงค์ขอรับเงินโดยวิธีโอนเงินเข้าบัญชีเงินฝากธนาคาร
          </h2>
          <h3 className="font-bold text-sm md:text-base">
            และขอเข้าใช้ระบบการติดตามกระบวนการจ่ายเงินให้คู่ค้า
          </h3>
        </div>

        <div className="flex justify-end mb-4">
          <div>
            <span>วันที่ </span>
            <input
              type="text"
              value={formatDate(docDate)}
              onChange={(e) => setDocDate(e.target.value)}
              className="border-b border-black outline-none px-2 font-semibold text-center w-48 bg-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <span className="font-bold">เรียน </span>
          <span>การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่</span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2">
            <input type="checkbox" checked readOnly className="mt-1" />
            <span className="font-bold">
              ลงทะเบียน/แจ้งเปลี่ยนข้อมูล สำหรับขอรับเงินโดยวิธีโอนเงินเข้าบัญชีเงินฝากธนาคารและขอเข้าใช้ระบบการติดตามกระบวนการจ่ายเงินให้คู่ค้า
            </span>
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-3 mb-6">
          <div className="leading-loose">
            <span className="font-bold">1. ข้าพเจ้า </span>
            <span className="font-semibold underline px-1">{companyName || "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด"}</span>
            <span> คู่ค้ากับการไฟฟ้าส่วนภูมิภาค เลขประจำตัวผู้เสียภาษี </span>
            <span className="font-mono font-semibold underline px-1">{taxId || "0105564012345"}</span>
            <span> โดย </span>
            <span className="font-semibold underline px-1">{signerName || "นายสมชาย รักษ์พลังงาน"}</span>
            <span> เกี่ยวข้องเป็น </span>
            <span className="font-semibold underline px-1">{signerTitle || "กรรมการผู้จัดการ"}</span>
          </div>

          <div className="leading-loose">
            <span>สถานประกอบการตั้งอยู่ที่ </span>
            <span className="underline px-1">{address || "88/8 หมู่ 5 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120"}</span>
          </div>

          <div className="leading-loose">
            <span>เจ้าหน้าที่ประสานงาน: </span>
            <span className="underline font-semibold px-1">{contactPerson || signerName || "สมชาย"}</span>
            <span> โทรศัพท์: </span>
            <span className="underline font-mono px-1">{phone || "02-123-4567"}</span>
            <span> อีเมล: </span>
            <span className="underline font-mono px-1">{email || "billing@company.co.th"}</span>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-2 mb-6">
          <div className="font-bold">2. ข้าพเจ้าได้ทำธุรกรรมกับการไฟฟ้าส่วนภูมิภาคตามรายละเอียด ดังนี้:</div>
          <div className="pl-6 space-y-1.5">
            <div className="flex items-center gap-2">
              <input type="checkbox" readOnly />
              <span>2.1 ซื้อขายไฟฟ้า เช่น VSPP Rooftop ฯลฯ</span>
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" checked readOnly className="mt-1" />
              <div>
                <span>2.2 ซื้อขายสินค้าและบริการ (ระบุสัญญาเลขที่: </span>
                <span className="font-semibold underline">{contractRef}</span>
                <span>) - บริการสถานีชาร์จ PEA VOLTA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Details */}
        <div className="space-y-3 mb-6 border border-black p-4 rounded-lg bg-slate-50/30 print:bg-transparent">
          <div className="font-bold">3. ข้าพเจ้ามีความประสงค์ขอแจ้งบัญชีธนาคารเพื่อให้ กฟภ. โอนเงินเข้า:</div>
          <div className="grid grid-cols-2 gap-4 pl-2">
            <div>
              <span className="font-semibold">ประเภทบัญชี: </span>
              <span>{bankAccountType === "SAVINGS" ? "บัญชีเงินฝากออมทรัพย์" : "บัญชีกระแสรายวัน"}</span>
            </div>
            <div>
              <span className="font-semibold">เลขที่บัญชี: </span>
              <span className="font-mono font-bold text-base underline">{bankAccountNo || "123-4-56789-0"}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">ชื่อบัญชี (ภาษาไทย): </span>
              <span className="font-semibold underline">{bankAccountNameTh || companyName}</span>
            </div>
            <div>
              <span className="font-semibold">ชื่อธนาคาร: </span>
              <span className="underline">{bankNameTh || "ธนาคารกสิกรไทย"}</span>
            </div>
            <div>
              <span className="font-semibold">สาขา: </span>
              <span className="underline">{bankBranchTh || "สาขาคลองหลวง"}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="text-xs text-slate-700 leading-relaxed space-y-1 mb-8">
          <div className="font-bold text-slate-900">ทั้งนี้ข้าพเจ้ายินยอมดำเนินการตามที่ การไฟฟ้าส่วนภูมิภาค แจ้งดังนี้:</div>
          <div>1. เป็นผู้รับภาระค่าธรรมเนียม หรือค่าบริการอื่นใดที่เกิดขึ้นจากการโอนเงินตามที่ธนาคารเรียกเก็บ</div>
          <div>2. สามารถเปลี่ยนแปลงข้อมูลบัญชีเงินฝากและข้อมูลที่ใช้ติดต่อประสานงานได้ปีละ 1 ครั้ง</div>
          <div>3. ข้าพเจ้าได้อ่านขั้นตอนการรับเงินโดยวิธีโอนเงินเข้าบัญชีเงินฝากธนาคารเป็นที่เข้าใจดีแล้ว</div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 text-center pt-4">
          <div className="space-y-2">
            <div className="h-16 flex items-center justify-center text-slate-400 italic">
              (ประทับตราบริษัท ถ้ามี)
            </div>
          </div>

          <div className="space-y-2">
            <div>ลงชื่อ ........................................................... ผู้มีอำนาจลงนาม</div>
            <div className="font-semibold">({signerName || "นายสมชาย รักษ์พลังงาน"})</div>
            <div className="text-xs text-slate-600">ตำแหน่ง {signerTitle || "กรรมการผู้จัดการ"}</div>
          </div>
        </div>

        {/* Page 2 Attachments note */}
        <div className="border-t border-dashed border-slate-400 pt-4 mt-8 text-xs text-slate-600">
          <span className="font-bold">เอกสารประกอบที่ต้องแนบ: </span>
          1. สำเนาหนังสือรับรองจดทะเบียนบริษัท (ไม่เกิน 1 เดือน) &bull; 2. สำเนาบัตร ปชช. ผู้มีอำนาจ &bull; 3. ภ.พ.20 &bull; 4. สำเนาหน้าสมุดบัญชีเงินฝาก &bull; 5. สำเนาสัญญา กฟภ.
        </div>
      </div>
    </div>
  )
}
