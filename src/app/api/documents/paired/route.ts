import { NextRequest, NextResponse } from "next/server"
import { createPairedDocuments } from "@/lib/data-service"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const body = await request.json()

    // Strict date validation: Invoice Date MUST be <= Receipt Date
    if (body.issueDate && body.receiptDate) {
      const invDate = new Date(body.issueDate)
      const recDate = new Date(body.receiptDate)
      if (recDate < invDate) {
        return NextResponse.json(
          {
            error:
              "ตามกฎระเบียบ กฟภ. วันที่ในใบแจ้งหนี้ต้องเป็นวันที่มาก่อนหรือวันเดียวกันกับวันที่ในใบเสร็จรับเงิน/ใบกำกับภาษีเท่านั้น",
          },
          { status: 400 }
        )
      }
    }

    const result = await createPairedDocuments(body)

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "CREATE_PAIRED_DOCS",
      category: "DOCUMENT",
      description: `สร้างเอกสารเป็นคู่: ใบแจ้งหนี้ ${result.invoice.docNumber} และใบเสร็จรับเงิน ${result.receipt.docNumber} (ยอดสุทธิ ${Number(result.invoice.netPayable || 0).toLocaleString()} บาท)`,
      targetId: result.invoice.id,
      targetName: `${result.invoice.docNumber} / ${result.receipt.docNumber}`,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details: {
        invoiceNumber: result.invoice.docNumber,
        receiptNumber: result.receipt.docNumber,
        netPayable: result.invoice.netPayable,
        billingMonth: result.invoice.billingMonth,
        billingYear: result.invoice.billingYear,
      },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error creating paired documents:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการออกคู่เอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
