import { NextRequest, NextResponse } from "next/server"
import { getOrganizationSettings, updateOrganizationSettings } from "@/lib/data-service"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

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
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const body = await request.json()
    const updated = await updateOrganizationSettings(body)

    const isMaintenance = body.isMaintenanceMode !== undefined
    const desc = isMaintenance
      ? `เปลี่ยนโหมดบำรุงรักษา (Maintenance Mode): ${body.isMaintenanceMode ? "เปิดใช้งาน" : "ปิดใช้งาน"}`
      : `บันทึกข้อมูลองค์กรและค่าเริ่มต้น กฟภ. (${body.companyName || "การตั้งค่า"})`

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: isMaintenance ? "UPDATE_MAINTENANCE" : "UPDATE_SETTINGS",
      category: "SETTINGS",
      description: desc,
      targetName: body.companyName,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details: {
        companyName: body.companyName,
        isMaintenanceMode: body.isMaintenanceMode,
        taxId: body.taxId,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", details: error.message },
      { status: 500 }
    )
  }
}
