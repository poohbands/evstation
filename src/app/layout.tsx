import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "ระบบบริหารจัดการเอกสารการเงิน | EV Charging Station",
  description: "ระบบบริหารจัดการเอกสารการเงิน ใบแจ้งหนี้ ใบเสร็จรับเงิน สำหรับสถานีชาร์จรถยนต์ไฟฟ้า (EV Charging Station Billing System)",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-background font-prompt antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
