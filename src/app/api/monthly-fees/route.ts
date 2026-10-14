import { NextRequest, NextResponse } from "next/server"
import { getMonthlyFeesList, createNewMonthlyFee, deleteMonthlyFeeById } from "@/lib/data-service"

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
  try {
    const body = await request.json()
    const fee = await createNewMonthlyFee(body)
    return NextResponse.json(fee, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }
    const success = await deleteMonthlyFeeById(id)
    return NextResponse.json({ success })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
