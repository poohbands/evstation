import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const DEFAULT_SETTINGS = {
  companyName: "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด",
  address: "88/8 หมู่ 5 ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120",
  taxId: "0105564012345",
  phone: "02-123-4567",
  email: "billing@greencharge.co.th",
  bankName: "ธนาคารกสิกรไทย",
  bankAccountNo: "123-4-56789-0",
  bankAccountName: "บริษัท กรีนชาร์จ พร็อพเพอร์ตี้ จำกัด",
  signerName: "นายสมชาย รักษ์พลังงาน",
  signerTitle: "กรรมการผู้จัดการ",
  logoUrl: "",
  defaultCustomerName: "การไฟฟ้าส่วนภูมิภาค",
  defaultCustomerAddress: "200 ถนนงามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900",
  defaultCustomerTaxId: "0994000165509",
  defaultCustomerBranch: "สำนักงานใหญ่",
}

export async function GET() {
  try {
    let settings = await prisma.organizationSettings.findFirst()

    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: DEFAULT_SETTINGS,
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Error fetching organization settings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let settings = await prisma.organizationSettings.findFirst()

    const updateData = {
      companyName: body.companyName ?? DEFAULT_SETTINGS.companyName,
      address: body.address ?? DEFAULT_SETTINGS.address,
      taxId: body.taxId ?? DEFAULT_SETTINGS.taxId,
      phone: body.phone ?? DEFAULT_SETTINGS.phone,
      email: body.email ?? DEFAULT_SETTINGS.email,
      bankName: body.bankName ?? DEFAULT_SETTINGS.bankName,
      bankAccountNo: body.bankAccountNo ?? DEFAULT_SETTINGS.bankAccountNo,
      bankAccountName: body.bankAccountName ?? DEFAULT_SETTINGS.bankAccountName,
      signerName: body.signerName ?? DEFAULT_SETTINGS.signerName,
      signerTitle: body.signerTitle ?? DEFAULT_SETTINGS.signerTitle,
      logoUrl: body.logoUrl ?? "",
      defaultCustomerName: body.defaultCustomerName ?? "",
      defaultCustomerAddress: body.defaultCustomerAddress ?? "",
      defaultCustomerTaxId: body.defaultCustomerTaxId ?? "",
      defaultCustomerBranch: body.defaultCustomerBranch ?? "",
    }

    if (settings) {
      settings = await prisma.organizationSettings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      settings = await prisma.organizationSettings.create({
        data: updateData,
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error("Error updating organization settings:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า", details: error.message },
      { status: 500 }
    )
  }
}
