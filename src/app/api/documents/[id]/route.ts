import { NextRequest, NextResponse } from "next/server"
import { getDocumentById, updateExistingDocument, deleteDocumentById } from "@/lib/data-service"

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
  try {
    const { id } = await context.params
    const body = await request.json()

    const updated = await updateExistingDocument(id, body)
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่ต้องการแก้ไข" }, { status: 404 })
    }

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
  try {
    const { id } = await context.params
    const deleted = await deleteDocumentById(id)

    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบเอกสารที่ต้องการลบ" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "ลบเอกสารสำเร็จ" })
  } catch (error: any) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
