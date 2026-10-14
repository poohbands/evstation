import prisma from "@/lib/prisma"
import {
  getMockDashboardStats,
  getMockDocuments,
  getMockDocumentById,
  createMockDocument,
  updateMockDocument,
  deleteMockDocument,
  convertMockInvoiceToReceipt,
  duplicateMockDocument,
  getMockSettings,
  updateMockSettings,
  resetMockData,
} from "@/lib/mock-store"
import { generateDocNumber } from "@/lib/document-number"
import { calculateAllTotals, getDefaultWhtRate } from "@/lib/calculations"
import { ThaiBahtText } from "@/lib/thai-baht-text"

function isRemoteDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL
  if (!url) return false
  if (url.includes("localhost:5432")) return false
  if (url.startsWith("file:")) return false
  return true
}

export async function getDashboardData() {
  if (isRemoteDatabaseConfigured()) {
    try {
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
        prisma.document.findMany({
          where: {
            status: "PAID",
            docType: { in: ["INV_ELEC", "REC_ELEC"] },
            refInvoiceId: null,
          },
          select: { netPayable: true },
        }),
        prisma.document.findMany({
          where: {
            status: "PAID",
            docType: { in: ["INV_RENT", "REC_RENT"] },
            refInvoiceId: null,
          },
          select: { netPayable: true },
        }),
      ])

      const totalElectricityRevenue = paidElecDocs.reduce((sum, d) => sum + (d.netPayable || 0), 0)
      const totalRentalRevenue = paidRentDocs.reduce((sum, d) => sum + (d.netPayable || 0), 0)
      const pendingInvoices = allDocuments.filter(d => d.status === "PENDING").length
      const paidInvoices = allDocuments.filter(d => d.status === "PAID").length
      const cancelledInvoices = allDocuments.filter(d => d.status === "CANCELLED").length
      const totalDocuments = allDocuments.length

      const recentDocuments = await prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      })

      return {
        totalElectricityRevenue: Math.round(totalElectricityRevenue * 100) / 100,
        totalRentalRevenue: Math.round(totalRentalRevenue * 100) / 100,
        pendingInvoices,
        paidInvoices,
        cancelledInvoices,
        totalDocuments,
        recentDocuments,
      }
    } catch (err) {
      console.warn("Prisma dashboard query failed, using mock fallback:", err)
    }
  }

  // Fallback
  return getMockDashboardStats()
}

export async function getDocumentsList(filters: {
  type?: string | null
  status?: string | null
  month?: string | null
  year?: string | null
  search?: string | null
}) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const where: any = {}
      if (filters.type) where.docType = filters.type
      if (filters.status) where.status = filters.status
      if (filters.month) where.billingMonth = parseInt(filters.month, 10)
      if (filters.year) where.billingYear = parseInt(filters.year, 10)
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim()
        where.OR = [
          { docNumber: { contains: q } },
          { customerName: { contains: q } },
          { stationName: { contains: q } },
          { notes: { contains: q } },
          { contractRef: { contains: q } },
        ]
      }

      return await prisma.document.findMany({
        where,
        include: {
          items: { orderBy: { itemOrder: "asc" } },
          refInvoice: { select: { id: true, docNumber: true, docType: true } },
          receipts: { select: { id: true, docNumber: true, docType: true, paymentDate: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    } catch (err) {
      console.warn("Prisma documents query failed, using mock fallback:", err)
    }
  }

  return getMockDocuments(filters)
}

export async function getDocumentById(id: string) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const doc = await prisma.document.findUnique({
        where: { id },
        include: {
          items: { orderBy: { itemOrder: "asc" } },
          refInvoice: true,
          receipts: true,
        },
      })
      if (doc) return doc
    } catch (err) {
      console.warn("Prisma getDocumentById failed, using mock fallback:", err)
    }
  }

  return getMockDocumentById(id)
}

