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
import { useToast } from "@/components/ui/use-toast"
import type { OrganizationSettingsData } from "@/types"

export default function SettingsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const [formData, setFormData] = React.useState<OrganizationSettingsData>({
    companyName: "",
    address: "",
    taxId: "",
    phone: "",
    email: "",
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
    signerName: "",
    signerTitle: "",
    defaultCustomerName: "",
    defaultCustomerAddress: "",
    defaultCustomerTaxId: "",
    defaultCustomerBranch: "",
  })

  const fetchSettings = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/settings")
      if (!res.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้")
      }
      const data = await res.json()
      setFormData({
        id: data.id,
        companyName: data.companyName || "",
        address: data.address || "",
        taxId: data.taxId || "",
        phone: data.phone || "",
        email: data.email || "",
        bankName: data.bankName || "",
        bankAccountNo: data.bankAccountNo || "",
        bankAccountName: data.bankAccountName || "",
        signerName: data.signerName || "",
        signerTitle: data.signerTitle || "",
        defaultCustomerName: data.defaultCustomerName || "",
        defaultCustomerAddress: data.defaultCustomerAddress || "",
        defaultCustomerTaxId: data.defaultCustomerTaxId || "",
        defaultCustomerBranch: data.defaultCustomerBranch || "",
      })
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message || "ไม่สามารถดึงข้อมูลการตั้งค่าได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (
    field: keyof OrganizationSettingsData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลได้")
      }

      toast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "ข้อมูลองค์กรและค่าเริ่มต้นถูกบันทึกเรียบร้อยแล้ว",
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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              ตั้งค่าองค์กร
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              กำหนดข้อมูลบริษัท ผู้ออกเอกสาร บัญชีธนาคาร และข้อมูลลูกค้าเริ่มต้นสำหรับออกใบแจ้งหนี้
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรชข้อมูล
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm">กำลังโหลดข้อมูลการตั้งค่า...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Issuer Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      ข้อมูลผู้ออกเอกสาร (Issuer Information)
                    </CardTitle>
                    <CardDescription>
                      ข้อมูลนี้จะปรากฏที่หัวเอกสารใบแจ้งหนี้และใบเสร็จรับเงิน
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName">ชื่อบริษัท / สถานี *</Label>
                    <Input
                      id="companyName"
                      placeholder="เช่น บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด"
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">ที่อยู่สถานประกอบการ *</Label>
                    <Textarea
                      id="address"
                      placeholder="เลขที่ อาคาร ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={2}
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี *</Label>
                    <Input
                      id="taxId"
                      placeholder="เลข 13 หลัก"
                      value={formData.taxId}
                      onChange={(e) => handleChange("taxId", e.target.value)}
                      className="mt-1.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                    <Input
                      id="phone"
                      placeholder="เช่น 02-123-4567"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="email">อีเมลติดต่อ</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="billing@greencharge.co.th"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                    บัญชีธนาคารสำหรับรับชำระเงิน
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="bankName">ชื่อธนาคาร</Label>
                      <Input
                        id="bankName"
                        placeholder="เช่น ธนาคารกสิกรไทย"
                        value={formData.bankName}
                        onChange={(e) => handleChange("bankName", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccountNo">เลขที่บัญชี</Label>
                      <Input
                        id="bankAccountNo"
                        placeholder="เช่น 123-4-56789-0"
                        value={formData.bankAccountNo}
                        onChange={(e) => handleChange("bankAccountNo", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankAccountName">ชื่อบัญชี</Label>
                      <Input
                        id="bankAccountName"
                        placeholder="เช่น บจก. กรีนชาร์จ พร็อพเพอร์ตี้"
                        value={formData.bankAccountName}
                        onChange={(e) => handleChange("bankAccountName", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Authorized Signer Details */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                    <UserCheck className="h-4 w-4 text-slate-500" />
                    ผู้มีอำนาจลงนามในเอกสาร
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="signerName">ชื่อ-นามสกุล ผู้มีอำนาจลงนาม</Label>
                      <Input
                        id="signerName"
                        placeholder="เช่น นายสมชาย รักษ์พลังงาน"
                        value={formData.signerName}
                        onChange={(e) => handleChange("signerName", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signerTitle">ตำแหน่ง</Label>
                      <Input
                        id="signerTitle"
                        placeholder="เช่น กรรมการผู้จัดการ"
                        value={formData.signerTitle}
                        onChange={(e) => handleChange("signerTitle", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Default Customer */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      ข้อมูลลูกค้าเริ่มต้น (Default Customer)
                    </CardTitle>
                    <CardDescription>
                      ใช้สำหรับกรอกข้อมูลลูกค้าอัตโนมัติเมื่อสร้างเอกสารใหม่ (เช่น การไฟฟ้าส่วนภูมิภาค)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="defaultCustomerName">ชื่อหน่วยงาน / ลูกค้า</Label>
                    <Input
                      id="defaultCustomerName"
                      placeholder="เช่น การไฟฟ้าส่วนภูมิภาค"
                      value={formData.defaultCustomerName}
                      onChange={(e) => handleChange("defaultCustomerName", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="defaultCustomerTaxId">เลขประจำตัวผู้เสียภาษี</Label>
                    <Input
                      id="defaultCustomerTaxId"
                      placeholder="เลข 13 หลัก เช่น 0994000165509"
                      value={formData.defaultCustomerTaxId}
                      onChange={(e) => handleChange("defaultCustomerTaxId", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="defaultCustomerBranch">สาขา</Label>
                    <Input
                      id="defaultCustomerBranch"
                      placeholder="เช่น สำนักงานใหญ่"
                      value={formData.defaultCustomerBranch}
                      onChange={(e) => handleChange("defaultCustomerBranch", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="defaultCustomerAddress">ที่อยู่</Label>
                    <Textarea
                      id="defaultCustomerAddress"
                      placeholder="ที่อยู่หน่วยงาน เช่น 200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900"
                      value={formData.defaultCustomerAddress}
                      onChange={(e) => handleChange("defaultCustomerAddress", e.target.value)}
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pb-12">
              <Button
                type="submit"
                disabled={saving}
                className="gap-2 bg-blue-600 px-6 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                {saving ? "กำลังบันทึกข้อมูล..." : "บันทึกการตั้งค่า"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  )
}
