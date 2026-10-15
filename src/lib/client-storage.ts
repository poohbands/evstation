import type { DocumentWithItems } from "@/types"

const STORAGE_KEY = "ev_station_custom_documents"

export function getLocalDocuments(): DocumentWithItems[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    // Auto-recover paired invoices for receipts that lost their partner invoice due to earlier ID collision
    let hasRecovered = false
    const recoveredInvoices: DocumentWithItems[] = []

    for (const doc of parsed) {
      if (doc.docType === "REC_ELEC" || doc.docType === "REC_RENT") {
        const isElec = doc.docType === "REC_ELEC"
        const recPrefix = isElec ? "REC-EV-" : "REC-RENT-"
        const invPrefix = isElec ? "INV-EV-" : "INV-RENT-"

        if (doc.docNumber && doc.docNumber.startsWith(recPrefix)) {
          const invDocNumber = doc.docNumber.replace(recPrefix, invPrefix)
          const matchingInvoice = parsed.find((d: any) => d.docNumber === invDocNumber)

          if (!matchingInvoice) {
            const invId = `doc-inv-recovered-${doc.id.replace(/^doc-(rec-)?/, "")}`
            const recDate = new Date(doc.issueDate || Date.now())
            const invDate = new Date(recDate.getTime() - 86400000) // 1 day before receipt

            const restoredInvoice: DocumentWithItems = {
              ...doc,
              id: invId,
              docNumber: invDocNumber,
              docType: isElec ? "INV_ELEC" : "INV_RENT",
              refInvoiceId: null,
              issueDate: invDate.toISOString(),
              dueDate: new Date(invDate.getTime() + 30 * 86400000).toISOString(),
              status: "PENDING",
              notes: `ใบแจ้งหนี้ (ออกคู่กับ ${doc.docNumber})`,
              createdAt: doc.createdAt
                ? new Date(new Date(doc.createdAt).getTime() - 1000).toISOString()
                : new Date().toISOString(),
              items: (doc.items || []).map((it: any, idx: number) => ({
                ...it,
                id: `it-${invId}-${idx}`,
                documentId: invId,
              })),
            }

            recoveredInvoices.push(restoredInvoice)
            doc.refInvoiceId = invId
            hasRecovered = true
          }
        }
      }
    }

    if (hasRecovered && recoveredInvoices.length > 0) {
      parsed.unshift(...recoveredInvoices)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }

    return parsed
  } catch (e) {
    console.warn("Failed to parse local documents", e)
    return []
  }
}

export function getLocalDocument(id: string): DocumentWithItems | null {
  const docs = getLocalDocuments()
  return docs.find((d) => d.id === id || d.docNumber === id) || null
}

export function saveLocalDocument(doc: any): void {
  if (typeof window === "undefined" || !doc || !doc.id) return
  try {
    const docs = getLocalDocuments()
    const idx = docs.findIndex((d) => d.id === doc.id)
    if (idx !== -1) {
      docs[idx] = { ...docs[idx], ...doc }
    } else {
      docs.unshift(doc)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch (e) {
    console.warn("Failed to save local document", e)
  }
}

export function removeLocalDocument(id: string): void {
  if (typeof window === "undefined") return
  try {
    const docs = getLocalDocuments().filter((d) => d.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch (e) {
    console.warn("Failed to remove local document", e)
  }
}
