const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Helper: parse date_key from query (YYYYMMDD integer)
function parseDateRange(query) {
  const from = parseInt(query.from) || 20260101;
  const to = parseInt(query.to) || 20260406;
  return { from, to };
}

// Dashboard catalog
router.get('/', async (req, res) => {
  const dashboards = [
    { code: 'executive', name: 'Executive Summary', icon: 'BarChart3', group: 'Executive', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'SYS_ADMIN'] },
    { code: 'sales', name: 'ยอดขายและรายได้', icon: 'TrendingUp', group: 'Sales', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BUSINESS', 'SALES', 'BRANCH_MGR', 'SYS_ADMIN'] },
    { code: 'branch', name: 'ผลงานสาขา', icon: 'Building2', group: 'Operations', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'BRANCH', 'SYS_ADMIN'] },
    { code: 'inventory', name: 'สต็อกสินค้า', icon: 'Package', group: 'Operations', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BUSINESS', 'BRANCH_MGR', 'SYS_ADMIN'] },
    { code: 'customer', name: 'ลูกค้าและ CRM', icon: 'Users', group: 'CRM', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'SALES', 'CS', 'CONSULTANT', 'SYS_ADMIN'] },
    { code: 'service', name: 'งานบริการ', icon: 'Wrench', group: 'Operations', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'TECHNICIAN', 'SYS_ADMIN'] },
    { code: 'audit', name: 'ตรวจสอบและคุณภาพ', icon: 'ShieldCheck', group: 'Quality', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'CONSULTANT', 'SYS_ADMIN'] },
    { code: 'learning', name: 'การเรียนรู้และพัฒนา', icon: 'GraduationCap', group: 'People', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'BRANCH_MGR', 'TECHNICIAN', 'SYS_ADMIN'] },
    { code: 'claim', name: 'เคลมและการรับประกัน', icon: 'AlertTriangle', group: 'Quality', roles: ['CEO', 'HQ_EXEC', 'HQ_ADMIN', 'MANAGER', 'CS', 'CONSULTANT', 'SYS_ADMIN'] },
  ];

  const userRoles = req.user.roles || [];
  const filtered = dashboards.filter(d => d.roles.some(r => userRoles.includes(r)));
  res.json({ success: true, data: filtered });
});

