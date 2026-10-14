"use client"

import * as React from "react"
import Link from "next/link"
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Save,
  RefreshCw,
  Eye,
  Shield,
  Zap,
  LogIn,
  Sliders,
  ExternalLink,
} from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/AuthContext"

export default function MaintenancePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Maintenance Settings State
  const [isMaintenanceMode, setIsMaintenanceMode] = React.useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = React.useState(
    "ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดระบบและปรับปรุงประสิทธิภาพ กรุณากลับมาใหม่อีกครั้งในภายหลัง"
  )
  const [maintenanceUntil, setMaintenanceUntil] = React.useState("เวลา 18:00 น.")
  const [previewMode, setPreviewMode] = React.useState(false)

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setIsMaintenanceMode(Boolean(data.isMaintenanceMode))
        if (data.maintenanceMessage) setMaintenanceMessage(data.maintenanceMessage)
        if (data.maintenanceUntil) setMaintenanceUntil(data.maintenanceUntil)
      }
    } catch (err) {
      console.error("Failed to load maintenance settings:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async (quickToggle?: boolean, directState?: boolean) => {
    try {
      setSaving(true)
      const nextMode = quickToggle !== undefined ? directState : isMaintenanceMode

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isMaintenanceMode: nextMode,
          maintenanceMessage,
          maintenanceUntil,
        }),
      })

      if (!res.ok) throw new Error("บันทึกการตั้งค่าไม่สำเร็จ")

      if (quickToggle !== undefined && directState !== undefined) {
        setIsMaintenanceMode(directState)
      }

      toast({
        title: nextMode ? "เปิดโหมดปรับปรุงระบบแล้ว (Maintenance ON)" : "ปิดโหมดปรับปรุงแล้ว (System Online)",
        description: nextMode
          ? "ขณะนี้ผู้ใช้งานทั่วไปจะไม่สามารถเข้าใช้งานระบบได้ ยกเว้นผู้ดูแลระบบ (ADMIN)"
          : "ระบบเปิดให้บริการแก่ผู้ใช้งานทุกคนตามปกติแล้ว",
      })

      // Dispatch storage event / notify
      window.dispatchEvent(new Event("maintenance-changed"))
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

  // If visitor or non-admin arrives at /maintenance while maintenance is OFF
  if (!isAdmin && !isMaintenanceMode) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-12 text-center space-y-4 font-prompt">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ระบบเปิดให้บริการตามปกติ</h1>
          <p className="text-sm text-slate-500">
            ขณะนี้ระบบไม่ได้อยู่ในโหมดปิดปรับปรุง สามารถเข้าใช้งานฟังก์ชันต่างๆ ได้ตามปกติ
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                กลับสู่หน้าแดชบอร์ด
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 pb-16 font-prompt">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Wrench className="h-7 w-7 text-amber-600" />
              <span>จัดการโหมดปิดปรับปรุงระบบ (Maintenance Mode)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ควบคุมการเปิด/ปิดการเข้าถึงระบบชั่วคราว เพื่ออัปเกรดระบบ ฐานข้อมูล หรือซ่อมบำรุง
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="gap-1.5 text-xs"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              {previewMode ? "กลับหน้าตั้งค่า" : "ดูตัวอย่างหน้าจอผู้ใช้"}
            </Button>
          </div>
        </div>

        {/* Live Status Hero Banner */}
        <div
          className={`rounded-xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm ${
            isMaintenanceMode
              ? "border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50"
              : "border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl shadow-sm ${
                isMaintenanceMode ? "bg-amber-600 text-white animate-pulse" : "bg-emerald-600 text-white"
              }`}
            >
              {isMaintenanceMode ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {isMaintenanceMode ? "ระบบกำลังอยู่ในโหมดปิดปรับปรุง (Maintenance Active)" : "ระบบเปิดให้บริการตามปกติ (Online)"}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isMaintenanceMode ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"
                  }`}
                >
                  {isMaintenanceMode ? "ปิดปรับปรุง" : "ออนไลน์"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isMaintenanceMode
                  ? "ผู้ใช้งานทั่วไปและผู้เยี่ยมชมจะไม่สามารถเข้าถึงหน้าใดๆ ได้ ยกเว้นผู้ดูแลระบบ (ADMIN)"
                  : "ผู้ใช้งานทุกคนสามารถเข้าถึงแดชบอร์ด ออกเอกสาร และใช้งานได้ตามปกติ"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-slate-700">
              {isMaintenanceMode ? "เปิดอยู่" : "ปิดอยู่"}
            </span>
            <Switch
              checked={isMaintenanceMode}
              onCheckedChange={(checked) => handleSave(true, checked)}
              disabled={saving}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </div>

        {/* Live Preview Screen */}
        {previewMode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-blue-600" />
                ตัวอย่างหน้าจอที่ผู้ใช้งานทั่วไปจะมองเห็น (User Preview):
              </span>
              <Button size="sm" variant="ghost" onClick={() => setPreviewMode(false)} className="h-7 text-xs">
                ปิดการดูตัวอย่าง
              </Button>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-amber-300 p-8 md:p-12 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl text-center space-y-6">
              <div className="inline-flex p-4 rounded-2xl bg-amber-500/20 text-amber-400 ring-2 ring-amber-400/30">
                <Wrench className="h-10 w-10 animate-bounce" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                  โหมดปิดปรับปรุงระบบชั่วคราว
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  ระบบกำลังปิดปรับปรุงชั่วคราว
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {maintenanceMessage || "ระบบอยู่ระหว่างปิดปรับปรุงชั่วคราวเพื่ออัปเกรดระบบและเพิ่มประสิทธิภาพ"}
                </p>
              </div>

              {maintenanceUntil && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-mono">
                  <Clock className="h-4 w-4" />
                  <span>คาดว่าจะเปิดให้บริการ: <strong>{maintenanceUntil}</strong></span>
                </div>
              )}

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  รีเฟรชหน้าเว็บ
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  เข้าสู่ระบบสำหรับ Admin
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Maintenance Settings Form */
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-slate-700" />
                <span>ตั้งค่ารายละเอียดการปิดปรับปรุง</span>
              </CardTitle>
              <CardDescription className="text-xs">
                ข้อความและเวลาที่ระบุในส่วนนี้จะแสดงให้ผู้ใช้งานและผู้เยี่ยมชมเห็นในหน้าจอแจ้งเตือน
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="mMessage" className="text-xs font-semibold text-slate-800">
                  ข้อความแจ้งเตือนผู้ใช้งาน (Maintenance Announcement) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="mMessage"
                  rows={4}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="เช่น ระบบกำลังปิดปรับปรุงชั่วคราวเพื่อปรับปรุงระบบบัญชี กรุณากลับมาใหม่อีกครั้ง..."
                  className="text-xs leading-relaxed"
                  required
                />
                <span className="text-[11px] text-slate-400 block">
                  * ข้อความนี้จะปรากฏเด่นชัดอยู่กลางหน้าจอของผู้ใช้งานทั่วไป
                </span>
              </div>

              {/* Time Until Input */}
              <div className="space-y-2">
                <Label htmlFor="mUntil" className="text-xs font-semibold text-slate-800">
                  เวลาที่คาดว่าจะเปิดให้บริการ (Estimated Completion Time)
                </Label>
                <div className="relative max-w-md">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="mUntil"
                    value={maintenanceUntil}
                    onChange={(e) => setMaintenanceUntil(e.target.value)}
                    placeholder="เช่น วันนี้ เวลา 18:00 น. หรือ 15 ต.ค. 2569 เวลา 12:00 น."
                    className="pl-9 text-xs"
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  * เว้นว่างไว้ได้หากยังไม่กำหนดเวลาที่แน่นอน
                </span>
              </div>

              {/* Tips & Admin Bypass Notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 text-xs text-blue-950">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>สิทธิ์การเข้าใช้งานพิเศษสำหรับผู้ดูแลระบบ (Admin Bypass):</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>
                    แม้โหมดปิดปรับปรุงจะเปิดอยู่ บัญชีผู้ดูแลระบบ (<strong>ADMIN</strong>) ยังคงสามารถเข้าสู่ระบบและจัดการข้อมูลได้ทุกหน้า
                  </li>
                  <li>
                    เมื่อแอดมินใช้งานอยู่ ระบบจะแสดงแถบแจ้งเตือนสีส้มด้านบนหน้าจอเพื่อเตือนว่าระบบยังอยู่ในโหมดปิดปรับปรุง
                  </li>
                  <li>
                    เมื่อดำเนินการปรับปรุงเสร็จสิ้น อย่าลืมกลับมาปิดสวิตช์ Maintenance Mode เพื่อเปิดให้ผู้ใช้งานคนอื่นเข้าใช้งานได้ตามปกติ
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-3 flex justify-end gap-3">
              <Button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-semibold"
              >
                <Save className="h-4 w-4" />
                {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
