import { NextRequest, NextResponse } from "next/server"
import { getDocumentsList, createNewDocument } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const search = searchParams.get("search")

    const documents = await getDocumentsList({ type, status, month, year, search })
    return NextResponse.json(documents)
  } catch (error: any) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงรายการเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const document = await createNewDocument(body)
    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
