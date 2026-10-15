import { ThaiBahtText } from "@/lib/thai-baht-text"
import { calculateAllTotals, getDefaultWhtRate, calculatePeaVoltaRevenue, addBusinessDays } from "@/lib/calculations"
import { DOC_TYPE_PREFIXES, PEA_HEADQUARTERS } from "@/lib/utils"
import { PeaMonthlyFee, PayoutStatus, PayoutType } from "@/types"

export interface MockItem {
  id: string
  documentId: string
  itemOrder: number
  description: string
  quantity: number
  unitName: string
  unitPrice: number
  amount: number
  meterPrevious: number | null
  meterCurrent: number | null
}

export interface MockDocument {
  id: string
  docNumber: string
  docType: string
  refInvoiceId: string | null
  issueDate: string
  dueDate: string | null
  billingMonth: number
  billingYear: number
  stationName: string
  customerName: string
  customerAddress: string
  customerTaxId: string
  customerBranch: string
  contractRef: string
  subtotal: number
  vatRate: number
  vatAmount: number
  whtRate: number
  whtAmount: number
  grandTotal: number
  netPayable: number
  enableVat: boolean
  enableWht: boolean
  status: string
  paymentDate: string | null
  paymentMethod: string | null
  paymentRef: string | null
  notes: string
  thaiBahtText: string
  createdAt: string
  updatedAt: string
  items: MockItem[]
  refInvoice?: MockDocument | null
  receipts?: MockDocument[]
  
  // PEA VOLTA Exact Compliance Fields
  isVatRegistered?: boolean
  branchNumber?: string
  totalKwh?: number | null
  ratePerKwh?: number | null
  totalRawAmount?: number | null
  peaFeeAmount?: number | null
  totalClaim95?: number | null

  // Payout Tracking & SLA
  payoutStatus?: PayoutStatus
  payoutType?: PayoutType
  trackingNumber?: string | null
  shippingDate?: string | null
  peaReceivedDate?: string | null
  estimatedPayoutDate?: string | null
}

export interface MockSettings {
  id: string
  companyName: string
  address: string
  taxId: string
  phone: string
  email: string
  bankName: string
  bankAccountNo: string
  bankAccountName: string
  bankBranch: string
  bankAccountType: "SAVINGS" | "CURRENT"
  contactPerson: string
  contactPhone: string
  isVatRegistered: boolean
  branchNumber: string
  signerName: string
  signerTitle: string
  logoUrl: string
  defaultCustomerName: string
  defaultCustomerAddress: string
  defaultCustomerTaxId: string
  defaultCustomerBranch: string
  isMaintenanceMode?: boolean
  maintenanceMessage?: string
  maintenanceUntil?: string
  createdAt: string
  updatedAt: string
}

