import { NextResponse } from "next/server"
import { runDatabaseSeed } from "@/lib/seed-data"

export async function POST() {
  try {
    const result = await runDatabaseSeed()
    return NextResponse.json({
      message: "ข้อมูลตัวอย่างถูกเพิ่มลงในฐานข้อมูลเรียบร้อยแล้ว",
      ...result,
    })
  } catch (error: any) {
    console.error("Error running database seed via API:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง", details: error.message },
      { status: 500 }
    )
  }
}
