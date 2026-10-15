import { NextRequest, NextResponse } from "next/server"
import {
  getUsersAsync,
  createUserAsync,
  updateUserAsync,
  deleteUserAsync,
} from "@/lib/auth"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const users = await getUsersAsync()
    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const body = await request.json()
    const { username, password, name, role } = body

    if (!username || !password || !name || !role) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อมูลให้ครบถ้วน (ชื่อผู้ใช้, รหัสผ่าน, ชื่อ-นามสกุล, สิทธิ์)" },
        { status: 400 }
      )
    }

    const result = await createUserAsync({ username, password, name, role })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "CREATE_USER",
      category: "USER",
      description: `สร้างผู้ใช้งานใหม่: ${username} (${name}) สิทธิ์: ${role}`,
      targetId: result.user?.id,
      targetName: username,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details: { username, name, role },
    })

    return NextResponse.json(result.user, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const body = await request.json()
    const { id, username, password, name, role, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ไม่พบรหัสผู้ใช้ที่ต้องการแก้ไข" }, { status: 400 })
    }

    const result = await updateUserAsync(id, { username, password, name, role, isActive })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const changes: string[] = []
    if (password) changes.push("เปลี่ยนรหัสผ่าน")
    if (name) changes.push(`ชื่อ: ${name}`)
    if (role) changes.push(`สิทธิ์: ${role}`)
    if (isActive !== undefined) changes.push(isActive ? "เปิดใช้งาน" : "ปิดใช้งาน")

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "UPDATE_USER",
      category: "USER",
      description: `แก้ไขผู้ใช้งาน: ${result.user?.username || id} (${changes.join(", ") || "อัปเดตข้อมูล"})`,
      targetId: id,
      targetName: result.user?.username || id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details: { username, name, role, isActive, passwordChanged: !!password },
    })

    return NextResponse.json(result.user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ไม่พบรหัสผู้ใช้" }, { status: 400 })
    }

    const result = await deleteUserAsync(id)
    if (!result.success) {
      return NextResponse.json({ error: result.error || "ไม่สามารถลบผู้ใช้นี้ได้" }, { status: 400 })
    }

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "DELETE_USER",
      category: "USER",
      description: `ลบผู้ใช้งานรหัส: ${id}`,
      targetId: id,
      targetName: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json({ success: true, message: "ลบผู้ใช้สำเร็จ" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
