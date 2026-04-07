-- =========================================================
-- Seed Data for BI DataAnalytic Demo
-- =========================================================

-- Roles
INSERT INTO app_auth.roles (role_code, role_name, role_group) VALUES
('CEO', 'Chief Executive Officer', 'EXECUTIVE'),
('HQ_EXEC', 'HQ Executive', 'EXECUTIVE'),
('HQ_ADMIN', 'HQ Admin', 'ADMIN'),
('MANAGER', 'Area Manager', 'MANAGEMENT'),
('BUSINESS', 'Business Team', 'BUSINESS'),
('CONSULTANT', 'Consultant', 'BUSINESS'),
('SALES', 'Sales', 'OPERATIONS'),
('BRANCH_MGR', 'Branch Manager', 'OPERATIONS'),
('BRANCH', 'Branch Staff', 'OPERATIONS'),
('CS', 'Customer Service', 'OPERATIONS'),
('TECHNICIAN', 'Technician', 'OPERATIONS'),
('SYS_ADMIN', 'System Admin', 'ADMIN')
ON CONFLICT (role_code) DO NOTHING;

-- Admin user (password: Admin@2025)
INSERT INTO app_auth.users (username, email, password_hash, full_name, status) VALUES
('admin', 'admin@autofast.co.th', crypt('Admin@2025', gen_salt('bf')), 'System Administrator', 'ACTIVE'),
('ceo', 'ceo@autofast.co.th', crypt('Admin@2025', gen_salt('bf')), 'Somchai Thanakit', 'ACTIVE'),
('hq_exec', 'hq@autofast.co.th', crypt('Admin@2025', gen_salt('bf')), 'Pranee Wongsakul', 'ACTIVE'),
('manager1', 'manager1@autofast.co.th', crypt('Admin@2025', gen_salt('bf')), 'Wichai Srisombat', 'ACTIVE'),
('branch_mgr1', 'bm1@autofast.co.th', crypt('Admin@2025', gen_salt('bf')), 'Sakchai Rattanawong', 'ACTIVE'),
('sales1', 'sales1@autofast.co.th', crypt('Admin@2025', gen_salt('bf')), 'Natthawut Sriprasert', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

-- Assign roles
INSERT INTO app_auth.user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM app_auth.users u, app_auth.roles r
WHERE (u.username = 'admin' AND r.role_code = 'SYS_ADMIN')
   OR (u.username = 'ceo' AND r.role_code = 'CEO')
   OR (u.username = 'hq_exec' AND r.role_code = 'HQ_EXEC')
   OR (u.username = 'manager1' AND r.role_code = 'MANAGER')
   OR (u.username = 'branch_mgr1' AND r.role_code = 'BRANCH_MGR')
   OR (u.username = 'sales1' AND r.role_code = 'SALES')
ON CONFLICT DO NOTHING;

-- Data scopes
INSERT INTO app_auth.user_data_scopes (user_id, scope_type, scope_code)
SELECT u.user_id, 'COMPANY', 'AUTOFAST' FROM app_auth.users u WHERE u.username IN ('admin','ceo','hq_exec')
ON CONFLICT DO NOTHING;

-- Organization
INSERT INTO app_core.organizations (organization_code, organization_name) VALUES
('AUTOFAST', 'AutoFast Co., Ltd.')
ON CONFLICT (organization_code) DO NOTHING;

-- Regions
INSERT INTO app_core.regions (organization_id, region_code, region_name) VALUES
(1, 'BKK', 'กรุงเทพและปริมณฑล'),
(1, 'CENTRAL', 'ภาคกลาง'),
(1, 'NORTH', 'ภาคเหนือ'),
(1, 'NORTHEAST', 'ภาคตะวันออกเฉียงเหนือ'),
(1, 'SOUTH', 'ภาคใต้'),
(1, 'EAST', 'ภาคตะวันออก')
ON CONFLICT (region_code) DO NOTHING;

-- Branches (20 branches)
INSERT INTO app_core.branches (organization_id, region_id, branch_code, branch_name, branch_type, province, opening_date) VALUES
(1, 1, 'BKK001', 'สาขารัชดาภิเษก', 'FLAGSHIP', 'กรุงเทพมหานคร', '2020-01-15'),
(1, 1, 'BKK002', 'สาขาลาดพร้าว', 'STANDARD', 'กรุงเทพมหานคร', '2020-03-01'),
(1, 1, 'BKK003', 'สาขาบางนา', 'STANDARD', 'กรุงเทพมหานคร', '2020-06-15'),
(1, 1, 'BKK004', 'สาขาปิ่นเกล้า', 'STANDARD', 'กรุงเทพมหานคร', '2021-02-01'),
(1, 1, 'NBR001', 'สาขานนทบุรี', 'STANDARD', 'นนทบุรี', '2021-05-01'),
(1, 2, 'AYT001', 'สาขาอยุธยา', 'STANDARD', 'พระนครศรีอยุธยา', '2021-08-01'),
(1, 2, 'NSN001', 'สาขานครสวรรค์', 'STANDARD', 'นครสวรรค์', '2022-01-15'),
(1, 3, 'CMI001', 'สาขาเชียงใหม่', 'FLAGSHIP', 'เชียงใหม่', '2020-09-01'),
(1, 3, 'CMI002', 'สาขาเชียงใหม่ 2', 'STANDARD', 'เชียงใหม่', '2023-01-15'),
(1, 3, 'LPN001', 'สาขาลำพูน', 'STANDARD', 'ลำพูน', '2023-06-01'),
(1, 4, 'KKN001', 'สาขาขอนแก่น', 'FLAGSHIP', 'ขอนแก่น', '2021-03-01'),
(1, 4, 'UDN001', 'สาขาอุดรธานี', 'STANDARD', 'อุดรธานี', '2022-06-01'),
(1, 4, 'NMA001', 'สาขานครราชสีมา', 'STANDARD', 'นครราชสีมา', '2022-09-01'),
(1, 5, 'SKA001', 'สาขาสงขลา', 'FLAGSHIP', 'สงขลา', '2021-11-01'),
(1, 5, 'PKT001', 'สาขาภูเก็ต', 'STANDARD', 'ภูเก็ต', '2022-04-01'),
(1, 5, 'NST001', 'สาขานครศรีธรรมราช', 'STANDARD', 'นครศรีธรรมราช', '2023-03-01'),
(1, 6, 'CBI001', 'สาขาชลบุรี', 'FLAGSHIP', 'ชลบุรี', '2020-11-01'),
(1, 6, 'RYG001', 'สาขาระยอง', 'STANDARD', 'ระยอง', '2022-02-01'),
(1, 6, 'PTY001', 'สาขาพัทยา', 'STANDARD', 'ชลบุรี', '2023-08-01'),
(1, 1, 'BKK005', 'สาขาสุขุมวิท', 'STANDARD', 'กรุงเทพมหานคร', '2024-01-15')
ON CONFLICT (branch_code) DO NOTHING;

-- Product Categories
INSERT INTO app_core.product_categories (category_code, category_name, category_type) VALUES
('OIL', 'น้ำมันเครื่อง', 'PART'),
('TIRE', 'ยางรถยนต์', 'PART'),
('BRAKE', 'ระบบเบรก', 'PART'),
('BATTERY', 'แบตเตอรี่', 'PART'),
('FILTER', 'ไส้กรอง', 'PART'),
('WIPER', 'ใบปัดน้ำฝน', 'PART'),
('LIGHT', 'ระบบไฟ', 'PART'),
('SVC_MAINT', 'บริการซ่อมบำรุง', 'SERVICE'),
('SVC_WASH', 'บริการล้างรถ', 'SERVICE'),
('SVC_INSPECT', 'บริการตรวจสภาพ', 'SERVICE')
ON CONFLICT (category_code) DO NOTHING;

-- Products (30 products)
INSERT INTO app_core.products (product_code, category_id, product_name, brand_name, unit_of_measure, standard_cost, standard_price) VALUES
('OIL-SYN-5W30', 1, 'น้ำมันเครื่องสังเคราะห์ 5W-30 4L', 'Shell', 'ขวด', 650.00, 1290.00),
('OIL-SYN-5W40', 1, 'น้ำมันเครื่องสังเคราะห์ 5W-40 4L', 'Shell', 'ขวด', 700.00, 1390.00),
('OIL-SEMI-10W40', 1, 'น้ำมันเครื่องกึ่งสังเคราะห์ 10W-40 4L', 'Mobil', 'ขวด', 450.00, 890.00),
('TIRE-ECO-195', 2, 'ยาง 195/65R15 Economy', 'Bridgestone', 'เส้น', 1800.00, 2990.00),
('TIRE-PREM-205', 2, 'ยาง 205/55R16 Premium', 'Michelin', 'เส้น', 2800.00, 4590.00),
('TIRE-SUV-265', 2, 'ยาง 265/70R16 SUV', 'Bridgestone', 'เส้น', 3200.00, 5290.00),
('BRK-PAD-FR', 3, 'ผ้าเบรกหน้า Standard', 'Brembo', 'ชุด', 800.00, 1590.00),
('BRK-PAD-RR', 3, 'ผ้าเบรกหลัง Standard', 'Brembo', 'ชุด', 650.00, 1290.00),
('BRK-DISC-FR', 3, 'จานเบรกหน้า', 'TRW', 'คู่', 1500.00, 2990.00),
('BAT-60AH', 4, 'แบตเตอรี่ 60Ah', 'Amaron', 'ลูก', 1800.00, 2990.00),
('BAT-80AH', 4, 'แบตเตอรี่ 80Ah', 'Amaron', 'ลูก', 2200.00, 3690.00),
('FLT-OIL-STD', 5, 'ไส้กรองน้ำมันเครื่อง', 'Denso', 'ชิ้น', 80.00, 190.00),
('FLT-AIR-STD', 5, 'ไส้กรองอากาศ', 'Denso', 'ชิ้น', 120.00, 290.00),
('FLT-CABIN', 5, 'ไส้กรองแอร์', 'Denso', 'ชิ้น', 150.00, 350.00),
('WPR-STD-16', 6, 'ใบปัดน้ำฝน 16 นิ้ว', 'Bosch', 'ชิ้น', 180.00, 390.00),
('WPR-STD-22', 6, 'ใบปัดน้ำฝน 22 นิ้ว', 'Bosch', 'ชิ้น', 220.00, 450.00),
('LGT-H4', 7, 'หลอดไฟหน้า H4', 'Philips', 'คู่', 250.00, 590.00),
('LGT-LED-H7', 7, 'หลอด LED H7', 'Osram', 'คู่', 800.00, 1590.00),
('SVC-OIL-CHG', 8, 'บริการเปลี่ยนถ่ายน้ำมันเครื่อง', NULL, 'ครั้ง', 0, 350.00),
('SVC-BRAKE-INS', 8, 'บริการตรวจเช็คเบรก', NULL, 'ครั้ง', 0, 250.00),
('SVC-TIRE-BAL', 8, 'บริการถ่วงล้อ', NULL, 'ครั้ง', 0, 200.00),
('SVC-ALIGN', 8, 'บริการตั้งศูนย์', NULL, 'ครั้ง', 0, 500.00),
('SVC-WASH-STD', 9, 'ล้างรถมาตรฐาน', NULL, 'ครั้ง', 0, 199.00),
('SVC-WASH-PRE', 9, 'ล้างรถพรีเมียม + เคลือบ', NULL, 'ครั้ง', 0, 599.00),
('SVC-INSPECT-40', 10, 'ตรวจสภาพ 40 จุด', NULL, 'ครั้ง', 0, 0),
('BRK-FLUID', 3, 'น้ำมันเบรก DOT4', 'TRW', 'ขวด', 120.00, 290.00),
('OIL-ATF', 1, 'น้ำมันเกียร์ ATF 1L', 'Shell', 'ขวด', 250.00, 490.00),
('COOL-GREEN', 1, 'น้ำยาหล่อเย็น 1L', 'Prestone', 'ขวด', 150.00, 350.00),
('SVC-AC-CHK', 8, 'บริการตรวจเช็คแอร์', NULL, 'ครั้ง', 0, 300.00),
('SVC-BAT-CHK', 8, 'บริการตรวจแบตเตอรี่', NULL, 'ครั้ง', 0, 0)
ON CONFLICT (product_code) DO NOTHING;

-- Payment Methods
INSERT INTO app_core.payment_methods (payment_method_code, payment_method_name) VALUES
('CASH', 'เงินสด'),
('CREDIT', 'บัตรเครดิต'),
('DEBIT', 'บัตรเดบิต'),
('TRANSFER', 'โอนเงิน'),
('QR', 'QR Payment'),
('INSTALLMENT', 'ผ่อนชำระ')
ON CONFLICT (payment_method_code) DO NOTHING;

-- dim_date (2024-01-01 to 2026-12-31)
INSERT INTO dw.dim_date (date_key, full_date, day_of_week, day_name, week_of_year, month_no, month_name, quarter_no, year_no, is_weekend)
SELECT
    TO_CHAR(d, 'YYYYMMDD')::integer,
    d,
    EXTRACT(DOW FROM d)::integer,
    TO_CHAR(d, 'Day'),
    EXTRACT(WEEK FROM d)::integer,
    EXTRACT(MONTH FROM d)::integer,
    TO_CHAR(d, 'Month'),
    EXTRACT(QUARTER FROM d)::integer,
    EXTRACT(YEAR FROM d)::integer,
    EXTRACT(DOW FROM d) IN (0, 6)
FROM generate_series('2024-01-01'::date, '2026-12-31'::date, '1 day'::interval) d
ON CONFLICT (date_key) DO NOTHING;

-- dim_branch from app_core.branches
INSERT INTO dw.dim_branch (source_branch_id, branch_code, branch_name, region_code, region_name, branch_type, province, active_flag, effective_from, effective_to, is_current)
SELECT b.branch_id, b.branch_code, b.branch_name, r.region_code, r.region_name, b.branch_type, b.province, b.is_active, b.opening_date, '9999-12-31', true
FROM app_core.branches b
LEFT JOIN app_core.regions r ON b.region_id = r.region_id
ON CONFLICT DO NOTHING;

-- dim_product from app_core.products
INSERT INTO dw.dim_product (source_product_id, product_code, product_name, category_code, category_name, brand_name, standard_cost, standard_price, active_flag, effective_from, effective_to, is_current)
SELECT p.product_id, p.product_code, p.product_name, c.category_code, c.category_name, p.brand_name, p.standard_cost, p.standard_price, p.active_flag, '2024-01-01', '9999-12-31', true
FROM app_core.products p
LEFT JOIN app_core.product_categories c ON p.category_id = c.category_id
ON CONFLICT DO NOTHING;

-- dim_customer (sample 200 customers)
INSERT INTO dw.dim_customer (source_customer_id, customer_code, full_name, mobile, member_code, loyalty_tier, segment_code, home_branch_code, first_visit_date, active_flag, effective_from, effective_to, is_current)
SELECT
    i,
    'CUST' || LPAD(i::text, 5, '0'),
    CASE (i % 10)
        WHEN 0 THEN 'สมชาย' WHEN 1 THEN 'วิชัย' WHEN 2 THEN 'สุภาพ' WHEN 3 THEN 'ประเสริฐ' WHEN 4 THEN 'มานะ'
        WHEN 5 THEN 'สมศรี' WHEN 6 THEN 'วิภา' WHEN 7 THEN 'พรทิพย์' WHEN 8 THEN 'อนุชา' ELSE 'ธนกร'
    END || ' ' ||
    CASE (i % 8)
        WHEN 0 THEN 'สุขใจ' WHEN 1 THEN 'ดีงาม' WHEN 2 THEN 'มั่นคง' WHEN 3 THEN 'พัฒนา'
        WHEN 4 THEN 'เจริญ' WHEN 5 THEN 'สว่าง' WHEN 6 THEN 'ก้าวหน้า' ELSE 'รุ่งเรือง'
    END,
    '08' || LPAD((i * 7 % 90000000 + 10000000)::text, 8, '0'),
    'MBR' || LPAD(i::text, 5, '0'),
    CASE WHEN i % 20 = 0 THEN 'PLATINUM' WHEN i % 5 = 0 THEN 'GOLD' WHEN i % 3 = 0 THEN 'SILVER' ELSE 'STANDARD' END,
    CASE WHEN i % 4 = 0 THEN 'VIP' WHEN i % 3 = 0 THEN 'REGULAR' ELSE 'NEW' END,
    (SELECT branch_code FROM app_core.branches ORDER BY branch_id LIMIT 1 OFFSET (i % 20)),
    '2024-01-01'::date + (i % 365),
    true,
    '2024-01-01', '9999-12-31', true
FROM generate_series(1, 200) i
ON CONFLICT DO NOTHING;

-- dim_vehicle
INSERT INTO dw.dim_vehicle (source_vehicle_id, license_plate, plate_province, make_name, model_name, model_year, customer_code, active_flag, effective_from, effective_to, is_current)
SELECT
    i,
    CHR(65 + (i % 26)) || CHR(65 + ((i*3) % 26)) || ' ' || LPAD((i * 17 % 9000 + 1000)::text, 4, '0'),
    CASE (i % 5) WHEN 0 THEN 'กรุงเทพ' WHEN 1 THEN 'เชียงใหม่' WHEN 2 THEN 'ชลบุรี' WHEN 3 THEN 'ขอนแก่น' ELSE 'สงขลา' END,
    CASE (i % 6) WHEN 0 THEN 'Toyota' WHEN 1 THEN 'Honda' WHEN 2 THEN 'Mitsubishi' WHEN 3 THEN 'Isuzu' WHEN 4 THEN 'Mazda' ELSE 'Nissan' END,
    CASE (i % 8) WHEN 0 THEN 'Camry' WHEN 1 THEN 'Civic' WHEN 2 THEN 'Pajero' WHEN 3 THEN 'D-Max' WHEN 4 THEN 'CX-5' WHEN 5 THEN 'Almera' WHEN 6 THEN 'Yaris' ELSE 'City' END,
    2018 + (i % 7),
    'CUST' || LPAD(((i % 200) + 1)::text, 5, '0'),
    true,
    '2024-01-01', '9999-12-31', true
FROM generate_series(1, 250) i
ON CONFLICT DO NOTHING;

-- dim_employee
INSERT INTO dw.dim_employee (source_employee_id, employee_code, employee_name, branch_code, department_name, position_name, employment_status, effective_from, effective_to, is_current)
SELECT
    i,
    'EMP' || LPAD(i::text, 4, '0'),
    CASE (i % 10)
        WHEN 0 THEN 'ธนาวุฒิ' WHEN 1 THEN 'สุริยา' WHEN 2 THEN 'กิตติ' WHEN 3 THEN 'พิชัย' WHEN 4 THEN 'อรุณ'
        WHEN 5 THEN 'สมพร' WHEN 6 THEN 'วันดี' WHEN 7 THEN 'รัตนา' WHEN 8 THEN 'ชัยวัฒน์' ELSE 'ปรีชา'
    END || ' ' ||
    CASE (i % 6)
        WHEN 0 THEN 'แสงทอง' WHEN 1 THEN 'รุ่งโรจน์' WHEN 2 THEN 'ศรีสุข' WHEN 3 THEN 'วิไล'
        WHEN 4 THEN 'ทองดี' ELSE 'สมบูรณ์'
    END,
    (SELECT branch_code FROM app_core.branches ORDER BY branch_id LIMIT 1 OFFSET (i % 20)),
    CASE (i % 4) WHEN 0 THEN 'ฝ่ายขาย' WHEN 1 THEN 'ฝ่ายช่าง' WHEN 2 THEN 'ฝ่ายบริการ' ELSE 'ฝ่ายบริหาร' END,
    CASE (i % 5) WHEN 0 THEN 'Sales Advisor' WHEN 1 THEN 'Technician' WHEN 2 THEN 'Customer Service' WHEN 3 THEN 'Branch Manager' ELSE 'Cashier' END,
    'ACTIVE',
    '2024-01-01', '9999-12-31', true
FROM generate_series(1, 100) i
ON CONFLICT DO NOTHING;

-- Generate fact_sales_invoice (sample: 90 days of data, ~50 invoices/day across 20 branches)
INSERT INTO dw.fact_sales_invoice (source_invoice_id, invoice_no, date_key, invoice_ts, branch_key, customer_key, vehicle_key, employee_key, payment_method_id, gross_amount, discount_amount, net_amount, tax_amount, cost_amount, gross_profit_amount, item_count)
SELECT
    'INV-' || TO_CHAR(d, 'YYYYMMDD') || '-' || LPAD(seq::text, 4, '0'),
    'INV' || TO_CHAR(d, 'YYYYMMDD') || LPAD(seq::text, 4, '0'),
    TO_CHAR(d, 'YYYYMMDD')::integer,
    d + (seq % 10) * interval '1 hour' + (seq * 7 % 60) * interval '1 minute',
    ((seq + TO_CHAR(d, 'DD')::integer) % 20) + 1,
    ((seq * 3 + TO_CHAR(d, 'DD')::integer) % 200) + 1,
    ((seq * 5 + TO_CHAR(d, 'DD')::integer) % 250) + 1,
    ((seq * 2 + TO_CHAR(d, 'DD')::integer) % 100) + 1,
    (seq % 6) + 1,
    gross,
    discount,
    gross - discount,
    ROUND((gross - discount) * 0.07, 2),
    cost,
    gross - discount - cost,
    (seq % 5) + 1
FROM generate_series('2026-01-01'::date, '2026-04-06'::date, '1 day'::interval) d
CROSS JOIN generate_series(1, 50) seq
CROSS JOIN LATERAL (
    SELECT
        ROUND((1000 + (seq * 137 + TO_CHAR(d, 'DD')::integer * 53) % 8000)::numeric, 2) AS gross,
        ROUND(((seq * 17 + TO_CHAR(d, 'DD')::integer * 7) % 500)::numeric, 2) AS discount,
        ROUND((400 + (seq * 97 + TO_CHAR(d, 'DD')::integer * 31) % 3000)::numeric, 2) AS cost
) amounts
ON CONFLICT (source_invoice_id) DO NOTHING;

-- Also add some historical data (2025 - monthly summaries via daily invoices for trend)
INSERT INTO dw.fact_sales_invoice (source_invoice_id, invoice_no, date_key, invoice_ts, branch_key, customer_key, vehicle_key, employee_key, payment_method_id, gross_amount, discount_amount, net_amount, tax_amount, cost_amount, gross_profit_amount, item_count)
SELECT
    'INV-H-' || TO_CHAR(d, 'YYYYMMDD') || '-' || LPAD(seq::text, 4, '0'),
    'INVH' || TO_CHAR(d, 'YYYYMMDD') || LPAD(seq::text, 4, '0'),
    TO_CHAR(d, 'YYYYMMDD')::integer,
    d + (seq % 10) * interval '1 hour',
    ((seq + TO_CHAR(d, 'DD')::integer) % 20) + 1,
    ((seq * 3) % 200) + 1,
    ((seq * 5) % 250) + 1,
    ((seq * 2) % 100) + 1,
    (seq % 6) + 1,
    gross,
    discount,
    gross - discount,
    ROUND((gross - discount) * 0.07, 2),
    cost,
    gross - discount - cost,
    (seq % 5) + 1
FROM generate_series('2025-01-01'::date, '2025-12-31'::date, '3 day'::interval) d
CROSS JOIN generate_series(1, 30) seq
CROSS JOIN LATERAL (
    SELECT
        ROUND((900 + (seq * 131 + TO_CHAR(d, 'MM')::integer * 200) % 7000)::numeric, 2) AS gross,
        ROUND(((seq * 13) % 400)::numeric, 2) AS discount,
        ROUND((350 + (seq * 89 + TO_CHAR(d, 'MM')::integer * 100) % 2500)::numeric, 2) AS cost
) amounts
ON CONFLICT (source_invoice_id) DO NOTHING;

-- fact_job_order
INSERT INTO dw.fact_job_order (source_job_order_id, job_order_no, open_date_key, close_date_key, branch_key, customer_key, vehicle_key, advisor_employee_key, technician_employee_key, open_ts, close_ts, turnaround_minutes, service_revenue, parts_revenue, total_revenue, total_cost, gross_profit, job_status)
SELECT
    'JO-' || TO_CHAR(d, 'YYYYMMDD') || '-' || LPAD(seq::text, 3, '0'),
    'JO' || TO_CHAR(d, 'YYYYMMDD') || LPAD(seq::text, 3, '0'),
    TO_CHAR(d, 'YYYYMMDD')::integer,
    TO_CHAR(d, 'YYYYMMDD')::integer,
    ((seq + TO_CHAR(d, 'DD')::integer) % 20) + 1,
    ((seq * 3) % 200) + 1,
    ((seq * 5) % 250) + 1,
    ((seq * 2) % 100) + 1,
    ((seq * 7) % 100) + 1,
    d + (seq % 8) * interval '1 hour',
    d + (seq % 8 + 1) * interval '1 hour' + (30 + seq * 11 % 90) * interval '1 minute',
    60 + (seq * 11 % 180),
    ROUND((200 + (seq * 47) % 2000)::numeric, 2),
    ROUND((500 + (seq * 83) % 5000)::numeric, 2),
    ROUND((700 + (seq * 47 + seq * 83) % 7000)::numeric, 2),
    ROUND((300 + (seq * 37) % 2500)::numeric, 2),
    ROUND((400 + (seq * 47 + seq * 83 - seq * 37) % 4500)::numeric, 2),
    'CLOSED'
FROM generate_series('2026-01-01'::date, '2026-04-06'::date, '1 day'::interval) d
CROSS JOIN generate_series(1, 25) seq
ON CONFLICT (source_job_order_id) DO NOTHING;

-- fact_inventory_balance_daily (latest snapshot for today)
INSERT INTO dw.fact_inventory_balance_daily (date_key, branch_key, product_key, on_hand_qty, reserved_qty, available_qty, stock_value, avg_cost, last_movement_ts)
SELECT
    20260406,
    b.branch_key,
    p.product_key,
    ROUND((10 + (b.branch_key * 7 + p.product_key * 13) % 200)::numeric, 0),
    ROUND(((b.branch_key * 3 + p.product_key * 5) % 20)::numeric, 0),
    ROUND((10 + (b.branch_key * 7 + p.product_key * 13) % 200 - (b.branch_key * 3 + p.product_key * 5) % 20)::numeric, 0),
    ROUND(((10 + (b.branch_key * 7 + p.product_key * 13) % 200) * COALESCE(p.standard_cost, 100))::numeric, 2),
    p.standard_cost,
    now() - ((b.branch_key + p.product_key) % 72) * interval '1 hour'
FROM dw.dim_branch b
CROSS JOIN dw.dim_product p
WHERE b.is_current = true AND p.active_flag = true AND p.standard_cost > 0
ON CONFLICT (date_key, branch_key, product_key) DO NOTHING;

-- fact_customer_visit
INSERT INTO dw.fact_customer_visit (source_visit_id, date_key, branch_key, customer_key, vehicle_key, visit_type, visit_count, net_revenue)
SELECT
    'VIS-' || TO_CHAR(d, 'YYYYMMDD') || '-' || LPAD(seq::text, 3, '0'),
    TO_CHAR(d, 'YYYYMMDD')::integer,
    ((seq + TO_CHAR(d, 'DD')::integer) % 20) + 1,
    ((seq * 3) % 200) + 1,
    ((seq * 5) % 250) + 1,
    CASE (seq % 3) WHEN 0 THEN 'SERVICE' WHEN 1 THEN 'PURCHASE' ELSE 'INSPECT' END,
    1,
    ROUND((500 + (seq * 67) % 5000)::numeric, 2)
FROM generate_series('2026-01-01'::date, '2026-04-06'::date, '1 day'::interval) d
CROSS JOIN generate_series(1, 30) seq
ON CONFLICT (source_visit_id) DO NOTHING;

-- fact_audit_result
INSERT INTO dw.fact_audit_result (source_audit_result_id, audit_date_key, branch_key, auditor_employee_key, checklist_code, checklist_name, result_status, score_value, issue_category, evidence_count)
SELECT
    'AUD-' || b.branch_key || '-' || TO_CHAR(d, 'YYYYMMDD') || '-' || c,
    TO_CHAR(d, 'YYYYMMDD')::integer,
    b.branch_key,
    (b.branch_key % 100) + 1,
    'CHK' || LPAD(c::text, 3, '0'),
    CASE c WHEN 1 THEN 'ความสะอาด' WHEN 2 THEN 'การจัดเรียงสินค้า' WHEN 3 THEN 'ความปลอดภัย' WHEN 4 THEN 'การบริการลูกค้า' ELSE 'มาตรฐานช่าง' END,
    CASE WHEN (b.branch_key + c) % 10 < 7 THEN 'PASS' WHEN (b.branch_key + c) % 10 < 9 THEN 'IMPROVE' ELSE 'FAIL' END,
    ROUND((60 + (b.branch_key * 7 + c * 13) % 40)::numeric, 1),
    CASE WHEN (b.branch_key + c) % 10 >= 7 THEN 'ปรับปรุง' ELSE NULL END,
    CASE WHEN (b.branch_key + c) % 10 >= 7 THEN (b.branch_key + c) % 5 + 1 ELSE 0 END
FROM dw.dim_branch b
CROSS JOIN generate_series('2026-01-01'::date, '2026-04-01'::date, '1 month'::interval) d
CROSS JOIN generate_series(1, 5) c
WHERE b.is_current = true
ON CONFLICT (source_audit_result_id) DO NOTHING;

-- fact_claim
INSERT INTO dw.fact_claim (source_claim_id, open_date_key, branch_key, customer_key, vehicle_key, claim_reason_code, claim_status, claim_amount, resolution_minutes)
SELECT
    'CLM-' || TO_CHAR(d, 'YYYYMMDD') || '-' || seq,
    TO_CHAR(d, 'YYYYMMDD')::integer,
    (seq % 20) + 1,
    (seq * 7 % 200) + 1,
    (seq * 11 % 250) + 1,
    CASE (seq % 4) WHEN 0 THEN 'DEFECT' WHEN 1 THEN 'WARRANTY' WHEN 2 THEN 'SERVICE_ISSUE' ELSE 'OTHER' END,
    CASE (seq % 4) WHEN 0 THEN 'OPEN' WHEN 1 THEN 'APPROVED' WHEN 2 THEN 'CLOSED' ELSE 'REJECTED' END,
    ROUND((200 + (seq * 97) % 5000)::numeric, 2),
    30 + (seq * 13) % 480
FROM generate_series('2026-01-01'::date, '2026-04-06'::date, '7 day'::interval) d
CROSS JOIN generate_series(1, 5) seq
ON CONFLICT (source_claim_id) DO NOTHING;

-- fact_learning_progress
INSERT INTO dw.fact_learning_progress (snapshot_date_key, employee_key, course_code, course_name, completion_pct, score_value, certification_status, completion_date)
SELECT
    20260401,
    e.employee_key,
    'CRS' || LPAD(c::text, 3, '0'),
    CASE c WHEN 1 THEN 'ความรู้ผลิตภัณฑ์' WHEN 2 THEN 'เทคนิคการขาย' WHEN 3 THEN 'การบริการลูกค้า' WHEN 4 THEN 'ความปลอดภัย' ELSE 'มาตรฐานช่าง' END,
    LEAST(100, ROUND(((e.employee_key * 17 + c * 31) % 100)::numeric, 1)),
    ROUND((50 + (e.employee_key * 13 + c * 7) % 50)::numeric, 1),
    CASE WHEN (e.employee_key * 17 + c * 31) % 100 >= 80 THEN 'CERTIFIED' WHEN (e.employee_key * 17 + c * 31) % 100 >= 50 THEN 'IN_PROGRESS' ELSE 'NOT_STARTED' END,
    CASE WHEN (e.employee_key * 17 + c * 31) % 100 >= 80 THEN '2026-03-15'::date ELSE NULL END
FROM dw.dim_employee e
CROSS JOIN generate_series(1, 5) c
WHERE e.is_current = true
ON CONFLICT DO NOTHING;

-- Materialized Views
DROP MATERIALIZED VIEW IF EXISTS mart.mv_exec_daily_summary;
CREATE MATERIALIZED VIEW mart.mv_exec_daily_summary AS
SELECT
    fsi.date_key,
    dd.full_date,
    dd.month_no,
    dd.year_no,
    SUM(fsi.net_amount) AS revenue_amount,
    SUM(fsi.gross_profit_amount) AS gross_profit_amount,
    CASE WHEN SUM(fsi.net_amount) = 0 THEN 0
         ELSE ROUND(SUM(fsi.gross_profit_amount) / SUM(fsi.net_amount), 4)
    END AS gross_margin_pct,
    COUNT(*) AS invoice_count,
    COUNT(DISTINCT fsi.customer_key) AS customer_count,
    COUNT(DISTINCT fsi.branch_key) AS active_branch_count
FROM dw.fact_sales_invoice fsi
JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
GROUP BY fsi.date_key, dd.full_date, dd.month_no, dd.year_no;

CREATE INDEX IF NOT EXISTS ix_mv_exec_daily_summary_date ON mart.mv_exec_daily_summary(date_key);

DROP MATERIALIZED VIEW IF EXISTS mart.mv_branch_kpi_daily;
CREATE MATERIALIZED VIEW mart.mv_branch_kpi_daily AS
SELECT
    fsi.date_key,
    dd.full_date,
    fsi.branch_key,
    db.branch_code,
    db.branch_name,
    db.region_code,
    db.region_name,
    SUM(fsi.net_amount) AS sales_amount,
    SUM(fsi.gross_profit_amount) AS gross_profit_amount,
    CASE WHEN SUM(fsi.net_amount) = 0 THEN 0
         ELSE ROUND(SUM(fsi.gross_profit_amount) / SUM(fsi.net_amount), 4)
    END AS margin_pct,
    COUNT(*) AS invoice_count,
    COUNT(DISTINCT fsi.customer_key) AS customer_count,
    CASE WHEN COUNT(*) = 0 THEN 0
         ELSE ROUND(SUM(fsi.net_amount) / COUNT(*), 2)
    END AS avg_ticket
FROM dw.fact_sales_invoice fsi
JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
JOIN dw.dim_branch db ON fsi.branch_key = db.branch_key AND db.is_current = true
GROUP BY fsi.date_key, dd.full_date, fsi.branch_key, db.branch_code, db.branch_name, db.region_code, db.region_name;

CREATE INDEX IF NOT EXISTS ix_mv_branch_kpi_daily_date_branch ON mart.mv_branch_kpi_daily(date_key, branch_key);

-- Inventory Risk View
DROP MATERIALIZED VIEW IF EXISTS mart.mv_inventory_risk_daily;
CREATE MATERIALIZED VIEW mart.mv_inventory_risk_daily AS
SELECT
    fib.date_key,
    fib.branch_key,
    db.branch_code,
    db.branch_name,
    fib.product_key,
    dp.product_code,
    dp.product_name,
    dp.category_name,
    fib.on_hand_qty,
    fib.available_qty,
    fib.stock_value,
    CASE
        WHEN fib.available_qty <= 0 THEN 'STOCK_OUT'
        WHEN fib.available_qty < 5 THEN 'LOW_STOCK'
        WHEN fib.on_hand_qty > 200 THEN 'OVERSTOCK'
        ELSE 'NORMAL'
    END AS risk_level
FROM dw.fact_inventory_balance_daily fib
JOIN dw.dim_branch db ON fib.branch_key = db.branch_key AND db.is_current = true
JOIN dw.dim_product dp ON fib.product_key = dp.product_key AND dp.is_current = true;
