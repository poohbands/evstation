"use client"

import * as React from "react"
import {
  Building2,
  Save,
  CreditCard,
  UserCheck,
  RefreshCw,
  Building,
  CheckCircle2,
  Loader2,
  Users,
  Shield,
  Trash2,
  PlusCircle,
  Phone,
  Mail,
  Receipt,
} from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/AuthContext"
import { PEA_HEADQUARTERS } from "@/lib/utils"
import type { OrganizationSettingsData, User } from "@/types"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Users Management state
  const [users, setUsers] = React.useState<User[]>([])
  const [usersLoading, setUsersLoading] = React.useState(false)
  const [newUsername, setNewUsername] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [newName, setNewName] = React.useState("")
  const [newRole, setNewRole] = React.useState<"ADMIN" | "ACCOUNTANT" | "VIEWER">("ACCOUNTANT")
  const [creatingUser, setCreatingUser] = React.useState(false)

  const [formData, setFormData] = React.useState<OrganizationSettingsData>({
    companyName: "",
    address: "",
    taxId: "",
    phone: "",
    email: "",
    isVatRegistered: true,
    branchNumber: "สำนักงานใหญ่",
    bankName: "",
    bankBranch: "",
    bankAccountNo: "",
    bankAccountName: "",
    bankAccountType: "SAVINGS",
    contactPerson: "",
    contactPhone: "",
    signerName: "",
    signerTitle: "",
    defaultCustomerName: PEA_HEADQUARTERS.name,
    defaultCustomerAddress: PEA_HEADQUARTERS.address,
    defaultCustomerTaxId: PEA_HEADQUARTERS.taxId,
    defaultCustomerBranch: PEA_HEADQUARTERS.branch,
  })

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้")
      const data = await res.json()
      setFormData({
        companyName: data.companyName || "",
        address: data.address || "",
        taxId: data.taxId || "",
        phone: data.phone || "",
        email: data.email || "",
        isVatRegistered: data.isVatRegistered !== undefined ? data.isVatRegistered : true,
        branchNumber: data.branchNumber || "สำนักงานใหญ่",
        bankName: data.bankName || "",
        bankBranch: data.bankBranch || "",
        bankAccountNo: data.bankAccountNo || "",
        bankAccountName: data.bankAccountName || "",
        bankAccountType: data.bankAccountType || "SAVINGS",
        contactPerson: data.contactPerson || "",
        contactPhone: data.contactPhone || "",
        signerName: data.signerName || "",
        signerTitle: data.signerTitle || "",
        defaultCustomerName: data.defaultCustomerName || PEA_HEADQUARTERS.name,
        defaultCustomerAddress: data.defaultCustomerAddress || PEA_HEADQUARTERS.address,
        defaultCustomerTaxId: data.defaultCustomerTaxId || PEA_HEADQUARTERS.taxId,
        defaultCustomerBranch: data.defaultCustomerBranch || PEA_HEADQUARTERS.branch,
      })
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchUsers = React.useCallback(async () => {
    try {
      setUsersLoading(true)
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSettings()
    fetchUsers()
  }, [fetchSettings, fetchUsers])

  const handleChange = (
    field: keyof OrganizationSettingsData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("ไม่สามารถบันทึกข้อมูลได้")
      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลองค์กรและค่าเริ่มต้น กฟภ. ถูกอัปเดตเรียบร้อยแล้ว",
      })
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername || !newPassword || !newName) return

    try {
      setCreatingUser(true)
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          role: newRole,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "สร้างผู้ใช้ไม่สำเร็จ")

      toast({
        title: "สร้างผู้ใช้งานสำเร็จ",
        description: `ผู้ใช้ ${newUsername} ถูกเพิ่มเข้าสู่ระบบแล้ว`,
      })
      setNewUsername("")
      setNewPassword("")
      setNewName("")
      fetchUsers()
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`ยืนยันการลบผู้ใช้ ${username}?`)) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "ลบผู้ใช้ไม่สำเร็จ")
      toast({ title: "ลบผู้ใช้สำเร็จ", description: `ผู้ใช้ ${username} ถูกลบออกจากระบบแล้ว` })
      fetchUsers()
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" })
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 pb-16 font-prompt">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2">
              <Building2 className="h-7 w-7 text-blue-600" />
              <span>ตั้งค่าองค์กร & ผู้ใช้งานระบบ</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              กำหนดข้อมูลผู้ประกอบการ บัญชีรับโอนเงิน ค่าเริ่มต้น กฟภ. และการจัดการสิทธิ์ผู้ใช้งาน
            </p>
          </div>
          <Button
            onClick={fetchSettings}
            variant="outline"
            size="sm"
            disabled={loading}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรชข้อมูล
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-sm">กำลังโหลดข้อมูลการตั้งค่า...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: ข้อมูลผู้ประกอบการ / สถานี (ตามแบบฟอร์ม กฟภ.) */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">
                      ข้อมูลผู้ประกอบการ / สถานีชาร์จ (Issuer Info)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      แสดงที่หัวเอกสารใบแจ้งหนี้และใบเสร็จรับเงิน/ใบกำกับภาษีตามแบบฟอร์มทางการของ กฟภ.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* VAT Registration Mode Switch */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-sm text-slate-900">
                          สถานะการจดทะเบียนภาษีมูลค่าเพิ่ม (VAT 7%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {formData.isVatRegistered
                          ? "จดทะเบียน VAT (นิติบุคคล): ใบเสร็จจะใช้หัว 'ใบเสร็จรับเงิน / ใบกำกับภาษี' และมีบรรทัด VAT 7%"
                          : "ไม่ได้จดทะเบียน VAT (บุคคลธรรมดา): ใบเสร็จใช้หัว 'ใบเสร็จรับเงิน' และไม่แสดงบรรทัด VAT 7%"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${!formData.isVatRegistered ? "text-slate-900 font-bold" : "text-slate-400"}`}>
                        ไม่จด VAT
                      </span>
                      <Switch
                        checked={formData.isVatRegistered}
                        onCheckedChange={(checked) => handleChange("isVatRegistered", checked)}
                      />
                      <span className={`text-xs font-medium ${formData.isVatRegistered ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                        จด VAT 7%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      ชื่อบริษัท / ชื่อผู้ประกอบการ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      placeholder="เช่น บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด หรือ นายสมชาย..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchNumber">
                      สาขาที่ (สำหรับนิติบุคคล)
                    </Label>
                    <Input
                      id="branchNumber"
                      value={formData.branchNumber || ""}
                      onChange={(e) => handleChange("branchNumber", e.target.value)}
                      placeholder="เช่น สำนักงานใหญ่ หรือ 00000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    ที่อยู่สถานประกอบการ <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="เลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">
                      เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleChange("taxId", e.target.value)}
                      placeholder="0105564012345"
                      maxLength={13}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์สถานี/บริษัท</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="02-123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="billing@company.co.th"
                    />
                  </div>
                </div>

                {/* Signer Info */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="signerName">ชื่อผู้มีอำนาจลงนาม / ผู้รับเงิน</Label>
                    <Input
                      id="signerName"
                      value={formData.signerName}
                      onChange={(e) => handleChange("signerName", e.target.value)}
                      placeholder="เช่น นายสมชาย รักษ์พลังงาน"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signerTitle">ตำแหน่ง</Label>
                    <Input
                      id="signerTitle"
                      value={formData.signerTitle}
                      onChange={(e) => handleChange("signerTitle", e.target.value)}
                      placeholder="เช่น กรรมการผู้จัดการ / เจ้าของสถานี"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: ข้อมูลบัญชีธนาคารสำหรับรับเงินโอนจาก กฟภ. */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">
                      ข้อมูลบัญชีธนาคารและผู้ติดต่อฝ่ายบัญชี (Payment Instructions)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      พิมพ์ลงท้ายใบแจ้งหนี้ เพื่อให้ กฟภ. ดำเนินการโอนเงินเข้าบัญชี (Direct Credit)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">ชื่อธนาคาร</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      placeholder="เช่น ธนาคารกสิกรไทย, ธนาคารกรุงไทย"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankBranch">สาขาธนาคาร</Label>
                    <Input
                      id="bankBranch"
                      value={formData.bankBranch || ""}
                      onChange={(e) => handleChange("bankBranch", e.target.value)}
                      placeholder="เช่น สาขาคลองหลวง"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccountType">ประเภทบัญชี</Label>
                    <Select
                      value={formData.bankAccountType || "SAVINGS"}
                      onValueChange={(val: any) => handleChange("bankAccountType", val)}
                    >
                      <SelectTrigger id="bankAccountType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">บัญชีออมทรัพย์</SelectItem>
                        <SelectItem value="CURRENT">บัญชีกระแสรายวัน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNo">เลขที่บัญชีธนาคาร</Label>
                    <Input
                      id="bankAccountNo"
                      value={formData.bankAccountNo}
                      onChange={(e) => handleChange("bankAccountNo", e.target.value)}
                      placeholder="XXX-X-XXXXX-X"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">ชื่อบัญชีเงินฝาก (ตรงกับหน้าสมุดบัญชี)</Label>
                    <Input
                      id="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={(e) => handleChange("bankAccountName", e.target.value)}
                      placeholder="ชื่อบริษัท หรือ ชื่อ-นามสกุล"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">ชื่อผู้ประสานงาน / คุณ (ฝ่ายบัญชี)</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson || ""}
                      onChange={(e) => handleChange("contactPerson", e.target.value)}
                      placeholder="เช่น คุณสมศรี หรือ คุณสมชาย"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">เบอร์โทรศัพท์ผู้ประสานงาน (ฝ่ายบัญชี)</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone || ""}
                      onChange={(e) => handleChange("contactPhone", e.target.value)}
                      placeholder="เช่น 081-234-5678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: ข้อมูลลูกค้าเริ่มต้น (การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่) */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900">
                        ข้อมูลลูกค้าคู่สัญญา (การไฟฟ้าส่วนภูมิภาค)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        ข้อมูลหน่วยงาน กฟภ. สำนักงานใหญ่ ที่ต้องใช้ในเอกสารวางบิลทุกฉบับ
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        defaultCustomerName: PEA_HEADQUARTERS.name,
                        defaultCustomerAddress: PEA_HEADQUARTERS.address,
                        defaultCustomerTaxId: PEA_HEADQUARTERS.taxId,
                        defaultCustomerBranch: PEA_HEADQUARTERS.branch,
                      }))
                      toast({ title: "รีเซ็ตค่ามาตรฐาน กฟภ. เรียบร้อย" })
                    }}
                  >
                    รีเซ็ตเป็นค่ามาตรฐาน กฟภ.
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCustomerName">ชื่อหน่วยงานลูกค้า</Label>
                    <Input
                      id="defaultCustomerName"
                      value={formData.defaultCustomerName}
                      onChange={(e) => handleChange("defaultCustomerName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultCustomerTaxId">
                      เลขประจำตัวผู้เสียภาษี กฟภ. (0994000165501)
                    </Label>
                    <Input
                      id="defaultCustomerTaxId"
                      value={formData.defaultCustomerTaxId}
                      onChange={(e) => handleChange("defaultCustomerTaxId", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultCustomerAddress">ที่อยู่ลูกค้า (กฟภ.)</Label>
                  <Textarea
                    id="defaultCustomerAddress"
                    value={formData.defaultCustomerAddress}
                    onChange={(e) => handleChange("defaultCustomerAddress", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button for Settings */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึกข้อมูลการตั้งค่า
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Section 4: การจัดการผู้ใช้งานระบบและสิทธิ์การใช้งาน (User Management) */}
        <Card className="border-slate-200 shadow-sm mt-8">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-slate-900">
                  การจัดการผู้ใช้งานระบบและสิทธิ์ (User & Access Control)
                </CardTitle>
                <CardDescription className="text-xs">
                  สร้างและกำหนดสิทธิ์ผู้ใช้งาน (Admin: จัดการได้ทั้งหมด, Accountant: สร้าง/แก้ไขบิล, Viewer: ดูได้อย่างเดียว)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Create User Form */}
            <form onSubmit={handleCreateUser} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4 text-blue-600" />
                <span>เพิ่มผู้ใช้งานใหม่ (Add User)</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="newUserUsername" className="text-xs">ชื่อผู้ใช้ (Username)</Label>
                  <Input
                    id="newUserUsername"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="เช่น somchai"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newUserPassword" className="text-xs">รหัสผ่าน (Password)</Label>
                  <Input
                    id="newUserPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newUserName" className="text-xs">ชื่อ-นามสกุล / ตำแหน่ง</Label>
                  <Input
                    id="newUserName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newUserRole" className="text-xs">สิทธิ์การใช้งาน (Role)</Label>
                  <Select
                    value={newRole}
                    onValueChange={(val: any) => setNewRole(val)}
                  >
                    <SelectTrigger id="newUserRole" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN (ผู้ดูแลระบบสูงสุด)</SelectItem>
                      <SelectItem value="ACCOUNTANT">ACCOUNTANT (ฝ่ายการเงิน/บัญชี)</SelectItem>
                      <SelectItem value="VIEWER">VIEWER (ดูข้อมูลได้อย่างเดียว)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={creatingUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {creatingUser ? "กำลังเพิ่ม..." : "เพิ่มผู้ใช้งาน"}
                </Button>
              </div>
            </form>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">ชื่อผู้ใช้ (Username)</th>
                    <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-2.5 px-3">สิทธิ์การใช้งาน (Role)</th>
                    <th className="py-2.5 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                        {u.username}
                        {u.username === "admin" && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-normal">
                            Root Admin
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{u.name}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : u.role === "ACCOUNTANT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {u.username !== "admin" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">หลัก</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
