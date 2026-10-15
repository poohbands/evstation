"use client"

import * as React from "react"
import Link from "next/link"
import {
  Database,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  HardDrive,
  FileText,
  Users,
  Building2,
  Receipt,
  Layers,
  Lock,
  Globe2,
  Clock,
  ArrowLeft,
  Loader2,
  Radio,
} from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { useAuth } from "@/components/auth/AuthContext"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface DatabaseStatusData {
  status: "CONNECTED" | "DISCONNECTED"
  isOnline: boolean
  latencyMs?: number
  provider?: string
  databaseName?: string
  host?: string
  port?: string
  sslMode?: string
  isPooled?: boolean
  region?: string
  serverTime?: string
  pgVersion?: string
  counts?: {
    documents: number
    documentItems: number
    users: number
    settings: number
    monthlyFees: number
  }
  error?: string
  checkedAt: string
}

export default function DatabaseStatusPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [dbData, setDbData] = React.useState<DatabaseStatusData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [testing, setTesting] = React.useState(false)

  const fetchStatus = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setTesting(true)
      else setLoading(true)

      const res = await fetch("/api/database/status")
      const data: DatabaseStatusData = await res.json()
      setDbData(data)

      if (showToast) {
        if (data.isOnline) {
          toast({
            title: "การเชื่อมต่อฐานข้อมูลสมบูรณ์",
            description: `ทดสอบสำเร็จ ใช้เวลาตอบสนอง ${data.latencyMs ?? 0} ms`,
          })
        } else {
          toast({
            title: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
            description: data.error || "เกิดข้อผิดพลาดในการติดต่อฐานข้อมูล",
            variant: "destructive",
          })
        }
      }
    } catch (err: any) {
      console.error(err)
      setDbData({
        status: "DISCONNECTED",
        isOnline: false,
        error: err.message || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
        checkedAt: new Date().toISOString(),
      })
      if (showToast) {
        toast({
          title: "เกิดข้อผิดพลาดในการตรวจสอบ",
          description: err.message,
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      setTesting(false)
    }
  }, [toast])

  React.useEffect(() => {
    if (isAdmin) {
      fetchStatus()
    }
  }, [isAdmin, fetchStatus])

  // 1. Loading Auth state
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
                หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้นในการตรวจสอบสถานะเซิร์ฟเวอร์ฐานข้อมูล
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-center">
              <p className="text-xs text-slate-600 leading-relaxed">
                บัญชีผู้ใช้ปัจจุบันของคุณคือ{" "}
                <strong className="text-slate-900">{user?.username || "Guest"}</strong> (สถานะ:{" "}
                <Badge variant="outline" className="text-[11px] font-semibold text-slate-700">
                  {user?.role || "ไม่มีสิทธิ์"}
                </Badge>
                ) ซึ่งไม่มีสิทธิ์เข้าถึงข้อมูลความปลอดภัยและการเชื่อมต่อฐานข้อมูล
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <ArrowLeft className="h-4 w-4" />
                    กลับสู่หน้าหลัก
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5">
                    เข้าสู่ระบบด้วยบัญชีอื่น
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // 3. Admin View
  const isOnline = dbData?.isOnline === true

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto font-prompt">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
                <Database className="h-7 w-7 text-blue-600" />
                <span>สถานะการเชื่อมต่อฐานข้อมูล</span>
              </h1>
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-[11px] gap-1 px-2 py-0.5">
                <Shield className="h-3 w-3" />
                Admin Only
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              ตรวจสอบสถานะเซิร์ฟเวอร์ฐานข้อมูล Cloud PostgreSQL และการเชื่อมต่อแบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStatus(true)}
              disabled={loading || testing}
              className="gap-2 text-xs border-slate-300 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${testing ? "animate-spin text-blue-600" : ""}`} />
              <span>{testing ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อใหม่ (Ping DB)"}</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm">กำลังเชื่อมต่อและดึงข้อมูลสถานะฐานข้อมูล...</p>
          </div>
        ) : (
          <>
            {/* Primary Status Banner */}
            <Card
              className={
                isOnline
                  ? "border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/60 shadow-md"
                  : "border-red-300 bg-red-50/80 shadow-md"
              }
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                        isOnline
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                          : "bg-red-600 text-white ring-4 ring-red-100"
                      }`}
                    >
                      {isOnline ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <XCircle className="h-6 w-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          {isOnline ? "เชื่อมต่อฐานข้อมูลสำเร็จ (Online)" : "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Offline)"}
                        </span>
                        <span className="relative flex h-2.5 w-2.5">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isOnline ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                              isOnline ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {isOnline
                          ? `เซิร์ฟเวอร์ตอบรับคำสั่ง Query ปกติ • เวลาตอบสนอง Latency: ${dbData?.latencyMs ?? 0} ms`
                          : dbData?.error || "กรุณาตรวจสอบการตั้งค่า DATABASE_URL ในระบบ"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>ตรวจสอบล่าสุด:</span>
                      <span className="font-mono text-slate-900">
                        {dbData?.checkedAt ? new Date(dbData.checkedAt).toLocaleTimeString("th-TH") : "-"}
                      </span>
                    </div>
                    {isOnline && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Radio className="h-3 w-3" />
                        Active Connection
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-medium text-slate-500 truncate">ชื่อฐานข้อมูล (DB Name)</p>
                    <p className="text-base font-bold text-slate-900 font-mono truncate">
                      {dbData?.databaseName || "neondb"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <Server className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-medium text-slate-500 truncate">ผู้ให้บริการ (Provider)</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {dbData?.provider || "Neon Serverless"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-medium text-slate-500 truncate">ที่ตั้งเซิร์ฟเวอร์ (Region)</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {dbData?.region || "Singapore (ap-southeast-1)"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-xs">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-medium text-slate-500 truncate">เวลาตอบสนอง (Latency)</p>
                    <p className="text-base font-bold text-slate-900 font-mono truncate">
                      {dbData?.latencyMs != null ? `${dbData.latencyMs} ms` : "-"}
                      <span className="text-[10px] font-normal text-emerald-600 ml-1.5 font-sans">
                        {dbData?.latencyMs != null && dbData.latencyMs < 100 ? "• เร็วมาก" : ""}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical Connection Details & Table Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Connection Info */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold text-slate-900">
                      รายละเอียดการเชื่อมต่อ (Connection Specs)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">โฮสต์เซิร์ฟเวอร์ (Host Endpoint):</span>
                    <span className="font-mono text-slate-900 text-right max-w-[240px] truncate" title={dbData?.host}>
                      {dbData?.host || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">พอร์ต (Port):</span>
                    <span className="font-mono text-slate-900">{dbData?.port || "5432"}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">โหมดความปลอดภัย (SSL Mode):</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Lock className="h-3 w-3" />
                      {dbData?.sslMode || "require"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">การจัดการ Connection (Pooling):</span>
                    <span className="font-medium text-slate-800">
                      {dbData?.isPooled ? "pgBouncer Pooler (เปิดใช้งาน)" : "Direct Connection"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">ไดรเวอร์เชื่อมต่อ (ORM Engine):</span>
                    <span className="font-mono font-medium text-slate-800">Prisma Client v6 (PostgreSQL)</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500">เวลาเซิร์ฟเวอร์ฐานข้อมูล (DB Time):</span>
                    <span className="font-mono text-slate-800">
                      {dbData?.serverTime ? new Date(dbData.serverTime).toLocaleString("th-TH") : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Table Records Summary */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <CardTitle className="text-sm font-bold text-slate-900">
                      สรุปข้อมูลในฐานข้อมูล (Tables & Records)
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-slate-700">เอกสารทั้งหมด (Documents)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {dbData?.counts?.documents ?? "-"} ฉบับ
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-500" />
                      <span className="text-slate-700">รายการย่อยในบิล (Document Items)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {dbData?.counts?.documentItems ?? "-"} รายการ
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-amber-500" />
                      <span className="text-slate-700">บันทึกค่าบริการ PEA App (Monthly Fees)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {dbData?.counts?.monthlyFees ?? "-"} รายการ
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-700">ข้อมูลองค์กรและสถานี (Settings)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {dbData?.counts?.settings ?? "-"} ชุดข้อมูล
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-slate-700">บัญชีผู้ใช้ในระบบ (Users)</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {dbData?.counts?.users ?? "-"} บัญชี
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multi-Device Sync & Resilience Note */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 flex items-start gap-3 text-xs text-blue-900">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-blue-950">
                    ระบบเชื่อมต่อฐานข้อมูล Cloud ถาวร (Cross-Device Sync Ready)
                  </p>
                  <p className="leading-relaxed text-blue-800">
                    ข้อมูลทั้งหมดถูกจัดเก็บอยู่บน Neon Serverless PostgreSQL อย่างปลอดภัย
                    เมื่อคุณสร้าง แก้ไข หรือลบเอกสารจากคอมพิวเตอร์เครื่องนี้ อุปกรณ์อื่นๆ
                    (ไม่ว่าจะเป็นมือถือ แท็บเล็ต หรือคอมพิวเตอร์เครื่องอื่น)
                    จะเห็นข้อมูลอัปเดตตรงกันทันที 100% โดยไม่ต้องซิงก์ข้อมูลด้วยตนเอง
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
