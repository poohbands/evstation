"use client"

import * as React from "react"
import {
  BarChart3,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Calendar,
  Filter,
  Zap,
  Clock,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

const LOOKER_STUDIO_DIRECT_URL =
  "https://datastudio.google.com/u/0/reporting/c095ebd9-3ddc-481d-99e6-942ab0ab354e/page/m0ViF"
const LOOKER_STUDIO_EMBED_URL =
  "https://datastudio.google.com/embed/reporting/c095ebd9-3ddc-481d-99e6-942ab0ab354e/page/m0ViF"

export default function StationReportsPage() {
  const { toast } = useToast()

  // Filters State
  const [datePreset, setDatePreset] = React.useState<string>("THIS_MONTH")
  const [startDate, setStartDate] = React.useState<string>("2026-10-01")
  const [endDate, setEndDate] = React.useState<string>("2026-10-31")
  const [stationFilter, setStationFilter] = React.useState<string>("ALL")
  const [chargerFilter, setChargerFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  // UI State
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)
  const [iframeKey, setIframeKey] = React.useState<number>(1)
  const [iframeLoading, setIframeLoading] = React.useState<boolean>(true)
  const [activeTab, setActiveTab] = React.useState<string>("looker")

  // Quick preset dates handler
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset)
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const d = String(today.getDate()).padStart(2, "0")

    switch (preset) {
      case "TODAY":
        setStartDate(`${y}-${m}-${d}`)
        setEndDate(`${y}-${m}-${d}`)
        break
      case "LAST_7_DAYS": {
        const past = new Date(today.getTime() - 7 * 86400000)
        setStartDate(past.toISOString().slice(0, 10))
        setEndDate(`${y}-${m}-${d}`)
        break
      }
      case "LAST_30_DAYS": {
        const past = new Date(today.getTime() - 30 * 86400000)
        setStartDate(past.toISOString().slice(0, 10))
        setEndDate(`${y}-${m}-${d}`)
        break
      }
      case "THIS_MONTH":
        setStartDate(`${y}-${m}-01`)
        setEndDate(`${y}-${m}-${d}`)
        break
      case "LAST_MONTH": {
        const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth()
        const prevYear = today.getMonth() === 0 ? y - 1 : y
        const pmStr = String(prevMonth).padStart(2, "0")
        const lastDay = new Date(prevYear, prevMonth, 0).getDate()
        setStartDate(`${prevYear}-${pmStr}-01`)
        setEndDate(`${prevYear}-${pmStr}-${lastDay}`)
        break
      }
      case "THIS_YEAR":
        setStartDate(`${y}-01-01`)
        setEndDate(`${y}-12-31`)
        break
      default:
        break
    }
  }

  const handleRefreshIframe = () => {
    setIframeLoading(true)
    setIframeKey((prev) => prev + 1)
    toast({
      title: "กำลังรีเฟรชข้อมูลรายงาน...",
      description: "กำลังโหลดรายงาน Looker Studio ล่าสุดจากเซิร์ฟเวอร์",
    })
  }

  const handleResetFilters = () => {
    setDatePreset("THIS_MONTH")
    handlePresetChange("THIS_MONTH")
    setStationFilter("ALL")
    setChargerFilter("ALL")
    setStatusFilter("ALL")
    toast({
      title: "ล้างตัวกรองแล้ว",
      description: "คืนค่าตัวกรองข้อมูลเป็นค่าเริ่มต้นรอบเดือนปัจจุบัน",
    })
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md ring-1 ring-blue-500/50">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    รายงานสถานีชาร์จ (Station Reports & Dashboard)
                  </h1>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
                    Live Analytics
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  ระบบรายงานวิเคราะห์สถิติการใช้งานสถานีชาร์จ ข้อมูลพลังงานไฟฟ้า และแดชบอร์ดสรุปผลแบบอินเทอร์แอคทีฟ
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshIframe}
              className="gap-1.5 text-xs shadow-sm bg-white"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
              รีเฟรชรายงาน
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-1.5 text-xs shadow-sm bg-white"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-slate-600" />
                  ย่อขนาด
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                  เต็มหน้าจอ
                </>
              )}
            </Button>

            <a
              href={LOOKER_STUDIO_DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                เปิดใน Looker Studio
              </Button>
            </a>
          </div>
        </div>

        {/* Filter Bar (ตัวกรองข้อมูล) */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  ตัวกรองข้อมูลสถานีชาร์จ (Report Filters)
                </CardTitle>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "TODAY", label: "วันนี้" },
                  { id: "LAST_7_DAYS", label: "7 วันล่าสุด" },
                  { id: "THIS_MONTH", label: "เดือนนี้" },
                  { id: "LAST_MONTH", label: "เดือนก่อน" },
                  { id: "THIS_YEAR", label: "ทั้งปี 2569" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      datePreset === preset.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
              {/* Start Date */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  วันที่เริ่มต้น
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setDatePreset("CUSTOM")
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  วันที่สิ้นสุด
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setDatePreset("CUSTOM")
                  }}
                  className="h-9 text-xs"
                />
              </div>

              {/* Station Select */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">สถานีชาร์จ</Label>
                <Select value={stationFilter} onValueChange={setStationFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="เลือกสถานี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทุกสถานี (ทั้งหมด)</SelectItem>
                    <SelectItem value="KLONG_LUANG">สถานีชาร์จ กรีนชาร์จ คลองหลวง</SelectItem>
                    <SelectItem value="PEA_HQ">สถานีชาร์จ กฟภ. สำนักงานใหญ่</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Charger Type Select */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">ประเภทหัวชาร์จ</Label>
                <Select value={chargerFilter} onValueChange={setChargerFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="เลือกประเภทหัวชาร์จ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทุกประเภทหัวชาร์จ</SelectItem>
                    <SelectItem value="DC_120">DC Fast Charge (CCS2 120 kW)</SelectItem>
                    <SelectItem value="DC_60">DC Fast Charge (CHAdeMO 60 kW)</SelectItem>
                    <SelectItem value="AC_22">AC Normal Charge (Type 2 22 kW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Button */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleRefreshIframe}
                  className="h-9 w-full text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <Filter className="h-3.5 w-3.5" />
                  กรองข้อมูล
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-9 px-3 text-xs text-slate-600 hover:text-slate-900"
                  title="คืนค่าตัวกรองเริ่มต้น"
                >
                  ล้าง
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Summary Overview (แดชบอร์ดสรุปผล) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">
                พลังงานจ่ายสะสม (Energy)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                18,450.50 <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +12.4% จากรอบเดือนที่ผ่านมา
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">
                รอบการเข้าชาร์จ (Sessions)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                642 <span className="text-xs font-normal text-slate-500">ครั้ง</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                เฉลี่ยประมาณ 21 คัน / วัน
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-purple-50/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">
                เวลาชาร์จเฉลี่ย (Avg Time)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                36.8 <span className="text-xs font-normal text-slate-500">นาที</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                กำลังชาร์จเฉลี่ย 48.5 kW
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-amber-50/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">
                สถานะหัวจ่าย (Uptime)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                99.8% <span className="text-xs font-normal text-slate-500">พร้อมใช้งาน</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                หัวจ่ายออนไลน์ 4/4 หัว
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="looker" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              แดชบอร์ด Google Looker Studio
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Layers className="h-3.5 w-3.5" />
              สรุปข้อมูลหัวจ่ายและสถิติย่อย
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Looker Studio Embed */}
          <TabsContent value="looker" className="space-y-3">
            <div
              className={`relative rounded-xl border border-slate-200 bg-white shadow-md transition-all overflow-hidden ${
                isFullscreen
                  ? "fixed inset-2 z-50 flex flex-col bg-white p-2 shadow-2xl"
                  : ""
              }`}
            >
              {/* Header Bar inside fullscreen mode */}
              {isFullscreen && (
                <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-t-lg mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold">
                      แดชบอร์ดรายงานสถานีชาร์จ (โหมดเต็มหน้าจอ)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshIframe}
                      className="h-7 text-xs text-white hover:bg-slate-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" /> รีเฟรช
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsFullscreen(false)}
                      className="h-7 text-xs"
                    >
                      <Minimize2 className="h-3.5 w-3.5 mr-1" /> ออกจากเต็มหน้าจอ
                    </Button>
                  </div>
                </div>
              )}

              {/* Iframe Loading Overlay */}
              {iframeLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-3 animate-pulse">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    กำลังโหลดแดชบอร์ดรายงาน Looker Studio...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    เชื่อมต่อข้อมูลสดจาก Google Data Studio
                  </p>
                </div>
              )}

              {/* Looker Studio Iframe */}
              <iframe
                key={iframeKey}
                src={LOOKER_STUDIO_EMBED_URL}
                title="Charging Station Analytics Report"
                className={`w-full border-0 transition-opacity duration-300 ${
                  isFullscreen ? "flex-1 h-full min-h-[90vh]" : "h-[850px]"
                } ${iframeLoading ? "opacity-30" : "opacity-100"}`}
                allowFullScreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => setIframeLoading(false)}
              />

              {/* Embed helper footer */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  หากเบราว์เซอร์บล็อกคุกกี้บุคคลที่สาม (Third-party Cookies) ทำให้รายงานไม่แสดงผล
                </span>
                <a
                  href={LOOKER_STUDIO_DIRECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                >
                  คลิกที่นี่เพื่อเปิดดูรายงานโดยตรงบน Google Looker Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Additional Charger Statistics Table */}
          <TabsContent value="details" className="space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900">
                  สถิติการใช้งานแยกตามจุดชาร์จ (Charger Point Breakdown)
                </CardTitle>
                <CardDescription className="text-xs">
                  รายละเอียดข้อมูลทางเทคนิค พลังงานที่จ่าย และประสิทธิภาพการทำงานของแต่ละหัวชาร์จ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">รหัสหัวชาร์จ</th>
                        <th className="py-3 px-4">ประเภทหัวชาร์จ</th>
                        <th className="py-3 px-4">กำลังไฟสูงสุด</th>
                        <th className="py-3 px-4">พลังงานจ่ายสะสม</th>
                        <th className="py-3 px-4">จำนวนรอบชาร์จ</th>
                        <th className="py-3 px-4">สถานะปัจจุบัน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">EV-DC-01A</td>
                        <td className="py-3 px-4 font-medium">CCS2 (DC Fast Charge)</td>
                        <td className="py-3 px-4">120 kW</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">8,240.20 kWh</td>
                        <td className="py-3 px-4">284 ครั้ง</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                            พร้อมใช้งาน (Available)
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">EV-DC-01B</td>
                        <td className="py-3 px-4 font-medium">CCS2 (DC Fast Charge)</td>
                        <td className="py-3 px-4">120 kW</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">6,110.80 kWh</td>
                        <td className="py-3 px-4">218 ครั้ง</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                            กำลังชาร์จ (Charging)
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">EV-DC-02A</td>
                        <td className="py-3 px-4 font-medium">CHAdeMO (DC Fast Charge)</td>
                        <td className="py-3 px-4">60 kW</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">2,350.00 kWh</td>
                        <td className="py-3 px-4">76 ครั้ง</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                            พร้อมใช้งาน (Available)
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">EV-AC-01</td>
                        <td className="py-3 px-4 font-medium">Type 2 (AC Normal Charge)</td>
                        <td className="py-3 px-4">22 kW</td>
                        <td className="py-3 px-4 font-semibold text-blue-600">1,749.50 kWh</td>
                        <td className="py-3 px-4">64 ครั้ง</td>
                        <td className="py-3 px-4">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                            พร้อมใช้งาน (Available)
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
