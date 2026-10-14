import { User, UserRole } from "@/types"

export interface StoredUser extends User {
  passwordHash: string
}

const DEFAULT_USERS: StoredUser[] = [
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
  }
  return globalForAuth.storedUsers
}

export function findUserByUsername(username: string): StoredUser | null {
  const users = getUsers()
  return users.find(u => u.username.toLowerCase() === username.toLowerCase().trim()) || null
}

export function validateCredentials(username: string, password: string): { user: User | null; error?: string } {
  const user = findUserByUsername(username)
  if (!user) return { user: null, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }
  if (user.passwordHash !== password) return { user: null, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }

  if (user.isActive === false) {
    return { user: null, error: "บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" }
  }

  const { passwordHash, ...safeUser } = user
  return { user: { ...safeUser, isActive: safeUser.isActive !== false } }
}

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
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) {
    return { success: false, error: "ไม่พบผู้ใช้งานที่ต้องการแก้ไข" }
  }

  const existing = users[idx]

  // If changing username, check if duplicate
  if (data.username && data.username.toLowerCase().trim() !== existing.username.toLowerCase()) {
    const dup = users.find(
      u => u.id !== id && u.username.toLowerCase() === data.username!.toLowerCase().trim()
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
      const activeAdmins = users.filter(u => u.role === "ADMIN" && u.isActive !== false)
      if (activeAdmins.length <= 1 && existing.isActive !== false) {
        return { success: false, error: "ไม่สามารถปิดใช้งานผู้ดูแลระบบคนสุดท้ายได้ ต้องมี Admin ที่เปิดใช้งานอย่างน้อย 1 คน" }
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
  const target = users.find(u => u.id === id)
  if (!target) {
    return { success: false, error: "ไม่พบผู้ใช้ที่ต้องการลบ" }
  }

  // Check if target is the last admin
  const adminCount = users.filter(u => u.role === "ADMIN").length
  if (target.role === "ADMIN" && adminCount <= 1) {
    return { success: false, error: "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ ต้องมี Admin อย่างน้อย 1 บัญชี" }
  }

  const before = users.length
  globalForAuth.storedUsers = users.filter(u => u.id !== id)
  return { success: globalForAuth.storedUsers.length < before }
}

