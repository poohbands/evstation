import prisma from "@/lib/prisma"
import { ThaiBahtText } from "@/lib/thai-baht-text"
import { calculateAllTotals } from "@/lib/calculations"

export const SEED_ORGANIZATION_SETTINGS = {
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
  logoUrl: "",
  defaultCustomerName: "การไฟฟ้าส่วนภูมิภาค",
  defaultCustomerAddress: "200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900",
  defaultCustomerTaxId: "0994000165509",
  defaultCustomerBranch: "สำนักงานใหญ่",
}

export async function runDatabaseSeed() {
  console.log("🌱 Starting EV Charging Billing database seeding...")

  // 1. Clean existing records in correct order
  await prisma.documentItem.deleteMany({})
  await prisma.document.deleteMany({})
  await prisma.organizationSettings.deleteMany({})

  // 2. Create Organization Settings
  const settings = await prisma.organizationSettings.create({
    data: SEED_ORGANIZATION_SETTINGS,
  })
  console.log("✅ Organization settings created")

  const defaultCust = {
    customerName: settings.defaultCustomerName,
    customerAddress: settings.defaultCustomerAddress,
    customerTaxId: settings.defaultCustomerTaxId,
    customerBranch: settings.defaultCustomerBranch,
    contractRef: "สัญญาเลขที่ EV-PEA-2025/089",
    stationName: "สถานีชาร์จ กรีนชาร์จ คลองหลวง",
  }

  // --- JULY 2026 ---
  // July Electricity Invoice
  const itemsJulElec = [
    {
      itemOrder: 1,
      description: "ค่าส่วนต่างกระแสไฟฟ้า สถานีชาร์จ กรีนชาร์จ คลองหลวง ประจำเดือน กรกฎาคม 2569 (ราคาขาย 6.50 บาท - ต้นทุน 4.50 บาท)",
      quantity: 6450,
      unitName: "kWh",
      unitPrice: 2.0,
      amount: 12900.0,
      meterPrevious: 124550.0,
      meterCurrent: 131000.0,
    },
  ]
  const totalsJulElec = calculateAllTotals(itemsJulElec, true, 7, true, 3)
  const invJulElec = await prisma.document.create({
    data: {
      docNumber: "INV-EV-202607-001",
      docType: "INV_ELEC",
      issueDate: new Date("2026-07-31T00:00:00.000Z"),
      dueDate: new Date("2026-08-15T00:00:00.000Z"),
      billingMonth: 7,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsJulElec.subtotal,
      vatRate: totalsJulElec.vatRate,
      vatAmount: totalsJulElec.vatAmount,
      whtRate: totalsJulElec.whtRate,
      whtAmount: totalsJulElec.whtAmount,
      grandTotal: totalsJulElec.grandTotal,
      netPayable: totalsJulElec.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-08-10T09:30:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "KTB-TRF-20260810-771",
      notes: "ชำระเงินเรียบร้อยแล้วผ่านธนาคารกรุงไทย",
      thaiBahtText: ThaiBahtText(totalsJulElec.netPayable),
      items: { create: itemsJulElec },
    },
  })

  // July Electricity Receipt referencing Invoice
  await prisma.document.create({
    data: {
      docNumber: "REC-EV-202607-001",
      docType: "REC_ELEC",
      refInvoiceId: invJulElec.id,
      issueDate: new Date("2026-08-10T09:30:00.000Z"),
      billingMonth: 7,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsJulElec.subtotal,
      vatRate: totalsJulElec.vatRate,
      vatAmount: totalsJulElec.vatAmount,
      whtRate: totalsJulElec.whtRate,
      whtAmount: totalsJulElec.whtAmount,
      grandTotal: totalsJulElec.grandTotal,
      netPayable: totalsJulElec.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-08-10T09:30:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "KTB-TRF-20260810-771",
      notes: "รับชำระค่าส่วนต่างไฟฟ้าเรียบร้อย",
      thaiBahtText: ThaiBahtText(totalsJulElec.netPayable),
      items: {
        create: itemsJulElec.map((it) => ({
          ...it,
        })),
      },
    },
  })

  // July Rental Invoice
  const itemsJulRent = [
    {
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน กรกฎาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
    },
    {
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน กรกฎาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
    },
  ]
  const totalsJulRent = calculateAllTotals(itemsJulRent, true, 7, true, 5)
  const invJulRent = await prisma.document.create({
    data: {
      docNumber: "INV-RENT-202607-001",
      docType: "INV_RENT",
      issueDate: new Date("2026-07-01T00:00:00.000Z"),
      dueDate: new Date("2026-07-15T00:00:00.000Z"),
      billingMonth: 7,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsJulRent.subtotal,
      vatRate: totalsJulRent.vatRate,
      vatAmount: totalsJulRent.vatAmount,
      whtRate: totalsJulRent.whtRate,
      whtAmount: totalsJulRent.whtAmount,
      grandTotal: totalsJulRent.grandTotal,
      netPayable: totalsJulRent.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-07-12T14:15:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "BBL-TRF-20260712-452",
      notes: "ชำระตรงตามกำหนดเวลา",
      thaiBahtText: ThaiBahtText(totalsJulRent.netPayable),
      items: { create: itemsJulRent },
    },
  })

  // July Rental Receipt
  await prisma.document.create({
    data: {
      docNumber: "REC-RENT-202607-001",
      docType: "REC_RENT",
      refInvoiceId: invJulRent.id,
      issueDate: new Date("2026-07-12T14:15:00.000Z"),
      billingMonth: 7,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsJulRent.subtotal,
      vatRate: totalsJulRent.vatRate,
      vatAmount: totalsJulRent.vatAmount,
      whtRate: totalsJulRent.whtRate,
      whtAmount: totalsJulRent.whtAmount,
      grandTotal: totalsJulRent.grandTotal,
      netPayable: totalsJulRent.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-07-12T14:15:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "BBL-TRF-20260712-452",
      notes: "ออกใบเสร็จรับเงินค่าเช่าพื้นที่",
      thaiBahtText: ThaiBahtText(totalsJulRent.netPayable),
      items: {
        create: itemsJulRent.map((it) => ({
          ...it,
        })),
      },
    },
  })

  // --- AUGUST 2026 ---
  // August Electricity Invoice
  const itemsAugElec = [
    {
      itemOrder: 1,
      description: "ค่าส่วนต่างกระแสไฟฟ้า สถานีชาร์จ กรีนชาร์จ คลองหลวง ประจำเดือน สิงหาคม 2569 (ราคาขาย 6.50 บาท - ต้นทุน 4.50 บาท)",
      quantity: 7200,
      unitName: "kWh",
      unitPrice: 2.0,
      amount: 14400.0,
      meterPrevious: 131000.0,
      meterCurrent: 138200.0,
    },
  ]
  const totalsAugElec = calculateAllTotals(itemsAugElec, true, 7, true, 3)
  const invAugElec = await prisma.document.create({
    data: {
      docNumber: "INV-EV-202608-001",
      docType: "INV_ELEC",
      issueDate: new Date("2026-08-31T00:00:00.000Z"),
      dueDate: new Date("2026-09-15T00:00:00.000Z"),
      billingMonth: 8,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsAugElec.subtotal,
      vatRate: totalsAugElec.vatRate,
      vatAmount: totalsAugElec.vatAmount,
      whtRate: totalsAugElec.whtRate,
      whtAmount: totalsAugElec.whtAmount,
      grandTotal: totalsAugElec.grandTotal,
      netPayable: totalsAugElec.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-09-10T11:00:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "KTB-TRF-20260910-882",
      notes: "รับชำระเรียบร้อย",
      thaiBahtText: ThaiBahtText(totalsAugElec.netPayable),
      items: { create: itemsAugElec },
    },
  })

  // August Electricity Receipt
  await prisma.document.create({
    data: {
      docNumber: "REC-EV-202608-001",
      docType: "REC_ELEC",
      refInvoiceId: invAugElec.id,
      issueDate: new Date("2026-09-10T11:00:00.000Z"),
      billingMonth: 8,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsAugElec.subtotal,
      vatRate: totalsAugElec.vatRate,
      vatAmount: totalsAugElec.vatAmount,
      whtRate: totalsAugElec.whtRate,
      whtAmount: totalsAugElec.whtAmount,
      grandTotal: totalsAugElec.grandTotal,
      netPayable: totalsAugElec.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-09-10T11:00:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "KTB-TRF-20260910-882",
      notes: "ใบเสร็จค่าไฟประจำเดือนสิงหาคม",
      thaiBahtText: ThaiBahtText(totalsAugElec.netPayable),
      items: {
        create: itemsAugElec.map((it) => ({
          ...it,
        })),
      },
    },
  })

  // August Rental Invoice
  const itemsAugRent = [
    {
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน สิงหาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
    },
    {
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน สิงหาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
    },
  ]
  const totalsAugRent = calculateAllTotals(itemsAugRent, true, 7, true, 5)
  const invAugRent = await prisma.document.create({
    data: {
      docNumber: "INV-RENT-202608-001",
      docType: "INV_RENT",
      issueDate: new Date("2026-08-01T00:00:00.000Z"),
      dueDate: new Date("2026-08-15T00:00:00.000Z"),
      billingMonth: 8,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsAugRent.subtotal,
      vatRate: totalsAugRent.vatRate,
      vatAmount: totalsAugRent.vatAmount,
      whtRate: totalsAugRent.whtRate,
      whtAmount: totalsAugRent.whtAmount,
      grandTotal: totalsAugRent.grandTotal,
      netPayable: totalsAugRent.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-08-12T10:00:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "BBL-TRF-20260812-901",
      notes: "ชำระเงินเรียบร้อย",
      thaiBahtText: ThaiBahtText(totalsAugRent.netPayable),
      items: { create: itemsAugRent },
    },
  })

  // August Rental Receipt
  await prisma.document.create({
    data: {
      docNumber: "REC-RENT-202608-001",
      docType: "REC_RENT",
      refInvoiceId: invAugRent.id,
      issueDate: new Date("2026-08-12T10:00:00.000Z"),
      billingMonth: 8,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsAugRent.subtotal,
      vatRate: totalsAugRent.vatRate,
      vatAmount: totalsAugRent.vatAmount,
      whtRate: totalsAugRent.whtRate,
      whtAmount: totalsAugRent.whtAmount,
      grandTotal: totalsAugRent.grandTotal,
      netPayable: totalsAugRent.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PAID",
      paymentDate: new Date("2026-08-12T10:00:00.000Z"),
      paymentMethod: "TRANSFER",
      paymentRef: "BBL-TRF-20260812-901",
      notes: "ใบเสร็จค่าเช่าประจำเดือนสิงหาคม",
      thaiBahtText: ThaiBahtText(totalsAugRent.netPayable),
      items: {
        create: itemsAugRent.map((it) => ({
          ...it,
        })),
      },
    },
  })

  // --- SEPTEMBER 2026 ---
  // September Electricity Invoice (PENDING)
  const itemsSepElec = [
    {
      itemOrder: 1,
      description: "ค่าส่วนต่างกระแสไฟฟ้า สถานีชาร์จ กรีนชาร์จ คลองหลวง ประจำเดือน กันยายน 2569 (ราคาขาย 6.50 บาท - ต้นทุน 4.50 บาท)",
      quantity: 7850,
      unitName: "kWh",
      unitPrice: 2.0,
      amount: 15700.0,
      meterPrevious: 138200.0,
      meterCurrent: 146050.0,
    },
  ]
  const totalsSepElec = calculateAllTotals(itemsSepElec, true, 7, true, 3)
  await prisma.document.create({
    data: {
      docNumber: "INV-EV-202609-001",
      docType: "INV_ELEC",
      issueDate: new Date("2026-09-30T00:00:00.000Z"),
      dueDate: new Date("2026-10-15T00:00:00.000Z"),
      billingMonth: 9,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsSepElec.subtotal,
      vatRate: totalsSepElec.vatRate,
      vatAmount: totalsSepElec.vatAmount,
      whtRate: totalsSepElec.whtRate,
      whtAmount: totalsSepElec.whtAmount,
      grandTotal: totalsSepElec.grandTotal,
      netPayable: totalsSepElec.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PENDING",
      paymentDate: null,
      paymentMethod: null,
      paymentRef: null,
      notes: "ส่งใบแจ้งหนี้ไปยังฝ่ายบัญชี กฟภ. เรียบร้อย รอการโอนเงิน",
      thaiBahtText: ThaiBahtText(totalsSepElec.netPayable),
      items: { create: itemsSepElec },
    },
  })

  // September Rental Invoice (PENDING)
  const itemsSepRent = [
    {
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน กันยายน 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
    },
    {
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน กันยายน 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
    },
  ]
  const totalsSepRent = calculateAllTotals(itemsSepRent, true, 7, true, 5)
  await prisma.document.create({
    data: {
      docNumber: "INV-RENT-202609-001",
      docType: "INV_RENT",
      issueDate: new Date("2026-09-01T00:00:00.000Z"),
      dueDate: new Date("2026-09-15T00:00:00.000Z"),
      billingMonth: 9,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsSepRent.subtotal,
      vatRate: totalsSepRent.vatRate,
      vatAmount: totalsSepRent.vatAmount,
      whtRate: totalsSepRent.whtRate,
      whtAmount: totalsSepRent.whtAmount,
      grandTotal: totalsSepRent.grandTotal,
      netPayable: totalsSepRent.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PENDING",
      paymentDate: null,
      paymentMethod: null,
      paymentRef: null,
      notes: "รอการตั้งเบิกจ่ายตามรอบบัญชี",
      thaiBahtText: ThaiBahtText(totalsSepRent.netPayable),
      items: { create: itemsSepRent },
    },
  })

  // --- OCTOBER 2026 ---
  // October Rental Invoice (PENDING)
  const itemsOctRent = [
    {
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน ตุลาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
    },
    {
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน ตุลาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
    },
  ]
  const totalsOctRent = calculateAllTotals(itemsOctRent, true, 7, true, 5)
  await prisma.document.create({
    data: {
      docNumber: "INV-RENT-202610-001",
      docType: "INV_RENT",
      issueDate: new Date("2026-10-01T00:00:00.000Z"),
      dueDate: new Date("2026-10-15T00:00:00.000Z"),
      billingMonth: 10,
      billingYear: 2026,
      ...defaultCust,
      subtotal: totalsOctRent.subtotal,
      vatRate: totalsOctRent.vatRate,
      vatAmount: totalsOctRent.vatAmount,
      whtRate: totalsOctRent.whtRate,
      whtAmount: totalsOctRent.whtAmount,
      grandTotal: totalsOctRent.grandTotal,
      netPayable: totalsOctRent.netPayable,
      enableVat: true,
      enableWht: true,
      status: "PENDING",
      paymentDate: null,
      paymentMethod: null,
      paymentRef: null,
      notes: "ใบแจ้งหนี้รอบล่าสุด ประจำเดือนตุลาคม 2569",
      thaiBahtText: ThaiBahtText(totalsOctRent.netPayable),
      items: { create: itemsOctRent },
    },
  })

  const count = await prisma.document.count()
  console.log(`🎉 Seeding completed successfully! Total documents created: ${count}`)
  return { success: true, documentsCreated: count }
}