export async function createNewDocument(body: any) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const {
        docType,
        issueDate,
        dueDate,
        billingMonth,
        billingYear,
        stationName,
        customerName,
        customerAddress,
        customerTaxId,
        customerBranch,
        contractRef,
        enableVat = true,
        enableWht = true,
        vatRate = 7,
        whtRate,
        status = "PENDING",
        paymentDate,
        paymentMethod,
        paymentRef,
        notes,
        items = [],
        refInvoiceId,
      } = body

      const month = parseInt(billingMonth, 10)
      const year = parseInt(billingYear, 10)
      const docNumber = await generateDocNumber(docType, month, year)
      const effectiveWhtRate = whtRate !== undefined ? Number(whtRate) : getDefaultWhtRate(docType)
      const totals = calculateAllTotals(items, enableVat, Number(vatRate), enableWht, effectiveWhtRate)
      const thaiBaht = ThaiBahtText(totals.netPayable)

      const doc = await prisma.document.create({
        data: {
          docNumber,
          docType,
          refInvoiceId: refInvoiceId || null,
          issueDate: new Date(issueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          billingMonth: month,
          billingYear: year,
          stationName: stationName || "",
          customerName: customerName || "",
          customerAddress: customerAddress || "",
          customerTaxId: customerTaxId || "",
          customerBranch: customerBranch || "",
          contractRef: contractRef || "",
          ...totals,
          enableVat,
          enableWht,
          status,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          paymentMethod: paymentMethod || null,
          paymentRef: paymentRef || null,
          notes: notes || "",
          thaiBahtText: thaiBaht,
          items: {
            create: items.map((it: any, index: number) => ({
              itemOrder: it.itemOrder || index + 1,
              description: it.description,
              quantity: Number(it.quantity) || 0,
              unitName: it.unitName || "",
              unitPrice: Number(it.unitPrice) || 0,
              amount: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
              meterPrevious: it.meterPrevious != null ? Number(it.meterPrevious) : null,
              meterCurrent: it.meterCurrent != null ? Number(it.meterCurrent) : null,
            })),
          },
        },
        include: { items: true },
      })
      return doc
    } catch (err) {
      console.warn("Prisma createNewDocument failed, using mock fallback:", err)
    }
  }

  return createMockDocument(body)
}

export async function updateExistingDocument(id: string, body: any) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const {
        docType,
        issueDate,
        dueDate,
        billingMonth,
        billingYear,
        stationName,
        customerName,
        customerAddress,
        customerTaxId,
        customerBranch,
        contractRef,
        enableVat,
        enableWht,
        vatRate,
        whtRate,
        status,
        paymentDate,
        paymentMethod,
        paymentRef,
        notes,
        items,
        refInvoiceId,
      } = body

      const month = parseInt(billingMonth, 10)
      const year = parseInt(billingYear, 10)
      const effectiveWhtRate = whtRate !== undefined ? Number(whtRate) : getDefaultWhtRate(docType)
      const totals = calculateAllTotals(items || [], enableVat, Number(vatRate), enableWht, effectiveWhtRate)
      const thaiBaht = ThaiBahtText(totals.netPayable)

      return await prisma.$transaction(async tx => {
        if (items) {
          await tx.documentItem.deleteMany({ where: { documentId: id } })
          await tx.documentItem.createMany({
            data: items.map((it: any, index: number) => ({
              documentId: id,
              itemOrder: it.itemOrder || index + 1,
              description: it.description,
              quantity: Number(it.quantity) || 0,
              unitName: it.unitName || "",
              unitPrice: Number(it.unitPrice) || 0,
              amount: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
              meterPrevious: it.meterPrevious != null ? Number(it.meterPrevious) : null,
              meterCurrent: it.meterCurrent != null ? Number(it.meterCurrent) : null,
            })),
          })
        }

        return tx.document.update({
          where: { id },
          data: {
            docType,
            refInvoiceId: refInvoiceId || null,
            issueDate: new Date(issueDate),
            dueDate: dueDate ? new Date(dueDate) : null,
            billingMonth: month,
            billingYear: year,
            stationName: stationName || "",
            customerName: customerName || "",
            customerAddress: customerAddress || "",
            customerTaxId: customerTaxId || "",
            customerBranch: customerBranch || "",
            contractRef: contractRef || "",
            ...totals,
            enableVat,
            enableWht,
            status,
            paymentDate: paymentDate ? new Date(paymentDate) : null,
            paymentMethod: paymentMethod || null,
            paymentRef: paymentRef || null,
            notes: notes || "",
            thaiBahtText: thaiBaht,
          },
          include: { items: { orderBy: { itemOrder: "asc" } } },
        })
      })
    } catch (err) {
      console.warn("Prisma updateExistingDocument failed, using mock fallback:", err)
    }
  }

  return updateMockDocument(id, body)
}

