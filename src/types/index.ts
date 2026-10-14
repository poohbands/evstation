export type DocType = 'INV_ELEC' | 'REC_ELEC' | 'INV_RENT' | 'REC_RENT'
export type DocStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type PaymentMethod = 'TRANSFER' | 'CHEQUE' | 'CASH'

export type PayoutStatus = 'WAITING_SEND' | 'SENT' | 'PEA_RECEIVED' | 'PAID'
export type PayoutType = 'FIRST_TIME' | 'REGULAR'

export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  isActive?: boolean
  createdAt: string
}

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
  isVatRegistered?: boolean
  branchNumber?: string
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
  
  // PEA VOLTA 95% Calculation Data
  totalKwh?: number | null
  ratePerKwh?: number | null
  totalRawAmount?: number | null // 100% Excl VAT
  peaFeeAmount?: number | null   // 5% Fee Excl VAT
  totalClaim95?: number | null   // 95% Claim Amount Excl VAT

  // Tracking & Payout
  payoutStatus?: PayoutStatus
  payoutType?: PayoutType
  trackingNumber?: string
  shippingDate?: string | null
  peaReceivedDate?: string | null
  estimatedPayoutDate?: string | null
}

export interface DashboardStats {
  totalElectricityRevenue: number
  totalRentalRevenue: number
  pendingInvoices: number
  paidInvoices: number
  cancelledInvoices: number
  totalDocuments: number
  waitingSendCount?: number
  sentCount?: number
  peaReceivedCount?: number
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
  
  // PEA VOLTA Specific Fields
  isVatRegistered?: boolean
  branchNumber?: string
  totalKwh?: number | null
  ratePerKwh?: number | null
  totalRawAmount?: number | null
  peaFeeAmount?: number | null
  totalClaim95?: number | null

  // Tracking & Payout
  payoutStatus?: PayoutStatus
  payoutType?: PayoutType
  trackingNumber?: string | null
  shippingDate?: Date | string | null
  peaReceivedDate?: Date | string | null
  estimatedPayoutDate?: Date | string | null
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
  bankBranch?: string
  bankAccountType?: 'SAVINGS' | 'CURRENT'
  contactPerson?: string
  contactPhone?: string
  isVatRegistered?: boolean
  branchNumber?: string
  signerName: string
  signerTitle: string
  logoUrl?: string
  defaultCustomerName?: string
  defaultCustomerAddress?: string
  defaultCustomerTaxId?: string
  defaultCustomerBranch?: string
  isMaintenanceMode?: boolean
  maintenanceMessage?: string
  maintenanceUntil?: string
}

export interface PeaMonthlyFee {
  id: string
  billingMonth: number
  billingYear: number
  stationName: string
  ref1Contract: string
  ref2Invoice: string
  amount: number
  paymentDate: string
  paymentChannel: 'PEA_SMART_PLUS' | 'COUNTER' | 'OTHER'
  status: 'PAID' | 'PENDING'
  slipUrl?: string
  notes?: string
  createdAt: string
}
