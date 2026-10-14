import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth/AuthContext"

export const metadata: Metadata = {
  title: "ระบบบริหารจัดการเอกสารการเงิน | EV Charging Station (PEA VOLTA)",
  description: "ระบบบริหารจัดการเอกสารการเงิน ใบแจ้งหนี้ ใบเสร็จรับเงิน สำหรับสถานีชาร์จรถยนต์ไฟฟ้า ตามมาตรฐาน กฟภ. PEA VOLTA CONNEXT",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-background font-prompt antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
