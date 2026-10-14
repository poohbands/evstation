"use client"

import * as React from "react"
import { Menu, Zap } from "lucide-react"
import { Sidebar } from "@/components/layout/Sidebar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-slate-50/50">
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