export async function deleteDocumentById(id: string) {
  if (isRemoteDatabaseConfigured()) {
    try {
      await prisma.document.delete({ where: { id } })
      return true
    } catch (err) {
      console.warn("Prisma deleteDocumentById failed, using mock fallback:", err)
    }
  }

  return deleteMockDocument(id)
}

export async function convertInvoiceToReceipt(id: string, body: any) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const invoice = await prisma.document.findUnique({
        where: { id },
        include: { items: { orderBy: { itemOrder: "asc" } } },
      })
      if (!invoice) throw new Error("ไม่พบเอกสารต้นทาง")

      const targetType = invoice.docType === "INV_ELEC" ? "REC_ELEC" : "REC_RENT"
      const recDocNumber = await generateDocNumber(targetType, invoice.billingMonth, invoice.billingYear)

      return await prisma.$transaction(async tx => {
        await tx.document.update({
          where: { id },
          data: { status: "PAID" },
        })

        return tx.document.create({
          data: {
            docNumber: recDocNumber,
            docType: targetType,
            refInvoiceId: invoice.id,
            issueDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
            dueDate: null,
            billingMonth: invoice.billingMonth,
            billingYear: invoice.billingYear,
            stationName: invoice.stationName,
            customerName: invoice.customerName,
            customerAddress: invoice.customerAddress,
            customerTaxId: invoice.customerTaxId,
            customerBranch: invoice.customerBranch,
            contractRef: invoice.contractRef,
            subtotal: invoice.subtotal,
            vatRate: invoice.vatRate,
            vatAmount: invoice.vatAmount,
            whtRate: invoice.whtRate,
            whtAmount: invoice.whtAmount,
            grandTotal: invoice.grandTotal,
            netPayable: invoice.netPayable,
            enableVat: invoice.enableVat,
            enableWht: invoice.enableWht,
            status: "PAID",
            paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
            paymentMethod: body.paymentMethod || "TRANSFER",
            paymentRef: body.paymentRef || null,
            notes: body.notes || `ออกใบเสร็จรับเงินอ้างอิงใบแจ้งหนี้เลขที่ ${invoice.docNumber}`,
            thaiBahtText: invoice.thaiBahtText,
            items: {
              create: invoice.items.map(it => ({
                itemOrder: it.itemOrder,
                description: it.description,
                quantity: it.quantity,
                unitName: it.unitName,
                unitPrice: it.unitPrice,
                amount: it.amount,
                meterPrevious: it.meterPrevious,
                meterCurrent: it.meterCurrent,
              })),
            },
          },
          include: { items: true },
        })
      })
    } catch (err) {
      console.warn("Prisma convertInvoiceToReceipt failed, using mock fallback:", err)
    }
  }

  return convertMockInvoiceToReceipt(id, body)
}

