import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateDocNumber } from "@/lib/document-number"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const sourceDoc = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemOrder: "asc" },
        },
      },
    })

    if (!sourceDoc) {
      return NextResponse.json(
        { error: "ไม่พบเอกสารต้นทางที่ต้องการคัดลอก" },
        { status: 404 }
      )
    }

    const now = new Date()
    const targetMonth = body.billingMonth ?? now.getMonth() + 1
    const targetYear = body.billingYear ?? now.getFullYear()
    const issueDate = body.issueDate ? new Date(body.issueDate) : now

    // Set due date to 15 days later by default
    const dueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

    // Generate new document number
    const newDocNumber = await generateDocNumber(
      sourceDoc.docType,
      targetMonth,
      targetYear
    )

    const duplicatedDoc = await prisma.document.create({
      data: {
        docNumber: newDocNumber,
        docType: sourceDoc.docType,
        refInvoiceId: null,
        issueDate,
        dueDate,
        billingMonth: targetMonth,
        billingYear: targetYear,
        stationName: sourceDoc.stationName,
        customerName: sourceDoc.customerName,
        customerAddress: sourceDoc.customerAddress,
        customerTaxId: sourceDoc.customerTaxId,
        customerBranch: sourceDoc.customerBranch,
        contractRef: sourceDoc.contractRef,
        subtotal: sourceDoc.subtotal,
        vatRate: sourceDoc.vatRate,
        vatAmount: sourceDoc.vatAmount,
        whtRate: sourceDoc.whtRate,
        whtAmount: sourceDoc.whtAmount,
        grandTotal: sourceDoc.grandTotal,
        netPayable: sourceDoc.netPayable,
        enableVat: sourceDoc.enableVat,
        enableWht: sourceDoc.enableWht,
        status: "PENDING",
        paymentDate: null,
        paymentMethod: null,
        paymentRef: null,
        notes: sourceDoc.notes,
        thaiBahtText: sourceDoc.thaiBahtText,
        items: {
          create: sourceDoc.items.map((item) => ({
            itemOrder: item.itemOrder,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName,
            unitPrice: item.unitPrice,
            amount: item.amount,
            meterPrevious: item.meterPrevious,
            meterCurrent: item.meterCurrent,
          })),
        },
      },
      include: {
        items: {
          orderBy: { itemOrder: "asc" },
        },
      },
    })

    return NextResponse.json(duplicatedDoc, { status: 201 })
  } catch (error: any) {
    console.error("Error duplicating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการคัดลอกเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
