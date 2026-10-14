import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { calculateAllTotals, getDefaultWhtRate } from "@/lib/calculations"
import { ThaiBahtText } from "@/lib/thai-baht-text"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            itemOrder: "asc",
          },
        },
        refInvoice: true,
        receipts: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "ไม่พบเอกสารที่ระบุ" },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error: any) {
    console.error("Error fetching document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Check if document exists
    const existingDoc = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json(
        { error: "ไม่พบเอกสารที่ต้องการแก้ไข" },
        { status: 404 }
      )
    }

    const {
      docType = existingDoc.docType,
      issueDate = existingDoc.issueDate,
      dueDate,
      billingMonth = existingDoc.billingMonth,
      billingYear = existingDoc.billingYear,
      stationName = existingDoc.stationName,
      customerName = existingDoc.customerName,
      customerAddress = existingDoc.customerAddress,
      customerTaxId = existingDoc.customerTaxId,
      customerBranch = existingDoc.customerBranch,
      contractRef = existingDoc.contractRef,
      enableVat = existingDoc.enableVat,
      enableWht = existingDoc.enableWht,
      vatRate = existingDoc.vatRate,
      whtRate: customWhtRate,
      status = existingDoc.status,
      paymentDate,
      paymentMethod,
      paymentRef,
      notes = existingDoc.notes,
      items,
      refInvoiceId = existingDoc.refInvoiceId,
      docNumber = existingDoc.docNumber,
    } = body

    const finalWhtRate =
      customWhtRate !== undefined
        ? Number(customWhtRate)
        : existingDoc.whtRate ?? getDefaultWhtRate(docType)
    const finalVatRate = vatRate !== undefined ? Number(vatRate) : existingDoc.vatRate

    // Prepare items if provided
    let processedItems: any[] = []
    if (items && Array.isArray(items)) {
      processedItems = items.map((item: any, index: number) => {
        const quantity = Number(item.quantity) || 0
        const unitPrice = Number(item.unitPrice) || 0
        const amount =
          typeof item.amount === "number" && !isNaN(item.amount) && item.amount !== 0
            ? item.amount
            : Math.round(quantity * unitPrice * 100) / 100

        return {
          itemOrder: item.itemOrder ?? index + 1,
          description: item.description || "",
          quantity,
          unitName: item.unitName || "",
          unitPrice,
          amount,
          meterPrevious:
            item.meterPrevious !== undefined && item.meterPrevious !== null
              ? Number(item.meterPrevious)
              : null,
          meterCurrent:
            item.meterCurrent !== undefined && item.meterCurrent !== null
              ? Number(item.meterCurrent)
              : null,
        }
      })
    }

    const totals = calculateAllTotals(
      processedItems,
      enableVat,
      finalVatRate,
      enableWht,
      finalWhtRate
    )

    const thaiBahtText = ThaiBahtText(totals.netPayable)

    const updatedDocument = await prisma.$transaction(async (tx) => {
      // If new items were provided, delete old ones and insert new
      if (items && Array.isArray(items)) {
        await tx.documentItem.deleteMany({
          where: { documentId: id },
        })
      }

      const doc = await tx.document.update({
        where: { id },
        data: {
          docNumber,
          docType,
          refInvoiceId: refInvoiceId || null,
          issueDate: new Date(issueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          billingMonth: Number(billingMonth),
          billingYear: Number(billingYear),
          stationName,
          customerName,
          customerAddress,
          customerTaxId,
          customerBranch,
          contractRef,
          subtotal: totals.subtotal,
          vatRate: totals.vatRate,
          vatAmount: totals.vatAmount,
          whtRate: totals.whtRate,
          whtAmount: totals.whtAmount,
          grandTotal: totals.grandTotal,
          netPayable: totals.netPayable,
          enableVat,
          enableWht,
          status,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          paymentMethod: paymentMethod || null,
          paymentRef: paymentRef || null,
          notes,
          thaiBahtText,
          ...(items && Array.isArray(items)
            ? {
                items: {
                  create: processedItems,
                },
              }
            : {}),
        },
        include: {
          items: {
            orderBy: {
              itemOrder: "asc",
            },
          },
          refInvoice: true,
          receipts: true,
        },
      })

      return doc
    })

    return NextResponse.json(updatedDocument)
  } catch (error: any) {
    console.error("Error updating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const existingDoc = await prisma.document.findUnique({
      where: { id },
    })

    if (!existingDoc) {
      return NextResponse.json(
        { error: "ไม่พบเอกสารที่ต้องการลบ" },
        { status: 404 }
      )
    }

    // Cascade delete is handled by schema (DocumentItem onDelete: Cascade),
    // but we can execute in transaction to clean up relations cleanly
    await prisma.$transaction(async (tx) => {
      // Disconnect or handle any receipt referencing this doc
      await tx.document.updateMany({
        where: { refInvoiceId: id },
        data: { refInvoiceId: null },
      })

      // Delete items
      await tx.documentItem.deleteMany({
        where: { documentId: id },
      })

      // Delete document
      await tx.document.delete({
        where: { id },
      })
    })

    return NextResponse.json({
      success: true,
      message: "ลบเอกสารสำเร็จ",
      id,
    })
  } catch (error: any) {
    console.error("Error deleting document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
