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
} from "@/lib/utils"
import {
  calculateSubtotal,
  calculateVat,
  calculateWht,
  calculateGrandTotal,
  calculateNetPayable,
  getDefaultWhtRate,
} from "@/lib/calculations"
import type { DocType, DocumentItemInput, PaymentMethod } from "@/types"

function CreateDocumentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Initialize docType from query params or default to INV_ELEC
  const initialType = (searchParams.get("type") as DocType) || "INV_ELEC"

  const now = new Date()
  const defaultIssueDate = now.toISOString().split("T")[0]
  // 15 days later for due date
  const defaultDueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  const [docType, setDocType] = React.useState<DocType>(initialType)
  const [issueDate, setIssueDate] = React.useState(defaultIssueDate)
  const [dueDate, setDueDate] = React.useState(defaultDueDate)
  const [billingMonth, setBillingMonth] = React.useState(now.getMonth() + 1)
  const [billingYear, setBillingYear] = React.useState(now.getFullYear())
  const [stationName, setStationName] = React.useState("สถานีชาร์จ กรีนชาร์จ คลองหลวง")
  const [contractRef, setContractRef] = React.useState("CT-2024-001")

  // Customer Information
  const [customerName, setCustomerName] = React.useState("")
  const [customerAddress, setCustomerAddress] = React.useState("")
  const [customerTaxId, setCustomerTaxId] = React.useState("")
  const [customerBranch, setCustomerBranch] = React.useState("สำนักงานใหญ่")

  // Line items
  const [items, setItems] = React.useState<DocumentItemInput[]>([])

  // Tax calculations
  const [enableVat, setEnableVat] = React.useState(true)
  const [vatRate, setVatRate] = React.useState(7)
  const [enableWht, setEnableWht] = React.useState(true)
  const [whtRate, setWhtRate] = React.useState(getDefaultWhtRate(initialType))

  // Payment information (for receipts)
  const [paymentDate, setPaymentDate] = React.useState(defaultIssueDate)
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [paymentRef, setPaymentRef] = React.useState("")
  const [refInvoiceId, setRefInvoiceId] = React.useState("")
  const [availableInvoices, setAvailableInvoices] = React.useState<any[]>([])

  // Notes
  const [notes, setNotes] = React.useState("")

  // Submitting state
  const [submitting, setSubmitting] = React.useState(false)

  // Generate default items according to docType & billingMonth/Year
  const generateDefaultItems = React.useCallback(
    (type: DocType, month: number, year: number): DocumentItemInput[] => {
      const monthName = THAI_MONTHS[month - 1] || ""
      const yearThai = year + 543

      if (type.includes("ELEC")) {
        return [
          {
            itemOrder: 1,
            description: `ค่าส่วนต่างไฟฟ้า ประจำเดือน ${monthName} ${yearThai}`,
            quantity: 6500,
            unitName: "kWh",
            unitPrice: 2.0,
            amount: 13000,
            meterPrevious: 12500,
            meterCurrent: 19000,
          },
        ]
      } else {
        return [
          {
            itemOrder: 1,
            description: `ค่าเช่าพื้นที่ ประจำเดือน ${monthName} ${yearThai}`,
            quantity: 1,
            unitName: "เดือน",
            unitPrice: 20000,
            amount: 20000,
            meterPrevious: null,
            meterCurrent: null,
          },
          {
            itemOrder: 2,
            description: `ค่าบริการพื้นที่ส่วนกลาง ประจำเดือน ${monthName} ${yearThai}`,
            quantity: 1,
            unitName: "เดือน",
            unitPrice: 5000,
            amount: 5000,
            meterPrevious: null,
            meterCurrent: null,
          },
        ]
      }
    },
    []
  )

  // Fetch settings to populate default customer details
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const s = await res.json()
          if (s.defaultCustomerName) setCustomerName(s.defaultCustomerName)
          if (s.defaultCustomerAddress) setCustomerAddress(s.defaultCustomerAddress)
          if (s.defaultCustomerTaxId) setCustomerTaxId(s.defaultCustomerTaxId)
          if (s.defaultCustomerBranch) setCustomerBranch(s.defaultCustomerBranch)
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      }
    }
    loadSettings()
  }, [])

  // Fetch available invoices if creating receipt
  React.useEffect(() => {
    if (docType.startsWith("REC_")) {
      const correspondingInvoiceType = docType === "REC_ELEC" ? "INV_ELEC" : "INV_RENT"
      fetch(`/api/documents?type=${correspondingInvoiceType}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableInvoices(data)
          }
        })
        .catch(console.error)
    }
  }, [docType])

  // Initial item setup when docType changes
  React.useEffect(() => {
    setItems(generateDefaultItems(docType, billingMonth, billingYear))
    setWhtRate(getDefaultWhtRate(docType))
  }, [docType, generateDefaultItems]) // billingMonth/year handled separately

  // Calculations
  const subtotal = calculateSubtotal(items)
  const vatAmount = calculateVat(subtotal, vatRate, enableVat)
  const grandTotal = calculateGrandTotal(subtotal, vatAmount)
  const whtAmount = calculateWht(subtotal, whtRate, enableWht)
  const netPayable = calculateNetPayable(grandTotal, whtAmount)

  // Line items handlers
  const handleItemChange = (
    index: number,
    field: keyof DocumentItemInput,
    value: any
  ) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }

    // If meter readings change for electricity, auto-update quantity
    if (field === "meterPrevious" || field === "meterCurrent") {
      const prev = field === "meterPrevious" ? Number(value) : Number(item.meterPrevious)
      const curr = field === "meterCurrent" ? Number(value) : Number(item.meterCurrent)
      if (!isNaN(prev) && !isNaN(curr) && curr >= prev) {
        item.quantity = curr - prev
      }
    }

    // Auto-calculate amount
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    item.amount = Math.round((qty * price + Number.EPSILON) * 100) / 100

    updated[index] = item
    setItems(updated)
  }

  const handleAddItem = () => {
    const isElec = docType.includes("ELEC")
    setItems([
      ...items,
      {
        itemOrder: items.length + 1,
        description: "",
        quantity: 1,
        unitName: isElec ? "kWh" : "รายการ",
        unitPrice: 0,
        amount: 0,
        meterPrevious: isElec ? 0 : null,
        meterCurrent: isElec ? 0 : null,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast({
        title: "ไม่สามารถลบรายการได้",
        description: "เอกสารต้องมีอย่างน้อย 1 รายการ",
        variant: "destructive",
      })
      return
    }
    const updated = items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, itemOrder: i + 1 }))
    setItems(updated)
  }

  // Handle invoice reference selection for receipts
  const handleSelectInvoiceRef = (invId: string) => {
    setRefInvoiceId(invId)
    const inv = availableInvoices.find((i) => i.id === invId)
    if (inv) {
      setCustomerName(inv.customerName || "")
      setCustomerAddress(inv.customerAddress || "")
      setCustomerTaxId(inv.customerTaxId || "")
      setCustomerBranch(inv.customerBranch || "")
      setStationName(inv.stationName || "")
      setContractRef(inv.contractRef || "")
      setBillingMonth(inv.billingMonth)
      setBillingYear(inv.billingYear)
      setEnableVat(inv.enableVat)
      setVatRate(inv.vatRate)
      setEnableWht(inv.enableWht)
      setWhtRate(inv.whtRate)

      if (inv.items && inv.items.length > 0) {
        setItems(
          inv.items.map((it: any, i: number) => ({
            itemOrder: i + 1,
            description: it.description,
            quantity: it.quantity,
            unitName: it.unitName,
            unitPrice: it.unitPrice,
            amount: it.amount,
            meterPrevious: it.meterPrevious,
            meterCurrent: it.meterCurrent,
          }))
        )
      }
    }
  }

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toast({
        title: "กรุณาระบุข้อมูลลูกค้า",
        description: "ชื่อลูกค้า/หน่วยงาน จำเป็นต้องกรอก",
        variant: "destructive",
      })
      return
    }

    if (items.some((it) => !it.description.trim())) {
      toast({
        title: "รายการไม่สมบูรณ์",
        description: "กรุณาระบุคำอธิบายในทุกรายการ",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        docType,
        issueDate,
        dueDate: docType.startsWith("INV_") ? dueDate : null,
        billingMonth: Number(billingMonth),
        billingYear: Number(billingYear),
        stationName: stationName.trim(),
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerTaxId: customerTaxId.trim(),
        customerBranch: customerBranch.trim(),
        contractRef: contractRef.trim(),
        enableVat,
        vatRate: Number(vatRate),
        enableWht,
        whtRate: Number(whtRate),
        status: docType.startsWith("REC_") ? "PAID" : "PENDING",
        paymentDate: docType.startsWith("REC_") ? paymentDate : null,
        paymentMethod: docType.startsWith("REC_") ? paymentMethod : null,
        paymentRef: docType.startsWith("REC_") ? paymentRef.trim() : null,
        refInvoiceId: docType.startsWith("REC_") && refInvoiceId ? refInvoiceId : null,
        notes: notes.trim(),
        items,
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกเอกสาร")
      }

      toast({
        title: "บันทึกเอกสารสำเร็จ",
        description: `สร้างเอกสารเลขที่ ${data.docNumber} เรียบร้อยแล้ว`,
      })

      router.push(`/documents/${data.id}`)
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isElec = docType.includes("ELEC")
  const isInvoice = docType.startsWith("INV_")

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              สร้างเอกสารใหม่
            </h1>
            <p className="text-sm text-slate-500">
              กรอกข้อมูลเพื่อออกใบแจ้งหนี้หรือใบเสร็จรับเงินสำหรับสถานีชาร์จ EV
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Step 1: Document Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              1. เลือกประเภทเอกสารที่ต้องการสร้าง
            </CardTitle>
            <CardDescription>
              ระบบจะปรับอัตราภาษีและรายการมาตรฐานตามประเภทเอกสารที่เลือก
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Option 1: INV_ELEC */}
              <div
                onClick={() => setDocType("INV_ELEC")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  docType === "INV_ELEC"
                    ? "border-blue-600 bg-blue-50/60 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    INV-EV
                  </span>
                </div>
                <div className="mt-3 font-semibold text-slate-900 text-sm">
                  ใบแจ้งหนี้ค่าส่วนต่างไฟฟ้า
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  สำหรับเรียกเก็บค่าไฟตามหน่วยชาร์จ (kWh)
                </p>
              </div>

              {/* Option 2: REC_ELEC */}
              <div
                onClick={() => setDocType("REC_ELEC")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  docType === "REC_ELEC"
                    ? "border-sky-600 bg-sky-50/60 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                    REC-EV
                  </span>
                </div>
                <div className="mt-3 font-semibold text-slate-900 text-sm">
                  ใบเสร็จรับเงินค่าส่วนต่างไฟฟ้า
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  เมื่อได้รับชำระเงินค่าไฟ EV แล้ว
                </p>
              </div>

              {/* Option 3: INV_RENT */}
              <div
                onClick={() => setDocType("INV_RENT")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  docType === "INV_RENT"
                    ? "border-emerald-600 bg-emerald-50/60 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Home className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    INV-RENT
                  </span>
                </div>
                <div className="mt-3 font-semibold text-slate-900 text-sm">
                  ใบแจ้งหนี้ค่าเช่าพื้นที่
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  สำหรับเรียกเก็บค่าเช่าและค่าบริการส่วนกลาง
                </p>
              </div>

              {/* Option 4: REC_RENT */}
              <div
                onClick={() => setDocType("REC_RENT")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  docType === "REC_RENT"
                    ? "border-teal-600 bg-teal-50/60 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                    REC-RENT
                  </span>
                </div>
                <div className="mt-3 font-semibold text-slate-900 text-sm">
                  ใบเสร็จรับเงินค่าเช่าพื้นที่
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  เมื่อได้รับชำระเงินค่าเช่าสถานีแล้ว
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reference Invoice (Shown only for Receipts if user wants to link) */}
        {!isInvoice && availableInvoices.length > 0 && (
          <Card className="border-sky-200 bg-sky-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-sky-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-sky-600" />
                อ้างอิงใบแจ้งหนี้ต้นทาง (ทางเลือก)
              </CardTitle>
              <CardDescription className="text-xs text-sky-700">
                เลือกใบแจ้งหนี้เพื่อดึงข้อมูลรายการและยอดเงินอัตโนมัติ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <Select value={refInvoiceId} onValueChange={handleSelectInvoiceRef}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="-- เลือกใบแจ้งหนี้ที่ต้องการอ้างอิง --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">ไม่ระบุอ้างอิง</SelectItem>
                    {availableInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.docNumber} - {inv.customerName} (฿{formatCurrency(inv.netPayable)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Common Document Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              2. ข้อมูลเอกสารทั่วไป
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="issueDate">วันที่ออกเอกสาร</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              {isInvoice && (
                <div>
                  <Label htmlFor="dueDate">วันครบกำหนดชำระ</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>
              )}

              <div>
                <Label>ประจำเดือน</Label>
                <Select
                  value={String(billingMonth)}
                  onValueChange={(val) => {
                    const m = Number(val)
                    setBillingMonth(m)
                    setItems(generateDefaultItems(docType, m, billingYear))
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_MONTHS.map((m, idx) => (
                      <SelectItem key={idx + 1} value={String(idx + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ประจำปี</Label>
                <Select
                  value={String(billingYear)}
                  onValueChange={(val) => {
                    const y = Number(val)
                    setBillingYear(y)
                    setItems(generateDefaultItems(docType, billingMonth, y))
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[billingYear - 1, billingYear, billingYear + 1].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        พ.ศ. {y + 543} ({y})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stationName">ชื่อสถานีชาร์จ</Label>
                <Input
                  id="stationName"
                  placeholder="เช่น สถานี กรีนชาร์จ คลองหลวง"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="contractRef">เลขที่สัญญาอ้างอิง</Label>
                <Input
                  id="contractRef"
                  placeholder="เช่น CT-2024-001"
                  value={contractRef}
                  onChange={(e) => setContractRef(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              3. ข้อมูลลูกค้า / หน่วยงาน
            </CardTitle>
            <CardDescription>
              ระบุข้อมูลผู้รับเอกสาร เช่น การไฟฟ้าส่วนภูมิภาค หรือลูกค้ารายบุคคล
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="customerName">ชื่อลูกค้า / หน่วยงาน *</Label>
                <Input
                  id="customerName"
                  placeholder="เช่น การไฟฟ้าส่วนภูมิภาค"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerTaxId">เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  id="customerTaxId"
                  placeholder="เลขประจำตัว 13 หลัก"
                  value={customerTaxId}
                  onChange={(e) => setCustomerTaxId(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="customerBranch">สาขา</Label>
                <Input
                  id="customerBranch"
                  placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                  value={customerBranch}
                  onChange={(e) => setCustomerBranch(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="customerAddress">ที่อยู่</Label>
                <Textarea
                  id="customerAddress"
                  placeholder="ที่อยู่สำหรับออกใบกำกับภาษี/ใบแจ้งหนี้"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  rows={2}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                4. รายการสินค้า / บริการ
              </CardTitle>
              <CardDescription>
                {isElec
                  ? "คำนวณตามหน่วยไฟ (kWh) และเลขมิเตอร์"
                  : "ค่าเช่าพื้นที่และค่าบริการ"}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="gap-1 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y bg-slate-50/75 text-xs text-slate-700">
                  <tr>
                    <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                    <th className="py-3 px-3 min-w-[220px]">รายการคำอธิบาย</th>
                    {isElec && (
                      <>
                        <th className="py-3 px-3 w-28">มิเตอร์ก่อน</th>
                        <th className="py-3 px-3 w-28">มิเตอร์หลัง</th>
                      </>
                    )}
                    <th className="py-3 px-3 w-24">จำนวน</th>
                    <th className="py-3 px-3 w-20">หน่วย</th>
                    <th className="py-3 px-3 w-28 text-right">ราคา/หน่วย</th>
                    <th className="py-3 px-3 w-32 text-right">จำนวนเงิน (฿)</th>
                    <th className="py-3 px-3 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, "description", e.target.value)
                          }
                          placeholder="รายละเอียดรายการ"
                          className="h-9"
                          required
                        />
                      </td>

                      {isElec && (
                        <>
                          <td className="py-2.5 px-3">
                            <Input
                              type="number"
                              step="any"
                              value={item.meterPrevious ?? ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "meterPrevious",
                                  e.target.value === "" ? null : Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="h-9 text-right"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <Input
                              type="number"
                              step="any"
                              value={item.meterCurrent ?? ""}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "meterCurrent",
                                  e.target.value === "" ? null : Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="h-9 text-right"
                            />
                          </td>
                        </>
                      )}

                      <td className="py-2.5 px-3">
                        <Input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", Number(e.target.value))
                          }
                          className="h-9 text-right font-medium"
                          required
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <Input
                          value={item.unitName}
                          onChange={(e) =>
                            handleItemChange(index, "unitName", e.target.value)
                          }
                          placeholder="หน่วย"
                          className="h-9 text-center"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <Input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, "unitPrice", Number(e.target.value))
                          }
                          className="h-9 text-right font-medium"
                          required
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        ฿{formatCurrency(item.amount)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Step 5: Tax & Calculations */}
        <Card className="border-slate-300">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              5. การคำนวณภาษีและยอดสุทธิ (Real-Time Calculations)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Toggles & Rates */}
              <div className="space-y-4 rounded-lg bg-slate-50 p-4">
                <h4 className="font-semibold text-sm text-slate-700">การตั้งค่าภาษี</h4>

                {/* VAT Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableVat" className="font-medium text-slate-800">
                      คิดภาษีมูลค่าเพิ่ม (VAT)
                    </Label>
                    <p className="text-xs text-slate-500">
                      เพิ่มภาษีมูลค่าเพิ่มเข้าไปในยอดรวม
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enableVat"
                      checked={enableVat}
                      onCheckedChange={setEnableVat}
                    />
                    {enableVat && (
                      <div className="flex items-center gap-1 w-20">
                        <Input
                          type="number"
                          value={vatRate}
                          onChange={(e) => setVatRate(Number(e.target.value))}
                          className="h-8 text-center text-xs"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                {/* WHT Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableWht" className="font-medium text-slate-800">
                      หักภาษี ณ ที่จ่าย (Withholding Tax)
                    </Label>
                    <p className="text-xs text-slate-500">
                      {isElec
                        ? "บริการไฟฟ้าทั่วไป อัตรา 3%"
                        : "ค่าเช่าสถานที่ อัตรา 5%"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enableWht"
                      checked={enableWht}
                      onCheckedChange={setEnableWht}
                    />
                    {enableWht && (
                      <div className="flex items-center gap-1 w-20">
                        <Input
                          type="number"
                          value={whtRate}
                          onChange={(e) => setWhtRate(Number(e.target.value))}
                          className="h-8 text-center text-xs"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Totals Breakdown */}
              <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>รวมเป็นเงิน (Subtotal)</span>
                  <span className="font-medium text-slate-900">
                    ฿{formatCurrency(subtotal)}
                  </span>
                </div>

                {enableVat && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม {vatRate}% (VAT)</span>
                    <span className="font-medium text-slate-900">
                      ฿{formatCurrency(vatAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2 text-sm font-semibold text-slate-800">
                  <span>จำนวนเงินรวมทั้งสิ้น (Grand Total)</span>
                  <span>฿{formatCurrency(grandTotal)}</span>
                </div>

                {enableWht && (
                  <div className="flex justify-between text-sm text-amber-700">
                    <span>หักภาษี ณ ที่จ่าย {whtRate}% (WHT)</span>
                    <span className="font-medium">
                      -฿{formatCurrency(whtAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center rounded-lg bg-blue-50 p-3 border border-blue-200">
                  <div>
                    <div className="font-bold text-base text-blue-900">
                      ยอดชำระสุทธิ (Net Payable)
                    </div>
                    <div className="text-xs text-blue-700">
                      ยอดที่ลูกค้าต้องโอน/จ่ายจริง
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-blue-700">
                    ฿{formatCurrency(netPayable)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 6: Payment Info (Only for Receipts) */}
        {!isInvoice && (
          <Card className="border-sky-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-sky-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-600" />
                6. ข้อมูลการรับชำระเงิน (สำหรับใบเสร็จรับเงิน)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="paymentDate">วันที่รับชำระ</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label>วิธีการชำระเงิน</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val: PaymentMethod) => setPaymentMethod(val)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSFER">โอนเงินเข้าบัญชี (Transfer)</SelectItem>
                      <SelectItem value="CHEQUE">เช็คธนาคาร (Cheque)</SelectItem>
                      <SelectItem value="CASH">เงินสด (Cash)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentRef">เลขที่อ้างอิงการโอน / เลขที่เช็ค</Label>
                  <Input
                    id="paymentRef"
                    placeholder="เช่น Ref: TXN-884912 หรือ เช็ค #094"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              หมายเหตุเพิ่มเติม (Notes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="ระบุหมายเหตุ เงื่อนไขการชำระเงิน หรือข้อมูลสำคัญท้ายเอกสาร"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="gap-2 bg-blue-600 px-6 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            {submitting ? "กำลังบันทึกเอกสาร..." : "บันทึกเอกสาร"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <AppShell>
      <React.Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <span className="text-slate-400">กำลังโหลดแบบฟอร์ม...</span>
          </div>
        }
      >
        <CreateDocumentForm />
      </React.Suspense>
    </AppShell>
  )
}
