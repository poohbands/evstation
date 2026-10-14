import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateDocNumber } from "@/lib/document-number"
import {
  calculateAllTotals,
  getDefaultWhtRate,
} from "@/lib/calculations"
import { ThaiBahtText } from "@/lib/thai-baht-text"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const search = searchParams.get("search")

    const where: any = {}

    if (type) {
      where.docType = type
    }

    if (status) {
      where.status = status
    }

    if (month) {
      where.billingMonth = parseInt(month, 10)
    }

    if (year) {
      where.billingYear = parseInt(year, 10)
    }

    if (search && search.trim() !== "") {
      const q = search.trim()
      where.OR = [
        { docNumber: { contains: q } },
        { customerName: { contains: q } },
        { stationName: { contains: q } },
        { notes: { contains: q } },
        { contractRef: { contains: q } },
      ]
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        items: {
          orderBy: {
            itemOrder: "asc",
          },
        },
        refInvoice: {
          select: {
            id: true,
            docNumber: true,
            docType: true,
            grandTotal: true,
            netPayable: true,
          },
        },
        receipts: {
          select: {
            id: true,
            docNumber: true,
            docType: true,
            grandTotal: true,
            netPayable: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      docType,
      issueDate,
      dueDate,
      billingMonth,
      billingYear,
      stationName = "",
      customerName = "",
      customerAddress = "",
      customerTaxId = "",
      customerBranch = "",
      contractRef = "",
      enableVat = true,
      enableWht = true,
      vatRate = 7,
      whtRate: customWhtRate,
      status = "PENDING",
      paymentDate,
      paymentMethod,
      paymentRef,
      notes = "",
      items = [],
      refInvoiceId,
      docNumber: customDocNumber,
    } = body

    if (!docType) {
      return NextResponse.json(
        { error: "กรุณาระบุประเภทเอกสาร (docType)" },
        { status: 400 }
      )
    }

    const bMonth = parseInt(billingMonth, 10) || new Date().getMonth() + 1
    const bYear = parseInt(billingYear, 10) || new Date().getFullYear()

    // Determine document number
    const docNumber =
      customDocNumber?.trim() ||
      (await generateDocNumber(docType, bMonth, bYear))

    const finalWhtRate =
      customWhtRate !== undefined ? Number(customWhtRate) : getDefaultWhtRate(docType)
    const finalVatRate = vatRate !== undefined ? Number(vatRate) : 7

    // Process and sanitize item totals
    const processedItems = items.map((item: any, index: number) => {
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

    const totals = calculateAllTotals(
      processedItems,
      enableVat,
      finalVatRate,
      enableWht,
      finalWhtRate
    )

    const thaiBahtText = ThaiBahtText(totals.netPayable)

    const newDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          docNumber,
          docType,
          refInvoiceId: refInvoiceId || null,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          billingMonth: bMonth,
          billingYear: bYear,
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
          items: {
            create: processedItems,
          },
        },
        include: {
          items: {
            orderBy: {
              itemOrder: "asc",
            },
          },
        },
      })

      // If this document is a receipt referencing an invoice, update invoice status
      if (refInvoiceId && (docType === "REC_ELEC" || docType === "REC_RENT")) {
        await tx.document.update({
          where: { id: refInvoiceId },
          data: {
            status: "PAID",
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMethod: paymentMethod || "TRANSFER",
            paymentRef: paymentRef || docNumber,
          },
        })
      }

      return doc
    })

    return NextResponse.json(newDocument, { status: 201 })
  } catch (error: any) {
    console.error("Error creating document:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างเอกสาร", details: error.message },
      { status: 500 }
    )
  }
}
