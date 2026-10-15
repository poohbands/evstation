"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAdmin: boolean
  isAccountant: boolean
  canEdit: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage or cookie on mount
    try {
      const stored = localStorage.getItem("ev_user")
      if (stored) {
        setUser(JSON.parse(stored))
      } else {
        setUser(null)
      }
    } catch (e) {
      console.error("Auth load error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "เข้าสู่ระบบไม่สำเร็จ" }
      }

      setUser(data.user)
      localStorage.setItem("ev_user", JSON.stringify(data.user))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" }
    }
  }

  const logout = () => {
    try {
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOGOUT",
          category: "AUTH",
          description: `ออกจากระบบ (${user?.username || "ไม่ระบุ"})`,
          username: user?.username,
          userRole: user?.role,
        }),
      }).catch(() => {})
    } catch {
      // ignore
    }
    setUser(null)
    localStorage.removeItem("ev_user")
    document.cookie = "ev_user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    window.location.href = "/login"
  }

  const isAdmin = user?.role === "ADMIN"
  const isAccountant = user?.role === "ACCOUNTANT" || isAdmin
  const canEdit = isAdmin || isAccountant

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin,
        isAccountant,
        canEdit,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
