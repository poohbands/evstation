"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Printer,
  Edit3,
  Copy,
  Receipt,
  XCircle,
  Trash2,
  MoreVertical,
  Loader2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  DOC_TYPE_LABELS,
  STATUS_LABELS,
  THAI_MONTHS,
} from "@/lib/utils"
import { getLocalDocuments, removeLocalDocument } from "@/lib/client-storage"
import type { DocumentWithItems } from "@/types"

function sortDocumentsList(docs: DocumentWithItems[], sortKey: string): DocumentWithItems[] {
  return [...docs].sort((a, b) => {
    switch (sortKey) {
      case "createdAt_asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "createdAt_desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "issueDate_desc":
        return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
      case "issueDate_asc":
        return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
      case "docNumber_desc":
        return (b.docNumber || "").localeCompare(a.docNumber || "", undefined, { numeric: true })
      case "docNumber_asc":
        return (a.docNumber || "").localeCompare(b.docNumber || "", undefined, { numeric: true })
      case "netPayable_desc":
        return (b.netPayable || 0) - (a.netPayable || 0)
      case "netPayable_asc":
        return (a.netPayable || 0) - (b.netPayable || 0)
      case "customer_asc":
        return (a.stationName || a.customerName || "").localeCompare(b.stationName || b.customerName || "", "th")
      case "customer_desc":
        return (b.stationName || b.customerName || "").localeCompare(a.stationName || a.customerName || "", "th")
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
}

export default function DocumentsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [documents, setDocuments] = React.useState<DocumentWithItems[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filters state
  const [searchTerm, setSearchTerm] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("ALL")
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [monthFilter, setMonthFilter] = React.useState("ALL")
  const [yearFilter, setYearFilter] = React.useState("ALL")

  // Sorting state
  const [sortBy, setSortBy] = React.useState("createdAt_desc")
  const sortByRef = React.useRef(sortBy)
  sortByRef.current = sortBy

  const handleSortChange = React.useCallback((newSort: string) => {
    setSortBy(newSort)
    sortByRef.current = newSort
    setDocuments((prev) => sortDocumentsList(prev, newSort))
  }, [])

  // Delete modal confirmation
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Convert modal confirmation / progress
  const [isConverting, setIsConverting] = React.useState(false)

  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== "ALL") params.append("type", typeFilter)
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter)
      if (monthFilter && monthFilter !== "ALL") params.append("month", monthFilter)
      if (yearFilter && yearFilter !== "ALL") params.append("year", yearFilter)
      if (searchTerm.trim() !== "") params.append("search", searchTerm.trim())

      const res = await fetch(`/api/documents?${params.toString()}`)
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดรายการเอกสารได้")
      }
      const data = await res.json()
      const serverDocs: DocumentWithItems[] = Array.isArray(data) ? data : []

      // Merge client local documents (prevents disappearing on serverless cold starts)
      // Apply the same filters to local docs so wrong doc types don't leak through
      const localDocs = getLocalDocuments()
      const merged = [...serverDocs]
      for (const ld of localDocs) {
        if (merged.some(d => d.id === ld.id)) continue
        // Apply same filters as the server query
        if (typeFilter && typeFilter !== "ALL" && ld.docType !== typeFilter) continue
        if (statusFilter && statusFilter !== "ALL" && ld.status !== statusFilter) continue
        if (monthFilter && monthFilter !== "ALL" && ld.billingMonth !== parseInt(monthFilter)) continue
        if (yearFilter && yearFilter !== "ALL" && ld.billingYear !== parseInt(yearFilter)) continue
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase()
          const match =
            (ld.docNumber || "").toLowerCase().includes(q) ||
            (ld.customerName || "").toLowerCase().includes(q) ||
            (ld.stationName || "").toLowerCase().includes(q)
          if (!match) continue
        }
        merged.push(ld)
        // Re-sync to server in background
        fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ld),
        }).catch(() => {})
      }

      // Sort according to current sort criteria
      const sorted = sortDocumentsList(merged, sortByRef.current)
      setDocuments(sorted)
    } catch (err: any) {
      console.error(err)
      let localDocs = getLocalDocuments()
      // Apply same filters to local-only fallback
      if (typeFilter && typeFilter !== "ALL") localDocs = localDocs.filter(d => d.docType === typeFilter)
      if (statusFilter && statusFilter !== "ALL") localDocs = localDocs.filter(d => d.status === statusFilter)
      if (monthFilter && monthFilter !== "ALL") localDocs = localDocs.filter(d => d.billingMonth === parseInt(monthFilter))
      if (yearFilter && yearFilter !== "ALL") localDocs = localDocs.filter(d => d.billingYear === parseInt(yearFilter))
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase()
        localDocs = localDocs.filter(d =>
          (d.docNumber || "").toLowerCase().includes(q) ||
          (d.customerName || "").toLowerCase().includes(q) ||
          (d.stationName || "").toLowerCase().includes(q)
        )
      }
      const sorted = sortDocumentsList(localDocs, sortByRef.current)
      if (sorted.length > 0) {
        setDocuments(sorted)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: err.message || "ไม่สามารถดึงข้อมูลเอกสารได้",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }, [typeFilter, statusFilter, monthFilter, yearFilter, searchTerm, toast])

  React.useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Handle Search Input Debounce or Form Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDocuments()
  }

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("")
    setTypeFilter("ALL")
    setStatusFilter("ALL")
    setMonthFilter("ALL")
    setYearFilter("ALL")
    handleSortChange("createdAt_desc")
  }

  // Handle Duplicate
  const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      toast({
        title: "กำลังคัดลอกเอกสาร...",
        description: "กรุณารอสักครู่",
      })
      const res = await fetch(`/api/documents/${id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการทำสำเนาเอกสาร")
      }
      toast({
        title: "ทำสำเนาสำเร็จ",
        description: `สร้างเอกสารเลขที่ ${data.docNumber} เรียบร้อยแล้ว`,
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
  const handleConvert = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setIsConverting(true)
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
        description: `สร้างใบเสร็จรับเงินเลขที่ ${data.docNumber} แล้ว และปรับสถานะใบแจ้งหนี้เป็น "ชำระแล้ว"`,
      })
      router.push(`/documents/${data.id}`)
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  // Handle Cancel Document
  const handleCancelStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถยกเลิกเอกสารได้")
      }
      toast({
        title: "ยกเลิกเอกสารสำเร็จ",
        description: "ปรับสถานะเอกสารเป็นยกเลิกแล้ว",
      })
      fetchDocuments()
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  // Handle Delete Confirmation
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/documents/${deleteId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถลบเอกสารได้")
      }
      removeLocalDocument(deleteId)
      toast({
        title: "ลบเอกสารสำเร็จ",
        description: "นำเอกสารออกจากระบบเรียบร้อยแล้ว",
      })
      setDeleteId(null)
      fetchDocuments()
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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

  // Current year options (current year +/- 2)
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              เอกสารทั้งหมด
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              จัดการ ค้นหา พิมพ์ และติดตามสถานะใบแจ้งหนี้และใบเสร็จรับเงิน
            </p>
          </div>

          <Link href="/documents/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4" />
              สร้างเอกสารใหม่
            </Button>
          </Link>
        </div>

        {/* Filter Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Search Term */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, สถานี..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Doc Type Filter */}
                <div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="ประเภทเอกสารทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ประเภทเอกสารทั้งหมด</SelectItem>
                      <SelectItem value="INV_ELEC">ใบแจ้งหนี้ค่าไฟ (INV-EV)</SelectItem>
                      <SelectItem value="REC_ELEC">ใบเสร็จค่าไฟ (REC-EV)</SelectItem>
                      <SelectItem value="INV_RENT">ใบแจ้งหนี้ค่าเช่า (INV-RENT)</SelectItem>
                      <SelectItem value="REC_RENT">ใบเสร็จค่าเช่า (REC-RENT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="สถานะทั้งหมด" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">สถานะทั้งหมด</SelectItem>
                      <SelectItem value="PENDING">รอชำระ (Pending)</SelectItem>
                      <SelectItem value="PAID">ชำระแล้ว (Paid)</SelectItem>
                      <SelectItem value="CANCELLED">ยกเลิก (Cancelled)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Filter */}
                <div>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="ทุกเดือน" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทุกเดือน</SelectItem>
                      {THAI_MONTHS.map((m, idx) => (
                        <SelectItem key={idx + 1} value={String(idx + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sub Row: Year, Sorting, and Reset */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {/* Year Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">ปี พ.ศ./ค.ศ.:</span>
                    <div className="w-32">
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="ทุกปี" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">ทุกปี</SelectItem>
                          {years.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y + 543} ({y})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="hidden h-4 w-px bg-slate-200 sm:block" />

                  {/* Sort Filter */}
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500 whitespace-nowrap">
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      เรียงเอกสาร:
                    </span>
                    <div className="w-56 sm:w-64">
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="เรียงลำดับเอกสาร" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt_desc">สร้างล่าสุด (ใหม่ → เก่า)</SelectItem>
                          <SelectItem value="createdAt_asc">สร้างก่อนหน้า (เก่า → ใหม่)</SelectItem>
                          <SelectItem value="issueDate_desc">วันที่เอกสาร (ล่าสุด → เก่าสุด)</SelectItem>
                          <SelectItem value="issueDate_asc">วันที่เอกสาร (เก่าสุด → ล่าสุด)</SelectItem>
                          <SelectItem value="docNumber_desc">เลขที่เอกสาร (มาก → น้อย)</SelectItem>
                          <SelectItem value="docNumber_asc">เลขที่เอกสาร (น้อย → มาก)</SelectItem>
                          <SelectItem value="netPayable_desc">ยอดเงินสุทธิ (มาก → น้อย)</SelectItem>
                          <SelectItem value="netPayable_asc">ยอดเงินสุทธิ (น้อย → มาก)</SelectItem>
                          <SelectItem value="customer_asc">ชื่อสถานี/ลูกค้า (ก → ฮ)</SelectItem>
                          <SelectItem value="customer_desc">ชื่อสถานี/ลูกค้า (ฮ → ก)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL" || monthFilter !== "ALL" || yearFilter !== "ALL" || sortBy !== "createdAt_desc") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-8 gap-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      ล้างตัวกรอง
                    </Button>
                  )}
                  <span className="text-xs text-slate-400">
                    พบ {documents.length} เอกสาร
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm">กำลังโหลดข้อมูลเอกสาร...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-base font-medium text-slate-700">
                  ไม่พบเอกสารตามเงื่อนไขที่เลือก
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  ลองปรับเปลี่ยนคำค้นหา หรือสร้างเอกสารใหม่สำหรับระบบ
                </p>
                <Link href="/documents/new" className="mt-4">
                  <Button size="sm" className="bg-blue-600">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    สร้างเอกสารใหม่
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead
                        className="cursor-pointer font-semibold text-slate-700 hover:text-blue-600 select-none transition-colors"
                        onClick={() => handleSortChange(sortBy === "docNumber_desc" ? "docNumber_asc" : "docNumber_desc")}
                        title="คลิกเพื่อเรียงตามเลขที่เอกสาร"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>เลขที่เอกสาร</span>
                          {sortBy === "docNumber_desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                          ) : sortBy === "docNumber_asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 hover:text-slate-500" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">ประเภทเอกสาร</TableHead>
                      <TableHead
                        className="cursor-pointer font-semibold text-slate-700 hover:text-blue-600 select-none transition-colors"
                        onClick={() => handleSortChange(sortBy === "customer_asc" ? "customer_desc" : "customer_asc")}
                        title="คลิกเพื่อเรียงตามชื่อสถานี/ลูกค้า"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>สถานี / ลูกค้า</span>
                          {sortBy === "customer_asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : sortBy === "customer_desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 hover:text-slate-500" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">ประจำเดือน</TableHead>
                      <TableHead
                        className="cursor-pointer text-right font-semibold text-slate-700 hover:text-blue-600 select-none transition-colors"
                        onClick={() => handleSortChange(sortBy === "netPayable_desc" ? "netPayable_asc" : "netPayable_desc")}
                        title="คลิกเพื่อเรียงตามยอดสุทธิ"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>ยอดสุทธิ</span>
                          {sortBy === "netPayable_desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                          ) : sortBy === "netPayable_asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 hover:text-slate-500" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">สถานะ</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">การดำเนินการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => {
                      const isInvoice = doc.docType.startsWith("INV_")
                      const isPending = doc.status === "PENDING"
                      const monthName =
                        doc.billingMonth && doc.billingMonth >= 1 && doc.billingMonth <= 12
                          ? THAI_MONTHS[doc.billingMonth - 1]
                          : "-"
                      const yearThai = doc.billingYear ? doc.billingYear + 543 : "-"

                      return (
                        <TableRow
                          key={doc.id}
                          onClick={() => router.push(`/documents/${doc.id}`)}
                          className="cursor-pointer transition-colors hover:bg-blue-50/40"
                        >
                          <TableCell className="font-medium text-blue-600">
                            <div className="font-semibold">{doc.docNumber}</div>
                            <div className="text-[11px] text-slate-400">
                              {formatDate(doc.issueDate)}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div>{getDocTypeBadge(doc.docType)}</div>
                            {doc.refInvoice && (
                              <div className="mt-1 text-[11px] text-slate-500">
                                อ้างอิง: {doc.refInvoice.docNumber}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="max-w-[220px]">
                            <div className="truncate font-medium text-slate-900">
                              {doc.stationName || "-"}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {doc.customerName || "-"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600">
                            {monthName} {yearThai}
                          </TableCell>

                          <TableCell className="text-right font-semibold text-slate-900">
                            ฿{formatCurrency(doc.netPayable)}
                          </TableCell>

                          <TableCell className="text-center">
                            {getStatusBadge(doc.status)}
                          </TableCell>

                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">เปิดเมนูจัดการ</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}`)}>
                                  <Eye className="mr-2 h-4 w-4 text-slate-500" />
                                  ดูเอกสาร
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}/print`)}>
                                  <Printer className="mr-2 h-4 w-4 text-slate-500" />
                                  พิมพ์ / บันทึก PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}?edit=true`)}>
                                  <Edit3 className="mr-2 h-4 w-4 text-slate-500" />
                                  แก้ไข
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleDuplicate(doc.id, e)}>
                                  <Copy className="mr-2 h-4 w-4 text-slate-500" />
                                  ทำสำเนา (คัดลอก)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/envelope?docId=${doc.id}`)}>
                                  <span className="mr-2 text-sm">✉️</span>
                                  ใบปะหน้าซอง กฟภ.
                                </DropdownMenuItem>

                                {/* Convert to receipt: only for INV_ and PENDING */}
                                {isInvoice && isPending && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => handleConvert(doc.id, e)}
                                      className="text-emerald-700 font-medium"
                                    >
                                      <Receipt className="mr-2 h-4 w-4 text-emerald-600" />
                                      ออกใบเสร็จรับเงิน
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {doc.status !== "CANCELLED" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => handleCancelStatus(doc.id, e)}
                                      className="text-amber-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-amber-600" />
                                      ยกเลิกเอกสาร
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(doc.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                  ลบเอกสาร
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                ยืนยันการลบเอกสาร
              </DialogTitle>
              <DialogDescription>
                การลบเอกสารนี้จะไม่สามารถกู้คืนได้ และรายการที่เชื่อมโยงจะถูกลบทั้งหมด คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
