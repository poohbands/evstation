"use client"

import * as React from "react"
import {
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Receipt,
  Download,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  Send,
  Building,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  formatCurrency,
  formatDate,
  THAI_MONTHS,
  PEA_GOOGLE_DRIVE_URL,
  generatePeaMonthlyFeeLineMessage,
} from "@/lib/utils"
import type { PeaMonthlyFee } from "@/types"

export default function MonthlyFeesPage() {
  const { toast } = useToast()
  const [fees, setFees] = React.useState<PeaMonthlyFee[]>([])
  const [loading, setLoading] = React.useState(true)
  const [openModal, setOpenModal] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [stationName, setStationName] = React.useState("สถานีชาร์จ กรีนชาร์จ คลองหลวง")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // New Fee Form State
  const now = new Date()
  const [month, setMonth] = React.useState<number>(now.getMonth() + 1)
  const [year, setYear] = React.useState<number>(now.getFullYear())
  const [ref1, setRef1] = React.useState("020018475923")
  const [ref2, setRef2] = React.useState("")
  const [amount, setAmount] = React.useState("1605.00")
  const [paymentDate, setPaymentDate] = React.useState(now.toISOString().split("T")[0])
  const [paymentChannel, setPaymentChannel] = React.useState<"PEA_SMART_PLUS" | "COUNTER" | "OTHER">("PEA_SMART_PLUS")
  const [notes, setNotes] = React.useState("")

  const fetchFees = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/monthly-fees")
      if (res.ok) {
        const data = await res.json()
        setFees(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchFees()
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.companyName) setStationName(d.companyName)
      })
      .catch(() => {})
  }, [fetchFees])

  const handleCopyMonthlyFeeLine = (fee: PeaMonthlyFee) => {
    const channelName =
      fee.paymentChannel === "PEA_SMART_PLUS"
        ? "แอปพลิเคชัน PEA SMART Plus"
        : "เคาน์เตอร์การไฟฟ้าส่วนภูมิภาค"
    const text = generatePeaMonthlyFeeLineMessage({
      monthYear: `${THAI_MONTHS[fee.billingMonth - 1]} ${fee.billingYear + 543}`,
      stationName: fee.stationName || stationName,
      ref1: fee.ref1Contract,
      ref2: fee.ref2Invoice,
      amount: fee.amount,
      channel: channelName,
    })
    navigator.clipboard.writeText(text)
    setCopiedId(fee.id)
    toast({
      title: "คัดลอกข้อความส่ง LINE สำเร็จ",
      description: "สามารถนำไปวางในห้องแชต LINE เจ้าหน้าที่ กฟภ. พร้อมแนบรูปภาพใบเสร็จได้ทันที",
    })
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetch("/api/monthly-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMonth: month,
          billingYear: year,
          ref1Contract: ref1,
          ref2Invoice: ref2,
          amount: parseFloat(amount) || 0,
          paymentDate,
          paymentChannel,
          notes,
        }),
      })

      if (!res.ok) throw new Error("ไม่สามารถบันทึกรายการได้")

      toast({
        title: "บันทึกการชำระเงินสำเร็จ",
        description: `บันทึกค่าบริการประจำเดือน ${THAI_MONTHS[month - 1]} เรียบร้อยแล้ว`,
      })

      setOpenModal(false)
      setRef2("")
      setNotes("")
      fetchFees()
    } catch (err: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) return
    try {
      const res = await fetch(`/api/monthly-fees?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("ลบรายการไม่สำเร็จ")
      toast({ title: "ลบรายการเรียบร้อย" })
      fetchFees()
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" })
    }
  }

  const totalPaid = fees.reduce((sum, f) => sum + (f.amount || 0), 0)

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 pb-16 font-prompt">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2">
              <CreditCard className="h-7 w-7 text-purple-600" />
              <span>บันทึกการชำระค่าบริการให้ กฟภ. (PEA SMART PLUS)</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ติดตามประวัติการชำระค่าแรกเข้าและค่าบริการรายเดือนผ่านแอปพลิเคชัน PEA SMART Plus
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={PEA_GOOGLE_DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-2 text-xs font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                คู่มือ & ตัวอย่าง กฟภ. (Drive)
              </Button>
            </a>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-medium">
                  <Plus className="h-4 w-4" />
                  บันทึกการชำระใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md font-prompt">
                <DialogHeader>
                  <DialogTitle className="text-base text-slate-900">
                    บันทึกการชำระค่าบริการ PEA VOLTA
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    กรอกข้อมูลจากสลิปหรือใบแจ้งหนี้ค่าบริการรายเดือน กฟภ.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ประจำเดือน</Label>
                      <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v, 10))}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THAI_MONTHS.map((m, idx) => (
                            <SelectItem key={m} value={(idx + 1).toString()}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">ประจำปี (พ.ศ.)</Label>
                      <Input
                        type="number"
                        value={year + 543}
                        onChange={(e) => setYear((parseInt(e.target.value, 10) || year + 543) - 543)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ref1" className="text-xs">หมายเลขบัญชีแสดงสัญญา (REF No.1)</Label>
                    <Input
                      id="ref1"
                      value={ref1}
                      onChange={(e) => setRef1(e.target.value)}
                      placeholder="เช่น 020018475923"
                      className="h-9 text-xs font-mono"
                      required
                    />
                    <p className="text-[10px] text-slate-400">เลข 12 หลัก อยู่ด้านล่างของใบแจ้งหนี้ กฟภ.</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ref2" className="text-xs">หมายเลขใบแจ้งหนี้ (REF No.2)</Label>
                    <Input
                      id="ref2"
                      value={ref2}
                      onChange={(e) => setRef2(e.target.value)}
                      placeholder="เช่น 910248593821"
                      className="h-9 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="amount" className="text-xs">ยอดเงินที่ชำระ (บาท)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-9 text-xs font-mono font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="payDate" className="text-xs">วันที่ชำระ</Label>
                      <Input
                        id="payDate"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">ช่องทางการชำระ</Label>
                    <Select
                      value={paymentChannel}
                      onValueChange={(v: any) => setPaymentChannel(v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEA_SMART_PLUS">แอปพลิเคชัน PEA SMART Plus (โหลดใบเสร็จใน 2-3 วัน)</SelectItem>
                        <SelectItem value="COUNTER">เคาน์เตอร์การไฟฟ้าส่วนภูมิภาค (ได้สลิปทันที)</SelectItem>
                        <SelectItem value="OTHER">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="notes" className="text-xs">หมายเหตุ</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="เช่น ชำระตรงรอบบิล"
                      className="h-9 text-xs"
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full text-xs"
                    >
                      {submitting ? "กำลังบันทึก..." : "บันทึกการชำระเงิน"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Rolling Process Guide Banner */}
        <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-5 space-y-4 text-xs text-slate-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-purple-200/70">
            <div className="flex items-center gap-2 font-bold text-sm text-purple-950">
              <span className="p-1.5 rounded-md bg-purple-600 text-white">
                <CreditCard className="h-4 w-4" />
              </span>
              <span>ขั้นตอนและกระบวนการ Rolling ค่าบริการรายเดือน VOLTA CONNEXT:</span>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
              รอบบิลหมุนเวียนประจำทุกเดือน
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-white/80 border border-purple-100 space-y-1">
              <div className="font-bold text-purple-900 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">1</span>
                <span>กฟภ. ส่งใบแจ้งหนี้</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ทุกๆ <strong>ต้นเดือน</strong> กฟภ. จะส่งใบแจ้งหนี้เรียกเก็บค่าบริการรายเดือนให้ทางห้องแชต LINE
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/80 border border-purple-100 space-y-1">
              <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">2</span>
                <span>ผู้ประกอบการชำระเงิน</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ชำระได้ 2 ช่องทาง: <strong>เคาน์เตอร์การไฟฟ้า</strong> ใกล้คุณ หรือแอป <strong>PEA SMART Plus</strong> (ระบุ Ref.1 และ Ref.2)
              </p>
            </div>

            <div className="p-3 rounded-lg bg-white/80 border border-purple-100 space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">3</span>
                <span>รับหลักฐานใบเสร็จ</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เคาน์เตอร์ กฟภ. ได้รับสลิปทันที / แอป Smart Plus รอ <strong>2-3 วัน</strong> เพื่อ Download ใบเสร็จจากในแอป
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">4</span>
                <span>ส่งภาพใบเสร็จทาง LINE</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                <strong>สำคัญ:</strong> เมื่อได้ใบเสร็จแล้ว ส่งภาพถ่ายให้ กฟภ. ทาง LINE เพื่อใช้แนบประกอบการเบิกเงินค่าอัดประจุไฟฟ้า
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-purple-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">ยอดรวมชำระให้ กฟภ. ทั้งหมด</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 font-mono">
                {formatCurrency(totalPaid)} บาท
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">จำนวนงวดที่ชำระแล้ว</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-800 font-mono">
                {fees.length} เดือน
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">ช่องทางชำระเงินหลัก</CardDescription>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>PEA SMART Plus & เคาน์เตอร์</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>ประวัติการชำระค่าบริการรายเดือน (Payment History)</span>
              <span className="text-xs font-normal text-slate-500">
                กดปุ่ม "ส่งภาพทาง LINE" เพื่อคัดลอกข้อความนำส่งใบเสร็จให้ กฟภ.
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-40 items-center justify-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-sm">กำลังโหลด...</span>
              </div>
            ) : fees.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                ยังไม่มีข้อมูลการชำระค่าบริการ กดปุ่ม "บันทึกการชำระใหม่" เพื่อเพิ่มข้อมูล
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">รอบประจำเดือน</th>
                      <th className="py-2.5 px-3">REF 1 (สัญญา)</th>
                      <th className="py-2.5 px-3">REF 2 (ใบแจ้งหนี้)</th>
                      <th className="py-2.5 px-3">วันที่ชำระ</th>
                      <th className="py-2.5 px-3">ช่องทาง</th>
                      <th className="py-2.5 px-3 text-right">ยอดชำระ</th>
                      <th className="py-2.5 px-3 text-center">สถานะ</th>
                      <th className="py-2.5 px-3 text-center">นำส่งภาพให้ กฟภ.</th>
                      <th className="py-2.5 px-3 text-right">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {THAI_MONTHS[fee.billingMonth - 1]} {fee.billingYear + 543}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{fee.ref1Contract}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{fee.ref2Invoice}</td>
                        <td className="py-3 px-3 text-slate-600">{formatDate(fee.paymentDate)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">
                            {fee.paymentChannel === "PEA_SMART_PLUS" ? "PEA SMART Plus (2-3 วัน)" : "เคาน์เตอร์ กฟภ. (ทันที)"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(fee.amount)} บาท
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ชำระแล้ว
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyMonthlyFeeLine(fee)}
                            className="h-7 text-[11px] gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            title="คัดลอกข้อความนำส่งภาพใบเสร็จเพื่อส่งให้ กฟภ. ทาง LINE"
                          >
                            {copiedId === fee.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span>คัดลอกแล้ว!</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3 text-emerald-600" />
                                <span>ส่งภาพทาง LINE</span>
                              </>
                            )}
                          </Button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(fee.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
