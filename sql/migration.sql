-- ==============================================================================
-- EV Charging Station Billing System
-- PostgreSQL / Supabase Migration Schema
-- ==============================================================================

-- Enable UUID extension if needed (or gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Organization Settings Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_name VARCHAR(255) NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    tax_id VARCHAR(50) NOT NULL DEFAULT '',
    phone VARCHAR(50) NOT NULL DEFAULT '',
    email VARCHAR(100) NOT NULL DEFAULT '',
    bank_name VARCHAR(100) NOT NULL DEFAULT '',
    bank_account_no VARCHAR(50) NOT NULL DEFAULT '',
    bank_account_name VARCHAR(255) NOT NULL DEFAULT '',
    signer_name VARCHAR(255) NOT NULL DEFAULT '',
    signer_title VARCHAR(255) NOT NULL DEFAULT '',
    logo_url TEXT NOT NULL DEFAULT '',
    default_customer_name VARCHAR(255) NOT NULL DEFAULT '',
    default_customer_address TEXT NOT NULL DEFAULT '',
    default_customer_tax_id VARCHAR(50) NOT NULL DEFAULT '',
    default_customer_branch VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE organization_settings IS 'ข้อมูลการตั้งค่าองค์กรและผู้ออกใบกำกับ/ใบเสร็จ';
COMMENT ON COLUMN organization_settings.company_name IS 'ชื่อบริษัทผู้ให้บริการสถานีชาร์จ';
COMMENT ON COLUMN organization_settings.tax_id IS 'เลขประจำตัวผู้เสียภาษีอากร';
COMMENT ON COLUMN organization_settings.signer_name IS 'ชื่อผู้มีอำนาจลงนาม';
COMMENT ON COLUMN organization_settings.signer_title IS 'ตำแหน่งผู้มีอำนาจลงนาม';

-- ------------------------------------------------------------------------------
-- 2. Documents Table (Invoices and Receipts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    doc_number VARCHAR(100) NOT NULL UNIQUE,
    doc_type VARCHAR(20) NOT NULL, -- INV_ELEC, REC_ELEC, INV_RENT, REC_RENT
    ref_invoice_id VARCHAR(36) REFERENCES documents(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    billing_month INTEGER NOT NULL,
    billing_year INTEGER NOT NULL,
    station_name VARCHAR(255) NOT NULL DEFAULT '',
    customer_name VARCHAR(255) NOT NULL DEFAULT '',
    customer_address TEXT NOT NULL DEFAULT '',
    customer_tax_id VARCHAR(50) NOT NULL DEFAULT '',
    customer_branch VARCHAR(100) NOT NULL DEFAULT '',
    contract_ref VARCHAR(100) NOT NULL DEFAULT '',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.00,
    vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    wht_rate NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
    wht_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    enable_vat BOOLEAN NOT NULL DEFAULT TRUE,
    enable_wht BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, CANCELLED
    payment_date TIMESTAMPTZ,
    payment_method VARCHAR(50), -- TRANSFER, CHEQUE, CASH
    payment_ref VARCHAR(100),
    notes TEXT NOT NULL DEFAULT '',
    thai_baht_text VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_doc_number ON documents(doc_number);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_billing_period ON documents(billing_year, billing_month);
CREATE INDEX IF NOT EXISTS idx_documents_ref_invoice ON documents(ref_invoice_id);

COMMENT ON TABLE documents IS 'ตารางจัดเก็บเอกสารใบแจ้งหนี้และใบเสร็จรับเงินสถานีชาร์จ EV';
COMMENT ON COLUMN documents.doc_type IS 'ประเภทเอกสาร (INV_ELEC, REC_ELEC, INV_RENT, REC_RENT)';
COMMENT ON COLUMN documents.ref_invoice_id IS 'รหัสใบแจ้งหนี้อ้างอิงกรณีเป็นใบเสร็จรับเงิน';
COMMENT ON COLUMN documents.net_payable IS 'ยอดเงินสุทธิที่ต้องชำระ (รวมภาษีมูลค่าเพิ่มและหักภาษี ณ ที่จ่าย)';
COMMENT ON COLUMN documents.thai_baht_text IS 'จำนวนเงินตัวอักษรภาษาไทยพร้อมวงเล็บ';

-- ------------------------------------------------------------------------------
-- 3. Document Items Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    document_id VARCHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    quantity NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    unit_name VARCHAR(50) NOT NULL DEFAULT '',
    unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    meter_previous NUMERIC(14, 2),
    meter_current NUMERIC(14, 2)
);

CREATE INDEX IF NOT EXISTS idx_document_items_doc_id ON document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_document_items_order ON document_items(document_id, item_order);

COMMENT ON TABLE document_items IS 'รายการสินค้าและบริการในเอกสาร';
COMMENT ON COLUMN document_items.meter_previous IS 'เลขมิเตอร์ครั้งก่อน (กิโลวัตต์-ชั่วโมง)';
COMMENT ON COLUMN document_items.meter_current IS 'เลขมิเตอร์ครั้งนี้ (กิโลวัตต์-ชั่วโมง)';

-- ------------------------------------------------------------------------------
-- 4. Trigger for Updated At
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_org_settings_updated_at ON organization_settings;
CREATE TRIGGER trigger_org_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_documents_updated_at ON documents;
CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