// Executive Summary
router.get('/executive/summary', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const [todayRes, mtdRes, ytdRes, branchRankRes, trendRes] = await Promise.all([
      // Today (use "to" date as "today")
      pool.query(`SELECT COALESCE(SUM(revenue_amount),0) as revenue, COALESCE(SUM(gross_profit_amount),0) as gp,
        COALESCE(AVG(gross_margin_pct),0) as margin, COALESCE(SUM(invoice_count),0) as invoices,
        COALESCE(SUM(customer_count),0) as customers, COALESCE(MAX(active_branch_count),0) as branches
        FROM mart.mv_exec_daily_summary WHERE date_key = $1`, [to]),
      // MTD (from -> to)
      pool.query(`SELECT COALESCE(SUM(revenue_amount),0) as revenue, COALESCE(SUM(gross_profit_amount),0) as gp,
        COALESCE(AVG(gross_margin_pct),0) as margin, COALESCE(SUM(invoice_count),0) as invoices,
        COALESCE(SUM(customer_count),0) as customers
        FROM mart.mv_exec_daily_summary WHERE date_key >= $1 AND date_key <= $2`, [from, to]),
      // YTD (year start of 'from' -> to)
      pool.query(`SELECT COALESCE(SUM(revenue_amount),0) as revenue, COALESCE(SUM(gross_profit_amount),0) as gp,
        COALESCE(AVG(gross_margin_pct),0) as margin, COALESCE(SUM(invoice_count),0) as invoices
        FROM mart.mv_exec_daily_summary WHERE date_key >= $1 AND date_key <= $2`,
        [Math.floor(from / 10000) * 10000 + 101, to]),
      // Branch ranking (from -> to)
      pool.query(`SELECT branch_code, branch_name, region_name,
        SUM(sales_amount) as total_sales, SUM(gross_profit_amount) as total_gp,
        AVG(margin_pct) as avg_margin, SUM(invoice_count) as total_invoices, SUM(customer_count) as total_customers
        FROM mart.mv_branch_kpi_daily WHERE date_key >= $1 AND date_key <= $2
        GROUP BY branch_code, branch_name, region_name ORDER BY total_sales DESC LIMIT 20`, [from, to]),
      // Daily trend (from -> to)
      pool.query(`SELECT date_key, full_date, revenue_amount, gross_profit_amount, gross_margin_pct, invoice_count, customer_count
        FROM mart.mv_exec_daily_summary WHERE date_key >= $1 AND date_key <= $2 ORDER BY date_key`, [from, to]),
    ]);

    // Previous period comparison (same duration before 'from')
    const duration = to - from;
    const prevFrom = from - duration - 1;
    const prevTo = from - 1;
    const prevMtdRes = await pool.query(`SELECT COALESCE(SUM(revenue_amount),0) as revenue, COALESCE(SUM(gross_profit_amount),0) as gp
        FROM mart.mv_exec_daily_summary WHERE date_key >= $1 AND date_key <= $2`, [prevFrom, prevTo]);

    const today = todayRes.rows[0];
    const mtd = mtdRes.rows[0];
    const ytd = ytdRes.rows[0];
    const prevMtd = prevMtdRes.rows[0];

    const mtdGrowth = prevMtd.revenue > 0 ? ((mtd.revenue - prevMtd.revenue) / prevMtd.revenue * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        today: { revenue: today.revenue, grossProfit: today.gp, margin: today.margin, invoices: today.invoices, customers: today.customers, activeBranches: today.branches },
        mtd: { revenue: mtd.revenue, grossProfit: mtd.gp, margin: mtd.margin, invoices: mtd.invoices, customers: mtd.customers, growth: parseFloat(mtdGrowth) },
        ytd: { revenue: ytd.revenue, grossProfit: ytd.gp, margin: ytd.margin, invoices: ytd.invoices },
        branchRanking: branchRankRes.rows,
        trend: trendRes.rows,
      },
    });
  } catch (err) {
    console.error('Executive summary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Sales Dashboard
router.get('/sales/summary', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const { branchKey } = req.query;
    const params = [from, to];
    let branchFilter = '';
    if (branchKey) { branchFilter = ' AND fsi.branch_key = $3'; params.push(parseInt(branchKey)); }

    const [salesTrend, categoryBreakdown, paymentMix, topProducts] = await Promise.all([
      pool.query(`SELECT dd.month_no, dd.year_no,
        SUM(fsi.net_amount) as revenue, SUM(fsi.gross_profit_amount) as gp,
        SUM(fsi.discount_amount) as discount, COUNT(*) as invoices
        FROM dw.fact_sales_invoice fsi JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
        WHERE fsi.date_key >= $1 AND fsi.date_key <= $2 ${branchFilter}
        GROUP BY dd.month_no, dd.year_no ORDER BY dd.year_no, dd.month_no`, params),

      pool.query(`SELECT dp.category_name, SUM(fsl.line_net_amount) as revenue, SUM(fsl.line_gp_amount) as gp,
        SUM(fsl.quantity) as qty
        FROM dw.fact_sales_line fsl
        JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
        WHERE fsl.date_key >= $1 AND fsl.date_key <= $2 ${branchFilter ? branchFilter.replace('fsi', 'fsl') : ''}
        GROUP BY dp.category_name ORDER BY revenue DESC`, params),

      pool.query(`SELECT pm.payment_method_name, COUNT(*) as count, SUM(fsi.net_amount) as amount
        FROM dw.fact_sales_invoice fsi
        JOIN app_core.payment_methods pm ON fsi.payment_method_id = pm.payment_method_id
        WHERE fsi.date_key >= $1 AND fsi.date_key <= $2 ${branchFilter}
        GROUP BY pm.payment_method_name ORDER BY amount DESC`, params),

      pool.query(`SELECT dp.product_name, dp.category_name, SUM(fsl.line_net_amount) as revenue,
        SUM(fsl.quantity) as qty, SUM(fsl.line_gp_amount) as gp
        FROM dw.fact_sales_line fsl
        JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
        WHERE fsl.date_key >= $1 AND fsl.date_key <= $2 ${branchFilter ? branchFilter.replace('fsi', 'fsl') : ''}
        GROUP BY dp.product_name, dp.category_name ORDER BY revenue DESC LIMIT 15`, params),
    ]);

    res.json({
      success: true,
      data: { salesTrend: salesTrend.rows, categoryBreakdown: categoryBreakdown.rows, paymentMix: paymentMix.rows, topProducts: topProducts.rows },
    });
  } catch (err) {
    console.error('Sales summary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// KPI Drill-down: detailed data for each KPI card (revenue, gp, invoices, discount)
router.get('/sales/kpi-drilldown', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const { type, branchKey, productSearch } = req.query;

    if (!type || !['revenue', 'gp', 'invoices', 'discount', 'margin', 'customers'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be revenue|gp|invoices|discount|margin|customers' });
    }

    let paramIdx = 3;
    const params = [from, to];
    const filters = ['fsi.date_key >= $1 AND fsi.date_key <= $2'];

    if (branchKey) {
      filters.push(`fsi.branch_key = $${paramIdx}`);
      params.push(parseInt(branchKey));
      paramIdx++;
    }
    if (productSearch) {
      filters.push(`EXISTS (SELECT 1 FROM dw.fact_sales_line fsl2 JOIN dw.dim_product dp2 ON fsl2.product_key = dp2.product_key WHERE fsl2.sales_invoice_key = fsi.sales_invoice_key AND dp2.product_name ILIKE $${paramIdx})`);
      params.push(`%${productSearch}%`);
      paramIdx++;
    }

    const whereClause = filters.join(' AND ');

    // Summary by branch
    const orderByMap = { revenue: 'revenue', gp: 'gp', invoices: 'invoices', discount: 'discount', margin: 'margin', customers: 'customers' };
    const branchSummary = await pool.query(`
      SELECT db.branch_key, db.branch_name, db.region_name,
        SUM(fsi.net_amount) as revenue, SUM(fsi.gross_profit_amount) as gp,
        SUM(fsi.discount_amount) as discount, COUNT(*) as invoices,
        COUNT(DISTINCT fsi.customer_key) as customers,
        CASE WHEN SUM(fsi.net_amount) > 0 THEN SUM(fsi.gross_profit_amount) / SUM(fsi.net_amount) ELSE 0 END as margin
      FROM dw.fact_sales_invoice fsi
      JOIN dw.dim_branch db ON fsi.branch_key = db.branch_key
      WHERE ${whereClause}
      GROUP BY db.branch_key, db.branch_name, db.region_name
      ORDER BY ${orderByMap[type] || 'revenue'} DESC
    `, params);

    // Daily trend
    const dailyTrend = await pool.query(`
      SELECT dd.full_date, dd.month_no,
        SUM(fsi.net_amount) as revenue, SUM(fsi.gross_profit_amount) as gp,
        SUM(fsi.discount_amount) as discount, COUNT(*) as invoices,
        COUNT(DISTINCT fsi.customer_key) as customers,
        CASE WHEN SUM(fsi.net_amount) > 0 THEN ROUND(SUM(fsi.gross_profit_amount) / SUM(fsi.net_amount) * 100, 1) ELSE 0 END as margin_pct
      FROM dw.fact_sales_invoice fsi
      JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
      WHERE ${whereClause}
      GROUP BY dd.full_date, dd.month_no
      ORDER BY dd.full_date
    `, params);

    // Invoice-level detail (limit 200)
    const invoices = await pool.query(`
      SELECT fsi.invoice_no, fsi.invoice_ts, dd.full_date,
        db.branch_name, db.region_name,
        dc.full_name as customer_name, dc.member_code, dc.loyalty_tier,
        fsi.net_amount as revenue, fsi.gross_profit_amount as gp,
        fsi.discount_amount as discount,
        pm.payment_method_name
      FROM dw.fact_sales_invoice fsi
      JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
      JOIN dw.dim_branch db ON fsi.branch_key = db.branch_key
      LEFT JOIN dw.dim_customer dc ON fsi.customer_key = dc.customer_key AND dc.is_current = true
      LEFT JOIN app_core.payment_methods pm ON fsi.payment_method_id = pm.payment_method_id
      WHERE ${whereClause}
      ORDER BY ${type === 'discount' ? 'fsi.discount_amount' : type === 'gp' ? 'fsi.gross_profit_amount' : 'fsi.net_amount'} DESC
      LIMIT 200
    `, params);

    // Top products in this selection
    const topProducts = await pool.query(`
      SELECT dp.product_name, dp.category_name,
        SUM(fsl.quantity) as qty, SUM(fsl.line_net_amount) as revenue,
        SUM(fsl.line_gp_amount) as gp, SUM(fsl.line_discount_amount) as discount
      FROM dw.fact_sales_line fsl
      JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
      JOIN dw.fact_sales_invoice fsi ON fsl.sales_invoice_key = fsi.sales_invoice_key
      WHERE ${whereClause}
      GROUP BY dp.product_name, dp.category_name
      ORDER BY ${type === 'discount' ? 'discount' : type === 'gp' ? 'gp' : 'revenue'} DESC
      LIMIT 15
    `, params);

    // Grand totals
    const totals = branchSummary.rows.reduce((acc, r) => ({
      revenue: acc.revenue + Number(r.revenue),
      gp: acc.gp + Number(r.gp),
      discount: acc.discount + Number(r.discount),
      invoices: acc.invoices + Number(r.invoices),
      customers: acc.customers + Number(r.customers),
    }), { revenue: 0, gp: 0, discount: 0, invoices: 0, customers: 0 });
    totals.margin = totals.revenue > 0 ? totals.gp / totals.revenue : 0;

    res.json({
      success: true,
      data: {
        totals,
        branchSummary: branchSummary.rows,
        dailyTrend: dailyTrend.rows,
        invoices: invoices.rows,
        topProducts: topProducts.rows,
      },
    });
  } catch (err) {
    console.error('KPI drilldown error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Product filter options (categories + brands)
router.get('/sales/product-filters', async (req, res) => {
  try {
    const [categories, brands] = await Promise.all([
      pool.query(`SELECT DISTINCT category_name FROM dw.dim_product WHERE is_current = true AND category_name IS NOT NULL ORDER BY category_name`),
      pool.query(`SELECT DISTINCT brand_name FROM dw.dim_product WHERE is_current = true AND brand_name IS NOT NULL AND brand_name != '' ORDER BY brand_name`),
    ]);
    res.json({ success: true, data: { categories: categories.rows.map(r => r.category_name), brands: brands.rows.map(r => r.brand_name) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Top products with filters (category, brand)
router.get('/sales/top-products', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const { category, brand } = req.query;
    let paramIdx = 3;
    const params = [from, to];
    const filters = ['fsl.date_key >= $1 AND fsl.date_key <= $2'];

    if (category) {
      filters.push(`dp.category_name = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }
    if (brand) {
      filters.push(`dp.brand_name = $${paramIdx}`);
      params.push(brand);
      paramIdx++;
    }

    const whereClause = filters.join(' AND ');

    const result = await pool.query(`
      SELECT dp.product_key, dp.product_name, dp.category_name, dp.brand_name,
        SUM(fsl.quantity) as qty, SUM(fsl.line_net_amount) as revenue,
        SUM(fsl.line_gp_amount) as gp,
        CASE WHEN SUM(fsl.line_net_amount) > 0 THEN SUM(fsl.line_gp_amount) / SUM(fsl.line_net_amount) ELSE 0 END as margin,
        COUNT(DISTINCT fsl.sales_invoice_key) as invoice_count,
        COUNT(DISTINCT fsl.branch_key) as branch_count
      FROM dw.fact_sales_line fsl
      JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
      WHERE ${whereClause}
      GROUP BY dp.product_key, dp.product_name, dp.category_name, dp.brand_name
      ORDER BY revenue DESC
      LIMIT 30
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Top products error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Product drill-down: invoices for a specific product across all branches
router.get('/sales/product-detail/:productKey', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const productKey = parseInt(req.params.productKey);

    const [invoices, branchBreakdown, monthlyTrend] = await Promise.all([
      // Invoice-level detail
      pool.query(`
        SELECT fsi.invoice_no, fsi.invoice_ts, dd.full_date,
          db.branch_name, db.region_name,
          dc.full_name as customer_name, dc.member_code, dc.loyalty_tier,
          fsl.line_type, fsl.quantity, fsl.unit_price,
          fsl.line_discount_amount as discount, fsl.line_net_amount as net_amount,
          fsl.line_gp_amount as gp,
          pm.payment_method_name
        FROM dw.fact_sales_line fsl
        JOIN dw.fact_sales_invoice fsi ON fsl.sales_invoice_key = fsi.sales_invoice_key
        JOIN dw.dim_date dd ON fsl.date_key = dd.date_key
        JOIN dw.dim_branch db ON fsl.branch_key = db.branch_key
        LEFT JOIN dw.dim_customer dc ON fsi.customer_key = dc.customer_key AND dc.is_current = true
        LEFT JOIN app_core.payment_methods pm ON fsi.payment_method_id = pm.payment_method_id
        WHERE fsl.product_key = $1 AND fsl.date_key >= $2 AND fsl.date_key <= $3
        ORDER BY fsi.invoice_ts DESC
      `, [productKey, from, to]),

      // By branch breakdown
      pool.query(`
        SELECT db.branch_name, db.region_name,
          SUM(fsl.quantity) as qty, SUM(fsl.line_net_amount) as revenue,
          SUM(fsl.line_gp_amount) as gp, COUNT(DISTINCT fsl.sales_invoice_key) as invoices
        FROM dw.fact_sales_line fsl
        JOIN dw.dim_branch db ON fsl.branch_key = db.branch_key
        WHERE fsl.product_key = $1 AND fsl.date_key >= $2 AND fsl.date_key <= $3
        GROUP BY db.branch_name, db.region_name
        ORDER BY revenue DESC
      `, [productKey, from, to]),

      // Monthly trend
      pool.query(`
        SELECT dd.month_no, SUM(fsl.quantity) as qty,
          SUM(fsl.line_net_amount) as revenue, SUM(fsl.line_gp_amount) as gp,
          COUNT(DISTINCT fsl.sales_invoice_key) as invoices
        FROM dw.fact_sales_line fsl
        JOIN dw.dim_date dd ON fsl.date_key = dd.date_key
        WHERE fsl.product_key = $1 AND fsl.date_key >= $2 AND fsl.date_key <= $3
        GROUP BY dd.month_no ORDER BY dd.month_no
      `, [productKey, from, to]),
    ]);

    res.json({
      success: true,
      data: {
        invoices: invoices.rows,
        branchBreakdown: branchBreakdown.rows,
        monthlyTrend: monthlyTrend.rows,
      },
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Branch KPI Drill-down: detailed data for each branch KPI card
router.get('/branch/kpi-drilldown', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const { type, regionName, productSearch } = req.query;

    if (!type || !['branches', 'sales', 'gp', 'margin'].includes(type)) {
      return res.status(400).json({ success: false, message: 'type must be branches|sales|gp|margin' });
    }

    let paramIdx = 3;
    const params = [from, to];
    const branchFilters = ['date_key >= $1 AND date_key <= $2'];

    if (regionName) {
      branchFilters.push(`region_name = $${paramIdx}`);
      params.push(regionName);
      paramIdx++;
    }

    const branchWhere = branchFilters.join(' AND ');

    // Branch summary from mart view
    const orderCol = type === 'gp' ? 'gp' : type === 'margin' ? 'margin' : type === 'branches' ? 'sales' : 'sales';
    const branchSummary = await pool.query(`
      SELECT branch_key, branch_code, branch_name, region_code, region_name,
        SUM(sales_amount) as sales, SUM(gross_profit_amount) as gp,
        AVG(margin_pct) as margin, SUM(invoice_count) as invoices,
        SUM(customer_count) as customers, AVG(avg_ticket) as avg_ticket
      FROM mart.mv_branch_kpi_daily
      WHERE ${branchWhere}
      GROUP BY branch_key, branch_code, branch_name, region_code, region_name
      ORDER BY ${orderCol} DESC
    `, params);

    // Region summary
    const regionSummary = await pool.query(`
      SELECT region_name, SUM(sales_amount) as sales, SUM(gross_profit_amount) as gp,
        AVG(margin_pct) as margin, SUM(invoice_count) as invoices,
        COUNT(DISTINCT branch_key) as branch_count
      FROM mart.mv_branch_kpi_daily
      WHERE ${branchWhere}
      GROUP BY region_name ORDER BY sales DESC
    `, params);

    // Daily trend
    const dailyTrend = await pool.query(`
      SELECT dd.full_date,
        SUM(fsi.net_amount) as sales, SUM(fsi.gross_profit_amount) as gp,
        COUNT(*) as invoices
      FROM dw.fact_sales_invoice fsi
      JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
      ${regionName ? `JOIN dw.dim_branch db ON fsi.branch_key = db.branch_key` : ''}
      WHERE fsi.date_key >= $1 AND fsi.date_key <= $2
      ${regionName ? `AND db.region_name = $3` : ''}
      GROUP BY dd.full_date ORDER BY dd.full_date
    `, regionName ? [from, to, regionName] : [from, to]);

    // Top products (with optional product search)
    const prodParams = regionName ? [from, to, regionName] : [from, to];
    let prodParamIdx = prodParams.length + 1;
    let prodFilter = '';
    if (productSearch) {
      prodFilter = ` AND dp.product_name ILIKE $${prodParamIdx}`;
      prodParams.push(`%${productSearch}%`);
    }

    const topProducts = await pool.query(`
      SELECT dp.product_name, dp.category_name, dp.brand_name,
        SUM(fsl.quantity) as qty, SUM(fsl.line_net_amount) as revenue,
        SUM(fsl.line_gp_amount) as gp,
        COUNT(DISTINCT fsl.branch_key) as branch_count
      FROM dw.fact_sales_line fsl
      JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
      ${regionName ? `JOIN dw.dim_branch db ON fsl.branch_key = db.branch_key` : ''}
      WHERE fsl.date_key >= $1 AND fsl.date_key <= $2
      ${regionName ? `AND db.region_name = $3` : ''}
      ${prodFilter}
      GROUP BY dp.product_name, dp.category_name, dp.brand_name
      ORDER BY ${type === 'gp' ? 'gp' : 'revenue'} DESC
      LIMIT 15
    `, prodParams);

    // Totals
    const rows = branchSummary.rows;
    const totals = {
      branches: rows.length,
      sales: rows.reduce((s, r) => s + Number(r.sales), 0),
      gp: rows.reduce((s, r) => s + Number(r.gp), 0),
      invoices: rows.reduce((s, r) => s + Number(r.invoices), 0),
      customers: rows.reduce((s, r) => s + Number(r.customers), 0),
    };
    totals.margin = totals.sales > 0 ? totals.gp / totals.sales : 0;

    res.json({
      success: true,
      data: {
        totals,
        branchSummary: rows,
        regionSummary: regionSummary.rows,
        dailyTrend: dailyTrend.rows,
        topProducts: topProducts.rows,
      },
    });
  } catch (err) {
    console.error('Branch KPI drilldown error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Branch Performance
router.get('/branch/performance', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const [branchKpi, regionSummary] = await Promise.all([
      pool.query(`SELECT branch_key, branch_code, branch_name, region_code, region_name,
        SUM(sales_amount) as sales, SUM(gross_profit_amount) as gp,
        AVG(margin_pct) as margin, SUM(invoice_count) as invoices,
        SUM(customer_count) as customers, AVG(avg_ticket) as avg_ticket
        FROM mart.mv_branch_kpi_daily
        WHERE date_key >= $1 AND date_key <= $2
        GROUP BY branch_key, branch_code, branch_name, region_code, region_name
        ORDER BY sales DESC`, [from, to]),

      pool.query(`SELECT region_name, SUM(sales_amount) as sales, SUM(gross_profit_amount) as gp,
        AVG(margin_pct) as margin, SUM(invoice_count) as invoices,
        COUNT(DISTINCT branch_key) as branch_count
        FROM mart.mv_branch_kpi_daily
        WHERE date_key >= $1 AND date_key <= $2
        GROUP BY region_name ORDER BY sales DESC`, [from, to]),
    ]);

    res.json({ success: true, data: { branches: branchKpi.rows, regions: regionSummary.rows } });
  } catch (err) {
    console.error('Branch performance error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Branch Drill-down: product-level sales for a specific branch
router.get('/branch/detail/:branchKey', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const branchKey = parseInt(req.params.branchKey);

    const [products, dailyTrend, categorySplit] = await Promise.all([
      // Product-level sales
      pool.query(`SELECT dp.product_name, dp.category_name,
        SUM(fsl.quantity) as qty, SUM(fsl.line_net_amount) as revenue,
        SUM(fsl.line_gp_amount) as gp,
        CASE WHEN SUM(fsl.line_net_amount) > 0 THEN SUM(fsl.line_gp_amount) / SUM(fsl.line_net_amount) ELSE 0 END as margin
        FROM dw.fact_sales_line fsl
        JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
        WHERE fsl.branch_key = $1 AND fsl.date_key >= $2 AND fsl.date_key <= $3
        GROUP BY dp.product_name, dp.category_name
        ORDER BY revenue DESC`, [branchKey, from, to]),

      // Daily sales trend for this branch
      pool.query(`SELECT dd.full_date, dd.month_no,
        SUM(fsi.net_amount) as revenue, SUM(fsi.gross_profit_amount) as gp, COUNT(*) as invoices
        FROM dw.fact_sales_invoice fsi
        JOIN dw.dim_date dd ON fsi.date_key = dd.date_key
        WHERE fsi.branch_key = $1 AND fsi.date_key >= $2 AND fsi.date_key <= $3
        GROUP BY dd.full_date, dd.month_no
        ORDER BY dd.full_date`, [branchKey, from, to]),

      // Category breakdown for this branch
      pool.query(`SELECT dp.category_name, SUM(fsl.line_net_amount) as revenue, SUM(fsl.line_gp_amount) as gp,
        SUM(fsl.quantity) as qty
        FROM dw.fact_sales_line fsl
        JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
        WHERE fsl.branch_key = $1 AND fsl.date_key >= $2 AND fsl.date_key <= $3
        GROUP BY dp.category_name ORDER BY revenue DESC`, [branchKey, from, to]),
    ]);

    res.json({
      success: true,
      data: {
        products: products.rows,
        dailyTrend: dailyTrend.rows,
        categorySplit: categorySplit.rows,
      },
    });
  } catch (err) {
    console.error('Branch detail error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Product Invoice Drill-down: invoice-level detail for a product at a branch
router.get('/branch/product-invoices/:branchKey', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const branchKey = parseInt(req.params.branchKey);
    const productName = req.query.productName;

    if (!productName) {
      return res.status(400).json({ success: false, message: 'productName is required' });
    }

    // Get invoice lines for this product at this branch, joined to invoice, customer, date
    const result = await pool.query(`
      SELECT
        fsi.invoice_no,
        fsi.invoice_ts,
        dd.full_date,
        dc.full_name as customer_name,
        dc.member_code,
        dc.loyalty_tier,
        dp.product_name,
        dp.category_name,
        fsl.line_type,
        fsl.quantity,
        fsl.unit_price,
        fsl.line_discount_amount as discount,
        fsl.line_net_amount as net_amount,
        fsl.line_cost_amount as cost,
        fsl.line_gp_amount as gp,
        pm.payment_method_name
      FROM dw.fact_sales_line fsl
      JOIN dw.fact_sales_invoice fsi ON fsl.sales_invoice_key = fsi.sales_invoice_key
      JOIN dw.dim_product dp ON fsl.product_key = dp.product_key
      JOIN dw.dim_date dd ON fsl.date_key = dd.date_key
      LEFT JOIN dw.dim_customer dc ON fsi.customer_key = dc.customer_key AND dc.is_current = true
      LEFT JOIN app_core.payment_methods pm ON fsi.payment_method_id = pm.payment_method_id
      WHERE fsl.branch_key = $1
        AND fsl.date_key >= $2
        AND fsl.date_key <= $3
        AND dp.product_name = $4
      ORDER BY fsi.invoice_ts DESC
    `, [branchKey, from, to, productName]);

    // Summary
    const summary = {
      totalInvoices: result.rows.length,
      totalQty: result.rows.reduce((s, r) => s + Number(r.quantity), 0),
      totalRevenue: result.rows.reduce((s, r) => s + Number(r.net_amount), 0),
      totalGP: result.rows.reduce((s, r) => s + Number(r.gp), 0),
    };

    res.json({ success: true, data: { invoices: result.rows, summary } });
  } catch (err) {
    console.error('Product invoice detail error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Region Drill-down: branch-level details for a region
router.get('/branch/region/:regionName', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const regionName = decodeURIComponent(req.params.regionName);

    const branches = await pool.query(`SELECT branch_name,
      SUM(sales_amount) as sales, SUM(gross_profit_amount) as gp,
      AVG(margin_pct) as margin, SUM(invoice_count) as invoices,
      SUM(customer_count) as customers
      FROM mart.mv_branch_kpi_daily
      WHERE region_name = $1 AND date_key >= $2 AND date_key <= $3
      GROUP BY branch_name ORDER BY sales DESC`, [regionName, from, to]);

    res.json({ success: true, data: { branches: branches.rows } });
  } catch (err) {
    console.error('Region detail error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Inventory Dashboard
router.get('/inventory/summary', async (req, res) => {
  try {
    const { to } = parseDateRange(req.query);
    // Inventory is snapshot-based, use the "to" date
    const dateKey = to;

    const [overview, riskSummary, topStockValue, lowStock] = await Promise.all([
      pool.query(`SELECT COUNT(DISTINCT product_key) as total_products, COUNT(DISTINCT branch_key) as total_branches,
        SUM(stock_value) as total_stock_value, SUM(on_hand_qty) as total_qty
        FROM dw.fact_inventory_balance_daily WHERE date_key = $1`, [dateKey]),

      pool.query(`SELECT risk_level, COUNT(*) as count, SUM(stock_value) as value
        FROM mart.mv_inventory_risk_daily WHERE date_key = $1
        GROUP BY risk_level ORDER BY count DESC`, [dateKey]),

      pool.query(`SELECT branch_name, SUM(stock_value) as value, SUM(on_hand_qty) as qty
        FROM mart.mv_inventory_risk_daily WHERE date_key = $1
        GROUP BY branch_name ORDER BY value DESC LIMIT 10`, [dateKey]),

      pool.query(`SELECT branch_name, product_name, category_name, available_qty, stock_value, risk_level
        FROM mart.mv_inventory_risk_daily
        WHERE date_key = $1 AND risk_level IN ('STOCK_OUT', 'LOW_STOCK')
        ORDER BY available_qty ASC LIMIT 20`, [dateKey]),
    ]);

    res.json({
      success: true,
      data: {
        overview: overview.rows[0] || { total_products: 0, total_branches: 0, total_stock_value: 0, total_qty: 0 },
        riskSummary: riskSummary.rows,
        topStockValue: topStockValue.rows,
        lowStockItems: lowStock.rows,
      },
    });
  } catch (err) {
    console.error('Inventory summary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Customer Dashboard
router.get('/customer/summary', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const [overview, tierDist, visitTrend, topCustomers] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE active_flag) as active,
        COUNT(*) FILTER (WHERE loyalty_tier = 'PLATINUM') as platinum,
        COUNT(*) FILTER (WHERE loyalty_tier = 'GOLD') as gold,
        COUNT(*) FILTER (WHERE loyalty_tier = 'SILVER') as silver,
        COUNT(*) FILTER (WHERE loyalty_tier = 'STANDARD') as standard
        FROM dw.dim_customer WHERE is_current = true`),

      pool.query(`SELECT segment_code, COUNT(*) as count FROM dw.dim_customer
        WHERE is_current = true GROUP BY segment_code ORDER BY count DESC`),

      pool.query(`SELECT dd.month_no, dd.year_no, COUNT(DISTINCT fcv.customer_key) as unique_customers,
        SUM(fcv.visit_count) as total_visits, SUM(fcv.net_revenue) as revenue
        FROM dw.fact_customer_visit fcv JOIN dw.dim_date dd ON fcv.date_key = dd.date_key
        WHERE fcv.date_key >= $1 AND fcv.date_key <= $2
        GROUP BY dd.month_no, dd.year_no ORDER BY dd.year_no, dd.month_no`, [from, to]),

      pool.query(`SELECT dc.full_name, dc.loyalty_tier, dc.member_code,
        COUNT(*) as visits, SUM(fcv.net_revenue) as revenue
        FROM dw.fact_customer_visit fcv
        JOIN dw.dim_customer dc ON fcv.customer_key = dc.customer_key
        WHERE fcv.date_key >= $1 AND fcv.date_key <= $2
        GROUP BY dc.full_name, dc.loyalty_tier, dc.member_code
        ORDER BY revenue DESC LIMIT 15`, [from, to]),
    ]);

    res.json({
      success: true,
      data: { overview: overview.rows[0], tierDistribution: tierDist.rows, visitTrend: visitTrend.rows, topCustomers: topCustomers.rows },
    });
  } catch (err) {
    console.error('Customer summary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Service / Job Order Dashboard
router.get('/service/summary', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const [overview, statusBreakdown, trendData] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total_jobs, AVG(turnaround_minutes) as avg_turnaround,
        SUM(total_revenue) as total_revenue, SUM(gross_profit) as total_gp,
        SUM(service_revenue) as service_rev, SUM(parts_revenue) as parts_rev
        FROM dw.fact_job_order WHERE open_date_key >= $1 AND open_date_key <= $2`, [from, to]),

      pool.query(`SELECT job_status, COUNT(*) as count FROM dw.fact_job_order
        WHERE open_date_key >= $1 AND open_date_key <= $2 GROUP BY job_status`, [from, to]),

      pool.query(`SELECT dd.month_no, COUNT(*) as jobs, AVG(fjo.turnaround_minutes) as avg_turnaround,
        SUM(fjo.total_revenue) as revenue
        FROM dw.fact_job_order fjo JOIN dw.dim_date dd ON fjo.open_date_key = dd.date_key
        WHERE fjo.open_date_key >= $1 AND fjo.open_date_key <= $2
        GROUP BY dd.month_no ORDER BY dd.month_no`, [from, to]),
    ]);

    res.json({
      success: true,
      data: { overview: overview.rows[0], statusBreakdown: statusBreakdown.rows, trend: trendData.rows },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Audit Dashboard
router.get('/audit/summary', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const [overview, byBranch, byChecklist] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE result_status = 'PASS') as pass_count,
        COUNT(*) FILTER (WHERE result_status = 'IMPROVE') as improve_count,
        COUNT(*) FILTER (WHERE result_status = 'FAIL') as fail_count,
        AVG(score_value) as avg_score
        FROM dw.fact_audit_result WHERE audit_date_key >= $1 AND audit_date_key <= $2`, [from, to]),

      pool.query(`SELECT db.branch_name, AVG(far.score_value) as avg_score,
        COUNT(*) FILTER (WHERE far.result_status = 'PASS') as pass,
        COUNT(*) FILTER (WHERE far.result_status = 'FAIL') as fail, COUNT(*) as total
        FROM dw.fact_audit_result far JOIN dw.dim_branch db ON far.branch_key = db.branch_key
        WHERE far.audit_date_key >= $1 AND far.audit_date_key <= $2
        GROUP BY db.branch_name ORDER BY avg_score DESC`, [from, to]),

      pool.query(`SELECT checklist_name,
        COUNT(*) FILTER (WHERE result_status = 'PASS') as pass,
        COUNT(*) FILTER (WHERE result_status = 'IMPROVE') as improve,
        COUNT(*) FILTER (WHERE result_status = 'FAIL') as fail,
        AVG(score_value) as avg_score
        FROM dw.fact_audit_result WHERE audit_date_key >= $1 AND audit_date_key <= $2
        GROUP BY checklist_name ORDER BY avg_score`, [from, to]),
    ]);

    res.json({
      success: true,
      data: { overview: overview.rows[0], byBranch: byBranch.rows, byChecklist: byChecklist.rows },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Learning Dashboard
router.get('/learning/summary', async (req, res) => {
  try {
    const { to } = parseDateRange(req.query);
    // Learning is snapshot-based — find the closest snapshot_date_key <= to
    const snapshotRes = await pool.query(
      `SELECT DISTINCT snapshot_date_key FROM dw.fact_learning_progress
       WHERE snapshot_date_key <= $1 ORDER BY snapshot_date_key DESC LIMIT 1`, [to]);
    const snapshotKey = snapshotRes.rows[0]?.snapshot_date_key || 20260401;

    const [overview, byCourse] = await Promise.all([
      pool.query(`SELECT COUNT(DISTINCT employee_key) as total_employees,
        AVG(completion_pct) as avg_completion,
        COUNT(*) FILTER (WHERE certification_status = 'CERTIFIED') as certified_count,
        COUNT(*) FILTER (WHERE certification_status = 'IN_PROGRESS') as in_progress_count,
        COUNT(*) FILTER (WHERE certification_status = 'NOT_STARTED') as not_started_count,
        AVG(score_value) as avg_score
        FROM dw.fact_learning_progress WHERE snapshot_date_key = $1`, [snapshotKey]),

      pool.query(`SELECT course_name, AVG(completion_pct) as avg_completion,
        AVG(score_value) as avg_score,
        COUNT(*) FILTER (WHERE certification_status = 'CERTIFIED') as certified,
        COUNT(*) as total
        FROM dw.fact_learning_progress WHERE snapshot_date_key = $1
        GROUP BY course_name ORDER BY avg_completion DESC`, [snapshotKey]),
    ]);

    res.json({ success: true, data: { overview: overview.rows[0], byCourse: byCourse.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Claim Dashboard
router.get('/claim/summary', async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    const [overview, byStatus, byReason, trend] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total_claims, SUM(claim_amount) as total_amount,
        AVG(resolution_minutes) as avg_resolution,
        COUNT(*) FILTER (WHERE claim_status = 'OPEN') as open_count
        FROM dw.fact_claim WHERE open_date_key >= $1 AND open_date_key <= $2`, [from, to]),

      pool.query(`SELECT claim_status, COUNT(*) as count, SUM(claim_amount) as amount
        FROM dw.fact_claim WHERE open_date_key >= $1 AND open_date_key <= $2
        GROUP BY claim_status ORDER BY count DESC`, [from, to]),

      pool.query(`SELECT claim_reason_code, COUNT(*) as count, SUM(claim_amount) as amount
        FROM dw.fact_claim WHERE open_date_key >= $1 AND open_date_key <= $2
        GROUP BY claim_reason_code ORDER BY count DESC`, [from, to]),

      pool.query(`SELECT dd.month_no, COUNT(*) as claims, SUM(fc.claim_amount) as amount
        FROM dw.fact_claim fc JOIN dw.dim_date dd ON fc.open_date_key = dd.date_key
        WHERE fc.open_date_key >= $1 AND fc.open_date_key <= $2
        GROUP BY dd.month_no ORDER BY dd.month_no`, [from, to]),
    ]);

    res.json({
      success: true,
      data: { overview: overview.rows[0], byStatus: byStatus.rows, byReason: byReason.rows, trend: trend.rows },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
