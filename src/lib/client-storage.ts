import type { DocumentWithItems } from "@/types"

const STORAGE_KEY = "ev_station_custom_documents"

export function getLocalDocuments(): DocumentWithItems[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.warn("Failed to parse local documents", e)
    return []
  }
}

export function getLocalDocument(id: string): DocumentWithItems | null {
  const docs = getLocalDocuments()
  return docs.find((d) => d.id === id) || null
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
