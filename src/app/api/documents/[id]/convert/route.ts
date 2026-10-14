import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateDocNumber } from "@/lib/document-number"
import { ThaiBahtText } from "@/lib/thai-baht-text"

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
      // Body may be empty if simple POST
      body = {}
    }

    const {
      paymentDate = new Date().toISOString(),
      paymentMethod = "TRANSFER",
      paymentRef = "",
    } = body

    const sourceInvoice = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { itemOrder: "asc" },
        },
      },
    })

    if (!sourceInvoice) {
      return NextResponse.json(
        { error: "ไม่พบใบแจ้งหนี้ต้นทาง" },
        { status: 404 }
      )
    }

    // Determine target receipt type
    let targetDocType = ""
    if (sourceInvoice.docType === "INV_ELEC") {
      targetDocType = "REC_ELEC"
    } else if (sourceInvoice.docType === "INV_RENT") {
      targetDocType = "REC_RENT"
    } else {
      return NextResponse.json(
        { error: "สามารถแปลงเป็นใบเสร็จรับเงินได้เฉพาะใบแจ้งหนี้เท่านั้น (INV_ELEC หรือ INV_RENT)" },
        { status: 400 }
      )
    }

    // Generate new document number for receipt
    const receiptDocNumber = await generateDocNumber(
      targetDocType,
      sourceInvoice.billingMonth,
      sourceInvoice.billingYear
    )

    const payDate = new Date(paymentDate)

    const newReceipt = await prisma.$transaction(async (tx) => {
      // 1. Update source invoice status to PAID
      await tx.document.update({
        where: { id: sourceInvoice.id },
        data: {
          status: "PAID",
          paymentDate: payDate,
          paymentMethod,
          paymentRef: paymentRef || receiptDocNumber,
        },
      })

      // 2. Create the receipt document
      const createdReceipt = await tx.document.create({
        data: {
          docNumber: receiptDocNumber,
          docType: targetDocType,
          refInvoiceId: sourceInvoice.id,
          issueDate: payDate,
          dueDate: null,
          billingMonth: sourceInvoice.billingMonth,
          billingYear: sourceInvoice.billingYear,
          stationName: sourceInvoice.stationName,
          customerName: sourceInvoice.customerName,
          customerAddress: sourceInvoice.customerAddress,
          customerTaxId: sourceInvoice.customerTaxId,
          customerBranch: sourceInvoice.customerBranch,
          contractRef: sourceInvoice.contractRef,
          subtotal: sourceInvoice.subtotal,
          vatRate: sourceInvoice.vatRate,
          vatAmount: sourceInvoice.vatAmount,
          whtRate: sourceInvoice.whtRate,
          whtAmount: sourceInvoice.whtAmount,
          grandTotal: sourceInvoice.grandTotal,
          netPayable: sourceInvoice.netPayable,
          enableVat: sourceInvoice.enableVat,
          enableWht: sourceInvoice.enableWht,
          status: "PAID",
          paymentDate: payDate,
          paymentMethod,
          paymentRef: paymentRef || `อ้างอิงใบแจ้งหนี้ ${sourceInvoice.docNumber}`,
          notes: sourceInvoice.notes,
          thaiBahtText: sourceInvoice.thaiBahtText || ThaiBahtText(sourceInvoice.netPayable),
          items: {
            create: sourceInvoice.items.map((item) => ({
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
          refInvoice: true,
        },
      })

      return createdReceipt
    })

    return NextResponse.json(newReceipt, { status: 201 })
  } catch (error: any) {
    console.error("Error converting invoice to receipt:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแปลงใบแจ้งหนี้เป็นใบเสร็จรับเงิน", details: error.message },
      { status: 500 }
    )
  }
}
