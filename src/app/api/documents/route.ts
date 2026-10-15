import { NextRequest, NextResponse } from "next/server"
import { getDocumentsList, createNewDocument } from "@/lib/data-service"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

const DOC_TYPE_NAMES: Record<string, string> = {
  INV_ELEC: "ใบแจ้งหนี้ค่าไฟฟ้า",
  REC_ELEC: "ใบเสร็จรับเงินค่าไฟฟ้า",
  INV_RENT: "ใบแจ้งหนี้ค่าเช่าพื้นที่",
  REC_RENT: "ใบเสร็จรับเงินค่าเช่าพื้นที่",
}

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
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const body = await request.json()
    const document = await createNewDocument(body)

    const typeTitle = DOC_TYPE_NAMES[document.docType] || document.docType
    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "CREATE_DOC",
      category: "DOCUMENT",
      description: `สร้าง${typeTitle} เลขที่ ${document.docNumber} ยอดเงินสุทธิ ${Number(document.netPayable || 0).toLocaleString()} บาท`,
      targetId: document.id,
      targetName: document.docNumber,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details: {
        docNumber: document.docNumber,
        docType: document.docType,
        netPayable: document.netPayable,
        billingMonth: document.billingMonth,
        billingYear: document.billingYear,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
