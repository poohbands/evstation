import { NextRequest, NextResponse } from "next/server"
import { createPairedDocuments } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Strict date validation: Invoice Date MUST be <= Receipt Date
    if (body.issueDate && body.receiptDate) {
      const invDate = new Date(body.issueDate)
      const recDate = new Date(body.receiptDate)
      if (recDate < invDate) {
        return NextResponse.json(
          { error: "ตามกฎระเบียบ กฟภ. วันที่ในใบแจ้งหนี้ต้องเป็นวันที่มาก่อนหรือวันเดียวกันกับวันที่ในใบเสร็จรับเงิน/ใบกำกับภาษีเท่านั้น" },
          { status: 400 }
        )
      }
    }

    const result = await createPairedDocuments(body)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error creating paired documents:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการออกคู่เอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
