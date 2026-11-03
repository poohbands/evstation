import { prisma } from "@/lib/prisma"
import payloadTemplate from "./mainTablePayload.json"

export interface StationTransactionRecord {
  id: string
  date: string
  dateIso: string
  stationName: string
  chargerDevice: string
  connector: string
  vcard: string
  startTime: string
  stopTime: string
  duration: string
  durationSeconds: number
  durationMinutes: number
  kwh: number
  revenue: number
}

function parseDurationSeconds(dur: string): number {
  if (!dur) return 0
  const parts = dur.split(":").map(Number)
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0)
  }
  return 0
}

/**
 * Fetch live transaction data directly from Google Looker Studio batchedDataV2 API
 */
export async function fetchLookerStudioTransactions(
  maxRows = 500,
  timeoutMs = 7000
): Promise<StationTransactionRecord[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const payload = JSON.parse(JSON.stringify(payloadTemplate))
    if (payload.dataRequest?.[0]?.datasetSpec) {
      payload.dataRequest[0].datasetSpec.paginateInfo = {
        startRow: 1,
        rowsCount: maxRows,
      }
    }

    const res = await fetch(
      "https://datastudio.google.com/batchedDataV2?appVersion=20261025_0000",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer:
            "https://datastudio.google.com/reporting/c095ebd9-3ddc-481d-99e6-942ab0ab354e/page/m0ViF",
          Origin: "https://datastudio.google.com",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      }
    )

    if (!res.ok) {
      throw new Error(`Looker Studio responded with HTTP ${res.status}`)
    }

    let text = await res.text()
    const braceIdx = text.indexOf("{")
    if (braceIdx !== -1) {
      text = text.slice(braceIdx)
    }

    const json = JSON.parse(text)
    const table = json.dataResponse?.[0]?.dataSubset?.[0]?.dataset?.tableDataset
    if (!table || !Array.isArray(table.column)) {
      throw new Error("Invalid table format in Looker Studio response")
    }

    const getColValues = (idx: number): any[] => {
      const col = table.column[idx]
      if (!col) return []
      const key = Object.keys(col).find((k) => k.endsWith("Column"))
      return (col as any)[key!]?.values || []
    }

    const dates: string[] = getColValues(0)
    const stations: string[] = getColValues(1)
    const chargers: string[] = getColValues(2)
    const connectors: string[] = getColValues(3)
    const vcards: string[] = getColValues(4)
    const startTimes: string[] = getColValues(5)
    const stopTimes: string[] = getColValues(6)
    const durations: string[] = getColValues(7)
    const kwhs: number[] = getColValues(8)
    const revenues: number[] = getColValues(9)

    const transactions: StationTransactionRecord[] = []
    for (let i = 0; i < dates.length; i++) {
      const dateIso = dates[i] || ""
      const startTimeRaw = startTimes[i] || ""
      const startTime = startTimeRaw.replace("T", " ")
      const stopTime = (stopTimes[i] || "").replace("T", " ")
      const duration = durations[i] || "00:00:00"
      const durSec = parseDurationSeconds(duration)
      const kwh = Math.round((Number(kwhs[i]) || 0) * 100) / 100
      const revenue = Math.round((Number(revenues[i]) || 0) * 100) / 100

      let displayDate = dateIso
      if (dateIso && dateIso.includes("-")) {
        const [y, m, d] = dateIso.split("-")
        displayDate = `${d}/${m}/${y}`
      }

      transactions.push({
        id: `tx-${startTime}_${vcards[i] || ""}_${connectors[i] || ""}`,
        date: displayDate,
        dateIso,
        stationName: stations[i] || "สถานีชาร์จ พญาเสืออีวี",
        chargerDevice: chargers[i] || "สถานีชาร์จ พญาเสืออีวี",
        connector: connectors[i] || "CCS2-1",
        vcard: vcards[i] || "",
        startTime,
        stopTime,
        duration,
        durationSeconds: durSec,
        durationMinutes: Math.round((durSec / 60) * 10) / 10,
        kwh,
        revenue,
      })
    }

    return transactions
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Upsert transactions into database asynchronously or synchronously
 */
export async function syncTransactionsToDatabase(
  transactions: StationTransactionRecord[]
): Promise<number> {
  if (!transactions.length) return 0

  let updatedCount = 0
  for (const item of transactions) {
    if (!item.startTime || !item.vcard || !item.connector) continue

    try {
      await prisma.stationTransaction.upsert({
        where: {
          startTime_vcard_connector: {
            startTime: item.startTime,
            vcard: item.vcard,
            connector: item.connector,
          },
        },
        update: {
          date: item.date || item.dateIso,
          dateIso: item.dateIso,
          stationName: item.stationName,
          chargerDevice: item.chargerDevice,
          stopTime: item.stopTime,
          duration: item.duration,
          durationSeconds: item.durationSeconds,
          durationMinutes: item.durationMinutes,
          kwh: item.kwh,
          revenue: item.revenue,
        },
        create: {
          stationName: item.stationName,
          chargerDevice: item.chargerDevice,
          connector: item.connector,
          vcard: item.vcard,
          date: item.date || item.dateIso,
          dateIso: item.dateIso,
          startTime: item.startTime,
          stopTime: item.stopTime,
          duration: item.duration,
          durationSeconds: item.durationSeconds,
          durationMinutes: item.durationMinutes,
          kwh: item.kwh,
          revenue: item.revenue,
        },
      })
      updatedCount++
    } catch (err) {
      console.warn("Failed to upsert transaction:", item.id, err)
    }
  }

  return updatedCount
}
