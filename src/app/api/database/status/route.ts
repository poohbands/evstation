import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL || ""

    // Parse safe connection info from DATABASE_URL without exposing passwords
    let host = "Unknown"
    let databaseName = "Unknown"
    let port = "5432"
    let sslMode = "require"
    let isPooled = false
    let provider = "PostgreSQL"
    let region = "สิงคโปร์ (AWS ap-southeast-1)"

    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl)
        host = parsed.hostname || "localhost"
        databaseName = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "Unknown"
        port = parsed.port || "5432"
        sslMode = parsed.searchParams.get("sslmode") || "require"
        isPooled = host.includes("-pooler")

        if (host.includes("neon.tech")) {
          provider = "Neon Serverless PostgreSQL"
          if (host.includes("ap-southeast-1")) {
            region = "สิงคโปร์ (AWS ap-southeast-1)"
          }
        } else if (host.includes("supabase.co")) {
          provider = "Supabase PostgreSQL"
        } else if (host.includes("localhost")) {
          provider = "Local PostgreSQL"
          region = "เครื่องเซิร์ฟเวอร์ภายใน (Localhost)"
        }
      } catch {
        host = rawUrl.split("@")[1]?.split("/")[0] || "Configured"
      }
    }

    // Ping test query to DB and measure round-trip latency
    const pingStart = Date.now()
    const result: any[] =
      await prisma.$queryRaw`SELECT 1 as connected, NOW() as server_time, current_database() as current_db, version() as version`
    const latency = Date.now() - pingStart

    // Query record counts across key models
    const [docCount, itemCount, userCount, settingsCount, monthlyFeeCount] = await Promise.all([
      prisma.document.count(),
      prisma.documentItem.count(),
      prisma.user.count(),
      prisma.organizationSettings.count(),
      prisma.peaMonthlyFee.count(),
    ])

    const serverTime = result[0]?.server_time || new Date().toISOString()
    const pgVersion = result[0]?.version || "PostgreSQL"
    const currentDb = result[0]?.current_db || databaseName

    return NextResponse.json({
      status: "CONNECTED",
      isOnline: true,
      latencyMs: latency,
      provider,
      databaseName: currentDb,
      host,
      port,
      sslMode,
      isPooled,
      region,
      serverTime,
      pgVersion,
      counts: {
        documents: docCount,
        documentItems: itemCount,
        users: userCount,
        settings: settingsCount,
        monthlyFees: monthlyFeeCount,
      },
      checkedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Database connection test error:", error)
    return NextResponse.json(
      {
        status: "DISCONNECTED",
        isOnline: false,
        error: error.message || "ไม่สามารถเชื่อมต่อฐานข้อมูลได้",
        checkedAt: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
