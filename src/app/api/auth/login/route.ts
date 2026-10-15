import { NextRequest, NextResponse } from "next/server"
import { validateCredentials } from "@/lib/auth"
import { getOrganizationSettings } from "@/lib/data-service"
import { logActivity, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const client = getClientInfo(request)
  let attemptUsername = "unknown"

  try {
    const { username, password } = await request.json()
    attemptUsername = username || "unknown"

    if (!username || !password) {
      await logActivity({
        username: attemptUsername,
        action: "LOGIN_FAILED",
        category: "AUTH",
        description: `เข้าสู่ระบบไม่สำเร็จ: ไม่ได้ระบุชื่อผู้ใช้หรือรหัสผ่าน`,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
      })

      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      )
    }

    const result = await validateCredentials(username, password)
    if (!result.user) {
      await logActivity({
        username: attemptUsername,
        action: "LOGIN_FAILED",
        category: "AUTH",
        description: `เข้าสู่ระบบไม่สำเร็จ: ${result.error || "รหัสผ่านไม่ถูกต้อง"}`,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
      })

      return NextResponse.json(
        { error: result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: result.error?.includes("ปิดการใช้งาน") ? 403 : 401 }
      )
    }

    const user = result.user

    // Check Maintenance Mode
    const settings = (await getOrganizationSettings()) as any
    if (settings?.isMaintenanceMode && user.role !== "ADMIN") {
      await logActivity({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        action: "LOGIN_BLOCKED",
        category: "AUTH",
        description: `ถูกปฏิเสธการเข้าสู่ระบบ: ระบบอยู่ในโหมดบำรุงรักษา (Maintenance Mode)`,
        ipAddress: client.ipAddress,
        userAgent: client.userAgent,
      })

      return NextResponse.json(
        {
          error: "ระบบอยู่ระหว่างปิดปรับปรุงชั่วคราว (Maintenance Mode) อนุญาตเฉพาะผู้ดูแลระบบ (ADMIN) เข้าสู่ระบบเท่านั้น",
        },
        { status: 503 }
      )
    }

    // Successful login audit log
    await logActivity({
      userId: user.id,
      username: user.username,
      userRole: user.role,
      action: "LOGIN",
      category: "AUTH",
      description: `เข้าสู่ระบบสำเร็จ (สิทธิ์: ${user.role})`,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

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
    await logActivity({
      username: attemptUsername,
      action: "LOGIN_ERROR",
      category: "AUTH",
      description: `เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${error.message}`,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ", details: error.message },
      { status: 500 }
    )
  }
}
