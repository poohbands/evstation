import { NextRequest, NextResponse } from "next/server"
import { getOrganizationSettings, updateOrganizationSettings } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const settings = await getOrganizationSettings()
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = await updateOrganizationSettings(body)
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", details: error.message },
      { status: 500 }
    )
  }
}
