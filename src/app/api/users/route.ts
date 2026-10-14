import { NextRequest, NextResponse } from "next/server"
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const users = getUsers().map(({ passwordHash, ...safeUser }) => safeUser)
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, name, role } = body

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อมูลให้ครบถ้วน (ชื่อผู้ใช้, รหัสผ่าน, ชื่อ-นามสกุล, สิทธิ์)" },
        { status: 400 }
      )
    }

    const result = createUser({ username, password, name, role })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.user, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, username, password, name, role } = body

    if (!id) {
      return NextResponse.json({ error: "ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข" }, { status: 400 })
    }

    const result = updateUser(id, { username, password, name, role })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ไม่พบรหัสผู้ใช้" }, { status: 400 })
    }

    const result = deleteUser(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error || "ไม่สามารถลบผู้ใช้นี้ได้" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "ลบผู้ใช้สำเร็จ" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

