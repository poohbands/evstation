import { User, UserRole } from "@/types"
import prisma from "@/lib/prisma"

export interface StoredUser extends User {
  passwordHash: string
}

export const DEFAULT_USERS: StoredUser[] = [
  {
    id: "user-admin",
    username: "admin",
    passwordHash: "sakura4923",
    name: "ผู้ดูแลระบบ (Admin)",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-nukai",
    username: "nukai",
    passwordHash: "nukai12345",
    name: "Nukai (ผู้ดูแลระบบ)",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-accountant",
    username: "accountant",
    passwordHash: "sakura4923",
    name: "เจ้าหน้าที่การเงินและบัญชี",
    role: "ACCOUNTANT",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-viewer",
    username: "viewer",
    passwordHash: "sakura4923",
    name: "ผู้ตรวจสอบข้อมูล (Viewer)",
    role: "VIEWER",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

const globalForAuth = globalThis as unknown as {
  storedUsers: StoredUser[] | undefined
}

export function getUsers(): StoredUser[] {
  if (!globalForAuth.storedUsers || globalForAuth.storedUsers.length === 0) {
    globalForAuth.storedUsers = [...DEFAULT_USERS]
  } else {
    for (const def of DEFAULT_USERS) {
      if (!globalForAuth.storedUsers.some((u) => u.username.toLowerCase() === def.username.toLowerCase())) {
        globalForAuth.storedUsers.push(def)
      }
    }
  }
  return globalForAuth.storedUsers
}

export function findUserByUsername(username: string): StoredUser | null {
  const users = getUsers()
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim()) || null
}

/**
 * Asynchronous user validation connecting to Prisma / PostgreSQL
 * with fallback to in-memory store if DB is temporarily unreachable.
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<{ user: User | null; error?: string }> {
  const trimmed = username.toLowerCase().trim()

  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: trimmed,
          mode: "insensitive",
        },
      },
    })

    if (dbUser) {
      if (dbUser.passwordHash !== password) {
        return { user: null, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }
      }

      if (dbUser.isActive === false) {
        return { user: null, error: "บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" }
      }

      return {
        user: {
          id: dbUser.id,
          username: dbUser.username,
          name: dbUser.name,
          role: dbUser.role as UserRole,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt.toISOString(),
        },
      }
    }
  } catch (err) {
    console.error("Prisma validateCredentials error, falling back to local:", err)
  }

  // Fallback to in-memory store
  const user = findUserByUsername(username)
  if (!user) return { user: null, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }
  if (user.passwordHash !== password) return { user: null, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }

  if (user.isActive === false) {
    return { user: null, error: "บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" }
  }

  const { passwordHash, ...safeUser } = user
  return { user: { ...safeUser, isActive: safeUser.isActive !== false } }
}

/**
 * Fetch all users from PostgreSQL database, auto-seeding if empty
 */
export async function getUsersAsync(): Promise<User[]> {
  try {
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    })

    if (dbUsers.length > 0) {
      return dbUsers.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role as UserRole,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      }))
    }

    // If database table is empty, auto-seed DEFAULT_USERS
    await prisma.user.createMany({
      data: DEFAULT_USERS.map((u) => ({
        id: u.id,
        username: u.username,
        passwordHash: u.passwordHash,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
      })),
      skipDuplicates: true,
    })

    const seeded = await prisma.user.findMany({ orderBy: { createdAt: "asc" } })
    return seeded.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role as UserRole,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    }))
  } catch (err) {
    console.error("getUsersAsync Prisma error, falling back to in-memory:", err)
    return getUsers().map(({ passwordHash, ...safeUser }) => safeUser)
  }
}

/**
 * Create a new user in PostgreSQL and update in-memory cache
 */
export async function createUserAsync(data: {
  username: string
  password: string
  name: string
  role: UserRole
  isActive?: boolean
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanUsername = data.username.toLowerCase().trim()

  try {
    const existing = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
      },
    })

    if (existing) {
      return { success: false, error: "ชื่อผู้ใช้นี้มีในระบบแล้ว" }
    }

    const created = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash: data.password,
        name: data.name.trim(),
        role: data.role,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })

    // Also update in-memory cache
    createUser(data)

    return {
      success: true,
      user: {
        id: created.id,
        username: created.username,
        name: created.name,
        role: created.role as UserRole,
        isActive: created.isActive,
        createdAt: created.createdAt.toISOString(),
      },
    }
  } catch (err: any) {
    console.error("createUserAsync Prisma error, falling back:", err)
    return createUser(data)
  }
}

/**
 * Update user in PostgreSQL database (persisting password, role, name, active state)
 */
