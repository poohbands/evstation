import prisma from "@/lib/prisma"
import { DOC_TYPE_PREFIXES } from "@/lib/utils"

/**
 * Generate document numbers in format: PREFIX-YYYYMM-XXX
 * where XXX is a zero-padded sequential number (e.g. INV-EV-202610-001)
 */
export async function generateDocNumber(
  docType: string,
  billingMonth: number,
  billingYear: number
): Promise<string> {
  const prefix = DOC_TYPE_PREFIXES[docType] || docType
  const monthStr = billingMonth.toString().padStart(2, "0")
  const yearStr = billingYear.toString()
  const pattern = `${prefix}-${yearStr}${monthStr}-`

  // Find documents starting with this pattern to find the highest sequence number
  const existingDocs = await prisma.document.findMany({
    where: {
      docNumber: {
        startsWith: pattern,
      },
    },
    select: {
      docNumber: true,
    },
  })

  let maxSeq = 0
  for (const doc of existingDocs) {
    const suffix = doc.docNumber.slice(pattern.length)
    const seq = parseInt(suffix, 10)
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(3, "0")
  return `${pattern}${nextSeq}`
}
