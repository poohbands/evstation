import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export type LogCategory = "AUTH" | "DOCUMENT" | "USER" | "SETTINGS" | "MONTHLY_FEE" | "SYSTEM"

export interface CreateAuditLogParams {
  userId?: string
  username?: string
  userRole?: string
  action: string
  category: LogCategory
  description: string
  targetId?: string
  targetName?: string
  ipAddress?: string
  userAgent?: string
  details?: any
}

/**
 * Extracts logged-in user details from the session cookie in NextRequest
 */
export function getUserFromRequest(request: NextRequest): {
  id?: string
  username: string
  role?: string
} {
  try {
    const cookie = request.cookies.get("ev_user_session")?.value
    if (cookie) {
      const parsed = JSON.parse(cookie)
      return {
        id: parsed.id,
        username: parsed.username || "anonymous",
        role: parsed.role || "",
      }
    }
  } catch {
    // Ignore cookie parsing failure
  }
  return { username: "anonymous", role: "" }
}

/**
 * Extracts client IP and User-Agent from request headers
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string
  userAgent: string
} {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ipAddress = (forwarded ? forwarded.split(",")[0].trim() : realIp) || "127.0.0.1"
  const userAgent = request.headers.get("user-agent") || ""
  return { ipAddress, userAgent }
}

/**
 * Safely records an audit log entry in the PostgreSQL database.
 * Does not throw or break the parent operation if logging fails.
 */
export async function logActivity(params: CreateAuditLogParams) {
  try {
    const detailsStr = params.details
      ? typeof params.details === "string"
        ? params.details
        : JSON.stringify(params.details)
      : null

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        username: params.username || "anonymous",
        userRole: params.userRole || "",
        action: params.action,
        category: params.category,
        description: params.description,
        targetId: params.targetId,
        targetName: params.targetName,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        details: detailsStr,
      },
    })
  } catch (error) {
    console.error("Failed to write audit log to database:", error)
  }
}
