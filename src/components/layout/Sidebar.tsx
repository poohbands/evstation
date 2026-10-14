"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Settings,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
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
    title: "สร้างเอกสารใหม่",
    href: "/documents/new",
    icon: FilePlus,
  },
  {
    title: "ตั้งค่าองค์กร",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()

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
                <span>⚡ EV Billing</span>
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
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active ? "text-white" : "text-slate-400"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="border-t border-slate-800 p-4">
          <div className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>ระบบพร้อมใช้งาน</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              EV Billing System v1.0
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
