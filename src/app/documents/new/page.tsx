"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Zap,
  Home,
  Receipt,
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Calculator,
  Building,
  Calendar,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  formatCurrency,
  DOC_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  THAI_MONTHS,
  PEA_HEADQUARTERS,
} from "@/lib/utils"
import {
  calculateSubtotal,
  calculateVat,
  calculateWht,
  calculateGrandTotal,
  calculateNetPayable,
  getDefaultWhtRate,
  calculatePeaVoltaRevenue,
  generatePeaVoltaDescription,
} from "@/lib/calculations"
import type { DocType, DocumentItemInput, PaymentMethod } from "@/types"

function CreateDocumentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const typeParam = searchParams.get("type") as DocType | null
  const initialType: DocType =
    typeParam && ["INV_ELEC", "REC_ELEC", "INV_RENT", "REC_RENT"].includes(typeParam)
      ? typeParam
      : "INV_ELEC"

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Form State
  const [docType, setDocType] = React.useState<DocType>(initialType)
  const [issueDate, setIssueDate] = React.useState<string>(now.toISOString().split("T")[0])
  const [dueDate, setDueDate] = React.useState<string>(
    new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0]
  )
  const [receiptDate, setReceiptDate] = React.useState<string>(
    new Date(now.getTime() + 86400000).toISOString().split("T")[0]
  )
  const [billingMonth, setBillingMonth] = React.useState<number>(currentMonth)
  const [billingYear, setBillingYear] = React.useState<number>(currentYear)
  const [stationName, setStationName] = React.useState<string>("สถานีชาร์จ กรีนชาร์จ คลองหลวง")
  const [contractRef, setContractRef] = React.useState<string>("สัญญาเลขที่ EV-PEA-2025/089")

  // Customer Info (Default PEA)
  const [customerName, setCustomerName] = React.useState<string>(PEA_HEADQUARTERS.name)
  const [customerAddress, setCustomerAddress] = React.useState<string>(PEA_HEADQUARTERS.address)
  const [customerTaxId, setCustomerTaxId] = React.useState<string>(PEA_HEADQUARTERS.taxId)
  const [customerBranch, setCustomerBranch] = React.useState<string>(PEA_HEADQUARTERS.branch)

  // VAT & Tax Settings
  const [isVatRegistered, setIsVatRegistered] = React.useState<boolean>(true)
  const [branchNumber, setBranchNumber] = React.useState<string>("สำนักงานใหญ่")
  const [enableVat, setEnableVat] = React.useState<boolean>(true)
  const [vatRate, setVatRate] = React.useState<number>(7)
  const [enableWht, setEnableWht] = React.useState<boolean>(false)
  const [whtRate, setWhtRate] = React.useState<number>(0)

  // Paired Generation Mode
  const [isPairedMode, setIsPairedMode] = React.useState<boolean>(true)

  // Items
  const [items, setItems] = React.useState<DocumentItemInput[]>([
    {
      itemOrder: 1,
      description: generatePeaVoltaDescription(
        THAI_MONTHS[currentMonth - 1],
        currentYear + 543,
        "กรีนชาร์จ คลองหลวง"
      ),
      quantity: 1,
      unitName: "Unit",
      unitPrice: 0,
      amount: 0,
      meterPrevious: null,
      meterCurrent: null,
    },
  ])

  // Payment Info (for Receipts)
  const [paymentDate, setPaymentDate] = React.useState<string>(
    new Date(now.getTime() + 86400000).toISOString().split("T")[0]
  )
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [paymentRef, setPaymentRef] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")

  // Smart PEA Calculator State
  const [calcKwh, setCalcKwh] = React.useState<string>("47263.40")
  const [calcRate, setCalcRate] = React.useState<string>("6.90")
  const [calcRawAmount, setCalcRawAmount] = React.useState<string>("326117.46")
  const [useDirectAmount, setUseDirectAmount] = React.useState<boolean>(true)
  const [saving, setSaving] = React.useState<boolean>(false)

  // Auto-load settings
  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.companyName) setStationName(data.companyName)
        if (data.isVatRegistered !== undefined) {
          setIsVatRegistered(data.isVatRegistered)
          setEnableVat(data.isVatRegistered)
        }
        if (data.branchNumber) setBranchNumber(data.branchNumber)
      })
      .catch((err) => console.error("Error loading settings:", err))
  }, [])

  // Auto update item description when month, year, or station changes
  React.useEffect(() => {
    if (docType === "INV_ELEC" || docType === "REC_ELEC") {
      const monthTh = THAI_MONTHS[billingMonth - 1]
      const yearTh = billingYear + 543
      const newDesc = generatePeaVoltaDescription(monthTh, yearTh, stationName)
      setItems((prev) => {
        if (prev.length > 0 && prev[0].description.includes("PEA VOLTA")) {
          const updated = [...prev]
          updated[0].description = newDesc
          return updated
        }
        return prev
      })
    }
  }, [billingMonth, billingYear, stationName, docType])

  // Calculate PEA VOLTA smart values
  const peaCalc = React.useMemo(() => {
    if (useDirectAmount) {
      return calculatePeaVoltaRevenue({
        rawAmount: parseFloat(calcRawAmount) || 0,
        isVatRegistered,
      })
    } else {
      return calculatePeaVoltaRevenue({
        kwh: parseFloat(calcKwh) || 0,
        ratePerKwh: parseFloat(calcRate) || 0,
        isVatRegistered,
      })
    }
  }, [calcRawAmount, calcKwh, calcRate, useDirectAmount, isVatRegistered])

  // Apply Smart Calculator results into line item
  const handleApplyPeaCalc = () => {
    const claimAmount = peaCalc.totalClaim95
    setItems([
      {
        itemOrder: 1,
        description: generatePeaVoltaDescription(
          THAI_MONTHS[billingMonth - 1],
          billingYear + 543,
          stationName
        ),
        quantity: 1,
        unitName: "Unit",
        unitPrice: claimAmount,
        amount: claimAmount,
        meterPrevious: null,
        meterCurrent: null,
      },
    ])
    setEnableVat(isVatRegistered)
    toast({
      title: "นำยอด 95% เข้าสู่ตารางเรียบร้อย",
      description: `ยอดเบิก ${formatCurrency(claimAmount)} บาท ถูกใส่ในรายการแล้ว`,
    })
  }

  // Calculate overall financial figures
  const subtotal = calculateSubtotal(items)
  const vatAmount = calculateVat(subtotal, vatRate, enableVat)
  const whtAmount = calculateWht(subtotal, whtRate, enableWht)
  const grandTotal = calculateGrandTotal(subtotal, vatAmount)
  const netPayable = calculateNetPayable(grandTotal, whtAmount)

  // Strict Date Validation Rule Check
  const isDateInvalid = React.useMemo(() => {
    if (isPairedMode) {
      const invD = new Date(issueDate)
      const recD = new Date(receiptDate)
      return recD < invD
    }
    return false
  }, [isPairedMode, issueDate, receiptDate])

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemOrder: prev.length + 1,
        description: "",
        quantity: 1,
        unitName: docType.includes("ELEC") ? "Unit" : "เดือน",
        unitPrice: 0,
        amount: 0,
      },
    ])
  }

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index)
      return filtered.map((it, i) => ({ ...it, itemOrder: i + 1 }))
    })
  }

  // Item Field Change
  const handleItemChange = (index: number, field: keyof DocumentItemInput, value: any) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = { ...updated[index], [field]: value }
      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? Number(value) || 0 : current.quantity
        const price = field === "unitPrice" ? Number(value) || 0 : current.unitPrice
        current.amount = Math.round(qty * price * 100) / 100
      }
      updated[index] = current
      return updated
    })
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDateInvalid) {
      toast({
        title: "วันที่เอกสารไม่ถูกต้องตามระเบียบ กฟภ.",
        description: "วันที่ในใบแจ้งหนี้ต้องเป็นวันที่มาก่อนหรือวันเดียวกับใบเสร็จรับเงิน/ใบกำกับภาษีเท่านั้น",
        variant: "destructive",
      })
      return
    }

    if (items.some((i) => !i.description || i.amount <= 0)) {
      toast({
        title: "ข้อมูลรายการไม่ครบถ้วน",
        description: "กรุณาระบุรายละเอียดและจำนวนเงินของทุกรายการให้ถูกต้อง",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const payload = {
        docType,
        issueDate,
        dueDate: docType.startsWith("INV") ? dueDate : null,
        receiptDate: isPairedMode ? receiptDate : paymentDate,
        billingMonth,
        billingYear,
        stationName,
        customerName,
        customerAddress,
        customerTaxId,
        customerBranch,
        contractRef,
        isVatRegistered,
        branchNumber,
        enableVat,
        vatRate,
        enableWht,
        whtRate,
        status: docType.startsWith("REC") ? "PAID" : "PENDING",
        paymentDate: docType.startsWith("REC") ? paymentDate : null,
        paymentMethod: docType.startsWith("REC") ? paymentMethod : null,
        paymentRef: docType.startsWith("REC") ? paymentRef : null,
        notes,
        items,
        totalRawAmount: peaCalc.totalRawAmount,
        peaFeeAmount: peaCalc.peaFeeAmount,
        totalClaim95: peaCalc.totalClaim95,
      }

      if (isPairedMode && (docType === "INV_ELEC" || docType === "INV_RENT")) {
        // Paired Creation
        const res = await fetch("/api/documents/paired", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "ไม่สามารถออกคู่เอกสารได้")

        toast({
          title: "ออกคู่เอกสาร กฟภ. สำเร็จเรียบร้อย",
          description: `สร้าง ${data.invoice.docNumber} และ ${data.receipt.docNumber} พร้อมพิมพ์`,
        })
        router.push(`/documents/${data.invoice.id}`)
      } else {
        // Single Document Creation
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "ไม่สามารถสร้างเอกสารได้")

        toast({
          title: "สร้างเอกสารสำเร็จ",
          description: `เลขที่เอกสาร ${data.docNumber} ถูกบันทึกเรียบร้อย`,
        })
        router.push(`/documents/${data.id}`)
      }
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 font-prompt">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-1 text-slate-500 hover:text-slate-800 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            ย้อนกลับ
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2">
            <span>สร้างเอกสารวางบิล กฟภ. (PEA VOLTA)</span>
          </h1>
          <p className="text-sm text-slate-500">
            ระบบคำนวณยอดส่วนแบ่ง 95% และออกคู่เอกสารใบแจ้งหนี้ + ใบเสร็จรับเงินตามมาตรฐาน กฟภ.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Document Type Selector Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { id: "INV_ELEC", label: "ใบแจ้งหนี้ค่าไฟ (PEA)", icon: Zap, color: "text-amber-500" },
            { id: "REC_ELEC", label: "ใบเสร็จค่าไฟ (PEA)", icon: Receipt, color: "text-blue-500" },
            { id: "INV_RENT", label: "ใบแจ้งหนี้ค่าเช่าที่", icon: Home, color: "text-emerald-500" },
            { id: "REC_RENT", label: "ใบเสร็จค่าเช่าที่", icon: CreditCard, color: "text-teal-500" },
          ].map((t) => {
            const Icon = t.icon
            const selected = docType === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setDocType(t.id as DocType)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                  selected
                    ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-5 w-5 mb-1.5 ${t.color}`} />
                <span className="text-xs font-semibold">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* SMART PEA VOLTA REVENUE CALCULATOR */}
        {(docType === "INV_ELEC" || docType === "REC_ELEC") && (
          <Card className="border-blue-300 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 shadow-md">
            <CardHeader className="pb-3 border-b border-blue-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-blue-950 font-bold flex items-center gap-2">
                      <span>Smart PEA VOLTA Revenue Calculator</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                        กฎคำนวณยอด 95% กฟภ.
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs text-blue-700">
                      คำนวณหักส่วนลด 5% อัตโนมัติ เพื่อนำยอด 95% ไปเป็นมูลค่าในเอกสารวางบิล
                    </CardDescription>
                  </div>
                </div>

                {/* VAT Mode Toggle inside Calculator */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-xs">
                  <span className={!isVatRegistered ? "font-bold text-slate-800" : "text-slate-400"}>
                    ไม่จด VAT
                  </span>
                  <Switch
                    checked={isVatRegistered}
                    onCheckedChange={(val) => {
                      setIsVatRegistered(val)
                      setEnableVat(val)
                    }}
                  />
                  <span className={isVatRegistered ? "font-bold text-blue-700" : "text-slate-400"}>
                    จด VAT 7%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs Box */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">วิธีระบุยอดจากไฟล์สรุป กฟภ.:</span>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="calcMode"
                          checked={useDirectAmount}
                          onChange={() => setUseDirectAmount(true)}
                          className="text-blue-600"
                        />
                        <span>กรอกยอดรวม 100%</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="calcMode"
                          checked={!useDirectAmount}
                          onChange={() => setUseDirectAmount(false)}
                          className="text-blue-600"
                        />
                        <span>กรอกหน่วย kWh &times; ราคา</span>
                      </label>
                    </div>
                  </div>

                  {useDirectAmount ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="calcRaw" className="text-xs text-slate-600">
                        ค่าบริการรายเดือนรวม 100% (ไม่รวม VAT)
                      </Label>
                      <div className="relative">
                        <Input
                          id="calcRaw"
                          type="number"
                          step="0.01"
                          value={calcRawAmount}
                          onChange={(e) => setCalcRawAmount(e.target.value)}
                          placeholder="เช่น 326117.46"
                          className="text-base font-semibold text-blue-900 pr-12 font-mono"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">บาท</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        * ดูจากคอลัมน์ "รวมเป็นเงิน (ไม่รวม VAT)" ในไฟล์สรุปยอดประจำเดือนของ PEA VOLTA
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="calcKwh" className="text-xs text-slate-600">หน่วยไฟรวม (kWh)</Label>
                        <Input
                          id="calcKwh"
                          type="number"
                          step="0.01"
                          value={calcKwh}
                          onChange={(e) => setCalcKwh(e.target.value)}
                          placeholder="47263.40"
                          className="text-sm font-semibold text-blue-900 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="calcRate" className="text-xs text-slate-600">ราคาต่อหน่วย (บาท)</Label>
                        <Input
                          id="calcRate"
                          type="number"
                          step="0.01"
                          value={calcRate}
                          onChange={(e) => setCalcRate(e.target.value)}
                          placeholder="6.90"
                          className="text-sm font-semibold text-blue-900 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculation Breakdown Result Box */}
                <div className="rounded-xl border border-blue-200 bg-blue-900 text-white p-4 space-y-2.5 shadow-sm text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-800 text-[11px] text-blue-200 uppercase tracking-wider font-semibold">
                    <span>แจกแจงยอดคำนวณตามมาตรฐาน กฟภ.</span>
                    <span>{isVatRegistered ? "จดทะเบียน VAT 7%" : "ไม่จด VAT"}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>1. ยอดรวม 100% (ไม่รวม VAT):</span>
                    <span className="font-mono font-medium">{formatCurrency(peaCalc.totalRawAmount)} บาท</span>
                  </div>

                  <div className="flex justify-between items-center text-amber-300">
                    <span>2. หัก ค่าธรรมเนียม กฟภ. 5% (ไม่รวม VAT):</span>
                    <span className="font-mono font-medium">- {formatCurrency(peaFeeAmount(peaCalc.peaFeeAmount))} บาท</span>
                  </div>

                  <div className="flex justify-between items-center font-bold text-white pt-1 border-t border-blue-800/60 text-sm">
                    <span className="text-emerald-300">3. ยอด 95% ที่เบิกได้ (ใส่ในเอกสาร):</span>
                    <span className="font-mono text-emerald-300 text-base">{formatCurrency(peaCalc.totalClaim95)} บาท</span>
                  </div>

                  {isVatRegistered ? (
                    <>
                      <div className="flex justify-between items-center text-blue-200 pt-1">
                        <span>4. ภาษีมูลค่าเพิ่ม 7% (คำนวณจากยอด 95%):</span>
                        <span className="font-mono">+{formatCurrency(peaCalc.vatAmount)} บาท</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-amber-300 text-sm pt-1 border-t border-blue-800">
                        <span>จำนวนเงินรวมทั้งสิ้น (95% รวม VAT):</span>
                        <span className="font-mono text-lg">{formatCurrency(peaCalc.grandTotal)} บาท</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic pt-1">
                      * บุคคลธรรมดา/ไม่จด VAT: ยอด 95% ไม่รวม VAT คือยอดชำระสุทธิ (ไม่มีภาษีมูลค่าเพิ่ม)
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApplyPeaCalc}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium gap-1.5 shadow"
                    >
                      <Sparkles className="h-4 w-4" />
                      นำยอด 95% เข้าสู่ตารางเอกสารทันที
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PAIRED GENERATION & DATE VALIDATION SECTION */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    ออกคู่เอกสารพร้อมกัน (กฟภ. แพ็กคู่: ใบแจ้งหนี้ + ใบเสร็จรับเงิน)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    กฟภ. กำหนดให้นำส่งเอกสารตัวจริงทั้ง 2 ฉบับพร้อมกัน และวันที่ใบแจ้งหนี้ต้องมาก่อนใบเสร็จ
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isPairedMode}
                  onCheckedChange={setIsPairedMode}
                />
                <span className="text-xs font-semibold text-slate-700">
                  {isPairedMode ? "เปิดสร้างคู่เอกสาร (แนะนำ)" : "สร้างทีละฉบับ"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Date Validation Alert */}
            {isDateInvalid && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-300 text-red-800 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="font-medium">
                  <strong>ผิดกฎระเบียบ กฟภ.!</strong> วันที่ในใบแจ้งหนี้ ({issueDate}) ต้องเป็นวันที่มาก่อนหรือวันเดียวกันกับใบเสร็จรับเงิน ({receiptDate}) เท่านั้น
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="issueDate" className="text-xs">
                  วันที่ในใบแจ้งหนี้ (Invoice Date) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              {isPairedMode ? (
                <div className="space-y-1.5">
                  <Label htmlFor="receiptDate" className="text-xs">
                    วันที่ในใบเสร็จ (Receipt Date) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="receiptDate"
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className={`h-9 text-xs ${isDateInvalid ? "border-red-500 ring-1 ring-red-400" : ""}`}
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    * ต้องเป็นวันที่หลังใบแจ้งหนี้ (เช่น ถัดไป 1 วัน)
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="dueDate" className="text-xs">
                    วันครบกำหนดชำระ (Due Date)
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">ประจำเดือน / ปี</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={billingMonth.toString()}
                    onValueChange={(val) => setBillingMonth(parseInt(val, 10))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THAI_MONTHS.map((m, idx) => (
                        <SelectItem key={m} value={(idx + 1).toString()}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    value={billingYear}
                    onChange={(e) => setBillingYear(parseInt(e.target.value, 10) || currentYear)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stationName" className="text-xs">
                  ชื่อสถานีบริการ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stationName"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="เช่น กรีนชาร์จ คลองหลวง"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CUSTOMER INFO (PEA HEADQUARTERS) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-sm font-bold text-slate-900">
                ข้อมูลลูกค้า (การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ชื่อหน่วยงาน</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">เลขประจำตัวผู้เสียภาษี กฟภ. (สำนักงานใหญ่)</Label>
                <Input
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ที่อยู่ลูกค้า</Label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* LINE ITEMS TABLE */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                รายการในเอกสาร (Line Items)
              </CardTitle>
              <CardDescription className="text-xs">
                ข้อความรายการสำหรับค่าบริการ PEA VOLTA ต้องตรงตามมาตรฐานที่ กฟภ. กำหนด
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-8 text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              เพิ่มรายการ
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3">รายการ (Description)</th>
                    <th className="py-2.5 px-3 w-28 text-right">จำนวนหน่วย (Unit)</th>
                    <th className="py-2.5 px-3 w-36 text-right">จำนวนเงิน (Baht)</th>
                    <th className="py-2.5 px-3 w-12 text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-2 px-3">
                        <Textarea
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          rows={2}
                          className="text-xs"
                          placeholder="รายละเอียดรายการ..."
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className="h-9 text-xs text-right font-mono"
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount || item.unitPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            handleItemChange(index, "unitPrice", val)
                            handleItemChange(index, "amount", val)
                          }}
                          className="h-9 text-xs text-right font-mono font-semibold"
                          required
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(index)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary Box */}
            <div className="border-t border-slate-200 bg-slate-50/60 p-4">
              <div className="max-w-md ml-auto space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span className="font-mono font-semibold">{formatCurrency(subtotal)} บาท</span>
                </div>

                {isVatRegistered ? (
                  <div className="flex justify-between items-center text-blue-700">
                    <span className="flex items-center gap-1.5">
                      <span>จำนวนภาษีมูลค่าเพิ่ม 7%:</span>
                      <Switch
                        checked={enableVat}
                        onCheckedChange={setEnableVat}
                        className="scale-75"
                      />
                    </span>
                    <span className="font-mono font-semibold">
                      {enableVat ? `+ ${formatCurrency(vatAmount)} บาท` : "0.00 บาท"}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    * โหมดไม่จดทะเบียน VAT: ไม่แสดงภาษีมูลค่าเพิ่ม
                  </div>
                )}

                {/* Optional WHT toggle for Land rental */}
                {docType.includes("RENT") && (
                  <div className="flex justify-between items-center text-amber-700 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span>หักภาษี ณ ที่จ่ายค่าเช่า 5%:</span>
                      <Switch
                        checked={enableWht}
                        onCheckedChange={(val) => {
                          setEnableWht(val)
                          if (val) setWhtRate(5)
                        }}
                        className="scale-75"
                      />
                    </span>
                    <span className="font-mono font-semibold">
                      {enableWht ? `- ${formatCurrency(whtAmount)} บาท` : "0.00 บาท"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>จำนวนเงินรวมทั้งสิ้น (Grand Total):</span>
                  <span className="font-mono text-base text-blue-600">
                    {formatCurrency(grandTotal)} บาท
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            ยกเลิก
          </Button>

          <Button
            type="submit"
            disabled={saving || isDateInvalid}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 py-2.5 text-sm font-semibold shadow-md"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "กำลังสร้างเอกสาร..."
              : isPairedMode
              ? "⚡ บันทึกและออกคู่เอกสาร (ใบแจ้งหนี้ + ใบเสร็จ)"
              : "บันทึกเอกสาร"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function peaFeeAmount(fee: number) {
  return fee
}

export default function NewDocumentPage() {
  return (
    <AppShell>
      <React.Suspense fallback={<div className="p-8 text-center text-slate-400">กำลังโหลด...</div>}>
        <CreateDocumentForm />
      </React.Suspense>
    </AppShell>
  )
}
