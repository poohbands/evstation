import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch all documents to compute dashboard metrics
    const [allDocuments, paidElecDocs, paidRentDocs] = await Promise.all([
      prisma.document.findMany({
        select: {
          id: true,
          status: true,
          docType: true,
          netPayable: true,
          refInvoiceId: true,
          billingMonth: true,
          billingYear: true,
          issueDate: true,
        },
      }),
      // For revenue, avoid double counting invoices and their receipts:
      // Count PAID invoices, and standalone PAID receipts (refInvoiceId is null)
      prisma.document.findMany({
        where: {
          status: "PAID",
          docType: { in: ["INV_ELEC", "REC_ELEC"] },
          refInvoiceId: null,
        },
        select: {
          netPayable: true,
        },
      }),
      prisma.document.findMany({
        where: {
          status: "PAID",
          docType: { in: ["INV_RENT", "REC_RENT"] },
          refInvoiceId: null,
        },
        select: {
          netPayable: true,
        },
      }),
    ])

    const totalElectricityRevenue = paidElecDocs.reduce(
      (sum, d) => sum + (d.netPayable || 0),
      0
    )

    const totalRentalRevenue = paidRentDocs.reduce(
      (sum, d) => sum + (d.netPayable || 0),
      0
    )

    const pendingInvoices = allDocuments.filter(
      (d) => d.status === "PENDING"
    ).length

    const paidInvoices = allDocuments.filter(
      (d) => d.status === "PAID"
    ).length

    const cancelledInvoices = allDocuments.filter(
      (d) => d.status === "CANCELLED"
    ).length

    const totalDocuments = allDocuments.length

    // Optional recent activity summary
    const recentDocuments = await prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      totalElectricityRevenue: Math.round(totalElectricityRevenue * 100) / 100,
      totalRentalRevenue: Math.round(totalRentalRevenue * 100) / 100,
      pendingInvoices,
      paidInvoices,
      cancelledInvoices,
      totalDocuments,
      recentDocuments,
    })
  } catch (error: any) {
    console.error("Error generating dashboard stats:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด", details: error.message },
      { status: 500 }
    )
  }
}
