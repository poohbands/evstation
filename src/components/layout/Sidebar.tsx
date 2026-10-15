"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Mail,
  FileCheck2,
  CreditCard,
  Settings,
  X,
  Zap,
  LogOut,
  Shield,
  User as UserIcon,
  ExternalLink,
  Wrench,
  Database,
} from "lucide-react"
import { cn, PEA_GOOGLE_DRIVE_URL } from "@/lib/utils"
import { useAuth } from "@/components/auth/AuthContext"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavItem {
  title: string
  href: string
  icon: any
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: "แดชบอร์ด",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "เอกสารทั้งหมด",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "สร้างเอกสาร (PEA VOLTA)",
    href: "/documents/new",
    icon: FilePlus,
  },
  {
    title: "ใบปะหน้าซอง & Checklist",
    href: "/envelope",
    icon: Mail,
  },
  {
    title: "หนังสือขอรับเงินโอน กฟภ.",
    href: "/transfer-request",
    icon: FileCheck2,
  },
  {
    title: "บันทึกค่าบริการ PEA App",
    href: "/monthly-fees",
    icon: CreditCard,
  },
  {
    title: "โหมดปรับปรุง (Maintenance)",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    title: "สถานะฐานข้อมูล",
    href: "/database-status",
    icon: Database,
    adminOnly: true,
  },
  {
    title: "ตั้งค่าองค์กร & สิทธิ์ผู้ใช้",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden print:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-100 shadow-xl transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* App Logo & Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-md ring-1 ring-blue-500/50">
              <Zap className="h-5 w-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1 font-bold text-base text-white tracking-wide">
                <span>⚡ PEA VOLTA</span>
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                ระบบจัดการเอกสารการเงิน
              </div>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="ปิดเมนูนำทาง"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            เมนูหลัก
          </div>
          <nav className="space-y-1.5">
            {navItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-white" : "text-slate-400"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              )
            })}

            <div className="pt-2 mt-2 border-t border-slate-800">
              <a
                href={PEA_GOOGLE_DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                  <span>คู่มือ & ตัวอย่าง กฟภ. (Drive)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-800 font-mono">
                  Drive
                </span>
              </a>
            </div>
          </nav>
        </div>

        {/* User Profile & Role Section */}
        <div className="border-t border-slate-800 p-3 space-y-2">
          {user && !(pathname === "/" && user.username === "admin") ? (
            <div className="rounded-lg bg-slate-800/80 p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600/30 text-blue-300 ring-1 ring-blue-500/40">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-white truncate">{user.username}</div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Shield className="h-3 w-3 text-amber-400" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="ออกจากระบบ"
                className="p-1.5 rounded text-slate-400 hover:text-red-300 hover:bg-slate-700/60 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : !user ? (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              <span>เข้าสู่ระบบ</span>
            </Link>
          ) : null}

          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>PEA VOLTA CONNEXT</span>
            </span>
            <span className="text-slate-400">v2.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}
