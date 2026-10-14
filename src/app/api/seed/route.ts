import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const result = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: "ระบบข้อมูลจำลองพร้อมใช้งานเรียบร้อยแล้ว",
      data: result,
    })
  } catch (error: any) {
    console.error("Error seeding database:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างข้อมูลจำลอง", details: error.message },
      { status: 500 }
    )
  }
}