export async function duplicateDocumentById(id: string) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const source = await prisma.document.findUnique({
        where: { id },
        include: { items: { orderBy: { itemOrder: "asc" } } },
      })
      if (!source) throw new Error("ไม่พบเอกสารที่ต้องการทำสำเนา")

      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()
      const newDocNumber = await generateDocNumber(source.docType, currentMonth, currentYear)

      return await prisma.document.create({
        data: {
          docNumber: newDocNumber,
          docType: source.docType,
          refInvoiceId: null,
          issueDate: now,
          dueDate: source.dueDate ? new Date(now.getTime() + 15 * 86400000) : null,
          billingMonth: currentMonth,
          billingYear: currentYear,
          stationName: source.stationName,
          customerName: source.customerName,
          customerAddress: source.customerAddress,
          customerTaxId: source.customerTaxId,
          customerBranch: source.customerBranch,
          contractRef: source.contractRef,
          subtotal: source.subtotal,
          vatRate: source.vatRate,
          vatAmount: source.vatAmount,
          whtRate: source.whtRate,
          whtAmount: source.whtAmount,
          grandTotal: source.grandTotal,
          netPayable: source.netPayable,
          enableVat: source.enableVat,
          enableWht: source.enableWht,
          status: "PENDING",
          paymentDate: null,
          paymentMethod: null,
          paymentRef: null,
          notes: `${source.notes} (ทำสำเนาจาก ${source.docNumber})`.trim(),
          thaiBahtText: source.thaiBahtText,
          items: {
            create: source.items.map(it => ({
              itemOrder: it.itemOrder,
              description: it.description,
              quantity: it.quantity,
              unitName: it.unitName,
              unitPrice: it.unitPrice,
              amount: it.amount,
              meterPrevious: it.meterPrevious,
              meterCurrent: it.meterCurrent,
            })),
          },
        },
        include: { items: true },
      })
    } catch (err) {
      console.warn("Prisma duplicateDocumentById failed, using mock fallback:", err)
    }
  }

  return duplicateMockDocument(id)
}

export async function getOrganizationSettings() {
  if (isRemoteDatabaseConfigured()) {
    try {
      let settings = await prisma.organizationSettings.findFirst()
      if (!settings) {
        settings = await prisma.organizationSettings.create({
          data: {
            companyName: "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด",
            address: "88/8 หมู่ 5 ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120",
            taxId: "0105564012345",
            phone: "02-123-4567",
            email: "billing@greencharge.co.th",
            bankName: "ธนาคารกสิกรไทย",
            bankAccountNo: "123-4-56789-0",
            bankAccountName: "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด",
            signerName: "นายสมชาย รักษ์พลังงาน",
            signerTitle: "กรรมการผู้จัดการ",
            defaultCustomerName: "การไฟฟ้าส่วนภูมิภาค",
            defaultCustomerAddress: "200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900",
            defaultCustomerTaxId: "0994000165509",
            defaultCustomerBranch: "สำนักงานใหญ่",
          },
        })
      }
      return settings
    } catch (err) {
      console.warn("Prisma getOrganizationSettings failed, using mock fallback:", err)
    }
  }

  return getMockSettings()
}

export async function updateOrganizationSettings(body: any) {
  if (isRemoteDatabaseConfigured()) {
    try {
      const existing = await prisma.organizationSettings.findFirst()
      if (existing) {
        return await prisma.organizationSettings.update({
          where: { id: existing.id },
          data: body,
        })
      } else {
        return await prisma.organizationSettings.create({ data: body })
      }
    } catch (err) {
      console.warn("Prisma updateOrganizationSettings failed, using mock fallback:", err)
    }
  }

  return updateMockSettings(body)
}

export async function seedDatabase() {
  if (isRemoteDatabaseConfigured()) {
    try {
      const { runDatabaseSeed } = await import("@/lib/seed-data")
      await runDatabaseSeed()
      return { success: true, message: "Database seeded successfully via Prisma" }
    } catch (err) {
      console.warn("Prisma seed failed, using mock reset:", err)
    }
  }

  return resetMockData()
}
