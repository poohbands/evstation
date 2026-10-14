import { NextRequest, NextResponse } from "next/server"
import { convertInvoiceToReceipt } from "@/lib/data-service"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const receipt = await convertInvoiceToReceipt(id, body)
    if (!receipt) {
      return NextResponse.json({ error: "ไม่สามารถออกใบเสร็จรับเงินได้ หรือไม่พบเอกสารต้นทาง" }, { status: 400 })
    }

    return NextResponse.json(receipt, { status: 201 })
  } catch (error: any) {
    console.error("Error converting invoice to receipt:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการออกใบเสร็จรับเงิน", details: error.message },
      { status: 500 }
    )
  }
}
