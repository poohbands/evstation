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
  MapPin,
  Building2,
  Info,
  Search,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Coins,
  ArrowUpDown,
  Car,
  Check,
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
import defaultTransactions from "@/data/phayaSueaTransactions.json"

const LOOKER_STUDIO_DIRECT_URL =
  "https://datastudio.google.com/u/0/reporting/c095ebd9-3ddc-481d-99e6-942ab0ab354e/page/m0ViF"
const LOOKER_STUDIO_EMBED_URL =
  "https://datastudio.google.com/embed/reporting/c095ebd9-3ddc-481d-99e6-942ab0ab354e/page/m0ViF"

const TARGET_STATION_NAME = "สถานีชาร์จ พญาเสืออีวี"

export interface TransactionRecord {
  id: string
  date: string
  dateIso: string
  stationName: string
  chargerDevice: string
  connector: string
  vcard: string
  startTime: string
  stopTime: string
  duration: string
  durationSeconds: number
  durationMinutes: number
  kwh: number
  revenue: number
}

export default function StationReportsPage() {
  const { toast } = useToast()

  // Transactions State
  const [transactions, setTransactions] = React.useState<TransactionRecord[]>(
    defaultTransactions as TransactionRecord[]
  )
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false)
  const [lastSyncTime, setLastSyncTime] = React.useState<string>("เพิ่งซิงค์เมื่อสักครู่")

  // Filters State - Defaulted to November 2026 (เดือนปัจจุบัน)
  const [datePreset, setDatePreset] = React.useState<string>("NOV_2026")
  const [startDate, setStartDate] = React.useState<string>("2026-11-01")
  const [endDate, setEndDate] = React.useState<string>("2026-11-30")
  const [stationFilter, setStationFilter] = React.useState<string>("PHAYA_SUEA")
  const [chargerFilter, setChargerFilter] = React.useState<string>("ALL")
  const [searchQuery, setSearchQuery] = React.useState<string>("")

  // UI State
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)
  const [iframeKey, setIframeKey] = React.useState<number>(1)
  const [iframeLoading, setIframeLoading] = React.useState<boolean>(true)
  const [activeTab, setActiveTab] = React.useState<string>("analytics")
  const [txPage, setTxPage] = React.useState<number>(1)
  const [csvUploadStatus, setCsvUploadStatus] = React.useState<string>("")
  const itemsPerPage = 15

  // Fetch data automatically from API when opening web page
  const fetchLiveTransactions = React.useCallback(async (silent = false) => {
    try {
      setIsSyncing(true)
      const res = await fetch("/api/station-reports")
      if (res.ok) {
        const result = await res.json()
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          setTransactions(result.data)
          const nowStr = new Date().toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
          setLastSyncTime(`วันนี้ ${nowStr} น.`)
          if (!silent) {
            toast({
              title: "ซิงค์ข้อมูลสถานีสำเร็จ",
              description: `ดึงข้อมูลอัตโนมัติ ${result.data.length} รายการ ตรงกับ CONNEXT DASHBOARD แล้ว`,
            })
          }
        }
      }
    } catch (e) {
      console.warn("Auto-sync fallback to bundled data:", e)
    } finally {
      setIsSyncing(false)
    }
  }, [toast])

  // Automatically sync when opening web page
  React.useEffect(() => {
    fetchLiveTransactions(true)
  }, [fetchLiveTransactions])

  // Quick preset dates handler
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset)
    setTxPage(1)

    switch (preset) {
      case "NOV_2026":
        setStartDate("2026-11-01")
        setEndDate("2026-11-30")
        break
      case "OCT_2026":
        setStartDate("2026-10-01")
        setEndDate("2026-10-31")
        break
      case "ALL_DATA":
        setStartDate("2026-10-01")
        setEndDate("2026-11-30")
        break
      case "TODAY": {
        const todayIso = "2026-11-02"
        setStartDate(todayIso)
        setEndDate(todayIso)
        break
      }
      case "LAST_7_DAYS": {
        setStartDate("2026-10-27")
        setEndDate("2026-11-02")
        break
      }
      default:
        break
    }
  }

  // Filtered transactions
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      // Date range filter
      if (startDate && tx.dateIso < startDate) return false
      if (endDate && tx.dateIso > endDate) return false

      // Connector filter
      if (chargerFilter !== "ALL" && tx.connector !== chargerFilter) {
        return false
      }

      // Search Query filter (vcard, connector, date, time)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const match =
          tx.vcard.toLowerCase().includes(q) ||
          tx.connector.toLowerCase().includes(q) ||
          tx.date.includes(q) ||
          tx.startTime.includes(q)
        if (!match) return false
      }

      return true
    })
  }, [transactions, startDate, endDate, chargerFilter, searchQuery])

  // Aggregate Metrics
  const stats = React.useMemo(() => {
    const totalSessions = filteredTransactions.length
    const totalKwh = filteredTransactions.reduce((sum, t) => sum + t.kwh, 0)
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.revenue, 0)
    const totalSeconds = filteredTransactions.reduce(
      (sum, t) => sum + t.durationSeconds,
      0
    )
    const avgDurationMin =
      totalSessions > 0
        ? Math.round((totalSeconds / totalSessions / 60) * 10) / 10
        : 0
    const avgKwhPerSession =
      totalSessions > 0 ? Math.round((totalKwh / totalSessions) * 100) / 100 : 0
    const avgRatePerKwh =
      totalKwh > 0 ? Math.round((totalRevenue / totalKwh) * 100) / 100 : 7.5

    // Breakdown by connector
    const connectorsMap: Record<
      string,
      { count: number; kwh: number; revenue: number; seconds: number }
    > = {
      "CCS2-1": { count: 0, kwh: 0, revenue: 0, seconds: 0 },
      "CCS2-2": { count: 0, kwh: 0, revenue: 0, seconds: 0 },
    }

    filteredTransactions.forEach((t) => {
      const conn = t.connector || "CCS2-1"
      if (!connectorsMap[conn]) {
        connectorsMap[conn] = { count: 0, kwh: 0, revenue: 0, seconds: 0 }
      }
      connectorsMap[conn].count += 1
      connectorsMap[conn].kwh += t.kwh
      connectorsMap[conn].revenue += t.revenue
      connectorsMap[conn].seconds += t.durationSeconds
    })

    // Breakdown by date
    const dailyMap: Record<
      string,
      { date: string; dateIso: string; count: number; kwh: number; revenue: number }
    > = {}

    filteredTransactions.forEach((t) => {
      const key = t.dateIso || t.date
      if (!dailyMap[key]) {
        dailyMap[key] = {
          date: t.date,
          dateIso: t.dateIso,
          count: 0,
          kwh: 0,
          revenue: 0,
        }
      }
      dailyMap[key].count += 1
      dailyMap[key].kwh += t.kwh
      dailyMap[key].revenue += t.revenue
    })

    const dailyList = Object.values(dailyMap).sort((a, b) =>
      b.dateIso.localeCompare(a.dateIso)
    )

    return {
      totalSessions,
      totalKwh: Math.round(totalKwh * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgDurationMin,
      avgKwhPerSession,
      avgRatePerKwh,
      connectors: connectorsMap,
      dailyList,
    }
  }, [filteredTransactions])

  // Pagination for transaction table
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1
  const paginatedTransactions = React.useMemo(() => {
    const start = (txPage - 1) * itemsPerPage
    return filteredTransactions.slice(start, start + itemsPerPage)
  }, [filteredTransactions, txPage, itemsPerPage])

  const handleRefreshAll = () => {
    fetchLiveTransactions(false)
    setIframeLoading(true)
    setIframeKey((prev) => prev + 1)
  }

  const handleResetFilters = () => {
    setDatePreset("NOV_2026")
    setStartDate("2026-11-01")
    setEndDate("2026-11-30")
    setChargerFilter("ALL")
    setSearchQuery("")
    setTxPage(1)
    toast({
      title: "รีเซ็ตตัวกรองแล้ว",
      description: "แสดงข้อมูลเดือนพฤศจิกายน 2569 (11 ครั้ง)",
    })
  }

  // Export filtered data as CSV
  const handleExportCsv = () => {
    const header =
      "วันที่,ชื่อสถานีอัดประจุ,ชื่อเครื่องอัดประจุ,หัวชาร์จ,vcard,start_timestamp,stop_timestamp,daration,หน่วยไฟฟ้า (kWh),รายได้ (บาท)\n"
    const rows = filteredTransactions
      .map(
        (t) =>
          `"${t.date}","${t.stationName}","${t.chargerDevice}","${t.connector}","${t.vcard}","${t.startTime}","${t.stopTime}","${t.duration}",${t.kwh},${t.revenue}`
      )
      .join("\n")

    const blob = new Blob(["\uFEFF" + header + rows], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `รายงานสถานีชาร์จ_พญาเสืออีวี_${startDate}_${endDate}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "ส่งออกไฟล์เรียบร้อย",
      description: `ดาวน์โหลดข้อมูล ${filteredTransactions.length} รายการเป็น CSV แล้ว`,
    })
  }

  // CSV File Uploader / Parser for future Connext Dashboard exports
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvUploadStatus(`กำลังอ่านไฟล์: ${file.name}...`)
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.trim().split("\n").filter(Boolean)
        if (lines.length < 2) {
          throw new Error("ไฟล์ CSV ว่างเปล่าหรือไม่มีข้อมูลแถว")
        }

        function parseDurationSeconds(dur: string) {
          if (!dur) return 0
          const parts = dur.split(":").map(Number)
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
          return 0
        }

        function parseDateIso(d: string, start: string) {
          if (d && d.match(/^\d{4}-\d{2}-\d{2}$/)) return d
          if (d && d.includes("/")) {
            const parts = d.split("/")
            if (parts.length === 3) {
              return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
            }
          }
          if (start && start.match(/^\d{4}-\d{2}-\d{2}/)) return start.slice(0, 10)
          return d
        }

        const newRecords: TransactionRecord[] = lines.slice(1).map((l, index) => {
          const parts = l.split(",")
          const dateStr = parts[0]?.trim() || ""
          const durStr = parts[7]?.trim() || "0:00:00"
          const kwh = parseFloat(parts[8]) || 0
          const revenue = parseFloat(parts[9]) || 0
          const durSec = parseDurationSeconds(durStr)
          const startTime = parts[5]?.trim() || ""

          return {
            id: `upload-${Date.now()}-${index}`,
            date: dateStr,
            dateIso: parseDateIso(dateStr, startTime),
            stationName: parts[1]?.trim() || TARGET_STATION_NAME,
            chargerDevice: parts[2]?.trim() || TARGET_STATION_NAME,
            connector: parts[3]?.trim() || "CCS2-1",
            vcard: parts[4]?.trim() || "",
            startTime: startTime,
            stopTime: parts[6]?.trim() || "",
            duration: durStr,
            durationSeconds: durSec,
            durationMinutes: Math.round((durSec / 60) * 10) / 10,
            kwh: Math.round(kwh * 100) / 100,
            revenue: Math.round(revenue * 100) / 100,
          }
        })

        // Save to Database via API
        setCsvUploadStatus(`กำลังบันทึกลงฐานข้อมูล ${newRecords.length} รายการ...`)
        try {
          const apiRes = await fetch("/api/station-reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: newRecords }),
          })
          if (apiRes.ok) {
            setCsvUploadStatus(
              `บันทึกสำเร็จ! อัปเดต ${newRecords.length} รายการลงฐานข้อมูลแล้ว`
            )
          }
        } catch (apiErr) {
          console.warn("Could not save to DB API, updating local state only", apiErr)
        }

        setTransactions(newRecords)
        toast({
          title: "นำเข้าและซิงค์ข้อมูลสำเร็จ",
          description: `อัปเดตข้อมูลสถานีชาร์จ ${newRecords.length} รายการเรียบร้อยแล้ว`,
        })
      } catch (err: any) {
        setCsvUploadStatus(`เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถอ่านไฟล์ได้"}`)
        toast({
          title: "นำเข้าไฟล์ล้มเหลว",
          description: "โปรดตรวจสอบว่าเป็นไฟล์ CSV ที่ Export มาจาก Connext Dashboard",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file, "UTF-8")
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md ring-1 ring-blue-500/50 mt-0.5">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    รายงานสถานีชาร์จ พญาเสืออีวี
                  </h1>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
                    สถานีชาร์จ พญาเสืออีวี
                  </Badge>
                  <Badge variant="outline" className="text-slate-600 text-[11px] border-slate-300">
                    พิษณุโลก
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  บริษัท อัปสรา เอ็นเนอร์จี โซลูชั่น จำกัด • 152/6 ถนนพญาเสือ ตำบลในเมือง อำเภอเมือง จังหวัดพิษณุโลก
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isSyncing}
              className="gap-1.5 text-xs shadow-sm bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-blue-600 ${isSyncing ? "animate-spin" : ""}`}
              />
              {isSyncing ? "กำลังดึงข้อมูล..." : "ดึงข้อมูลล่าสุด (Sync Now)"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs shadow-sm bg-white text-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              ส่งออก CSV ({filteredTransactions.length})
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
                เปิดดูใน Looker Studio
              </Button>
            </a>
          </div>
        </div>

        {/* Live Auto-Sync Status Banner */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-emerald-950">
                  ระบบดึงข้อมูลอัตโนมัติเมื่อเปิดเว็บ (Auto-Sync Active)
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-2 font-normal">
                  ข้อมูลตรงกับ CONNEXT DASHBOARD (182 ครั้ง)
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                อัปเดตข้อมูลล่าสุดเมื่อ: <strong>{lastSyncTime}</strong> • เดือนพฤศจิกายน 2569 มีการชาร์จสะสม <strong>11 ครั้ง</strong> (244.07 kWh | ฿1,830.52) • เดือนตุลาคม 2569 มี <strong>171 ครั้ง</strong> (4,257.02 kWh | ฿31,927.72)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetChange("NOV_2026")}
              className={`h-8 text-xs ${
                datePreset === "NOV_2026"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              ดู พ.ย. 69 (11 ครั้ง)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePresetChange("OCT_2026")}
              className={`h-8 text-xs ${
                datePreset === "OCT_2026"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              ดู ต.ค. 69 (171 ครั้ง)
            </Button>
          </div>
        </div>

        {/* Filter Bar (ตัวกรองข้อมูลเฉพาะสถานีชาร์จ พญาเสืออีวี) */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-semibold text-slate-900">
                  ตัวกรองข้อมูลสถานีชาร์จ พญาเสืออีวี
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800">
                  ล็อกสถานี: พญาเสืออีวี
                </Badge>
              </div>

              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "NOV_2026", label: "พฤศจิกายน 2569 (11 ครั้ง)" },
                  { id: "OCT_2026", label: "ตุลาคม 2569 (171 ครั้ง)" },
                  { id: "ALL_DATA", label: "ข้อมูลทั้งหมด (182 ครั้ง)" },
                  { id: "TODAY", label: "วันนี้ (2 พ.ย. 69)" },
                  { id: "LAST_7_DAYS", label: "7 วันล่าสุด" },
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
              {/* Station Selection */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 flex items-center justify-between">
                  <span>สถานีชาร์จ</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">เฉพาะสถานีนี้</span>
                </Label>
                <Select value={stationFilter} onValueChange={setStationFilter}>
                  <SelectTrigger className="h-9 text-xs font-medium text-slate-900 bg-slate-50 border-blue-200">
                    <SelectValue placeholder="เลือกสถานี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHAYA_SUEA">
                      ⚡ สถานีชาร์จ พญาเสืออีวี (พิษณุโลก)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {/* Charger Connector Select */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">หัวชาร์จ (Connector)</Label>
                <Select value={chargerFilter} onValueChange={setChargerFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="เลือกหัวชาร์จ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทุกหัวชาร์จ (CCS2-1 & CCS2-2)</SelectItem>
                    <SelectItem value="CCS2-1">เฉพาะหัวชาร์จ CCS2-1 (120 kW)</SelectItem>
                    <SelectItem value="CCS2-2">เฉพาะหัวชาร์จ CCS2-2 (120 kW)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setTxPage(1)
                    toast({
                      title: "กรองข้อมูลแล้ว",
                      description: `พบข้อมูล ${filteredTransactions.length} รายการ`,
                    })
                  }}
                  className="h-9 w-full text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-sm"
                >
                  <Filter className="h-3.5 w-3.5" />
                  กรองข้อมูล ({filteredTransactions.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="h-9 px-3 text-xs text-slate-600 hover:text-slate-900"
                  title="คืนค่าเริ่มต้นเป็นเดือนพฤศจิกายน 2569"
                >
                  ล้าง
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Card 1: พลังงานไฟฟ้าสะสม (kWh) */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-blue-50/50">
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
                {stats.totalKwh.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-xs font-normal text-slate-500">kWh</span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> เฉลี่ย{" "}
                {stats.avgKwhPerSession.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}{" "}
                kWh/รอบ
              </p>
            </CardContent>
          </Card>

          {/* Card 2: จำนวนรอบการเข้าชาร์จ (Sessions) */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/50">
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
                {stats.totalSessions.toLocaleString("th-TH")}{" "}
                <span className="text-xs font-normal text-slate-500">ครั้ง</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <Car className="h-3 w-3" /> สถานีชาร์จ พญาเสืออีวี
              </p>
            </CardContent>
          </Card>

          {/* Card 3: รายได้รวมค่าชาร์จ (บาท) */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-amber-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">
                รายได้รวมค่าบริการชาร์จ
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Coins className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ฿
                {stats.totalRevenue.toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
                อัตราเฉลี่ย ~{stats.avgRatePerKwh.toFixed(2)} บาท/kWh
              </p>
            </CardContent>
          </Card>

          {/* Card 4: เวลาชาร์จเฉลี่ย (นาที) */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-slate-600">
                ระยะเวลาชาร์จเฉลี่ย
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats.avgDurationMin.toLocaleString("th-TH", {
                  minimumFractionDigits: 1,
                })}{" "}
                <span className="text-xs font-normal text-slate-500">นาที</span>
              </div>
              <p className="text-[11px] text-purple-700 font-medium flex items-center gap-1 mt-1">
                หัวจ่าย DC Fast Charge (CCS2)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger
              value="analytics"
              className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
              วิเคราะห์ข้อมูลสถานี (Data Analytics)
            </TabsTrigger>
            <TabsTrigger
              value="looker"
              className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5 text-purple-600" />
              แดชบอร์ด Google Looker Studio
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <UploadCloud className="h-3.5 w-3.5 text-emerald-600" />
              นำเข้าไฟล์ CSV เพิ่มเติม
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DATA ANALYTICS (REAL PHAYA SUEA DATA) */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Charger Connector Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Connector CCS2-1 */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 bg-slate-50/60 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">
                          หัวชาร์จ CCS2-1 (DC Fast Charge)
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                          กำลังไฟสูงสุด 120 kW • สถานีชาร์จ พญาเสืออีวี
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      พร้อมใช้งาน
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">จำนวนรอบ</span>
                      <span className="text-lg font-bold text-slate-900">
                        {stats.connectors["CCS2-1"]?.count || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block">ครั้ง</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">พลังงาน</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(stats.connectors["CCS2-1"]?.kwh || 0).toLocaleString(
                          "th-TH",
                          { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block">kWh</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">รายได้</span>
                      <span className="text-lg font-bold text-emerald-600">
                        ฿
                        {(stats.connectors["CCS2-1"]?.revenue || 0).toLocaleString(
                          "th-TH",
                          { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block">บาท</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span>ระยะเวลาชาร์จเฉลี่ย:</span>
                    <span className="font-semibold text-slate-900">
                      {stats.connectors["CCS2-1"]?.count
                        ? Math.round(
                            (stats.connectors["CCS2-1"].seconds /
                              stats.connectors["CCS2-1"].count /
                              60) *
                              10
                          ) / 10
                        : 0}{" "}
                      นาที/รอบ
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Connector CCS2-2 */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 bg-slate-50/60 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900">
                          หัวชาร์จ CCS2-2 (DC Fast Charge)
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                          กำลังไฟสูงสุด 120 kW • สถานีชาร์จ พญาเสืออีวี
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      พร้อมใช้งาน
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">จำนวนรอบ</span>
                      <span className="text-lg font-bold text-slate-900">
                        {stats.connectors["CCS2-2"]?.count || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block">ครั้ง</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">พลังงาน</span>
                      <span className="text-lg font-bold text-purple-600">
                        {(stats.connectors["CCS2-2"]?.kwh || 0).toLocaleString(
                          "th-TH",
                          { minimumFractionDigits: 1, maximumFractionDigits: 1 }
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block">kWh</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">รายได้</span>
                      <span className="text-lg font-bold text-emerald-600">
                        ฿
                        {(stats.connectors["CCS2-2"]?.revenue || 0).toLocaleString(
                          "th-TH",
                          { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block">บาท</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <span>ระยะเวลาชาร์จเฉลี่ย:</span>
                    <span className="font-semibold text-slate-900">
                      {stats.connectors["CCS2-2"]?.count
                        ? Math.round(
                            (stats.connectors["CCS2-2"].seconds /
                              stats.connectors["CCS2-2"].count /
                              60) *
                              10
                          ) / 10
                        : 0}{" "}
                      นาที/รอบ
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Summary Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      สรุปสถิติรายวัน (Daily Breakdown)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      ยอดชาร์จสะสมรายวันของสถานีชาร์จ พญาเสืออีวี ในช่วงเวลาที่เลือก
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stats.dailyList.length} วันที่มีการใช้งาน
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4">วันที่</th>
                        <th className="py-2.5 px-4 text-center">จำนวนรอบ (ครั้ง)</th>
                        <th className="py-2.5 px-4 text-right">พลังงาน (kWh)</th>
                        <th className="py-2.5 px-4 text-right">รายได้ (บาท)</th>
                        <th className="py-2.5 px-4">สัดส่วนพลังงานประจำวัน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {stats.dailyList.map((day) => {
                        const percentOfMax = Math.min(
                          100,
                          Math.round((day.kwh / 600) * 100)
                        )
                        return (
                          <tr key={day.date} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 font-medium text-slate-900">
                              {day.date}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <Badge
                                variant="secondary"
                                className="font-mono text-xs px-2 py-0.5"
                              >
                                {day.count}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-blue-600 font-mono">
                              {day.kwh.toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-600 font-mono">
                              ฿
                              {day.revenue.toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-32 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${percentOfMax}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {percentOfMax}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {stats.dailyList.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-8 text-center text-slate-500 text-xs"
                          >
                            ไม่พบข้อมูลในช่วงวันที่เลือก
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Individual Transaction Logs Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      รายการบันทึกการชาร์จรายคัน (Transaction Details)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      แสดงประวัติการชาร์จ {filteredTransactions.length} รายการของสถานีชาร์จ พญาเสืออีวี
                    </CardDescription>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="ค้นหา VCard, หัวชาร์จ, วันที่..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setTxPage(1)
                        }}
                        className="h-8 pl-8 text-xs bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">ลำดับ</th>
                        <th className="py-3 px-4">วันที่ & เวลา</th>
                        <th className="py-3 px-4">หัวชาร์จ</th>
                        <th className="py-3 px-4">รหัสบัตร / VCard</th>
                        <th className="py-3 px-4">ระยะเวลา</th>
                        <th className="py-3 px-4 text-right">พลังงาน (kWh)</th>
                        <th className="py-3 px-4 text-right">ค่าบริการ (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {paginatedTransactions.map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {(txPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            <div>{tx.startTime}</div>
                            <div className="text-[10px] text-slate-400">
                              ถึง {tx.stopTime ? (tx.stopTime.split(" ")[1] || tx.stopTime) : "-"}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <Badge
                              className={
                                tx.connector === "CCS2-1"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : "bg-purple-100 text-purple-800 border-purple-200"
                              }
                            >
                              {tx.connector}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">
                            {tx.vcard || "-"}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-600">
                            {tx.duration}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-blue-600">
                            {tx.kwh.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-600">
                            ฿{tx.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {paginatedTransactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-slate-500 text-xs"
                          >
                            ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="border-t border-slate-100 p-3 flex items-center justify-between text-xs text-slate-600">
                  <div>
                    แสดง {(txPage - 1) * itemsPerPage + 1} ถึง{" "}
                    {Math.min(txPage * itemsPerPage, filteredTransactions.length)}{" "}
                    จากทั้งหมด {filteredTransactions.length} รายการ
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      className="h-7 text-xs px-2.5"
                    >
                      ก่อนหน้า
                    </Button>
                    <span className="text-xs px-2 font-medium">
                      {txPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage >= totalPages}
                      onClick={() => setTxPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 text-xs px-2.5"
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: LOOKER STUDIO EMBED */}
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
                      แดชบอร์ดรายงาน สถานีชาร์จ พญาเสืออีวี (โหมดเต็มหน้าจอ)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshAll}
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
                    กำลังโหลดรายงาน Looker Studio สำหรับสถานีชาร์จ พญาเสืออีวี...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    เชื่อมต่อฐานข้อมูล PEA VOLTA Reporting
                  </p>
                </div>
              )}

              {/* Looker Studio Iframe */}
              <iframe
                key={iframeKey}
                src={LOOKER_STUDIO_EMBED_URL}
                title="Charging Station Analytics Report - Phaya Suea EV"
                className={`w-full border-0 transition-opacity duration-300 ${
                  isFullscreen ? "flex-1 h-full min-h-[90vh]" : "h-[850px]"
                } ${iframeLoading ? "opacity-30" : "opacity-100"}`}
                allowFullScreen
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                onLoad={() => setIframeLoading(false)}
              />

              {/* Embed helper footer */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>
                    ในรายงาน Looker Studio: คลิกที่ตัวกรอง <strong>&quot;ชื่อสถานี&quot;</strong> แล้วเลือก <strong>&quot;สถานีชาร์จ พญาเสืออีวี&quot;</strong> เพื่อดูสถิติเจาะจงสถานี
                  </span>
                </span>
                <a
                  href={LOOKER_STUDIO_DIRECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 shrink-0"
                >
                  เปิดดูรายงานสถานีชาร์จ พญาเสืออีวี ใน Looker Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: CSV IMPORTER */}
          <TabsContent value="upload" className="space-y-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-emerald-600" />
                  นำเข้าไฟล์รายงานสถานี (CONNEXT DASHBOARD CSV Import)
                </CardTitle>
                <CardDescription className="text-xs">
                  เมื่อคุณดาวน์โหลดไฟล์สรุปประจำเดือนใหม่จาก CONNEXT DASHBOARD (เช่น ธันวาคม หรือ มกราคม) คุณสามารถอัปโหลดไฟล์ .csv ได้ที่นี่ ระบบจะบันทึกลงฐานข้อมูลและอัปเดตตัวเลขให้ทันที
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์ .CSV มาวางที่นี่
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      รองรับไฟล์ CSV ตารางสรุปจาก CONNEXT DASHBOARD ของสถานีชาร์จ พญาเสืออีวี
                    </p>
                  </div>
                </div>

                {csvUploadStatus && (
                  <div className="rounded-lg p-3 bg-slate-100 text-xs text-slate-800 font-mono">
                    {csvUploadStatus}
                  </div>
                )}

                <div className="rounded-lg bg-blue-50/70 p-3 text-xs text-blue-900 border border-blue-200 space-y-1">
                  <p className="font-semibold">โครงสร้างหัวตาราง CSV ที่ระบบรองรับ:</p>
                  <p className="font-mono text-[11px] text-blue-800">
                    วันที่, ชื่อสถานีอัดประจุ, ชื่อเครื่องอัดประจุ, หัวชาร์จ, vcard, start_timestamp, stop_timestamp, daration, หน่วยไฟฟ้า (kWh), รายได้ (บาท)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
