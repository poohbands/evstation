import { NextResponse } from "next/server"
import { getDashboardData } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await getDashboardData()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error generating dashboard stats:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด", details: error.message },
      { status: 500 }
    )
  }
}
