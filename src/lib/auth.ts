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
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-accountant",
    username: "accountant",
    passwordHash: "sakura4923",
    name: "เจ้าหน้าที่การเงินและบัญชี",
    role: "ACCOUNTANT",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-viewer",
    username: "viewer",
    passwordHash: "sakura4923",
    name: "ผู้ตรวจสอบข้อมูล (Viewer)",
    role: "VIEWER",
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

export function validateCredentials(username: string, password: string): User | null {
  const user = findUserByUsername(username)
  if (!user) return null
  if (user.passwordHash !== password) return null

  const { passwordHash, ...safeUser } = user
  return safeUser
}

export function createUser(data: {
  username: string
  password: string
  name: string
  role: UserRole
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
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  globalForAuth.storedUsers = users

  const { passwordHash, ...safeUser } = newUser
  return { success: true, user: safeUser }
}

export function deleteUser(id: string): boolean {
  if (id === "user-admin") return false // Cannot delete root admin
  const users = getUsers()
  const before = users.length
  globalForAuth.storedUsers = users.filter(u => u.id !== id)
  return globalForAuth.storedUsers.length < before
}
