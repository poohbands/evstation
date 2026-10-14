"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("sakura4923")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(username, password)
    setLoading(false)

    if (result.success) {
      router.push("/")
    } else {
      setError(result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-prompt">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20">
            <Zap className="h-8 w-8 text-amber-300 fill-amber-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ระบบบริหารจัดการเอกสารการเงิน
          </h1>
          <p className="text-sm text-slate-400">
            สถานีชาร์จยานยนต์ไฟฟ้า &bull; PEA VOLTA CONNEXT
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-800/80 backdrop-blur shadow-2xl text-slate-100">
          <CardHeader>
            <CardTitle className="text-lg text-white">เข้าสู่ระบบ (Sign In)</CardTitle>
            <CardDescription className="text-slate-400">
              กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าใช้งานระบบ
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-red-950/60 border border-red-800 text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-200">ชื่อผู้ใช้ (Username)</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="pl-9 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">รหัสผ่าน (Password)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Pre-filled credentials hint */}
              <div className="rounded-lg bg-slate-900/90 border border-slate-700/60 p-3 text-xs space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ข้อมูลบัญชีเริ่มต้นสำหรับทดสอบ:</span>
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[11px] text-slate-400">
                  <div>User: <span className="text-amber-300">admin</span></div>
                  <div>Pass: <span className="text-amber-300">sakura4923</span></div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
