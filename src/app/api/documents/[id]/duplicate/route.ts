import { NextRequest, NextResponse } from "next/server"
import { duplicateDocumentById } from "@/lib/data-service"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const duplicated = await duplicateDocumentById(id)

    if (!duplicated) {
      return NextResponse.json({ error: "ไม่สามารถทำสำเนาได้ หรือไม่พบเอกสารต้นทาง" }, { status: 404 })
    }

    return NextResponse.json(duplicated, { status: 201 })
  } catch (error: any) {
    console.error("Error duplicating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการทำสำเนาเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
