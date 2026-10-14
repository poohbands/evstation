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
        // Default auto-login as admin for instant preview convenience
        const defaultAdmin: User = {
          id: "user-admin",
          username: "admin",
          name: "ผู้ดูแลระบบ (Admin)",
          role: "ADMIN",
          createdAt: new Date().toISOString(),
        }
        setUser(defaultAdmin)
        localStorage.setItem("ev_user", JSON.stringify(defaultAdmin))
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
    setUser(null)
    localStorage.removeItem("ev_user")
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
