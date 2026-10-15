import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest, getClientInfo, logActivity } from "@/lib/audit-logger"

export const dynamic = "force-dynamic"

/**
 * GET /api/logs
 * Retrieves audit logs with filtering and pagination. Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    // Verify ADMIN permission
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Only) เท่านั้นที่สามารถดูประวัติการใช้งานได้" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)))
    const category = searchParams.get("category")
    const action = searchParams.get("action")
    const search = searchParams.get("search")?.trim()
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (category && category !== "ALL") {
      where.category = category
    }

    if (action && action !== "ALL") {
      where.action = action
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { targetName: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ]
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // Calculate quick stats for the dashboard header
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayCount, authTodayCount, docTodayCount] = await Promise.all([
      prisma.auditLog.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: todayStart },
          category: "AUTH",
          action: "LOGIN",
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: todayStart },
          category: "DOCUMENT",
        },
      }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
      stats: {
        totalLogs: total,
        todayCount,
        authTodayCount,
        docTodayCount,
      },
    })
  } catch (error: any) {
    console.error("GET /api/logs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/logs
 * Allows recording client-initiated events (e.g., LOGOUT, PRINT_DOCUMENT, EXPORT_PDF)
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    const client = getClientInfo(request)
    const body = await request.json()

    const { action, category, description, targetId, targetName, details } = body

    if (!action || !category || !description) {
      return NextResponse.json(
        { error: "ข้อมูลบันทึกไม่ครบถ้วน (action, category, description)" },
        { status: 400 }
      )
    }

    await logActivity({
      userId: user.id,
      username: user.username || body.username || "anonymous",
      userRole: user.role || body.userRole || "",
      action,
      category,
      description,
      targetId,
      targetName,
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      details,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("POST /api/logs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