let mockSettings: MockSettings = {
  id: "settings-default",
  companyName: "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด",
  address: "88/8 หมู่ 5 ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120",
  taxId: "0105564012345",
  phone: "02-123-4567",
  email: "billing@greencharge.co.th",
  bankName: "ธนาคารกสิกรไทย",
  bankAccountNo: "123-4-56789-0",
  bankAccountName: "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด",
  bankBranch: "สาขาคลองหลวง",
  bankAccountType: "SAVINGS",
  contactPerson: "นายสมชาย รักษ์พลังงาน",
  contactPhone: "081-234-5678",
  isVatRegistered: true,
  branchNumber: "สำนักงานใหญ่",
  signerName: "นายสมชาย รักษ์พลังงาน",
  signerTitle: "กรรมการผู้จัดการ",
  logoUrl: "",
  defaultCustomerName: PEA_HEADQUARTERS.name,
  defaultCustomerAddress: PEA_HEADQUARTERS.address,
  defaultCustomerTaxId: PEA_HEADQUARTERS.taxId,
  defaultCustomerBranch: PEA_HEADQUARTERS.branch,
  isMaintenanceMode: false,
  maintenanceMessage: "ระบบกำลังปิดปรับปรุงชั่วคราวเพื่ออัปเกรดระบบและเพิ่มประสิทธิภาพ กรุณากลับมาใหม่อีกครั้งในภายหลัง",
  maintenanceUntil: "เร็วๆ นี้",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

let mockMonthlyFees: PeaMonthlyFee[] = [
  {
    id: "fee-202610",
    billingMonth: 10,
    billingYear: 2026,
    stationName: "สถานีชาร์จ กรีนชาร์จ คลองหลวง",
    ref1Contract: "020018475923",
    ref2Invoice: "910248593821",
    amount: 1605.0,
    paymentDate: "2026-10-05T10:30:00.000Z",
    paymentChannel: "PEA_SMART_PLUS",
    status: "PAID",
    notes: "ชำระค่าบริการรายเดือนผ่านแอป PEA SMART Plus เรียบร้อยแล้ว",
    createdAt: "2026-10-05T10:30:00.000Z",
  },
  {
    id: "fee-202609",
    billingMonth: 9,
    billingYear: 2026,
    stationName: "สถานีชาร์จ กรีนชาร์จ คลองหลวง",
    ref1Contract: "020018475923",
    ref2Invoice: "910247482910",
    amount: 1605.0,
    paymentDate: "2026-09-05T11:15:00.000Z",
    paymentChannel: "PEA_SMART_PLUS",
    status: "PAID",
    notes: "ชำระค่าบริการรายเดือนผ่านแอป PEA SMART Plus เรียบร้อย",
    createdAt: "2026-09-05T11:15:00.000Z",
  },
  {
    id: "fee-202608",
    billingMonth: 8,
    billingYear: 2026,
    stationName: "สถานีชาร์จ กรีนชาร์จ คลองหลวง",
    ref1Contract: "020018475923",
    ref2Invoice: "910246372819",
    amount: 1605.0,
    paymentDate: "2026-08-04T09:45:00.000Z",
    paymentChannel: "PEA_SMART_PLUS",
    status: "PAID",
    notes: "ชำระผ่านเคาน์เตอร์ กฟภ.",
    createdAt: "2026-08-04T09:45:00.000Z",
  },
]

function initMockDocuments(): MockDocument[] {
  const defaultCust = {
    customerName: PEA_HEADQUARTERS.name,
    customerAddress: PEA_HEADQUARTERS.address,
    customerTaxId: PEA_HEADQUARTERS.taxId,
    customerBranch: PEA_HEADQUARTERS.branch,
    contractRef: "สัญญาเลขที่ EV-PEA-2025/089",
    stationName: "สถานีชาร์จ กรีนชาร์จ คลองหลวง",
  }

  // Example PEA Calculation:
  // 47,263.40 kWh @ 6.90 = 326,117.46 (100% Excl VAT)
  // Fee 5% = 16,305.87
  // 95% Claim = 309,811.59
  // VAT 7% = 21,686.81
  // Total = 331,498.40
  const peaCalcSep = calculatePeaVoltaRevenue({
    rawAmount: 326117.46,
    isVatRegistered: true,
  })

  // 1. September 2026 Electricity Invoice (PEA Claim - PENDING, Sent via EMS)
  const itSepElec = [
    {
      id: "it-sep-elec-1",
      documentId: "doc-inv-sep-elec",
      itemOrder: 1,
      description: "ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน กันยายน 2569 ของสถานีบริการ กรีนชาร์จ คลองหลวง",
      quantity: 1,
      unitName: "Unit",
      unitPrice: peaCalcSep.totalClaim95,
      amount: peaCalcSep.totalClaim95,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]

  const docSepElec: MockDocument = {
    id: "doc-inv-sep-elec",
    docNumber: "INV-EV-202609-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-09-30T00:00:00.000Z",
    dueDate: "2026-10-30T00:00:00.000Z",
    billingMonth: 9,
    billingYear: 2026,
    ...defaultCust,
    subtotal: peaCalcSep.totalClaim95,
    vatRate: 7,
    vatAmount: peaCalcSep.vatAmount,
    whtRate: 0,
    whtAmount: 0,
    grandTotal: peaCalcSep.grandTotal,
    netPayable: peaCalcSep.netPayable,
    enableVat: true,
    enableWht: false,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: "ส่งเอกสารทางไปรษณีย์ EMS ถึง กฟภ. เรียบร้อยแล้ว",
    thaiBahtText: ThaiBahtText(peaCalcSep.netPayable),
    createdAt: "2026-09-30T08:00:00.000Z",
    updatedAt: "2026-10-02T10:00:00.000Z",
    items: itSepElec,
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
    totalRawAmount: peaCalcSep.totalRawAmount,
    peaFeeAmount: peaCalcSep.peaFeeAmount,
    totalClaim95: peaCalcSep.totalClaim95,
    payoutStatus: "PEA_RECEIVED",
    payoutType: "REGULAR",
    trackingNumber: "ED839281745TH",
    shippingDate: "2026-10-01T09:00:00.000Z",
    peaReceivedDate: "2026-10-03T11:00:00.000Z",
    estimatedPayoutDate: addBusinessDays("2026-10-03", 35).toISOString(),
  }

  // 2. September 2026 Electricity Receipt / Tax Invoice (Paired with Invoice)
  const recSepElec: MockDocument = {
    id: "doc-rec-sep-elec",
    docNumber: "REC-EV-202609-001",
    docType: "REC_ELEC",
    refInvoiceId: docSepElec.id,
    issueDate: "2026-10-01T09:00:00.000Z", // strictly > invoice date!
    dueDate: null,
    billingMonth: 9,
    billingYear: 2026,
    ...defaultCust,
    subtotal: peaCalcSep.totalClaim95,
    vatRate: 7,
    vatAmount: peaCalcSep.vatAmount,
    whtRate: 0,
    whtAmount: 0,
    grandTotal: peaCalcSep.grandTotal,
    netPayable: peaCalcSep.netPayable,
    enableVat: true,
    enableWht: false,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: "TRANSFER",
    paymentRef: null,
    notes: "ออกคู่กับใบแจ้งหนี้เพื่อส่งวางบิล กฟภ. พร้อมกัน",
    thaiBahtText: ThaiBahtText(peaCalcSep.netPayable),
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    items: [
      {
        id: "it-rec-sep-elec-1",
        documentId: "doc-rec-sep-elec",
        itemOrder: 1,
        description: "ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน กันยายน 2569 ของสถานีบริการ กรีนชาร์จ คลองหลวง",
        quantity: 1,
        unitName: "Unit",
        unitPrice: peaCalcSep.totalClaim95,
        amount: peaCalcSep.totalClaim95,
        meterPrevious: null,
        meterCurrent: null,
      },
    ],
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
    totalRawAmount: peaCalcSep.totalRawAmount,
    peaFeeAmount: peaCalcSep.peaFeeAmount,
    totalClaim95: peaCalcSep.totalClaim95,
    payoutStatus: "PEA_RECEIVED",
    payoutType: "REGULAR",
    trackingNumber: "ED839281745TH",
    shippingDate: "2026-10-01T09:00:00.000Z",
    peaReceivedDate: "2026-10-03T11:00:00.000Z",
    estimatedPayoutDate: addBusinessDays("2026-10-03", 35).toISOString(),
  }

  // 3. August 2026 Electricity Claim (PAID)
  const peaCalcAug = calculatePeaVoltaRevenue({
    rawAmount: 280000.0,
    isVatRegistered: true,
  })
  const itAugElec = [
    {
      id: "it-aug-elec-1",
      documentId: "doc-inv-aug-elec",
      itemOrder: 1,
      description: "ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน สิงหาคม 2569 ของสถานีบริการ กรีนชาร์จ คลองหลวง",
      quantity: 1,
      unitName: "Unit",
      unitPrice: peaCalcAug.totalClaim95,
      amount: peaCalcAug.totalClaim95,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]
  const docAugElec: MockDocument = {
    id: "doc-inv-aug-elec",
    docNumber: "INV-EV-202608-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-08-31T00:00:00.000Z",
    dueDate: "2026-09-30T00:00:00.000Z",
    billingMonth: 8,
    billingYear: 2026,
    ...defaultCust,
    subtotal: peaCalcAug.totalClaim95,
    vatRate: 7,
    vatAmount: peaCalcAug.vatAmount,
    whtRate: 0,
    whtAmount: 0,
    grandTotal: peaCalcAug.grandTotal,
    netPayable: peaCalcAug.netPayable,
    enableVat: true,
    enableWht: false,
    status: "PAID",
    paymentDate: "2026-09-28T14:20:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "PEA-KTB-20260928-091",
    notes: "ได้รับเงินโอนจาก กฟภ. เรียบร้อยแล้ว",
    thaiBahtText: ThaiBahtText(peaCalcAug.netPayable),
    createdAt: "2026-08-31T08:00:00.000Z",
    updatedAt: "2026-09-28T14:20:00.000Z",
    items: itAugElec,
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
    totalRawAmount: peaCalcAug.totalRawAmount,
    peaFeeAmount: peaCalcAug.peaFeeAmount,
    totalClaim95: peaCalcAug.totalClaim95,
    payoutStatus: "PAID",
    payoutType: "REGULAR",
    trackingNumber: "ED748291038TH",
    shippingDate: "2026-09-01T10:00:00.000Z",
    peaReceivedDate: "2026-09-03T11:00:00.000Z",
    estimatedPayoutDate: "2026-09-30T00:00:00.000Z",
  }

  // 4. August Receipt (PAID)
  const recAugElec: MockDocument = {
    id: "doc-rec-aug-elec",
    docNumber: "REC-EV-202608-001",
    docType: "REC_ELEC",
    refInvoiceId: docAugElec.id,
    issueDate: "2026-09-01T09:00:00.000Z",
    dueDate: null,
    billingMonth: 8,
    billingYear: 2026,
    ...defaultCust,
    subtotal: peaCalcAug.totalClaim95,
    vatRate: 7,
    vatAmount: peaCalcAug.vatAmount,
    whtRate: 0,
    whtAmount: 0,
    grandTotal: peaCalcAug.grandTotal,
    netPayable: peaCalcAug.netPayable,
    enableVat: true,
    enableWht: false,
    status: "PAID",
    paymentDate: "2026-09-28T14:20:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "PEA-KTB-20260928-091",
    notes: "ออกใบเสร็จรับเงิน/ใบกำกับภาษี เรียบร้อย",
    thaiBahtText: ThaiBahtText(peaCalcAug.netPayable),
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-28T14:20:00.000Z",
    items: [
      {
        id: "it-rec-aug-elec-1",
        documentId: "doc-rec-aug-elec",
        itemOrder: 1,
        description: "ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน สิงหาคม 2569 ของสถานีบริการ กรีนชาร์จ คลองหลวง",
        quantity: 1,
        unitName: "Unit",
        unitPrice: peaCalcAug.totalClaim95,
        amount: peaCalcAug.totalClaim95,
        meterPrevious: null,
        meterCurrent: null,
      },
    ],
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
    totalRawAmount: peaCalcAug.totalRawAmount,
    peaFeeAmount: peaCalcAug.peaFeeAmount,
    totalClaim95: peaCalcAug.totalClaim95,
    payoutStatus: "PAID",
  }

  // 5. October Electricity Claim (Waiting to send)
  const peaCalcOct = calculatePeaVoltaRevenue({
    rawAmount: 154000.0,
    isVatRegistered: true,
  })
  const itOctElec = [
    {
      id: "it-oct-elec-1",
      documentId: "doc-inv-oct-elec",
      itemOrder: 1,
      description: "ค่าบริการอัดประจุยานยนต์ไฟฟ้าผ่าน PEA VOLTA Platform ประจำเดือน ตุลาคม 2569 ของสถานีบริการ กรีนชาร์จ คลองหลวง",
      quantity: 1,
      unitName: "Unit",
      unitPrice: peaCalcOct.totalClaim95,
      amount: peaCalcOct.totalClaim95,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]
  const docOctElec: MockDocument = {
    id: "doc-inv-oct-elec",
    docNumber: "INV-EV-202610-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-10-14T00:00:00.000Z",
    dueDate: "2026-11-14T00:00:00.000Z",
    billingMonth: 10,
    billingYear: 2026,
    ...defaultCust,
    subtotal: peaCalcOct.totalClaim95,
    vatRate: 7,
    vatAmount: peaCalcOct.vatAmount,
    whtRate: 0,
    whtAmount: 0,
    grandTotal: peaCalcOct.grandTotal,
    netPayable: peaCalcOct.netPayable,
    enableVat: true,
    enableWht: false,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: "ออกเอกสารแล้ว รอพิมพ์จัดส่งไปรษณีย์ EMS ไปยัง กฟภ.",
    thaiBahtText: ThaiBahtText(peaCalcOct.netPayable),
    createdAt: "2026-10-14T08:00:00.000Z",
    updatedAt: "2026-10-14T08:00:00.000Z",
    items: itOctElec,
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
    totalRawAmount: peaCalcOct.totalRawAmount,
    peaFeeAmount: peaCalcOct.peaFeeAmount,
    totalClaim95: peaCalcOct.totalClaim95,
    payoutStatus: "WAITING_SEND",
    payoutType: "REGULAR",
    trackingNumber: "",
    shippingDate: null,
    peaReceivedDate: null,
    estimatedPayoutDate: null,
  }

  // 6. October Rent Invoice
  const itOctRent = [
    {
      id: "it-oct-rent-1",
      documentId: "doc-inv-oct-rent",
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน ตุลาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
      meterPrevious: null,
      meterCurrent: null,
    },
    {
      id: "it-oct-rent-2",
      documentId: "doc-inv-oct-rent",
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน ตุลาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]
  const totOctRent = calculateAllTotals(itOctRent, true, 7, true, 5)
  const docOctRent: MockDocument = {
    id: "doc-inv-oct-rent",
    docNumber: "INV-RENT-202610-001",
    docType: "INV_RENT",
    refInvoiceId: null,
    issueDate: "2026-10-01T00:00:00.000Z",
    dueDate: "2026-10-15T00:00:00.000Z",
    billingMonth: 10,
    billingYear: 2026,
    ...defaultCust,
    ...totOctRent,
    enableVat: true,
    enableWht: true,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: "ออกใบแจ้งหนี้ค่าเช่าพื้นที่รอบเดือนตุลาคม",
    thaiBahtText: ThaiBahtText(totOctRent.netPayable),
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    items: itOctRent,
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
  }

  return [
    docOctElec,
    docOctRent,
    docSepElec,
    recSepElec,
    docAugElec,
    recAugElec,
  ]
}

const globalForStore = globalThis as unknown as {
  mockDocuments: MockDocument[] | undefined
  mockSettings: MockSettings | undefined
  mockMonthlyFees: PeaMonthlyFee[] | undefined
}

export function getStore() {
  if (!globalForStore.mockDocuments || globalForStore.mockDocuments.length === 0) {
    globalForStore.mockDocuments = initMockDocuments()
  }
  if (!globalForStore.mockSettings) {
    globalForStore.mockSettings = { ...mockSettings }
  }
  if (!globalForStore.mockMonthlyFees) {
    globalForStore.mockMonthlyFees = [...mockMonthlyFees]
  }
  return {
    documents: globalForStore.mockDocuments,
    settings: globalForStore.mockSettings,
    monthlyFees: globalForStore.mockMonthlyFees,
  }
}

export function getMockSettings(): MockSettings {
  return getStore().settings
}

export function updateMockSettings(data: Partial<MockSettings>): MockSettings {
  const store = getStore()
  store.settings = {
    ...store.settings,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  globalForStore.mockSettings = store.settings
  return store.settings
}

export function ensurePairedInvoicesExist(documents: MockDocument[]): MockDocument[] {
  const missingInvoices: MockDocument[] = []
  for (const doc of documents) {
    if (doc.docType === "REC_ELEC" || doc.docType === "REC_RENT") {
      const isElec = doc.docType === "REC_ELEC"
      const targetPrefix = isElec ? "INV-EV-" : "INV-RENT-"
      const recPrefix = isElec ? "REC-EV-" : "REC-RENT-"
      if (doc.docNumber && doc.docNumber.startsWith(recPrefix)) {
        const invDocNumber = doc.docNumber.replace(recPrefix, targetPrefix)
        const hasMatching = documents.some(d => d.docNumber === invDocNumber)
        if (!hasMatching) {
          const invId = `doc-inv-${doc.id.replace(/^doc-(rec-)?/, "")}`
          const recDate = new Date(doc.issueDate)
          const invDate = new Date(recDate.getTime() - 86400000)
          const newInv: MockDocument = {
            ...doc,
            id: invId,
            docNumber: invDocNumber,
            docType: isElec ? "INV_ELEC" : "INV_RENT",
            refInvoiceId: null,
            issueDate: invDate.toISOString(),
            dueDate: new Date(invDate.getTime() + 30 * 86400000).toISOString(),
            status: "PENDING",
            notes: `ใบแจ้งหนี้ (ออกคู่กับ ${doc.docNumber})`,
            createdAt: doc.createdAt ? new Date(new Date(doc.createdAt).getTime() - 1000).toISOString() : new Date().toISOString(),
            items: (doc.items || []).map((it, idx) => ({
              ...it,
              id: `it-${invId}-${idx}`,
              documentId: invId,
            })),
          }
          missingInvoices.push(newInv)
          doc.refInvoiceId = invId
        }
      }
    }
  }
  if (missingInvoices.length > 0) {
    documents.unshift(...missingInvoices)
  }
  return documents
}

export function getMockDocuments(filters?: {
  type?: string | null
  status?: string | null
  month?: string | null
  year?: string | null
  search?: string | null
}): MockDocument[] {
  const store = getStore()
  ensurePairedInvoicesExist(store.documents)
  let list = [...store.documents]

  if (filters?.type) {
    list = list.filter(d => d.docType === filters.type)
  }
  if (filters?.status) {
    list = list.filter(d => d.status === filters.status)
  }
  if (filters?.month) {
    const m = parseInt(filters.month, 10)
    list = list.filter(d => d.billingMonth === m)
  }
  if (filters?.year) {
    const y = parseInt(filters.year, 10)
    list = list.filter(d => d.billingYear === y)
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase()
    list = list.filter(
      d =>
        d.docNumber.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.stationName.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q) ||
        d.contractRef.toLowerCase().includes(q) ||
        (d.trackingNumber && d.trackingNumber.toLowerCase().includes(q))
    )
  }

  return list.map(doc => {
    if (doc.refInvoiceId) {
      const parent = store.documents.find(d => d.id === doc.refInvoiceId)
      return { ...doc, refInvoice: parent ? { ...parent, items: [] } : null }
    }
    return doc
  })
}

export function getMockDocumentById(id: string): MockDocument | null {
  const store = getStore()
  const doc = store.documents.find(d => d.id === id)
  if (!doc) return null

  let refInvoice = null
  if (doc.refInvoiceId) {
    const p = store.documents.find(d => d.id === doc.refInvoiceId)
    if (p) refInvoice = { ...p }
  }

  const receipts = store.documents
    .filter(d => d.refInvoiceId === doc.id)
    .map(r => ({ ...r }))

  return {
    ...doc,
    refInvoice,
    receipts,
  }
}

export function generateMockDocNumber(docType: string, month: number, year: number): string {
  const store = getStore()
  const prefix = DOC_TYPE_PREFIXES[docType] || docType
  const ym = `${year}${month.toString().padStart(2, "0")}`
  const existingCount = store.documents.filter(
    d => d.docType === docType && d.billingMonth === month && d.billingYear === year
  ).length
  const seq = (existingCount + 1).toString().padStart(3, "0")
  return `${prefix}-${ym}-${seq}`
}

export function createMockDocument(data: any): MockDocument {
  const store = getStore()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const id = data.id || `doc-${Date.now()}-${randomSuffix}`
  const month = parseInt(data.billingMonth || "10", 10)
  const year = parseInt(data.billingYear || "2026", 10)
  const docType = data.docType || "INV_ELEC"

  const docNumber = data.docNumber || generateMockDocNumber(docType, month, year)

  const items: MockItem[] = (data.items || []).map((it: any, idx: number) => ({
    id: `it-${Date.now()}-${idx}-${randomSuffix}`,
    documentId: id,
    itemOrder: it.itemOrder || idx + 1,
    description: it.description || "",
    quantity: Number(it.quantity) || 1,
    unitName: it.unitName || (docType.includes("ELEC") ? "Unit" : "เดือน"),
    unitPrice: Number(it.unitPrice) || 0,
    amount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    meterPrevious: it.meterPrevious != null ? Number(it.meterPrevious) : null,
    meterCurrent: it.meterCurrent != null ? Number(it.meterCurrent) : null,
  }))

  const isVat = data.isVatRegistered !== undefined ? data.isVatRegistered : store.settings.isVatRegistered
  const totals = calculateAllTotals(
    items,
    isVat && data.enableVat !== false,
    Number(data.vatRate) || 7,
    data.enableWht === true,
    Number(data.whtRate) || 0
  )

  const newDoc: MockDocument = {
    id,
    docNumber,
    docType,
    refInvoiceId: data.refInvoiceId || null,
    issueDate: data.issueDate ? new Date(data.issueDate).toISOString() : new Date().toISOString(),
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    billingMonth: month,
    billingYear: year,
    stationName: data.stationName || store.settings.companyName,
    customerName: data.customerName || PEA_HEADQUARTERS.name,
    customerAddress: data.customerAddress || PEA_HEADQUARTERS.address,
    customerTaxId: data.customerTaxId || PEA_HEADQUARTERS.taxId,
    customerBranch: data.customerBranch || PEA_HEADQUARTERS.branch,
    contractRef: data.contractRef || "",
    ...totals,
    enableVat: isVat && data.enableVat !== false,
    enableWht: data.enableWht === true,
    status: data.status || "PENDING",
    paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
    paymentMethod: data.paymentMethod || null,
    paymentRef: data.paymentRef || null,
    notes: data.notes || "",
    thaiBahtText: ThaiBahtText(totals.netPayable),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items,
    isVatRegistered: isVat,
    branchNumber: data.branchNumber || store.settings.branchNumber,
    totalRawAmount: data.totalRawAmount || null,
    peaFeeAmount: data.peaFeeAmount || null,
    totalClaim95: data.totalClaim95 || null,
    payoutStatus: data.payoutStatus || "WAITING_SEND",
    payoutType: data.payoutType || "REGULAR",
    trackingNumber: data.trackingNumber || null,
    shippingDate: data.shippingDate ? new Date(data.shippingDate).toISOString() : null,
    peaReceivedDate: data.peaReceivedDate ? new Date(data.peaReceivedDate).toISOString() : null,
    estimatedPayoutDate: data.estimatedPayoutDate || null,
  }

  const existingIdx = store.documents.findIndex(d => d.id === id)
  if (existingIdx !== -1) {
    store.documents[existingIdx] = newDoc
  } else {
    store.documents.unshift(newDoc)
  }
  return newDoc
}

/**
 * Generate paired PEA Invoice + Receipt simultaneously
 */
export function createMockPairedDocuments(data: any): { invoice: MockDocument; receipt: MockDocument } {
  const isRent = Boolean(data.docType && data.docType.includes("RENT"))
  const invType = isRent ? "INV_RENT" : "INV_ELEC"
  const recType = isRent ? "REC_RENT" : "REC_ELEC"

  // 1. Create Invoice with explicitly unique ID
  const invoiceId = data.invoiceId || `doc-inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const invoiceData = {
    ...data,
    id: invoiceId,
    docType: invType,
    status: "PENDING",
  }
  const invoice = createMockDocument(invoiceData)

  // 2. Create Paired Receipt with explicitly unique ID and receipt date = invoice date + 1 day or specified receiptDate
  const invDate = new Date(invoice.issueDate)
  let recDate = new Date(invDate.getTime() + 86400000) // Next day
  if (data.receiptDate) {
    const specified = new Date(data.receiptDate)
    if (specified >= invDate) {
      recDate = specified
    }
  }

  const receiptId = data.receiptId || `doc-rec-${Date.now() + 10}-${Math.random().toString(36).substring(2, 7)}`
  const receiptData = {
    ...data,
    id: receiptId,
    docType: recType,
    refInvoiceId: invoice.id,
    issueDate: recDate.toISOString(),
    dueDate: null,
    status: "PENDING",
    paymentMethod: "TRANSFER",
    notes: `ออกคู่กับใบแจ้งหนี้ ${invoice.docNumber} เพื่อนำส่ง กฟภ.`,
  }
  const receipt = createMockDocument(receiptData)

  return { invoice, receipt }
}

export function updateMockDocument(id: string, data: any): MockDocument | null {
  const store = getStore()
  const idx = store.documents.findIndex(d => d.id === id)
  if (idx === -1) return null

  const existing = store.documents[idx]
  const docType = data.docType || existing.docType

  const items: MockItem[] = (data.items || existing.items || []).map((it: any, i: number) => ({
    id: it.id || `it-${Date.now()}-${i}`,
    documentId: id,
    itemOrder: it.itemOrder || i + 1,
    description: it.description || "",
    quantity: Number(it.quantity) || 1,
    unitName: it.unitName || (docType.includes("ELEC") ? "Unit" : "เดือน"),
    unitPrice: Number(it.unitPrice) || 0,
    amount: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    meterPrevious: it.meterPrevious != null ? Number(it.meterPrevious) : null,
    meterCurrent: it.meterCurrent != null ? Number(it.meterCurrent) : null,
  }))

  const isVat = data.isVatRegistered !== undefined ? data.isVatRegistered : existing.isVatRegistered
  const totals = calculateAllTotals(
    items,
    isVat && data.enableVat !== false,
    Number(data.vatRate) || 7,
    data.enableWht === true,
    Number(data.whtRate) || 0
  )

  const payoutType = data.payoutType || existing.payoutType || "REGULAR"
  const peaReceivedDate = data.peaReceivedDate !== undefined ? data.peaReceivedDate : existing.peaReceivedDate
  let estimatedPayoutDate = data.estimatedPayoutDate || existing.estimatedPayoutDate
  if (peaReceivedDate) {
    const days = payoutType === "FIRST_TIME" ? 45 : 35
    estimatedPayoutDate = addBusinessDays(peaReceivedDate, days).toISOString()
  }

  const updated: MockDocument = {
    ...existing,
    ...data,
    id,
    ...totals,
    thaiBahtText: ThaiBahtText(totals.netPayable),
    updatedAt: new Date().toISOString(),
    items,
    isVatRegistered: isVat,
    estimatedPayoutDate,
  }

  store.documents[idx] = updated
  return updated
}

export function deleteMockDocument(id: string): boolean {
  const store = getStore()
  const before = store.documents.length
  store.documents = store.documents.filter(d => d.id !== id)
  return store.documents.length < before
}

export function convertMockInvoiceToReceipt(id: string, data: any): MockDocument | null {
  const store = getStore()
  const invoice = store.documents.find(d => d.id === id)
  if (!invoice) return null

  // Ensure receipt date is >= invoice date
  const invDate = new Date(invoice.issueDate)
  let recDate = new Date()
  if (data.paymentDate) {
    const pDate = new Date(data.paymentDate)
    if (pDate >= invDate) recDate = pDate
    else recDate = new Date(invDate.getTime() + 86400000)
  } else if (recDate < invDate) {
    recDate = new Date(invDate.getTime() + 86400000)
  }

  invoice.status = "PAID"
  invoice.updatedAt = new Date().toISOString()

  const targetType = invoice.docType === "INV_ELEC" ? "REC_ELEC" : "REC_RENT"
  const recDocNumber = generateMockDocNumber(targetType, invoice.billingMonth, invoice.billingYear)

  const receiptId = `doc-rec-${Date.now()}`
  const receiptItems: MockItem[] = invoice.items.map((it, idx) => ({
    ...it,
    id: `it-rec-${Date.now()}-${idx}`,
    documentId: receiptId,
  }))

  const newReceipt: MockDocument = {
    ...invoice,
    id: receiptId,
    docNumber: recDocNumber,
    docType: targetType,
    refInvoiceId: invoice.id,
    status: "PAID",
    issueDate: recDate.toISOString(),
    dueDate: null,
    paymentDate: recDate.toISOString(),
    paymentMethod: data.paymentMethod || "TRANSFER",
    paymentRef: data.paymentRef || `AUTO-${Date.now()}`,
    notes: data.notes || `ออกใบเสร็จรับเงินอ้างอิงใบแจ้งหนี้เลขที่ ${invoice.docNumber}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: receiptItems,
  }

  store.documents.unshift(newReceipt)
  return newReceipt
}

export function duplicateMockDocument(id: string): MockDocument | null {
  const store = getStore()
  const source = store.documents.find(d => d.id === id)
  if (!source) return null

  const newId = `doc-dup-${Date.now()}`
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const newDocNumber = generateMockDocNumber(source.docType, currentMonth, currentYear)

  const items: MockItem[] = source.items.map((it, idx) => ({
    ...it,
    id: `it-dup-${Date.now()}-${idx}`,
    documentId: newId,
  }))

  const duplicated: MockDocument = {
    ...source,
    id: newId,
    docNumber: newDocNumber,
    refInvoiceId: null,
    status: "PENDING",
    billingMonth: currentMonth,
    billingYear: currentYear,
    issueDate: now.toISOString(),
    dueDate: source.dueDate ? new Date(now.getTime() + 30 * 86400000).toISOString() : null,
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: `${source.notes} (ทำสำเนาจาก ${source.docNumber})`.trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    items,
    payoutStatus: "WAITING_SEND",
    trackingNumber: null,
    shippingDate: null,
    peaReceivedDate: null,
    estimatedPayoutDate: null,
  }

  store.documents.unshift(duplicated)
  return duplicated
}

export function getMockDashboardStats() {
  const store = getStore()
  const docs = store.documents

  const paidElec = docs.filter(
    d => d.status === "PAID" && (d.docType === "INV_ELEC" || d.docType === "REC_ELEC") && !d.refInvoiceId
  )
  const paidRent = docs.filter(
    d => d.status === "PAID" && (d.docType === "INV_RENT" || d.docType === "REC_RENT") && !d.refInvoiceId
  )

  const totalElectricityRevenue = paidElec.reduce((sum, d) => sum + (d.netPayable || 0), 0)
  const totalRentalRevenue = paidRent.reduce((sum, d) => sum + (d.netPayable || 0), 0)

  const pendingInvoices = docs.filter(d => d.status === "PENDING").length
  const paidInvoices = docs.filter(d => d.status === "PAID").length
  const cancelledInvoices = docs.filter(d => d.status === "CANCELLED").length
  const totalDocuments = docs.length

  const waitingSendCount = docs.filter(d => d.payoutStatus === "WAITING_SEND").length
  const sentCount = docs.filter(d => d.payoutStatus === "SENT").length
  const peaReceivedCount = docs.filter(d => d.payoutStatus === "PEA_RECEIVED").length

  const recentDocuments = docs.slice(0, 5)

  return {
    totalElectricityRevenue: Math.round(totalElectricityRevenue * 100) / 100,
    totalRentalRevenue: Math.round(totalRentalRevenue * 100) / 100,
    pendingInvoices,
    paidInvoices,
    cancelledInvoices,
    totalDocuments,
    waitingSendCount,
    sentCount,
    peaReceivedCount,
    recentDocuments,
  }
}

// Monthly Fee Tracker
export function getMockMonthlyFees(): PeaMonthlyFee[] {
  return getStore().monthlyFees
}

export function createMockMonthlyFee(data: any): PeaMonthlyFee {
  const store = getStore()
  const fee: PeaMonthlyFee = {
    id: `fee-${Date.now()}`,
    billingMonth: parseInt(data.billingMonth, 10),
    billingYear: parseInt(data.billingYear, 10),
    stationName: data.stationName || store.settings.companyName,
    ref1Contract: data.ref1Contract || "",
    ref2Invoice: data.ref2Invoice || "",
    amount: Number(data.amount) || 0,
    paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString(),
    paymentChannel: data.paymentChannel || "PEA_SMART_PLUS",
    status: data.status || "PAID",
    notes: data.notes || "",
    createdAt: new Date().toISOString(),
  }
  store.monthlyFees.unshift(fee)
  return fee
}

export function deleteMockMonthlyFee(id: string): boolean {
  const store = getStore()
  const before = store.monthlyFees.length
  store.monthlyFees = store.monthlyFees.filter(f => f.id !== id)
  return store.monthlyFees.length < before
}

export function resetMockData() {
  globalForStore.mockDocuments = initMockDocuments()
  globalForStore.mockSettings = { ...mockSettings }
  globalForStore.mockMonthlyFees = [...mockMonthlyFees]
  return { success: true, count: globalForStore.mockDocuments.length }
}
