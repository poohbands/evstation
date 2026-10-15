import { NextRequest, NextResponse } from "next/server"
import { getDocumentById, updateExistingDocument, deleteDocumentById } from "@/lib/data-service"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const document = await getDocumentById(id)

    if (!document) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่ระบุ" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error: any) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const { id } = await context.params
    const body = await request.json()

    const updated = await updateExistingDocument(id, body)
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่ต้องการแก้ไข" }, { status: 404 })
    }

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "UPDATE_DOC",
      category: "DOCUMENT",
      description: `แก้ไขเอกสาร ${updated.docNumber} (สถานะ: ${updated.status}, ยอดสุทธิ: ${Number(updated.netPayable || 0).toLocaleString()} บาท)`,
      targetId: updated.id,
      targetName: updated.docNumber,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details: {
        docNumber: updated.docNumber,
        status: updated.status,
        netPayable: updated.netPayable,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const { id } = await context.params
    const existing = await getDocumentById(id)
    const deleted = await deleteDocumentById(id)

    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่ต้องการลบ" }, { status: 404 })
    }

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "DELETE_DOC",
      category: "DOCUMENT",
      description: `ลบเอกสารเลขที่ ${existing?.docNumber || id}`,
      targetId: id,
      targetName: existing?.docNumber || id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json({ success: true, message: "ลบเอกสารสำเร็จ" })
  } catch (error: any) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
