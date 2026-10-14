import { NextRequest, NextResponse } from "next/server"
import { validateCredentials } from "@/lib/auth"
import { getOrganizationSettings } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      )
    }

    const result = validateCredentials(username, password)
    if (!result.user) {
      return NextResponse.json(
        { error: result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: result.error?.includes("ปิดการใช้งาน") ? 403 : 401 }
      )
    }

    const user = result.user

    // Check Maintenance Mode
    const settings = (await getOrganizationSettings()) as any
    if (settings?.isMaintenanceMode && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "ระบบอยู่ระหว่างปิดปรับปรุงชั่วคราว (Maintenance Mode) อนุญาตเฉพาะผู้ดูแลระบบ (ADMIN) เข้าสู่ระบบเท่านั้น",
        },
        { status: 503 }
      )
    }

    const response = NextResponse.json({
      success: true,
      user,
      message: "เข้าสู่ระบบสำเร็จ",
    })

    // Set cookie for session persistence
    response.cookies.set("ev_user_session", JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ", details: error.message },
      { status: 500 }
    )
  }
}
