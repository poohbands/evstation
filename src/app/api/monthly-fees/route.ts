import { NextRequest, NextResponse } from "next/server"
import { getMonthlyFeesList, createNewMonthlyFee, deleteMonthlyFeeById } from "@/lib/data-service"
import { logActivity, getUserFromRequest, getClientInfo } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const fees = await getMonthlyFeesList()
    return NextResponse.json(fees)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const body = await request.json()
    const fee = await createNewMonthlyFee(body)

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "UPDATE_FEE",
      category: "MONTHLY_FEE",
      description: `บันทึกค่าบริการ PEA App เดือน ${fee.billingMonth}/${fee.billingYear} (สถานี: ${fee.stationName || "PEA"} ยอด: ${(fee as any).totalAmount || (fee as any).amount || 0} บาท)`,
      targetId: fee.id,
      targetName: `${fee.billingMonth}/${fee.billingYear}`,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json(fee, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const actor = getUserFromRequest(request)
  const client = getClientInfo(request)

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }
    const success = await deleteMonthlyFeeById(id)

    await logActivity({
      userId: actor.id,
      username: actor.username,
      userRole: actor.role,
      action: "DELETE_FEE",
      category: "MONTHLY_FEE",
      description: `ลบรายการบันทึกค่าบริการ PEA App รหัส: ${id}`,
      targetId: id,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
    })

    return NextResponse.json({ success })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
