"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Zap,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  PlusCircle,
  ArrowRight,
  Database,
  RefreshCw,
  Loader2,
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
import { Badge } from "@/components/ui/badge"
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
} from "@/lib/utils"
import type { DashboardStats, DocumentWithItems } from "@/types"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [stats, setStats] = React.useState<DashboardStats>({
    totalElectricityRevenue: 0,
    totalRentalRevenue: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    cancelledInvoices: 0,
    totalDocuments: 0,
  })
  const [recentDocs, setRecentDocs] = React.useState<DocumentWithItems[]>([])

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/dashboard")
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้")
      }
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
      }
      if (data.recentDocuments) {
        setRecentDocs(data.recentDocuments)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message || "ไม่สามารถดึงข้อมูลแดชบอร์ดได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleSeedDatabase = async () => {
    try {
      setSeeding(true)
      const res = await fetch("/api/seed", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง")
      }
      toast({
        title: "สร้างข้อมูลตัวอย่างสำเร็จ",
        description: `สร้างเอกสารตัวอย่างแล้ว ${data.count || 0} ฉบับ`,
      })
      await fetchDashboardData()
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSeeding(false)
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

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              แดชบอร์ด
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              ภาพรวมรายได้ สถานะเอกสาร และการเคลื่อนไหวล่าสุดของสถานีชาร์จ EV
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
            <Link href="/documents/new?type=INV_ELEC">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="h-4 w-4" />
                สร้างใบแจ้งหนี้ค่าไฟ
              </Button>
            </Link>
            <Link href="/documents/new?type=INV_RENT">
              <Button size="sm" variant="secondary" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                สร้างใบแจ้งหนี้ค่าเช่า
              </Button>
            </Link>
          </div>
        </div>

        {/* 6 Summary Cards (2x3 on mobile/tablet, 3x2 on desktop) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Revenue Elec */}
          <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                รายได้ค่าส่วนต่างไฟฟ้า
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Zap className="h-5 w-5 fill-blue-600 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "..." : `฿${formatCurrency(stats.totalElectricityRevenue)}`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                ยอดรับชำระแล้ว (ค่าไฟ EV)
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Revenue Rent */}
          <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                รายได้ค่าเช่าพื้นที่
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Home className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {loading ? "..." : `฿${formatCurrency(stats.totalRentalRevenue)}`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                ยอดรับชำระแล้ว (ค่าเช่าและส่วนกลาง)
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Pending Invoices */}
          <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/50 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                เอกสารรอชำระ
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loading ? "..." : `${stats.pendingInvoices} รายการ`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                เอกสารที่ยังไม่ได้รับการชำระเงิน
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Paid Invoices */}
          <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/50 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                เอกสารชำระแล้ว
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                {loading ? "..." : `${stats.paidInvoices} รายการ`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                เอกสารที่ออกใบเสร็จหรือชำระแล้ว
              </p>
            </CardContent>
          </Card>

          {/* Card 5: Cancelled Invoices */}
          <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/50 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                เอกสารยกเลิก
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? "..." : `${stats.cancelledInvoices} รายการ`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                เอกสารที่ถูกยกเลิกการใช้งาน
              </p>
            </CardContent>
          </Card>

          {/* Card 6: Total Documents */}
          <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/50 shadow-sm transition hover:shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                เอกสารทั้งหมด
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                {loading ? "..." : `${stats.totalDocuments} ฉบับ`}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                ยอดรวมเอกสารทุกประเภทในระบบ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              ทางลัดการออกเอกสาร (Quick Actions)
            </CardTitle>
            <CardDescription>
              สร้างเอกสารบิลเรียกเก็บเงินได้อย่างรวดเร็วตามประเภทที่ต้องการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/documents/new?type=INV_ELEC" className="block">
                <div className="flex h-full flex-col justify-between rounded-lg border border-blue-200 bg-blue-50/40 p-4 transition hover:bg-blue-50 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        ใบแจ้งหนี้ค่าไฟ
                      </div>
                      <div className="text-xs text-slate-500">INV-EV</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-medium text-blue-600">
                    <span>สร้างทันที</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>

              <Link href="/documents/new?type=REC_ELEC" className="block">
                <div className="flex h-full flex-col justify-between rounded-lg border border-sky-200 bg-sky-50/40 p-4 transition hover:bg-sky-50 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-sky-600 text-white">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        ใบเสร็จรับเงินค่าไฟ
                      </div>
                      <div className="text-xs text-slate-500">REC-EV</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-medium text-sky-600">
                    <span>สร้างทันที</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>

              <Link href="/documents/new?type=INV_RENT" className="block">
                <div className="flex h-full flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 transition hover:bg-emerald-50 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-600 text-white">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        ใบแจ้งหนี้ค่าเช่า
                      </div>
                      <div className="text-xs text-slate-500">INV-RENT</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-medium text-emerald-600">
                    <span>สร้างทันที</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>

              <Link href="/documents/new?type=REC_RENT" className="block">
                <div className="flex h-full flex-col justify-between rounded-lg border border-teal-200 bg-teal-50/40 p-4 transition hover:bg-teal-50 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-teal-600 text-white">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        ใบเสร็จรับเงินค่าเช่า
                      </div>
                      <div className="text-xs text-slate-500">REC-RENT</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs font-medium text-teal-600">
                    <span>สร้างทันที</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                เอกสารล่าสุด
              </CardTitle>
              <CardDescription>
                รายการเอกสารที่สร้างหรืออัปเดตล่าสุดในระบบ
              </CardDescription>
            </div>
            <Link href="/documents">
              <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700">
                ดูทั้งหมด
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm">กำลังโหลดข้อมูล...</span>
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-12 w-12 text-slate-300" />
                <p className="mt-3 font-medium text-slate-600">ยังไม่มีเอกสารในระบบ</p>
                <p className="text-xs text-slate-400">
                  เริ่มต้นด้วยการสร้างเอกสารใหม่ หรือโหลดข้อมูลตัวอย่างสำหรับทดสอบ
                </p>
                <div className="mt-4 flex gap-2">
                  <Link href="/documents/new">
                    <Button size="sm" className="bg-blue-600">
                      สร้างเอกสารฉบับแรก
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    className="gap-2"
                  >
                    <Database className="h-4 w-4" />
                    {seeding ? "กำลังสร้าง..." : "โหลดข้อมูลตัวอย่าง"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/75">
                      <TableHead className="font-semibold text-slate-700">เลขที่เอกสาร</TableHead>
                      <TableHead className="font-semibold text-slate-700">ประเภท</TableHead>
                      <TableHead className="font-semibold text-slate-700">ลูกค้า / หน่วยงาน</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">จำนวนเงินสุทธิ</TableHead>
                      <TableHead className="text-center font-semibold text-slate-700">สถานะ</TableHead>
                      <TableHead className="font-semibold text-slate-700">วันที่</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocs.slice(0, 8).map((doc) => (
                      <TableRow
                        key={doc.id}
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="cursor-pointer transition-colors hover:bg-blue-50/40"
                      >
                        <TableCell className="font-medium text-blue-600">
                          {doc.docNumber}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          <span className="text-xs">
                            {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-800">
                          {doc.customerName || "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          ฿{formatCurrency(doc.netPayable)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(doc.status)}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {formatDate(doc.issueDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Seed Section (Shown if 0 documents or as subtle bottom action) */}
        {stats.totalDocuments === 0 && !loading && (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-4 text-center">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
              <div className="text-left">
                <p className="font-semibold text-sm text-amber-900">
                  ⚡ ฐานข้อมูลยังว่างเปล่า (First-time setup)
                </p>
                <p className="text-xs text-amber-700">
                  ต้องการเพิ่มชุดข้อมูลตัวอย่าง (ใบแจ้งหนี้, ใบเสร็จรับเงิน, สถิติค่าไฟ) สำหรับทดลองระบบหรือไม่?
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
              >
                <Database className="mr-2 h-4 w-4 text-amber-600" />
                {seeding ? "กำลังสร้างข้อมูล..." : "โหลดข้อมูลตัวอย่าง (Seed Database)"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
