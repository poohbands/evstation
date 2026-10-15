import { NextRequest, NextResponse } from "next/server"
import { convertInvoiceToReceipt } from "@/lib/data-service"
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
    const body = await request.json().catch(() => ({}))

    const receipt = await convertInvoiceToReceipt(id, body)
    if (!receipt) {
      return NextResponse.json({ error: "ไม่สามารถออกใบเสร็จรับเงินได้ หรือไม่พบเอกสารต้นทาง" }, { status: 400 })
    }

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "CONVERT_DOC",
      category: "DOCUMENT",
      description: `แปลงใบแจ้งหนี้เป็นใบเสร็จรับเงิน เลขที่ ${receipt.docNumber} (อ้างอิงรหัส: ${id})`,
      targetId: receipt.id,
      targetName: receipt.docNumber,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json(receipt, { status: 201 })
  } catch (error: any) {
    console.error("Error converting invoice to receipt:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการออกใบเสร็จรับเงิน", details: error.message },
      { status: 500 }
    )
  }
}
