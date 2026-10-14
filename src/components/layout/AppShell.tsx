"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Zap, AlertTriangle, Wrench, RefreshCw, LogIn, Clock, Shield } from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAuth } from "@/components/auth/AuthContext"
import { Button } from "@/components/ui/button"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [maintenanceMode, setMaintenanceMode] = React.useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = React.useState("")
  const [maintenanceUntil, setMaintenanceUntil] = React.useState("")
  const [settingsLoaded, setSettingsLoaded] = React.useState(false)

  const checkMaintenance = React.useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setMaintenanceMode(Boolean(data.isMaintenanceMode))
        setMaintenanceMessage(
          data.maintenanceMessage ||
            "ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดระบบและเพิ่มประสิทธิภาพ กรุณากลับมาใหม่อีกครั้งในภายหลัง"
        )
        setMaintenanceUntil(data.maintenanceUntil || "")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSettingsLoaded(true)
    }
  }, [])

  React.useEffect(() => {
    checkMaintenance()
    const handleMaintenanceChange = () => {
      checkMaintenance()
    }
    window.addEventListener("maintenance-changed", handleMaintenanceChange)
    return () => {
      window.removeEventListener("maintenance-changed", handleMaintenanceChange)
    }
  }, [checkMaintenance])

  // Non-Admin Maintenance Splash Screen
  if (settingsLoaded && maintenanceMode && !isAdmin && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-prompt">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/20 text-amber-400 ring-4 ring-amber-400/20">
            <Wrench className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
              ปิดปรับปรุงระบบชั่วคราว
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              ระบบกำลังปิดปรับปรุง
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {maintenanceMessage}
            </p>
          </div>

          {maintenanceUntil && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-amber-300 font-mono">
              <Clock className="h-4 w-4" />
              <span>คาดว่าจะเปิดให้บริการ: <strong>{maintenanceUntil}</strong></span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              รีเฟรชหน้าเว็บ
            </Button>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                เข้าสู่ระบบสำหรับ Admin
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            ระบบบริหารจัดการเอกสารการเงินและบัญชีสถานีชาร์จรถยนต์ไฟฟ้า PEA VOLTA CONNEXT
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Admin Maintenance Mode Active Sticky Warning Banner */}
      {maintenanceMode && isAdmin && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-50 to-orange-500 text-slate-950 px-4 py-2 text-xs font-semibold shadow-md flex flex-wrap items-center justify-between gap-2 print:hidden font-prompt">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-950 animate-bounce shrink-0" />
            <span>
              <strong>ขณะนี้ระบบอยู่ในโหมดปิดปรับปรุง (Maintenance Mode):</strong> ผู้ใช้งานทั่วไปและผู้เยี่ยมชมจะไม่สามารถเข้าใช้งานได้ (คุณกำลังเข้าใช้งานในฐานะ Admin)
            </span>
          </div>
          <Link href="/maintenance">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 text-[11px] bg-slate-950 text-white hover:bg-slate-800 gap-1"
            >
              <Wrench className="h-3 w-3" />
              จัดการ / ปิดโหมดนี้
            </Button>
          </Link>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:hidden print:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="เปิดเมนูนำทาง"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">
            EV Billing
          </span>
        </div>

        <div className="w-8" />
      </header>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col md:pl-64 print:pl-0 print:m-0">
        <main className="flex-1 p-4 md:p-8 print:p-0 print:m-0">
          {children}
        </main>
      </div>
    </div>
  )
}
