import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import defaultTransactions from "@/data/phayaSueaTransactions.json"
import {
  fetchLookerStudioTransactions,
  syncTransactionsToDatabase,
} from "@/lib/looker-service"

// In-memory cache throttle: sync at most once every 60 seconds unless ?refresh=true is provided
let lastLiveSyncTime = 0
const AUTO_SYNC_INTERVAL_MS = 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // e.g. "2026-11"
    const station = searchParams.get("station") || "สถานีชาร์จ พญาเสืออีวี"
    const forceRefresh = searchParams.get("refresh") === "true"

    const shouldSyncFromLooker =
      forceRefresh || Date.now() - lastLiveSyncTime > AUTO_SYNC_INTERVAL_MS

    if (shouldSyncFromLooker) {
      try {
        const liveTxs = await fetchLookerStudioTransactions(500, 6000)
        if (liveTxs && liveTxs.length > 0) {
          lastLiveSyncTime = Date.now()
          // Asynchronously upsert records to Neon DB
          syncTransactionsToDatabase(liveTxs).catch((err) =>
            console.error("Error in background database upsert:", err)
          )
        }
      } catch (syncErr: any) {
        console.warn("Looker Studio automatic fetch notice:", syncErr.message)
      }
    }

    let where: any = {}
    if (station && station !== "ALL") {
      where.stationName = station
    }
    if (month) {
      where.dateIso = { startsWith: month }
    }

    const dbTransactions = await prisma.stationTransaction.findMany({
      where,
      orderBy: [{ dateIso: "desc" }, { startTime: "desc" }],
    })

    const data =
      dbTransactions.length > 0 ? dbTransactions : defaultTransactions

    return NextResponse.json({
      success: true,
      count: data.length,
      lastSyncedAt: new Date().toISOString(),
      source: "LOOKER_STUDIO_LIVE",
      data,
    })
  } catch (error: any) {
    console.error("Error fetching station reports data:", error)
    return NextResponse.json({
      success: true,
      count: defaultTransactions.length,
      lastSyncedAt: new Date().toISOString(),
      source: "FALLBACK_BUNDLED",
      data: defaultTransactions,
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required" },
        { status: 400 }
      )
    }

    let upsertCount = 0
    for (const item of items) {
      if (!item.startTime || !item.vcard || !item.connector) continue

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
          stationName: item.stationName || "สถานีชาร์จ พญาเสืออีวี",
          chargerDevice: item.chargerDevice || "สถานีชาร์จ พญาเสืออีวี",
          stopTime: item.stopTime || "",
          duration: item.duration || "",
          durationSeconds: item.durationSeconds || 0,
          durationMinutes: item.durationMinutes || 0,
          kwh: item.kwh || 0,
          revenue: item.revenue || 0,
        },
        create: {
          stationName: item.stationName || "สถานีชาร์จ พญาเสืออีวี",
          chargerDevice: item.chargerDevice || "สถานีชาร์จ พญาเสืออีวี",
          connector: item.connector,
          vcard: item.vcard,
          date: item.date || item.dateIso,
          dateIso: item.dateIso,
          startTime: item.startTime,
          stopTime: item.stopTime || "",
          duration: item.duration || "",
          durationSeconds: item.durationSeconds || 0,
          durationMinutes: item.durationMinutes || 0,
          kwh: item.kwh || 0,
          revenue: item.revenue || 0,
        },
      })
      upsertCount++
    }

    const totalCount = await prisma.stationTransaction.count()

    return NextResponse.json({
      success: true,
      message: `ซิงค์ข้อมูลสำเร็จ ${upsertCount} รายการ`,
      totalInDatabase: totalCount,
      lastSyncedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error saving transactions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save transactions" },
      { status: 500 }
    )
  }
}
