import { NextRequest, NextResponse } from "next/server"
import { validateCredentials } from "@/lib/auth"

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

    const user = validateCredentials(username, password)
    if (!user) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
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
