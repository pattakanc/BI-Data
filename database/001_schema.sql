-- =========================================================
-- BI DataAnalytic - Full DDL Schema
-- Target: PostgreSQL 16 / Database: dm_funnel
-- =========================================================

CREATE SCHEMA IF NOT EXISTS app_auth;
CREATE SCHEMA IF NOT EXISTS app_core;
CREATE SCHEMA IF NOT EXISTS dw;
CREATE SCHEMA IF NOT EXISTS mart;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- app_auth
-- =========================================================
CREATE TABLE IF NOT EXISTS app_auth.users (
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(100) NOT NULL UNIQUE,
    email varchar(255) UNIQUE,
    password_hash text NOT NULL,
    full_name varchar(255) NOT NULL,
    avatar_url text,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED'))
);

CREATE TABLE IF NOT EXISTS app_auth.roles (
    role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code varchar(50) NOT NULL UNIQUE,
    role_name varchar(255) NOT NULL,
    role_group varchar(50),
    is_system boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_auth.user_roles (
    user_role_id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_auth.users(user_id),
    role_id uuid NOT NULL REFERENCES app_auth.roles(role_id),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    assigned_by uuid REFERENCES app_auth.users(user_id),
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS app_auth.user_data_scopes (
    scope_id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_auth.users(user_id),
    scope_type varchar(30) NOT NULL,
    scope_code varchar(100) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_data_scopes_type CHECK (scope_type IN ('COMPANY', 'REGION', 'AREA', 'BRANCH', 'TEAM', 'SELF'))
);

CREATE INDEX IF NOT EXISTS ix_user_data_scopes_user_id
    ON app_auth.user_data_scopes(user_id);

CREATE TABLE IF NOT EXISTS app_auth.refresh_tokens (
    token_id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_auth.users(user_id),
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- app_core
-- =========================================================
CREATE TABLE IF NOT EXISTS app_core.organizations (
    organization_id bigserial PRIMARY KEY,
    organization_code varchar(50) NOT NULL UNIQUE,
    organization_name varchar(255) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.regions (
    region_id bigserial PRIMARY KEY,
    organization_id bigint NOT NULL REFERENCES app_core.organizations(organization_id),
    region_code varchar(50) NOT NULL UNIQUE,
    region_name varchar(255) NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.branches (
    branch_id bigserial PRIMARY KEY,
    organization_id bigint NOT NULL REFERENCES app_core.organizations(organization_id),
    region_id bigint REFERENCES app_core.regions(region_id),
    branch_code varchar(50) NOT NULL UNIQUE,
    branch_name varchar(255) NOT NULL,
    branch_type varchar(50),
    province varchar(100),
    opening_date date,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_branches_region_id
    ON app_core.branches(region_id);

CREATE TABLE IF NOT EXISTS app_core.departments (
    department_id bigserial PRIMARY KEY,
    department_code varchar(50) NOT NULL UNIQUE,
    department_name varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.employees (
    employee_id bigserial PRIMARY KEY,
    employee_code varchar(50) NOT NULL UNIQUE,
    branch_id bigint REFERENCES app_core.branches(branch_id),
    department_id bigint REFERENCES app_core.departments(department_id),
    user_id uuid REFERENCES app_auth.users(user_id),
    full_name varchar(255) NOT NULL,
    position_name varchar(255),
    manager_employee_id bigint REFERENCES app_core.employees(employee_id),
    employment_status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    hire_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_employees_status CHECK (employment_status IN ('ACTIVE', 'INACTIVE', 'RESIGNED'))
);

CREATE INDEX IF NOT EXISTS ix_employees_branch_id
    ON app_core.employees(branch_id);

CREATE TABLE IF NOT EXISTS app_core.customers (
    customer_id bigserial PRIMARY KEY,
    customer_code varchar(100) NOT NULL UNIQUE,
    home_branch_id bigint REFERENCES app_core.branches(branch_id),
    full_name varchar(255) NOT NULL,
    mobile varchar(30),
    email varchar(255),
    member_code varchar(100) UNIQUE,
    loyalty_tier varchar(50),
    first_visit_date date,
    last_visit_date date,
    status varchar(30) NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_customers_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE IF NOT EXISTS app_core.vehicles (
    vehicle_id bigserial PRIMARY KEY,
    customer_id bigint REFERENCES app_core.customers(customer_id),
    home_branch_id bigint REFERENCES app_core.branches(branch_id),
    license_plate varchar(30) NOT NULL,
    plate_province varchar(100),
    make_name varchar(100),
    model_name varchar(100),
    model_year integer,
    vin varchar(100) UNIQUE,
    last_service_date date,
    latest_odometer integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_vehicles_customer_id
    ON app_core.vehicles(customer_id);

CREATE TABLE IF NOT EXISTS app_core.product_categories (
    category_id bigserial PRIMARY KEY,
    category_code varchar(50) NOT NULL UNIQUE,
    category_name varchar(255) NOT NULL,
    parent_category_id bigint REFERENCES app_core.product_categories(category_id),
    category_type varchar(30),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.products (
    product_id bigserial PRIMARY KEY,
    product_code varchar(100) NOT NULL UNIQUE,
    category_id bigint REFERENCES app_core.product_categories(category_id),
    product_name varchar(255) NOT NULL,
    brand_name varchar(100),
    unit_of_measure varchar(30),
    standard_cost numeric(18,4),
    standard_price numeric(18,2),
    active_flag boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_products_category_id
    ON app_core.products(category_id);

CREATE TABLE IF NOT EXISTS app_core.payment_methods (
    payment_method_id bigserial PRIMARY KEY,
    payment_method_code varchar(50) NOT NULL UNIQUE,
    payment_method_name varchar(100) NOT NULL,
    active_flag boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_core.promotions (
    promotion_id bigserial PRIMARY KEY,
    promotion_code varchar(100) NOT NULL UNIQUE,
    promotion_name varchar(255) NOT NULL,
    start_date date,
    end_date date,
    discount_type varchar(30),
    active_flag boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================
-- dw dimensions
-- =========================================================
CREATE TABLE IF NOT EXISTS dw.dim_date (
    date_key integer PRIMARY KEY,
    full_date date NOT NULL UNIQUE,
    day_of_week integer NOT NULL,
    day_name varchar(20) NOT NULL,
    week_of_year integer NOT NULL,
    month_no integer NOT NULL,
    month_name varchar(20) NOT NULL,
    quarter_no integer NOT NULL,
    year_no integer NOT NULL,
    is_weekend boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS dw.dim_branch (
    branch_key bigserial PRIMARY KEY,
    source_branch_id bigint,
    branch_code varchar(50) NOT NULL,
    branch_name varchar(255) NOT NULL,
    region_code varchar(50),
    region_name varchar(255),
    branch_type varchar(50),
    province varchar(100),
    active_flag boolean NOT NULL DEFAULT true,
    effective_from date NOT NULL,
    effective_to date NOT NULL,
    is_current boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_dim_branch_current
    ON dw.dim_branch(branch_code, is_current);

CREATE TABLE IF NOT EXISTS dw.dim_employee (
    employee_key bigserial PRIMARY KEY,
    source_employee_id bigint,
    employee_code varchar(50) NOT NULL,
    employee_name varchar(255) NOT NULL,
    branch_code varchar(50),
    department_name varchar(255),
    position_name varchar(255),
    manager_code varchar(50),
    employment_status varchar(30) NOT NULL,
    effective_from date NOT NULL,
    effective_to date NOT NULL,
    is_current boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_dim_employee_current
    ON dw.dim_employee(employee_code, is_current);

CREATE TABLE IF NOT EXISTS dw.dim_customer (
    customer_key bigserial PRIMARY KEY,
    source_customer_id bigint,
    customer_code varchar(100) NOT NULL,
    full_name varchar(255) NOT NULL,
    mobile varchar(30),
    member_code varchar(100),
    loyalty_tier varchar(50),
    segment_code varchar(50),
    home_branch_code varchar(50),
    first_visit_date date,
    active_flag boolean NOT NULL DEFAULT true,
    effective_from date NOT NULL,
    effective_to date NOT NULL,
    is_current boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_dim_customer_current
    ON dw.dim_customer(customer_code, is_current);

CREATE TABLE IF NOT EXISTS dw.dim_vehicle (
    vehicle_key bigserial PRIMARY KEY,
    source_vehicle_id bigint,
    license_plate varchar(30) NOT NULL,
    plate_province varchar(100),
    make_name varchar(100),
    model_name varchar(100),
    model_year integer,
    customer_code varchar(100),
    active_flag boolean NOT NULL DEFAULT true,
    effective_from date NOT NULL,
    effective_to date NOT NULL,
    is_current boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS dw.dim_product (
    product_key bigserial PRIMARY KEY,
    source_product_id bigint,
    product_code varchar(100) NOT NULL,
    product_name varchar(255) NOT NULL,
    category_code varchar(50),
    category_name varchar(255),
    brand_name varchar(100),
    standard_cost numeric(18,4),
    standard_price numeric(18,2),
    active_flag boolean NOT NULL DEFAULT true,
    effective_from date NOT NULL,
    effective_to date NOT NULL,
    is_current boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS ix_dim_product_current
    ON dw.dim_product(product_code, is_current);

-- =========================================================
-- dw facts
-- =========================================================
CREATE TABLE IF NOT EXISTS dw.fact_sales_invoice (
    sales_invoice_key bigserial PRIMARY KEY,
    source_invoice_id varchar(100) NOT NULL UNIQUE,
    invoice_no varchar(100) NOT NULL,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    invoice_ts timestamptz NOT NULL,
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    customer_key bigint REFERENCES dw.dim_customer(customer_key),
    vehicle_key bigint REFERENCES dw.dim_vehicle(vehicle_key),
    employee_key bigint REFERENCES dw.dim_employee(employee_key),
    payment_method_id bigint,
    promotion_id bigint,
    gross_amount numeric(18,2) NOT NULL DEFAULT 0,
    discount_amount numeric(18,2) NOT NULL DEFAULT 0,
    net_amount numeric(18,2) NOT NULL DEFAULT 0,
    tax_amount numeric(18,2) NOT NULL DEFAULT 0,
    cost_amount numeric(18,2) NOT NULL DEFAULT 0,
    gross_profit_amount numeric(18,2) NOT NULL DEFAULT 0,
    item_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_fact_sales_invoice_date_branch
    ON dw.fact_sales_invoice(date_key, branch_key);
CREATE INDEX IF NOT EXISTS ix_fact_sales_invoice_customer
    ON dw.fact_sales_invoice(customer_key);

CREATE TABLE IF NOT EXISTS dw.fact_sales_line (
    sales_line_key bigserial PRIMARY KEY,
    source_invoice_line_id varchar(100) NOT NULL UNIQUE,
    sales_invoice_key bigint NOT NULL REFERENCES dw.fact_sales_invoice(sales_invoice_key),
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    product_key bigint REFERENCES dw.dim_product(product_key),
    line_type varchar(30) NOT NULL,
    quantity numeric(18,4) NOT NULL DEFAULT 0,
    unit_price numeric(18,2) NOT NULL DEFAULT 0,
    line_discount_amount numeric(18,2) NOT NULL DEFAULT 0,
    line_net_amount numeric(18,2) NOT NULL DEFAULT 0,
    line_cost_amount numeric(18,2) NOT NULL DEFAULT 0,
    line_gp_amount numeric(18,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_fact_sales_line_type CHECK (line_type IN ('PART', 'SERVICE'))
);

CREATE INDEX IF NOT EXISTS ix_fact_sales_line_date_branch_product
    ON dw.fact_sales_line(date_key, branch_key, product_key);

CREATE TABLE IF NOT EXISTS dw.fact_job_order (
    job_order_key bigserial PRIMARY KEY,
    source_job_order_id varchar(100) NOT NULL UNIQUE,
    job_order_no varchar(100) NOT NULL,
    open_date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    close_date_key integer REFERENCES dw.dim_date(date_key),
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    customer_key bigint REFERENCES dw.dim_customer(customer_key),
    vehicle_key bigint REFERENCES dw.dim_vehicle(vehicle_key),
    advisor_employee_key bigint REFERENCES dw.dim_employee(employee_key),
    technician_employee_key bigint REFERENCES dw.dim_employee(employee_key),
    open_ts timestamptz NOT NULL,
    close_ts timestamptz,
    turnaround_minutes integer,
    service_revenue numeric(18,2) NOT NULL DEFAULT 0,
    parts_revenue numeric(18,2) NOT NULL DEFAULT 0,
    total_revenue numeric(18,2) NOT NULL DEFAULT 0,
    total_cost numeric(18,2) NOT NULL DEFAULT 0,
    gross_profit numeric(18,2) NOT NULL DEFAULT 0,
    job_status varchar(30) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_fact_job_order_status CHECK (job_status IN ('OPEN', 'CLOSED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS ix_fact_job_order_branch_open_date
    ON dw.fact_job_order(branch_key, open_date_key);

CREATE TABLE IF NOT EXISTS dw.fact_inventory_balance_daily (
    inventory_balance_daily_key bigserial PRIMARY KEY,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    product_key bigint NOT NULL REFERENCES dw.dim_product(product_key),
    on_hand_qty numeric(18,4) NOT NULL DEFAULT 0,
    reserved_qty numeric(18,4) NOT NULL DEFAULT 0,
    available_qty numeric(18,4) NOT NULL DEFAULT 0,
    stock_value numeric(18,2) NOT NULL DEFAULT 0,
    avg_cost numeric(18,4),
    last_movement_ts timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_inventory_balance_daily UNIQUE (date_key, branch_key, product_key)
);

CREATE INDEX IF NOT EXISTS ix_fact_inventory_balance_daily_branch_product
    ON dw.fact_inventory_balance_daily(branch_key, product_key, date_key);

CREATE TABLE IF NOT EXISTS dw.fact_inventory_movement (
    inventory_movement_key bigserial PRIMARY KEY,
    source_inventory_txn_id varchar(100) NOT NULL UNIQUE,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    movement_ts timestamptz NOT NULL,
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    product_key bigint NOT NULL REFERENCES dw.dim_product(product_key),
    movement_type varchar(30) NOT NULL,
    quantity_delta numeric(18,4) NOT NULL,
    amount_delta numeric(18,2),
    ref_doc_no varchar(100),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_fact_inventory_movement_type CHECK (movement_type IN ('RECEIVE', 'ISSUE', 'TRANSFER', 'ADJUST'))
);

CREATE TABLE IF NOT EXISTS dw.fact_customer_visit (
    customer_visit_key bigserial PRIMARY KEY,
    source_visit_id varchar(100) NOT NULL UNIQUE,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    customer_key bigint NOT NULL REFERENCES dw.dim_customer(customer_key),
    vehicle_key bigint REFERENCES dw.dim_vehicle(vehicle_key),
    job_order_key bigint REFERENCES dw.fact_job_order(job_order_key),
    invoice_key bigint REFERENCES dw.fact_sales_invoice(sales_invoice_key),
    visit_type varchar(30),
    visit_count integer NOT NULL DEFAULT 1,
    net_revenue numeric(18,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dw.fact_service_reminder (
    service_reminder_key bigserial PRIMARY KEY,
    source_reminder_id varchar(100) NOT NULL UNIQUE,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint REFERENCES dw.dim_branch(branch_key),
    customer_key bigint REFERENCES dw.dim_customer(customer_key),
    vehicle_key bigint REFERENCES dw.dim_vehicle(vehicle_key),
    channel_code varchar(30) NOT NULL,
    delivery_status varchar(30) NOT NULL,
    response_status varchar(30),
    revisit_within_30d_flag boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dw.fact_feedback (
    feedback_key bigserial PRIMARY KEY,
    source_feedback_id varchar(100) NOT NULL UNIQUE,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint REFERENCES dw.dim_branch(branch_key),
    customer_key bigint REFERENCES dw.dim_customer(customer_key),
    vehicle_key bigint REFERENCES dw.dim_vehicle(vehicle_key),
    score_value numeric(5,2),
    feedback_status varchar(30),
    comment_text text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dw.fact_claim (
    claim_key bigserial PRIMARY KEY,
    source_claim_id varchar(100) NOT NULL UNIQUE,
    open_date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    close_date_key integer REFERENCES dw.dim_date(date_key),
    branch_key bigint REFERENCES dw.dim_branch(branch_key),
    customer_key bigint REFERENCES dw.dim_customer(customer_key),
    vehicle_key bigint REFERENCES dw.dim_vehicle(vehicle_key),
    claim_reason_code varchar(50),
    claim_status varchar(30) NOT NULL,
    claim_amount numeric(18,2),
    resolution_minutes integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_fact_claim_status CHECK (claim_status IN ('OPEN', 'APPROVED', 'REJECTED', 'CLOSED'))
);

CREATE TABLE IF NOT EXISTS dw.fact_learning_progress (
    learning_progress_key bigserial PRIMARY KEY,
    snapshot_date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    employee_key bigint NOT NULL REFERENCES dw.dim_employee(employee_key),
    course_code varchar(100) NOT NULL,
    course_name varchar(255) NOT NULL,
    completion_pct numeric(5,2) NOT NULL DEFAULT 0,
    score_value numeric(6,2),
    certification_status varchar(30),
    completion_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dw.fact_audit_result (
    audit_result_key bigserial PRIMARY KEY,
    source_audit_result_id varchar(100) NOT NULL UNIQUE,
    audit_date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    auditor_employee_key bigint REFERENCES dw.dim_employee(employee_key),
    checklist_code varchar(100) NOT NULL,
    checklist_name varchar(255) NOT NULL,
    result_status varchar(30) NOT NULL,
    score_value numeric(6,2),
    issue_category varchar(100),
    evidence_count integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_fact_audit_result_status CHECK (result_status IN ('PASS', 'IMPROVE', 'FAIL'))
);

CREATE TABLE IF NOT EXISTS dw.fact_staff_productivity_daily (
    staff_productivity_daily_key bigserial PRIMARY KEY,
    date_key integer NOT NULL REFERENCES dw.dim_date(date_key),
    branch_key bigint NOT NULL REFERENCES dw.dim_branch(branch_key),
    employee_key bigint NOT NULL REFERENCES dw.dim_employee(employee_key),
    role_code varchar(50) NOT NULL,
    job_count integer NOT NULL DEFAULT 0,
    invoice_count integer NOT NULL DEFAULT 0,
    sales_amount numeric(18,2) NOT NULL DEFAULT 0,
    gross_profit_amount numeric(18,2) NOT NULL DEFAULT 0,
    labor_hours numeric(10,2),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_fact_staff_productivity_daily UNIQUE (date_key, branch_key, employee_key, role_code)
);

-- =========================================================
-- ops / audit
-- =========================================================
CREATE TABLE IF NOT EXISTS ops.etl_job_runs (
    etl_job_run_id bigserial PRIMARY KEY,
    job_code varchar(100) NOT NULL,
    job_name varchar(255) NOT NULL,
    run_type varchar(30) NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    status varchar(30) NOT NULL,
    rows_read bigint DEFAULT 0,
    rows_written bigint DEFAULT 0,
    error_message text,
    triggered_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_etl_job_runs_status CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS ops.data_quality_issues (
    data_quality_issue_id bigserial PRIMARY KEY,
    detected_at timestamptz NOT NULL DEFAULT now(),
    domain_code varchar(50) NOT NULL,
    table_name varchar(255) NOT NULL,
    issue_type varchar(50) NOT NULL,
    severity varchar(20) NOT NULL,
    issue_count bigint NOT NULL DEFAULT 0,
    sample_payload jsonb,
    status varchar(30) NOT NULL DEFAULT 'OPEN',
    resolved_at timestamptz,
    resolved_by uuid,
    CONSTRAINT ck_data_quality_issues_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_data_quality_issues_status CHECK (status IN ('OPEN', 'ACK', 'RESOLVED'))
);

CREATE TABLE IF NOT EXISTS audit.access_logs (
    access_log_id bigserial PRIMARY KEY,
    user_id uuid,
    endpoint varchar(255) NOT NULL,
    http_method varchar(10) NOT NULL,
    status_code integer NOT NULL,
    request_id varchar(100),
    response_ms integer,
    ip_address inet,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit.export_logs (
    export_log_id bigserial PRIMARY KEY,
    user_id uuid NOT NULL,
    report_code varchar(100) NOT NULL,
    export_format varchar(20) NOT NULL,
    filter_payload jsonb,
    row_count bigint,
    file_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_export_logs_format CHECK (export_format IN ('CSV', 'XLSX', 'PDF'))
);
