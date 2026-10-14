"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  FileText,
  Printer,
  Edit3,
  Copy,
  Receipt,
  Trash2,
  ArrowLeft,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Save,
  X,
  CreditCard,
  AlertTriangle,
  Loader2,
  Zap,
  Home,
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  DOC_TYPE_LABELS,
  STATUS_LABELS,
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
import type { DocType, DocumentItemInput, DocumentWithItems, PaymentMethod } from "@/types"

function DocumentDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const id = params?.id as string
  const initialEditMode = searchParams.get("edit") === "true"

  const [document, setDocument] = React.useState<DocumentWithItems | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isEditMode, setIsEditMode] = React.useState(initialEditMode)
  const [saving, setSaving] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)
  const [converting, setConverting] = React.useState(false)

  // Edit form state
  const [editDocType, setEditDocType] = React.useState<DocType>("INV_ELEC")
  const [editIssueDate, setEditIssueDate] = React.useState("")
  const [editDueDate, setEditDueDate] = React.useState("")
  const [editBillingMonth, setEditBillingMonth] = React.useState(1)
  const [editBillingYear, setEditBillingYear] = React.useState(2026)
  const [editStationName, setEditStationName] = React.useState("")
  const [editContractRef, setEditContractRef] = React.useState("")
  const [editStatus, setEditStatus] = React.useState("PENDING")

  // Customer
  const [editCustomerName, setEditCustomerName] = React.useState("")
  const [editCustomerAddress, setEditCustomerAddress] = React.useState("")
  const [editCustomerTaxId, setEditCustomerTaxId] = React.useState("")
  const [editCustomerBranch, setEditCustomerBranch] = React.useState("")

  // Tax calculations
  const [editEnableVat, setEditEnableVat] = React.useState(true)
  const [editVatRate, setEditVatRate] = React.useState(7)
  const [editEnableWht, setEditEnableWht] = React.useState(true)
  const [editWhtRate, setEditWhtRate] = React.useState(3)

  // Payment
  const [editPaymentDate, setEditPaymentDate] = React.useState("")
  const [editPaymentMethod, setEditPaymentMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [editPaymentRef, setEditPaymentRef] = React.useState("")

  // Notes & Items
  const [editNotes, setEditNotes] = React.useState("")
  const [editItems, setEditItems] = React.useState<DocumentItemInput[]>([])

  const fetchDocument = React.useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/documents/${id}`)
      if (!res.ok) {
        throw new Error("ไม่พบเอกสารหรือข้อมูลผิดพลาด")
      }
      const data: DocumentWithItems = await res.json()
      setDocument(data)

      // Populate form state
      setEditDocType(data.docType as DocType)
      setEditIssueDate(
        data.issueDate ? new Date(data.issueDate).toISOString().split("T")[0] : ""
      )
      setEditDueDate(
        data.dueDate ? new Date(data.dueDate).toISOString().split("T")[0] : ""
      )
      setEditBillingMonth(data.billingMonth || 1)
      setEditBillingYear(data.billingYear || new Date().getFullYear())
      setEditStationName(data.stationName || "")
      setEditContractRef(data.contractRef || "")
      setEditStatus(data.status || "PENDING")

      setEditCustomerName(data.customerName || "")
      setEditCustomerAddress(data.customerAddress || "")
      setEditCustomerTaxId(data.customerTaxId || "")
      setEditCustomerBranch(data.customerBranch || "")

      setEditEnableVat(data.enableVat ?? true)
      setEditVatRate(data.vatRate ?? 7)
      setEditEnableWht(data.enableWht ?? true)
      setEditWhtRate(data.whtRate ?? getDefaultWhtRate(data.docType))

      setEditPaymentDate(
        data.paymentDate ? new Date(data.paymentDate).toISOString().split("T")[0] : ""
      )
      setEditPaymentMethod((data.paymentMethod as PaymentMethod) || "TRANSFER")
      setEditPaymentRef(data.paymentRef || "")
      setEditNotes(data.notes || "")

      if (data.items && data.items.length > 0) {
        setEditItems(
          data.items.map((it, idx) => ({
            id: it.id,
            itemOrder: it.itemOrder || idx + 1,
            description: it.description,
            quantity: it.quantity,
            unitName: it.unitName,
            unitPrice: it.unitPrice,
            amount: it.amount,
            meterPrevious: it.meterPrevious,
            meterCurrent: it.meterCurrent,
          }))
        )
      } else {
        setEditItems([])
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message || "ไม่สามารถดึงข้อมูลเอกสารได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  React.useEffect(() => {
    fetchDocument()
  }, [fetchDocument])

  // Real-time calculation in Edit Mode
  const editSubtotal = calculateSubtotal(editItems)
  const editVatAmount = calculateVat(editSubtotal, editVatRate, editEnableVat)
  const editGrandTotal = calculateGrandTotal(editSubtotal, editVatAmount)
  const editWhtAmount = calculateWht(editSubtotal, editWhtRate, editEnableWht)
  const editNetPayable = calculateNetPayable(editGrandTotal, editWhtAmount)

  // Edit item change handler
  const handleEditItemChange = (
    index: number,
    field: keyof DocumentItemInput,
    value: any
  ) => {
    const updated = [...editItems]
    const item = { ...updated[index], [field]: value }

    // Auto update quantity from meter readings if electricity
    if (field === "meterPrevious" || field === "meterCurrent") {
      const prev = field === "meterPrevious" ? Number(value) : Number(item.meterPrevious)
      const curr = field === "meterCurrent" ? Number(value) : Number(item.meterCurrent)
      if (!isNaN(prev) && !isNaN(curr) && curr >= prev) {
        item.quantity = curr - prev
      }
    }

    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    item.amount = Math.round((qty * price + Number.EPSILON) * 100) / 100

    updated[index] = item
    setEditItems(updated)
  }

  const handleAddEditItem = () => {
    const isElec = editDocType.includes("ELEC")
    setEditItems([
      ...editItems,
      {
        itemOrder: editItems.length + 1,
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

  const handleRemoveEditItem = (index: number) => {
    if (editItems.length <= 1) {
      toast({
        title: "ไม่สามารถลบได้",
        description: "เอกสารต้องมีอย่างน้อย 1 รายการ",
        variant: "destructive",
      })
      return
    }
    const updated = editItems
      .filter((_, i) => i !== index)
      .map((it, i) => ({ ...it, itemOrder: i + 1 }))
    setEditItems(updated)
  }

  // Handle Save in Edit Mode
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editCustomerName.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาระบุชื่อลูกค้า",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const payload = {
        docType: editDocType,
        issueDate: editIssueDate,
        dueDate: editDocType.startsWith("INV_") ? editDueDate : null,
        billingMonth: Number(editBillingMonth),
        billingYear: Number(editBillingYear),
        stationName: editStationName.trim(),
        customerName: editCustomerName.trim(),
        customerAddress: editCustomerAddress.trim(),
        customerTaxId: editCustomerTaxId.trim(),
        customerBranch: editCustomerBranch.trim(),
        contractRef: editContractRef.trim(),
        status: editStatus,
        enableVat: editEnableVat,
        vatRate: Number(editVatRate),
        enableWht: editEnableWht,
        whtRate: Number(editWhtRate),
        paymentDate: editDocType.startsWith("REC_") ? editPaymentDate : null,
        paymentMethod: editDocType.startsWith("REC_") ? editPaymentMethod : null,
        paymentRef: editDocType.startsWith("REC_") ? editPaymentRef.trim() : null,
        notes: editNotes.trim(),
        items: editItems,
      }

      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }

      toast({
        title: "บันทึกการแก้ไขสำเร็จ",
        description: `อัปเดตข้อมูลเอกสาร ${data.docNumber} เรียบร้อยแล้ว`,
      })

      setIsEditMode(false)
      await fetchDocument()
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

  // Handle Duplicate
  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/documents/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถทำสำเนาได้")
      }
      toast({
        title: "ทำสำเนาสำเร็จ",
        description: `สร้างเอกสารฉบับใหม่เลขที่ ${data.docNumber} แล้ว`,
      })
      router.push(`/documents/${data.id}?edit=true`)
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Handle Convert to Receipt
  const handleConvert = async () => {
    try {
      setConverting(true)
      const res = await fetch(`/api/documents/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentDate: new Date().toISOString(),
          paymentMethod: "TRANSFER",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถออกใบเสร็จรับเงินได้")
      }
      toast({
        title: "ออกใบเสร็จรับเงินสำเร็จ",
        description: `สร้างใบเสร็จรับเงินเลขที่ ${data.docNumber} เรียบร้อยแล้ว`,
      })
      router.push(`/documents/${data.id}`)
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setConverting(false)
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("ไม่สามารถลบเอกสารได้")
      }
      toast({
        title: "ลบเอกสารสำเร็จ",
        description: "นำเอกสารออกจากระบบเรียบร้อยแล้ว",
      })
      router.push("/documents")
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">{STATUS_LABELS[status] || "ชำระแล้ว"}</Badge>
      case "PENDING":
        return <Badge variant="warning">{STATUS_LABELS[status] || "รอชำระ"}</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">{STATUS_LABELS[status] || "ยกเลิก"}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDocTypeBadge = (docType: string) => {
    if (docType === "INV_ELEC") {
      return <Badge className="bg-blue-600 hover:bg-blue-700">{DOC_TYPE_LABELS[docType]}</Badge>
    }
    if (docType === "REC_ELEC") {
      return <Badge className="bg-sky-600 hover:bg-sky-700">{DOC_TYPE_LABELS[docType]}</Badge>
    }
    if (docType === "INV_RENT") {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">{DOC_TYPE_LABELS[docType]}</Badge>
    }
    if (docType === "REC_RENT") {
      return <Badge className="bg-teal-600 hover:bg-teal-700">{DOC_TYPE_LABELS[docType]}</Badge>
    }
    return <Badge variant="secondary">{docType}</Badge>
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm">กำลังโหลดข้อมูลเอกสาร...</p>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="h-16 w-16 text-slate-300" />
        <h2 className="mt-4 text-xl font-bold text-slate-800">ไม่พบเอกสารที่ระบุ</h2>
        <p className="mt-1 text-sm text-slate-500">
          เอกสารอาจถูกลบไปแล้วหรือไม่ถูกต้อง
        </p>
        <Link href="/documents" className="mt-6">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้ารายการเอกสาร
          </Button>
        </Link>
      </div>
    )
  }

  const isInvoice = document.docType.startsWith("INV_")
  const isPending = document.status === "PENDING"
  const monthName =
    document.billingMonth && document.billingMonth >= 1 && document.billingMonth <= 12
      ? THAI_MONTHS[document.billingMonth - 1]
      : ""
  const yearThai = document.billingYear ? document.billingYear + 543 : ""

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Buttons Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/documents")}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {document.docNumber}
              </h1>
              {getStatusBadge(document.status)}
            </div>
            <p className="text-xs text-slate-500">
              สร้างเมื่อ {formatDate(document.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isEditMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                แก้ไขเอกสาร
              </Button>

              <Link href={`/documents/${id}/print`}>
                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                  <Printer className="h-4 w-4" />
                  พิมพ์ / บันทึก PDF
                </Button>
              </Link>

              {isInvoice && isPending && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleConvert}
                  disabled={converting}
                  className="gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                >
                  <Receipt className="h-4 w-4" />
                  {converting ? "กำลังออก..." : "ออกใบเสร็จรับเงิน"}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" />
                ทำสำเนา
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="h-9 w-9 p-0 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(false)
                  fetchDocument()
                }}
                disabled={saving}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                ยกเลิกการแก้ไข
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW MODE                                                 */}
      {/* ========================================================= */}
      {!isEditMode ? (
        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <span className="text-xs font-medium text-slate-400">ประเภทเอกสาร</span>
                  <div className="mt-1">{getDocTypeBadge(document.docType)}</div>
                  {document.refInvoice && (
                    <div className="mt-2 text-xs text-slate-500">
                      อ้างอิงใบแจ้งหนี้:{" "}
                      <Link
                        href={`/documents/${document.refInvoice.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {document.refInvoice.docNumber}
                      </Link>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400">วันที่ออกเอกสาร</span>
                  <div className="mt-1 font-semibold text-slate-800">
                    {formatDate(document.issueDate)}
                  </div>
                  {isInvoice && document.dueDate && (
                    <div className="mt-1 text-xs text-amber-600">
                      ครบกำหนด: {formatDate(document.dueDate)}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400">รอบบิลประจำเดือน</span>
                  <div className="mt-1 font-semibold text-slate-800">
                    {monthName} {yearThai}
                  </div>
                  {document.contractRef && (
                    <div className="mt-1 text-xs text-slate-500">
                      สัญญา: {document.contractRef}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-400">สถานีชาร์จ</span>
                  <div className="mt-1 font-semibold text-slate-800">
                    {document.stationName || "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-500" />
                ข้อมูลลูกค้า / ผู้รับเอกสาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-slate-400">ชื่อลูกค้า / หน่วยงาน</div>
                  <div className="font-semibold text-slate-900 text-base">
                    {document.customerName || "-"}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">ที่อยู่</div>
                  <div className="text-sm text-slate-700 whitespace-pre-line">
                    {document.customerAddress || "-"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">เลขประจำตัวผู้เสียภาษี: </span>
                    <span className="font-medium text-slate-800 text-sm">
                      {document.customerTaxId || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">สาขา: </span>
                    <span className="font-medium text-slate-800 text-sm">
                      {document.customerBranch || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                รายการสินค้าและบริการ (Line Items)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead className="w-12 text-center">ลำดับ</TableHead>
                      <TableHead>รายการ</TableHead>
                      {document.docType.includes("ELEC") && (
                        <>
                          <TableHead className="text-right">มิเตอร์ก่อน</TableHead>
                          <TableHead className="text-right">มิเตอร์หลัง</TableHead>
                        </>
                      )}
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-center">หน่วย</TableHead>
                      <TableHead className="text-right">ราคา/หน่วย</TableHead>
                      <TableHead className="text-right">จำนวนเงิน (฿)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {document.items?.map((item) => (
                      <TableRow key={item.id || item.itemOrder}>
                        <TableCell className="text-center font-medium text-slate-500">
                          {item.itemOrder}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {item.description}
                        </TableCell>
                        {document.docType.includes("ELEC") && (
                          <>
                            <TableCell className="text-right text-slate-600">
                              {item.meterPrevious != null
                                ? formatCurrency(item.meterPrevious)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right text-slate-600">
                              {item.meterCurrent != null
                                ? formatCurrency(item.meterCurrent)
                                : "-"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right font-medium text-slate-900">
                          {item.quantity.toLocaleString("th-TH")}
                        </TableCell>
                        <TableCell className="text-center text-slate-600">
                          {item.unitName || "-"}
                        </TableCell>
                        <TableCell className="text-right text-slate-700">
                          ฿{formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          ฿{formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Calculations Box */}
              <div className="border-t bg-slate-50/40 p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  {/* Thai Baht text */}
                  <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      จำนวนเงินตัวอักษร
                    </span>
                    <div className="mt-1 font-semibold text-slate-800 text-sm">
                      {document.thaiBahtText || "(ศูนย์บาทถ้วน)"}
                    </div>
                  </div>

                  {/* Summary Totals Table */}
                  <div className="w-full max-w-sm space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>รวมเป็นเงิน</span>
                      <span className="font-medium text-slate-900">
                        ฿{formatCurrency(document.subtotal)}
                      </span>
                    </div>

                    {document.enableVat && (
                      <div className="flex justify-between text-slate-600">
                        <span>ภาษีมูลค่าเพิ่ม {document.vatRate}%</span>
                        <span className="font-medium text-slate-900">
                          ฿{formatCurrency(document.vatAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-t pt-2 font-semibold text-slate-800">
                      <span>จำนวนเงินรวมทั้งสิ้น</span>
                      <span>฿{formatCurrency(document.grandTotal)}</span>
                    </div>

                    {document.enableWht && (
                      <div className="flex justify-between text-amber-700">
                        <span>หักภาษี ณ ที่จ่าย {document.whtRate}%</span>
                        <span className="font-medium">
                          -฿{formatCurrency(document.whtAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center rounded-lg bg-blue-50 p-3 border border-blue-200">
                      <span className="font-bold text-blue-900">ยอดชำระสุทธิ</span>
                      <span className="text-xl font-extrabold text-blue-700">
                        ฿{formatCurrency(document.netPayable)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info Card (If Receipt) */}
          {!isInvoice && (
            <Card className="border-sky-200 bg-sky-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-sky-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  ข้อมูลการชำระเงิน (Payment Details)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">วันที่ชำระเงิน</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {document.paymentDate ? formatDate(document.paymentDate) : "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">วิธีการชำระ</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {document.paymentMethod
                        ? PAYMENT_METHOD_LABELS[document.paymentMethod] || document.paymentMethod
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">เลขที่อ้างอิง / เช็ค</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {document.paymentRef || "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          {document.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">
                  หมายเหตุ (Notes)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {document.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* ========================================================= */
        /* EDIT MODE                                                 */
        /* ========================================================= */
        <form onSubmit={handleSaveEdit} className="space-y-6">
          <Card className="border-blue-300">
            <CardHeader className="bg-blue-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-blue-900">
                    แก้ไขเอกสาร: {document.docNumber}
                  </CardTitle>
                  <CardDescription>
                    ปรับปรุงรายละเอียด รายการคำนวณ หรือข้อมูลลูกค้า
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">สถานะเอกสาร:</span>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-36 bg-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">รอชำระ (Pending)</SelectItem>
                      <SelectItem value="PAID">ชำระแล้ว (Paid)</SelectItem>
                      <SelectItem value="CANCELLED">ยกเลิก (Cancelled)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Document details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>วันที่ออกเอกสาร</Label>
                  <Input
                    type="date"
                    value={editIssueDate}
                    onChange={(e) => setEditIssueDate(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                </div>

                {editDocType.startsWith("INV_") && (
                  <div>
                    <Label>วันครบกำหนดชำระ</Label>
                    <Input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                )}

                <div>
                  <Label>ประจำเดือน</Label>
                  <Select
                    value={String(editBillingMonth)}
                    onValueChange={(val) => setEditBillingMonth(Number(val))}
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
                    value={String(editBillingYear)}
                    onValueChange={(val) => setEditBillingYear(Number(val))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[editBillingYear - 1, editBillingYear, editBillingYear + 1].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          พ.ศ. {y + 543} ({y})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ชื่อสถานี</Label>
                  <Input
                    value={editStationName}
                    onChange={(e) => setEditStationName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>เลขที่สัญญาอ้างอิง</Label>
                  <Input
                    value={editContractRef}
                    onChange={(e) => setEditContractRef(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Customer info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm text-slate-800 mb-3">
                  ข้อมูลลูกค้า / หน่วยงาน
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>ชื่อลูกค้า *</Label>
                    <Input
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label>เลขประจำตัวผู้เสียภาษี</Label>
                    <Input
                      value={editCustomerTaxId}
                      onChange={(e) => setEditCustomerTaxId(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>สาขา</Label>
                    <Input
                      value={editCustomerBranch}
                      onChange={(e) => setEditCustomerBranch(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>ที่อยู่</Label>
                    <Textarea
                      value={editCustomerAddress}
                      onChange={(e) => setEditCustomerAddress(e.target.value)}
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Items editing table */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm text-slate-800">
                    รายการสินค้า / บริการ
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEditItem}
                    className="gap-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มรายการ
                  </Button>
                </div>

                <div className="overflow-x-auto rounded border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs text-slate-700">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">ลำดับ</th>
                        <th className="py-2 px-3 min-w-[200px]">คำอธิบาย</th>
                        {editDocType.includes("ELEC") && (
                          <>
                            <th className="py-2 px-3 w-28">มิเตอร์ก่อน</th>
                            <th className="py-2 px-3 w-28">มิเตอร์หลัง</th>
                          </>
                        )}
                        <th className="py-2 px-3 w-24">จำนวน</th>
                        <th className="py-2 px-3 w-20">หน่วย</th>
                        <th className="py-2 px-3 w-28 text-right">ราคา/หน่วย</th>
                        <th className="py-2 px-3 w-32 text-right">จำนวนเงิน</th>
                        <th className="py-2 px-3 text-center w-12">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editItems.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleEditItemChange(index, "description", e.target.value)
                              }
                              className="h-8"
                              required
                            />
                          </td>
                          {editDocType.includes("ELEC") && (
                            <>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.meterPrevious ?? ""}
                                  onChange={(e) =>
                                    handleEditItemChange(
                                      index,
                                      "meterPrevious",
                                      e.target.value === "" ? null : Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-right"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.meterCurrent ?? ""}
                                  onChange={(e) =>
                                    handleEditItemChange(
                                      index,
                                      "meterCurrent",
                                      e.target.value === "" ? null : Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-right"
                                />
                              </td>
                            </>
                          )}
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleEditItemChange(index, "quantity", Number(e.target.value))
                              }
                              className="h-8 text-right"
                              required
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={item.unitName}
                              onChange={(e) =>
                                handleEditItemChange(index, "unitName", e.target.value)
                              }
                              className="h-8 text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleEditItemChange(index, "unitPrice", Number(e.target.value))
                              }
                              className="h-8 text-right"
                              required
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">
                            ฿{formatCurrency(item.amount)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveEditItem(index)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax calculations editor */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 border-t pt-4">
                <div className="space-y-4 rounded-lg bg-slate-50 p-4">
                  <h4 className="font-semibold text-sm text-slate-700">การตั้งค่าภาษี</h4>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="editEnableVat" className="font-medium text-slate-800">
                      คิดภาษีมูลค่าเพิ่ม (VAT)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="editEnableVat"
                        checked={editEnableVat}
                        onCheckedChange={setEditEnableVat}
                      />
                      {editEnableVat && (
                        <div className="flex items-center gap-1 w-20">
                          <Input
                            type="number"
                            value={editVatRate}
                            onChange={(e) => setEditVatRate(Number(e.target.value))}
                            className="h-8 text-center text-xs"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="editEnableWht" className="font-medium text-slate-800">
                      หักภาษี ณ ที่จ่าย (Withholding Tax)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="editEnableWht"
                        checked={editEnableWht}
                        onCheckedChange={setEditEnableWht}
                      />
                      {editEnableWht && (
                        <div className="flex items-center gap-1 w-20">
                          <Input
                            type="number"
                            value={editWhtRate}
                            onChange={(e) => setEditWhtRate(Number(e.target.value))}
                            className="h-8 text-center text-xs"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>รวมเป็นเงิน</span>
                    <span className="font-medium text-slate-900">
                      ฿{formatCurrency(editSubtotal)}
                    </span>
                  </div>

                  {editEnableVat && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>ภาษีมูลค่าเพิ่ม {editVatRate}%</span>
                      <span className="font-medium text-slate-900">
                        ฿{formatCurrency(editVatAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t pt-2 text-sm font-semibold text-slate-800">
                    <span>จำนวนเงินรวมทั้งสิ้น</span>
                    <span>฿{formatCurrency(editGrandTotal)}</span>
                  </div>

                  {editEnableWht && (
                    <div className="flex justify-between text-sm text-amber-700">
                      <span>หักภาษี ณ ที่จ่าย {editWhtRate}%</span>
                      <span className="font-medium">
                        -฿{formatCurrency(editWhtAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center rounded-lg bg-blue-50 p-3 border border-blue-200">
                    <span className="font-bold text-blue-900">ยอดชำระสุทธิ</span>
                    <span className="text-xl font-extrabold text-blue-700">
                      ฿{formatCurrency(editNetPayable)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info for Receipts */}
              {editDocType.startsWith("REC_") && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-slate-800 mb-3">
                    ข้อมูลการชำระเงิน
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Label>วันที่รับชำระ</Label>
                      <Input
                        type="date"
                        value={editPaymentDate}
                        onChange={(e) => setEditPaymentDate(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>วิธีการชำระ</Label>
                      <Select
                        value={editPaymentMethod}
                        onValueChange={(val: PaymentMethod) => setEditPaymentMethod(val)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRANSFER">โอนเงินเข้าบัญชี</SelectItem>
                          <SelectItem value="CHEQUE">เช็คธนาคาร</SelectItem>
                          <SelectItem value="CASH">เงินสด</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>เลขที่อ้างอิง</Label>
                      <Input
                        value={editPaymentRef}
                        onChange={(e) => setEditPaymentRef(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="border-t pt-4">
                <Label>หมายเหตุ</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
              </div>

              {/* Edit Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  disabled={saving}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ยืนยันการลบเอกสาร
            </DialogTitle>
            <DialogDescription>
              คุณต้องการลบเอกสารเลขที่ <strong>{document.docNumber}</strong> ออกจากระบบอย่างถาวรหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              ยืนยันการลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DocumentDetailPage() {
  return (
    <AppShell>
      <React.Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <DocumentDetailContent />
      </React.Suspense>
    </AppShell>
  )
}
