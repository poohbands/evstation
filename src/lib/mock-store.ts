import { ThaiBahtText } from "@/lib/thai-baht-text"
import { calculateAllTotals, getDefaultWhtRate } from "@/lib/calculations"
import { DOC_TYPE_PREFIXES } from "@/lib/utils"

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
  signerName: string
  signerTitle: string
  logoUrl: string
  defaultCustomerName: string
  defaultCustomerAddress: string
  defaultCustomerTaxId: string
  defaultCustomerBranch: string
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
  signerName: "นายสมชาย รักษ์พลังงาน",
  signerTitle: "กรรมการผู้จัดการ",
  logoUrl: "",
  defaultCustomerName: "การไฟฟ้าส่วนภูมิภาค",
  defaultCustomerAddress: "200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900",
  defaultCustomerTaxId: "0994000165509",
  defaultCustomerBranch: "สำนักงานใหญ่",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

let mockDocuments: MockDocument[] = []

function initMockDocuments(): MockDocument[] {
  const defaultCust = {
    customerName: mockSettings.defaultCustomerName,
    customerAddress: mockSettings.defaultCustomerAddress,
    customerTaxId: mockSettings.defaultCustomerTaxId,
    customerBranch: mockSettings.defaultCustomerBranch,
    contractRef: "สัญญาเลขที่ EV-PEA-2025/089",
    stationName: "สถานีชาร์จ กรีนชาร์จ คลองหลวง",
  }

  // 1. July Electricity Invoice
  const itJulElec = [
    {
      id: "it-jul-elec-1",
      documentId: "doc-inv-jul-elec",
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
  const totJulElec = calculateAllTotals(itJulElec, true, 7, true, 3)
  const docJulElec: MockDocument = {
    id: "doc-inv-jul-elec",
    docNumber: "INV-EV-202607-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-07-31T00:00:00.000Z",
    dueDate: "2026-08-15T00:00:00.000Z",
    billingMonth: 7,
    billingYear: 2026,
    ...defaultCust,
    ...totJulElec,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-08-10T09:30:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "KTB-TRF-20260810-771",
    notes: "ชำระเงินเรียบร้อยแล้วผ่านธนาคารกรุงไทย",
    thaiBahtText: ThaiBahtText(totJulElec.netPayable),
    createdAt: "2026-07-31T08:00:00.000Z",
    updatedAt: "2026-08-10T09:30:00.000Z",
    items: itJulElec,
  }

  // 2. July Electricity Receipt
  const recJulElec: MockDocument = {
    id: "doc-rec-jul-elec",
    docNumber: "REC-EV-202607-001",
    docType: "REC_ELEC",
    refInvoiceId: docJulElec.id,
    issueDate: "2026-08-10T09:30:00.000Z",
    dueDate: null,
    billingMonth: 7,
    billingYear: 2026,
    ...defaultCust,
    ...totJulElec,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-08-10T09:30:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "KTB-TRF-20260810-771",
    notes: "รับชำระค่าส่วนต่างไฟฟ้าเรียบร้อย",
    thaiBahtText: ThaiBahtText(totJulElec.netPayable),
    createdAt: "2026-08-10T09:30:00.000Z",
    updatedAt: "2026-08-10T09:30:00.000Z",
    items: itJulElec.map(i => ({ ...i, id: "it-rec-jul-elec-1", documentId: "doc-rec-jul-elec" })),
  }

  // 3. July Rent Invoice
  const itJulRent = [
    {
      id: "it-jul-rent-1",
      documentId: "doc-inv-jul-rent",
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน กรกฎาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
      meterPrevious: null,
      meterCurrent: null,
    },
    {
      id: "it-jul-rent-2",
      documentId: "doc-inv-jul-rent",
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน กรกฎาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]
  const totJulRent = calculateAllTotals(itJulRent, true, 7, true, 5)
  const docJulRent: MockDocument = {
    id: "doc-inv-jul-rent",
    docNumber: "INV-RENT-202607-001",
    docType: "INV_RENT",
    refInvoiceId: null,
    issueDate: "2026-07-01T00:00:00.000Z",
    dueDate: "2026-07-15T00:00:00.000Z",
    billingMonth: 7,
    billingYear: 2026,
    ...defaultCust,
    ...totJulRent,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-07-12T14:15:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "BBL-TRF-20260712-452",
    notes: "ชำระตรงตามกำหนดเวลา",
    thaiBahtText: ThaiBahtText(totJulRent.netPayable),
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-12T14:15:00.000Z",
    items: itJulRent,
  }

  // 4. July Rent Receipt
  const recJulRent: MockDocument = {
    id: "doc-rec-jul-rent",
    docNumber: "REC-RENT-202607-001",
    docType: "REC_RENT",
    refInvoiceId: docJulRent.id,
    issueDate: "2026-07-12T14:15:00.000Z",
    dueDate: null,
    billingMonth: 7,
    billingYear: 2026,
    ...defaultCust,
    ...totJulRent,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-07-12T14:15:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "BBL-TRF-20260712-452",
    notes: "ออกใบเสร็จรับเงินค่าเช่าพื้นที่",
    thaiBahtText: ThaiBahtText(totJulRent.netPayable),
    createdAt: "2026-07-12T14:15:00.000Z",
    updatedAt: "2026-07-12T14:15:00.000Z",
    items: itJulRent.map(i => ({ ...i, id: `it-rec-jul-rent-${i.itemOrder}`, documentId: "doc-rec-jul-rent" })),
  }

  // 5. August Electricity Invoice
  const itAugElec = [
    {
      id: "it-aug-elec-1",
      documentId: "doc-inv-aug-elec",
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
  const totAugElec = calculateAllTotals(itAugElec, true, 7, true, 3)
  const docAugElec: MockDocument = {
    id: "doc-inv-aug-elec",
    docNumber: "INV-EV-202608-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-08-31T00:00:00.000Z",
    dueDate: "2026-09-15T00:00:00.000Z",
    billingMonth: 8,
    billingYear: 2026,
    ...defaultCust,
    ...totAugElec,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-09-10T11:00:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "KTB-TRF-20260910-882",
    notes: "รับชำระเรียบร้อย",
    thaiBahtText: ThaiBahtText(totAugElec.netPayable),
    createdAt: "2026-08-31T08:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
    items: itAugElec,
  }

  // 6. August Electricity Receipt
  const recAugElec: MockDocument = {
    id: "doc-rec-aug-elec",
    docNumber: "REC-EV-202608-001",
    docType: "REC_ELEC",
    refInvoiceId: docAugElec.id,
    issueDate: "2026-09-10T11:00:00.000Z",
    dueDate: null,
    billingMonth: 8,
    billingYear: 2026,
    ...defaultCust,
    ...totAugElec,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-09-10T11:00:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "KTB-TRF-20260910-882",
    notes: "ออกใบเสร็จรับเงินค่าส่วนต่างไฟฟ้า",
    thaiBahtText: ThaiBahtText(totAugElec.netPayable),
    createdAt: "2026-09-10T11:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
    items: itAugElec.map(i => ({ ...i, id: "it-rec-aug-elec-1", documentId: "doc-rec-aug-elec" })),
  }

  // 7. August Rent Invoice
  const itAugRent = [
    {
      id: "it-aug-rent-1",
      documentId: "doc-inv-aug-rent",
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน สิงหาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
      meterPrevious: null,
      meterCurrent: null,
    },
    {
      id: "it-aug-rent-2",
      documentId: "doc-inv-aug-rent",
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน สิงหาคม 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]
  const totAugRent = calculateAllTotals(itAugRent, true, 7, true, 5)
  const docAugRent: MockDocument = {
    id: "doc-inv-aug-rent",
    docNumber: "INV-RENT-202608-001",
    docType: "INV_RENT",
    refInvoiceId: null,
    issueDate: "2026-08-01T00:00:00.000Z",
    dueDate: "2026-08-15T00:00:00.000Z",
    billingMonth: 8,
    billingYear: 2026,
    ...defaultCust,
    ...totAugRent,
    enableVat: true,
    enableWht: true,
    status: "PAID",
    paymentDate: "2026-08-14T10:20:00.000Z",
    paymentMethod: "TRANSFER",
    paymentRef: "SCB-TRF-20260814-119",
    notes: "ชำระเงินเรียบร้อย",
    thaiBahtText: ThaiBahtText(totAugRent.netPayable),
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-14T10:20:00.000Z",
    items: itAugRent,
  }

  // 8. September Electricity Invoice (PENDING)
  const itSepElec = [
    {
      id: "it-sep-elec-1",
      documentId: "doc-inv-sep-elec",
      itemOrder: 1,
      description: "ค่าส่วนต่างกระแสไฟฟ้า สถานีชาร์จ กรีนชาร์จ คลองหลวง ประจำเดือน กันยายน 2569 (ราคาขาย 6.50 บาท - ต้นทุน 4.50 บาท)",
      quantity: 8100,
      unitName: "kWh",
      unitPrice: 2.0,
      amount: 16200.0,
      meterPrevious: 138200.0,
      meterCurrent: 146300.0,
    },
  ]
  const totSepElec = calculateAllTotals(itSepElec, true, 7, true, 3)
  const docSepElec: MockDocument = {
    id: "doc-inv-sep-elec",
    docNumber: "INV-EV-202609-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-09-30T00:00:00.000Z",
    dueDate: "2026-10-15T00:00:00.000Z",
    billingMonth: 9,
    billingYear: 2026,
    ...defaultCust,
    ...totSepElec,
    enableVat: true,
    enableWht: true,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: "ส่งวางบิลเรียบร้อย รอการไฟฟ้าส่วนภูมิภาคดำเนินการจ่ายเงิน",
    thaiBahtText: ThaiBahtText(totSepElec.netPayable),
    createdAt: "2026-09-30T08:00:00.000Z",
    updatedAt: "2026-09-30T08:00:00.000Z",
    items: itSepElec,
  }

  // 9. September Rent Invoice (PENDING)
  const itSepRent = [
    {
      id: "it-sep-rent-1",
      documentId: "doc-inv-sep-rent",
      itemOrder: 1,
      description: "ค่าเช่าพื้นที่ติดตั้งสถานีชาร์จยานยนต์ไฟฟ้า ประจำเดือน กันยายน 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 25000.0,
      amount: 25000.0,
      meterPrevious: null,
      meterCurrent: null,
    },
    {
      id: "it-sep-rent-2",
      documentId: "doc-inv-sep-rent",
      itemOrder: 2,
      description: "ค่าบริการพื้นที่ส่วนกลางและรักษาความสะอาด ประจำเดือน กันยายน 2569",
      quantity: 1,
      unitName: "เดือน",
      unitPrice: 3500.0,
      amount: 3500.0,
      meterPrevious: null,
      meterCurrent: null,
    },
  ]
  const totSepRent = calculateAllTotals(itSepRent, true, 7, true, 5)
  const docSepRent: MockDocument = {
    id: "doc-inv-sep-rent",
    docNumber: "INV-RENT-202609-001",
    docType: "INV_RENT",
    refInvoiceId: null,
    issueDate: "2026-09-01T00:00:00.000Z",
    dueDate: "2026-09-15T00:00:00.000Z",
    billingMonth: 9,
    billingYear: 2026,
    ...defaultCust,
    ...totSepRent,
    enableVat: true,
    enableWht: true,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: "รอวางบิลรอบสิ้นเดือน",
    thaiBahtText: ThaiBahtText(totSepRent.netPayable),
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-01T09:00:00.000Z",
    items: itSepRent,
  }

  // 10. October Rent Invoice (PENDING)
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
    notes: "ออกใบแจ้งหนี้รอบต้นเดือน ตุลาคม",
    thaiBahtText: ThaiBahtText(totOctRent.netPayable),
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    items: itOctRent,
  }

  // 11. October Electricity Invoice (PENDING)
  const itOctElec = [
    {
      id: "it-oct-elec-1",
      documentId: "doc-inv-oct-elec",
      itemOrder: 1,
      description: "ค่าส่วนต่างกระแสไฟฟ้า สถานีชาร์จ กรีนชาร์จ คลองหลวง ประจำเดือน ตุลาคม 2569 (ยอดประมาณการครึ่งเดือนแรก)",
      quantity: 4200,
      unitName: "kWh",
      unitPrice: 2.0,
      amount: 8400.0,
      meterPrevious: 146300.0,
      meterCurrent: 150500.0,
    },
  ]
  const totOctElec = calculateAllTotals(itOctElec, true, 7, true, 3)
  const docOctElec: MockDocument = {
    id: "doc-inv-oct-elec",
    docNumber: "INV-EV-202610-001",
    docType: "INV_ELEC",
    refInvoiceId: null,
    issueDate: "2026-10-14T00:00:00.000Z",
    dueDate: "2026-10-28T00:00:00.000Z",
    billingMonth: 10,
    billingYear: 2026,
    ...defaultCust,
    ...totOctElec,
    enableVat: true,
    enableWht: true,
    status: "PENDING",
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: "บิลรอบปัจจุบัน รอดำเนินการ",
    thaiBahtText: ThaiBahtText(totOctElec.netPayable),
    createdAt: "2026-10-14T08:00:00.000Z",
    updatedAt: "2026-10-14T08:00:00.000Z",
    items: itOctElec,
  }

  return [
    docOctElec,
    docOctRent,
    docSepElec,
    docSepRent,
    recAugElec,
    docAugElec,
    docAugRent,
    recJulRent,
    docJulRent,
    recJulElec,
    docJulElec,
  ]
}

// Global in-memory cache across requests
const globalForStore = globalThis as unknown as {
  mockDocuments: MockDocument[] | undefined
  mockSettings: MockSettings | undefined
}

export function getStore() {
  if (!globalForStore.mockDocuments || globalForStore.mockDocuments.length === 0) {
    globalForStore.mockDocuments = initMockDocuments()
  }
  if (!globalForStore.mockSettings) {
    globalForStore.mockSettings = { ...mockSettings }
  }
  return {
    documents: globalForStore.mockDocuments,
    settings: globalForStore.mockSettings,
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

export function getMockDocuments(filters?: {
  type?: string | null
  status?: string | null
  month?: string | null
  year?: string | null
  search?: string | null
}): MockDocument[] {
  const store = getStore()
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
        d.contractRef.toLowerCase().includes(q)
    )
  }

  // Populate refInvoice if present
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
  const id = `doc-${Date.now()}`
  const month = parseInt(data.billingMonth || "10", 10)
  const year = parseInt(data.billingYear || "2026", 10)
  const docType = data.docType || "INV_ELEC"

  const docNumber = data.docNumber || generateMockDocNumber(docType, month, year)

  const items: MockItem[] = (data.items || []).map((it: any, idx: number) => ({
    id: `it-${Date.now()}-${idx}`,
    documentId: id,
    itemOrder: it.itemOrder || idx + 1,
    description: it.description || "",
    quantity: Number(it.quantity) || 0,
    unitName: it.unitName || "",
    unitPrice: Number(it.unitPrice) || 0,
    amount: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    meterPrevious: it.meterPrevious != null ? Number(it.meterPrevious) : null,
    meterCurrent: it.meterCurrent != null ? Number(it.meterCurrent) : null,
  }))

  const totals = calculateAllTotals(
    items,
    data.enableVat !== false,
    Number(data.vatRate) || 7,
    data.enableWht !== false,
    Number(data.whtRate) || getDefaultWhtRate(docType)
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
    customerName: data.customerName || store.settings.defaultCustomerName,
    customerAddress: data.customerAddress || store.settings.defaultCustomerAddress,
    customerTaxId: data.customerTaxId || store.settings.defaultCustomerTaxId,
    customerBranch: data.customerBranch || store.settings.defaultCustomerBranch,
    contractRef: data.contractRef || "",
    ...totals,
    enableVat: data.enableVat !== false,
    enableWht: data.enableWht !== false,
    status: data.status || "PENDING",
    paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : null,
    paymentMethod: data.paymentMethod || null,
    paymentRef: data.paymentRef || null,
    notes: data.notes || "",
    thaiBahtText: ThaiBahtText(totals.netPayable),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items,
  }

  store.documents.unshift(newDoc)
  return newDoc
}

export function updateMockDocument(id: string, data: any): MockDocument | null {
  const store = getStore()
  const idx = store.documents.findIndex(d => d.id === id)
  if (idx === -1) return null

  const existing = store.documents[idx]
  const docType = data.docType || existing.docType

  const items: MockItem[] = (data.items || []).map((it: any, i: number) => ({
    id: it.id || `it-${Date.now()}-${i}`,
    documentId: id,
    itemOrder: it.itemOrder || i + 1,
    description: it.description || "",
    quantity: Number(it.quantity) || 0,
    unitName: it.unitName || "",
    unitPrice: Number(it.unitPrice) || 0,
    amount: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    meterPrevious: it.meterPrevious != null ? Number(it.meterPrevious) : null,
    meterCurrent: it.meterCurrent != null ? Number(it.meterCurrent) : null,
  }))

  const totals = calculateAllTotals(
    items,
    data.enableVat !== false,
    Number(data.vatRate) || 7,
    data.enableWht !== false,
    Number(data.whtRate) || getDefaultWhtRate(docType)
  )

  const updated: MockDocument = {
    ...existing,
    ...data,
    id,
    ...totals,
    thaiBahtText: ThaiBahtText(totals.netPayable),
    updatedAt: new Date().toISOString(),
    items,
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

  // Mark invoice as PAID
  invoice.status = "PAID"
  invoice.updatedAt = new Date().toISOString()

  // Target receipt type
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
    issueDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString(),
    dueDate: null,
    paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString() : new Date().toISOString(),
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
    dueDate: source.dueDate ? new Date(now.getTime() + 15 * 86400000).toISOString() : null,
    paymentDate: null,
    paymentMethod: null,
    paymentRef: null,
    notes: `${source.notes} (ทำสำเนาจาก ${source.docNumber})`.trim(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    items,
  }

  store.documents.unshift(duplicated)
  return duplicated
}

export function getMockDashboardStats() {
  const store = getStore()
  const docs = store.documents

  // Avoid double counting receipts that reference invoices
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

  const recentDocuments = docs.slice(0, 5)

  return {
    totalElectricityRevenue: Math.round(totalElectricityRevenue * 100) / 100,
    totalRentalRevenue: Math.round(totalRentalRevenue * 100) / 100,
    pendingInvoices,
    paidInvoices,
    cancelledInvoices,
    totalDocuments,
    recentDocuments,
  }
}

export function resetMockData() {
  globalForStore.mockDocuments = initMockDocuments()
  globalForStore.mockSettings = { ...mockSettings }
  return { success: true, count: globalForStore.mockDocuments.length }
}
