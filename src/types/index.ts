export type DocType = 'INV_ELEC' | 'REC_ELEC' | 'INV_RENT' | 'REC_RENT'
export type DocStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type PaymentMethod = 'TRANSFER' | 'CHEQUE' | 'CASH'

export interface DocumentItemInput {
  id?: string
  itemOrder: number
  description: string
  quantity: number
  unitName: string
  unitPrice: number
  amount: number
  meterPrevious?: number | null
  meterCurrent?: number | null
}

export interface DocumentFormData {
  docType: DocType
  issueDate: string
  dueDate?: string
  billingMonth: number
  billingYear: number
  stationName: string
  customerName: string
  customerAddress: string
  customerTaxId: string
  customerBranch: string
  contractRef: string
  enableVat: boolean
  enableWht: boolean
  vatRate: number
  whtRate: number
  status: DocStatus
  paymentDate?: string
  paymentMethod?: PaymentMethod
  paymentRef?: string
  notes: string
  items: DocumentItemInput[]
  refInvoiceId?: string
}

export interface DashboardStats {
  totalElectricityRevenue: number
  totalRentalRevenue: number
  pendingInvoices: number
  paidInvoices: number
  cancelledInvoices: number
  totalDocuments: number
}

export interface DocumentWithItems {
  id: string
  docNumber: string
  docType: string
  refInvoiceId: string | null
  issueDate: Date | string
  dueDate: Date | string | null
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
  paymentDate: Date | string | null
  paymentMethod: string | null
  paymentRef: string | null
  notes: string
  thaiBahtText: string
  createdAt: Date | string
  updatedAt: Date | string
  items: DocumentItemInput[]
  refInvoice?: DocumentWithItems | null
  receipts?: DocumentWithItems[]
}

export interface OrganizationSettingsData {
  id?: string
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
  logoUrl?: string
  defaultCustomerName?: string
  defaultCustomerAddress?: string
  defaultCustomerTaxId?: string
  defaultCustomerBranch?: string
}
