"use client"

import * as React from "react"
import Link from "next/link"
import {
  Shield,
  ShieldAlert,
  Activity,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Users,
  LogIn,
  LogOut,
  AlertTriangle,
  FilePlus,
  Edit,
  Trash2,
  Copy,
  Settings as SettingsIcon,
  CreditCard,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Laptop,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpDown,
} from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { useAuth } from "@/components/auth/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface AuditLogItem {
  id: string
  userId?: string | null
  username: string
  userRole?: string | null
  action: string
  category: "AUTH" | "DOCUMENT" | "USER" | "SETTINGS" | "MONTHLY_FEE" | "SYSTEM"
  description: string
  targetId?: string | null
  targetName?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  details?: string | null
  createdAt: string
}

interface PaginationData {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface LogStats {
  totalLogs: number
  todayCount: number
  authTodayCount: number
  docTodayCount: number
}

export default function AuditLogsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [logs, setLogs] = React.useState<AuditLogItem[]>([])
  const [pagination, setPagination] = React.useState<PaginationData>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  })
  const [stats, setStats] = React.useState<LogStats>({
    totalLogs: 0,
    todayCount: 0,
    authTodayCount: 0,
    docTodayCount: 0,
  })
  const [loading, setLoading] = React.useState(true)

  // Filters state
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [selectedLog, setSelectedLog] = React.useState<AuditLogItem | null>(null)

  const fetchLogs = React.useCallback(
    async (pageToLoad = 1) => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set("page", pageToLoad.toString())
        params.set("pageSize", "50")

        if (categoryFilter && categoryFilter !== "ALL") {
          params.set("category", categoryFilter)
        }
        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim())
        }
        if (startDate) {
          params.set("startDate", startDate)
        }
        if (endDate) {
          params.set("endDate", endDate)
        }

        const res = await fetch(`/api/logs?${params.toString()}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "ไม่สามารถโหลดประวัติการใช้งานได้")
        }

        setLogs(data.logs || [])
        setPagination(data.pagination)
        setStats(data.stats)
      } catch (err: any) {
        console.error(err)
        toast({
          title: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
          description: err.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [categoryFilter, searchQuery, startDate, endDate, toast]
  )

  React.useEffect(() => {
    if (isAdmin) {
      fetchLogs(1)
    }
  }, [isAdmin, fetchLogs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchLogs(1)
  }

  const handleClearFilters = () => {
    setCategoryFilter("ALL")
    setSearchQuery("")
    setStartDate("")
    setEndDate("")
    setTimeout(() => {
      fetchLogs(1)
    }, 50)
  }

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast({
        title: "ไม่มีข้อมูลสำหรับส่งออก",
        description: "ไม่พบรายการประวัติการใช้งานที่ตรงกับเงื่อนไข",
      })
      return
    }

    const headers = ["ลำดับ", "วัน-เวลา", "ผู้ใช้งาน", "สิทธิ์", "หมวดหมู่", "การกระทำ", "รายละเอียด", "IP Address", "อ้างอิงเป้าหมาย"]
    const rows = logs.map((l, i) => [
      i + 1,
      new Date(l.createdAt).toLocaleString("th-TH"),
      l.username,
      l.userRole || "-",
      l.category,
      l.action,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      l.ipAddress || "-",
      `"${(l.targetName || l.targetId || "-").replace(/"/g, '""')}"`,
    ])

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "ส่งออกไฟล์ CSV สำเร็จ",
      description: `ดาวน์โหลดประวัติการใช้งาน ${logs.length} รายการเรียบร้อยแล้ว`,
    })
  }

  // 1. Loading Auth
  if (authLoading) {
    return (
      <AppShell>
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </AppShell>
    )
  }

  // 2. Non-Admin Access Denied
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-12">
          <Card className="border-red-200 bg-red-50/50 shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl text-red-900 font-bold">
                จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only)
              </CardTitle>
              <CardDescription className="text-xs text-red-700">
                หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้นในการตรวจสอบประวัติการเข้าใช้งานและกิจกรรมในระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-center">
              <p className="text-xs text-slate-600 leading-relaxed">
                บัญชีผู้ใช้ปัจจุบันของคุณคือ{" "}
                <strong className="text-slate-900">{user?.username || "Guest"}</strong> (สถานะ:{" "}
                <Badge variant="outline" className="text-[11px] font-semibold text-slate-700">
                  {user?.role || "ไม่มีสิทธิ์"}
                </Badge>
                ) ซึ่งไม่มีสิทธิ์เข้าถึงบันทึกความปลอดภัยและประวัติการทำรายการ
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    กลับหน้าหลัก
                  </Button>
                </Link>
                <Link href="/documents">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    ไปที่เอกสารทั้งหมด
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  const formatThaiDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d)
    } catch {
      return dateStr
    }
  }

  const getRelativeTime = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
      if (diffSec < 60) return "เมื่อสักครู่"
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`
      return `${Math.floor(diffSec / 86400)} วันที่แล้ว`
    } catch {
      return ""
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "AUTH":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">เข้าสู่ระบบ (AUTH)</Badge>
      case "DOCUMENT":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">เอกสาร (DOC)</Badge>
      case "USER":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">ผู้ใช้งาน (USER)</Badge>
      case "SETTINGS":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">ตั้งค่า (SETTINGS)</Badge>
      case "MONTHLY_FEE":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200">ค่าบริการ (FEE)</Badge>
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-emerald-600" />
      case "LOGIN_FAILED":
      case "LOGIN_BLOCKED":
        return <AlertTriangle className="h-4 w-4 text-rose-500" />
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-slate-500" />
      case "CREATE_DOC":
      case "CREATE_PAIRED_DOCS":
        return <FilePlus className="h-4 w-4 text-blue-600" />
      case "UPDATE_DOC":
        return <Edit className="h-4 w-4 text-sky-600" />
      case "DELETE_DOC":
        return <Trash2 className="h-4 w-4 text-red-500" />
      case "CONVERT_DOC":
        return <RefreshCw className="h-4 w-4 text-indigo-600" />
      case "DUPLICATE_DOC":
        return <Copy className="h-4 w-4 text-cyan-600" />
      case "CREATE_USER":
      case "UPDATE_USER":
        return <Users className="h-4 w-4 text-purple-600" />
      case "DELETE_USER":
        return <Trash2 className="h-4 w-4 text-rose-600" />
      case "UPDATE_SETTINGS":
      case "UPDATE_MAINTENANCE":
        return <SettingsIcon className="h-4 w-4 text-amber-600" />
      case "UPDATE_FEE":
        return <CreditCard className="h-4 w-4 text-indigo-600" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    ประวัติการใช้งานระบบ (Audit Logs)
                  </h1>
                  <Badge className="bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-semibold">
                    Admin Only
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  เก็บบันทึกประวัติการเข้าใช้งาน การออกเอกสาร และการเปลี่ยนแปลงข้อมูลสำคัญอย่างปลอดภัยบนฐานข้อมูลคลาวด์
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 text-xs text-slate-700 hover:text-slate-900 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              ส่งออก CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page)}
              disabled={loading}
              className="gap-1.5 text-xs shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">กิจกรรมทั้งหมด</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalLogs.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">บันทึกสะสมในฐานข้อมูล</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">กิจกรรมวันนี้</CardTitle>
              <Clock className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.todayCount.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">รายการกระทำในรอบ 24 ชม.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">เข้าสู่ระบบวันนี้</CardTitle>
              <LogIn className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.authTodayCount.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">ครั้งที่เข้าสู่ระบบสำเร็จ</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-500">งานเอกสารวันนี้</CardTitle>
              <FileText className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.docTodayCount.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">สร้าง/แก้ไข/ลบเอกสาร</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
              {/* Search text */}
              <div className="sm:col-span-4">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  ค้นหากิจกรรม (ผู้ใช้ / ข้อความ / เลขที่เอกสาร / IP)
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์คำค้นหา..."
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="sm:col-span-3">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  หมวดหมู่กิจกรรม
                </label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทั้งหมดทุกหมวดหมู่</SelectItem>
                    <SelectItem value="AUTH">การเข้าสู่ระบบ (AUTH)</SelectItem>
                    <SelectItem value="DOCUMENT">การจัดการเอกสาร (DOCUMENT)</SelectItem>
                    <SelectItem value="USER">การจัดการผู้ใช้ (USER)</SelectItem>
                    <SelectItem value="SETTINGS">การตั้งค่าองค์กร (SETTINGS)</SelectItem>
                    <SelectItem value="MONTHLY_FEE">ค่าบริการ PEA App (MONTHLY_FEE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  ตั้งแต่วันที่
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* End Date */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  ถึงวันที่
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="sm:col-span-1 flex gap-1">
                <Button type="submit" size="sm" className="h-9 w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Filter className="h-3.5 w-3.5" />
                </Button>
                {(searchQuery || categoryFilter !== "ALL" || startDate || endDate) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800"
                    title="ล้างตัวกรอง"
                  >
                    ล้าง
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table Card */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 px-6 py-3.5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-800">
                รายการประวัติล่าสุด
              </CardTitle>
              <Badge variant="secondary" className="text-[11px]">
                {pagination.total} รายการ
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500">
              หน้า {pagination.page} จาก {pagination.totalPages}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                <p className="text-xs">กำลังโหลดประวัติการใช้งาน...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-slate-400">
                <Shield className="h-10 w-10 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-600">ไม่พบประวัติการใช้งาน</p>
                <p className="text-xs text-slate-400">ยังไม่มีบันทึกกิจกรรมที่ตรงกับเงื่อนไขการค้นหาในระบบ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">วัน-เวลา</th>
                      <th className="py-3 px-4">ผู้ใช้งาน</th>
                      <th className="py-3 px-3">หมวดหมู่</th>
                      <th className="py-3 px-4">กิจกรรม / รายละเอียด</th>
                      <th className="py-3 px-4">IP Address & อุปกรณ์</th>
                      <th className="py-3 px-3 text-center">เพิ่มเติม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{formatThaiDate(log.createdAt)}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {getRelativeTime(log.createdAt)}
                          </div>
                        </td>

                        {/* Username */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                              {log.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{log.username}</div>
                              {log.userRole && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {log.userRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getCategoryBadge(log.category)}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2 max-w-xl">
                            <div className="mt-0.5 shrink-0">{getActionIcon(log.action)}</div>
                            <div>
                              <p className="text-xs font-medium text-slate-900 leading-snug">
                                {log.description}
                              </p>
                              {log.targetName && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  อ้างอิง: <span className="font-mono text-slate-700">{log.targetName}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* IP Address & User Agent */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          <div className="font-mono text-[11px] text-slate-700">{log.ipAddress || "-"}</div>
                          {log.userAgent && (
                            <div
                              className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5"
                              title={log.userAgent}
                            >
                              {log.userAgent.includes("Windows")
                                ? "Windows"
                                : log.userAgent.includes("Mac")
                                ? "macOS"
                                : log.userAgent.includes("iPhone")
                                ? "iOS"
                                : log.userAgent.includes("Android")
                                ? "Android"
                                : "Web Browser"}
                            </div>
                          )}
                        </td>

                        {/* Details Modal Trigger */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log)
                              setDetailModalOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="ดูรายละเอียดเชิงลึก"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  แสดงหน้า {pagination.page} จาก {pagination.totalPages} (รวม {pagination.total} รายการ)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    className="h-8 gap-1 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="h-8 gap-1 text-xs"
                  >
                    ถัดไป
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal Dialog */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                {selectedLog && getActionIcon(selectedLog.action)}
                รายละเอียดกิจกรรม (Log Details)
              </DialogTitle>
              <DialogDescription className="text-xs">
                รหัสบันทึก: <span className="font-mono">{selectedLog?.id}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">วัน-เวลา:</span>
                    <strong className="text-slate-900 font-medium">
                      {formatThaiDate(selectedLog.createdAt)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">ผู้กระทำ:</span>
                    <strong className="text-slate-900 font-medium">
                      {selectedLog.username} ({selectedLog.userRole || "ไม่มีสิทธิ์"})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">หมวดหมู่ / Action:</span>
                    <span className="font-mono text-slate-800">
                      {selectedLog.category} &rsaquo; {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">IP Address:</span>
                    <span className="font-mono text-slate-800">{selectedLog.ipAddress || "-"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px] mb-1">คำอธิบายกิจกรรม:</span>
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-md font-medium text-slate-900">
                    {selectedLog.description}
                  </div>
                </div>

                {selectedLog.userAgent && (
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">อุปกรณ์ / User-Agent:</span>
                    <div className="p-2 bg-slate-100 rounded text-[11px] text-slate-600 font-mono break-all">
                      {selectedLog.userAgent}
                    </div>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">ข้อมูลเชิงลึก (Payload JSON):</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-md text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                        } catch {
                          return selectedLog.details
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