export async function updateUserAsync(
  id: string,
  data: {
    username?: string
    password?: string
    name?: string
    role?: UserRole
    isActive?: boolean
  }
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    let existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      // Fallback matching by username in case id differed
      existing = await prisma.user.findFirst({
        where: {
          username: {
            equals: (data.username || id).toLowerCase().trim(),
            mode: "insensitive",
          },
        },
      })
    }

    if (!existing) {
      return updateUser(id, data)
    }

    // Check duplicate username if being changed
    if (data.username && data.username.toLowerCase().trim() !== existing.username.toLowerCase()) {
      const dup = await prisma.user.findFirst({
        where: {
          username: {
            equals: data.username.toLowerCase().trim(),
            mode: "insensitive",
          },
          id: { not: existing.id },
        },
      })
      if (dup) {
        return { success: false, error: "ชื่อผู้ใช้นี้มีในระบบแล้ว" }
      }
    }

    // Prevent disabling the last active admin
    if (data.isActive === false && existing.role === "ADMIN") {
      const activeAdmins = await prisma.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
          id: { not: existing.id },
        },
      })
      if (activeAdmins < 1) {
        return {
          success: false,
          error: "ไม่สามารถปิดใช้งานผู้ดูแลระบบคนสุดท้ายได้ ต้องมี Admin ที่เปิดใช้งานอย่างน้อย 1 คน",
        }
      }
    }

    const updatePayload: any = {}
    if (data.username) updatePayload.username = data.username.toLowerCase().trim()
    if (data.name) updatePayload.name = data.name.trim()
    if (data.role) updatePayload.role = data.role
    if (data.password && data.password.trim() !== "") {
      updatePayload.passwordHash = data.password.trim()
    }
    if (data.isActive !== undefined) {
      updatePayload.isActive = data.isActive
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: updatePayload,
    })

    // Also update in-memory cache
    updateUser(id, data)

    return {
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        role: updated.role as UserRole,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
      },
    }
  } catch (err: any) {
    console.error("updateUserAsync Prisma error, falling back:", err)
    return updateUser(id, data)
  }
}

/**
 * Delete user from PostgreSQL database
 */
export async function deleteUserAsync(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    let existing = await prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      existing = await prisma.user.findFirst({
        where: {
          username: {
            equals: id.toLowerCase().trim(),
            mode: "insensitive",
          },
        },
      })
    }

    if (!existing) {
      return deleteUser(id)
    }

    if (existing.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      })
      if (adminCount <= 1) {
        return {
          success: false,
          error: "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ ต้องมี Admin อย่างน้อย 1 บัญชี",
        }
      }
    }

    await prisma.user.delete({ where: { id: existing.id } })
    deleteUser(existing.id)
    return { success: true }
  } catch (err: any) {
    console.error("deleteUserAsync Prisma error, falling back:", err)
    return deleteUser(id)
  }
}

// In-memory synchronous fallbacks
export function createUser(data: {
  username: string
  password: string
  name: string
  role: UserRole
  isActive?: boolean
}): { success: boolean; user?: User; error?: string } {
  const users = getUsers()
  const existing = findUserByUsername(data.username)
  if (existing) {
    return { success: false, error: "ชื่อผู้ใช้นี้มีในระบบแล้ว" }
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    username: data.username.toLowerCase().trim(),
    passwordHash: data.password,
    name: data.name.trim(),
    role: data.role,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  globalForAuth.storedUsers = users

  const { passwordHash, ...safeUser } = newUser
  return { success: true, user: safeUser }
}

export function updateUser(
  id: string,
  data: {
    username?: string
    password?: string
    name?: string
    role?: UserRole
    isActive?: boolean
  }
): { success: boolean; user?: User; error?: string } {
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === id || u.username.toLowerCase() === id.toLowerCase())
  if (idx === -1) {
    return { success: false, error: "ไม่พบผู้ใช้งานที่ต้องการแก้ไข" }
  }

  const existing = users[idx]

  if (data.username && data.username.toLowerCase().trim() !== existing.username.toLowerCase()) {
    const dup = users.find(
      (u) => u.id !== existing.id && u.username.toLowerCase() === data.username!.toLowerCase().trim()
    )
    if (dup) {
      return { success: false, error: "ชื่อผู้ใช้นี้มีในระบบแล้ว" }
    }
    existing.username = data.username.toLowerCase().trim()
  }

  if (data.name) {
    existing.name = data.name.trim()
  }

  if (data.role) {
    existing.role = data.role
  }

  if (data.password && data.password.trim() !== "") {
    existing.passwordHash = data.password.trim()
  }

  if (data.isActive !== undefined) {
    if (data.isActive === false && existing.role === "ADMIN") {
      const activeAdmins = users.filter((u) => u.role === "ADMIN" && u.isActive !== false)
      if (activeAdmins.length <= 1 && existing.isActive !== false) {
        return {
          success: false,
          error: "ไม่สามารถปิดใช้งานผู้ดูแลระบบคนสุดท้ายได้ ต้องมี Admin ที่เปิดใช้งานอย่างน้อย 1 คน",
        }
      }
    }
    existing.isActive = data.isActive
  }

  users[idx] = existing
  globalForAuth.storedUsers = users

  const { passwordHash, ...safeUser } = existing
  return { success: true, user: safeUser }
}

export function deleteUser(id: string): { success: boolean; error?: string } {
  const users = getUsers()
  const target = users.find((u) => u.id === id || u.username.toLowerCase() === id.toLowerCase())
  if (!target) {
    return { success: false, error: "ไม่พบผู้ใช้ที่ต้องการลบ" }
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length
  if (target.role === "ADMIN" && adminCount <= 1) {
    return { success: false, error: "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ ต้องมี Admin อย่างน้อย 1 บัญชี" }
  }

  const before = users.length
  globalForAuth.storedUsers = users.filter((u) => u.id !== target.id)
  return { success: globalForAuth.storedUsers.length < before }
}
