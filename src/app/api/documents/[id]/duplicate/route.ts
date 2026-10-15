import { NextRequest, NextResponse } from "next/server"
import { duplicateDocumentById } from "@/lib/data-service"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const { id } = await context.params
    const duplicated = await duplicateDocumentById(id)

    if (!duplicated) {
      return NextResponse.json({ error: "ไม่สามารถทำสำเนาได้ หรือไม่พบเอกสารต้นทาง" }, { status: 404 })
    }

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "DUPLICATE_DOC",
      category: "DOCUMENT",
      description: `ทำสำเนาเอกสารเป็นฉบับใหม่ เลขที่ ${duplicated.docNumber} (จากเอกสารเดิมรหัส: ${id})`,
      targetId: duplicated.id,
      targetName: duplicated.docNumber,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json(duplicated, { status: 201 })
  } catch (error: any) {
    console.error("Error duplicating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการทำสำเนาเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
