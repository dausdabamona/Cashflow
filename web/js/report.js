// Kiyosaki Finance Tracker - Report Module

let currentReportMonth = new Date();

/**
 * Load report view
 */
async function loadReport(date = null) {
  const container = document.getElementById('reportView');
  if (!container) return;

  if (date) {
    currentReportMonth = new Date(date);
  }

  try {
    container.innerHTML = getReportSkeleton();

    const userId = currentUser?.id;
    if (!userId) return;

    const startDate = getMonthStartDate(currentReportMonth);
    const endDate = getMonthEndDate(currentReportMonth);

    // Fetch all data in parallel
    const [summaryResult, balanceSheetResult, healthScoreResult, itemsResult, recommendationsResult] = await Promise.all([
      window.db.rpc('get_dashboard_summary', { p_user_id: userId }),
      window.db.rpc('get_balance_sheet', { p_user_id: userId }),
      window.db.rpc('calculate_health_score', { p_user_id: userId }),
      window.db.rpc('get_items_with_status', { p_user_id: userId }),
      window.db.rpc('generate_recommendations', { p_user_id: userId })
    ]);

    const summary = summaryResult.data || {};
    const balanceSheet = balanceSheetResult.data || {};
    const healthScore = healthScoreResult.data || {};
    const items = itemsResult.data || [];
    const recommendations = recommendationsResult.data || [];

    container.innerHTML = renderReport(summary, balanceSheet, healthScore, items, recommendations);
    lucide.createIcons();

    // Initialize charts
    initReportCharts(summary, balanceSheet);

  } catch (error) {
    console.error('Load report error:', error);
    container.innerHTML = `
      <div class="card text-center py-8">
        <i data-lucide="alert-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
        <p class="text-gray-500">Gagal memuat laporan</p>
        <button onclick="loadReport()" class="btn btn-secondary mt-4">Coba Lagi</button>
      </div>
    `;
    lucide.createIcons();
  }
}

/**
 * Render report HTML
 */
function renderReport(summary, balanceSheet, healthScore, items, recommendations) {
  const monthName = currentReportMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const monthIncome = summary.month_income || 0;
  const monthExpense = summary.month_expense || 0;
  const netIncome = monthIncome - monthExpense;

  return `
    <!-- Header with navigation -->
    <div class="flex items-center justify-between mb-4">
      <button onclick="loadSettings()" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
      </button>
      <div class="text-center">
        <h2 class="font-semibold text-gray-900">Laporan ${monthName}</h2>
      </div>
      <div class="flex gap-1">
        <button onclick="navigateMonth(-1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <i data-lucide="chevron-left" class="w-4 h-4 text-gray-600"></i>
        </button>
        <button onclick="navigateMonth(1)" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
        </button>
      </div>
    </div>

    <!-- Monthly Summary -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4">Ringkasan Bulanan</h3>
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-gray-600">Pemasukan</span>
          <span class="font-semibold text-green-600">+${formatRupiah(monthIncome)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-600">Pengeluaran</span>
          <span class="font-semibold text-red-600">-${formatRupiah(monthExpense)}</span>
        </div>
        <div class="border-t pt-3 flex justify-between items-center">
          <span class="font-medium text-gray-900">Selisih</span>
          <span class="font-bold text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${netIncome >= 0 ? '+' : ''}${formatRupiah(netIncome)}
          </span>
        </div>
      </div>
    </div>

    <!-- Health Score Card -->
    <div class="card mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900">Health Score</h3>
        <span class="text-3xl font-bold ${getHealthScoreColorClass(healthScore.total_score || 0)}">
          ${healthScore.total_score || 0}
        </span>
      </div>

      <div class="progress-bar mb-4">
        <div class="progress-fill ${getHealthScoreBarClass(healthScore.total_score || 0)}"
             style="width: ${healthScore.total_score || 0}%"></div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span class="text-gray-600">DSR</span>
          <span class="font-medium ${getIndicatorClass(healthScore.dsr_status)}">${healthScore.dsr || 0}%</span>
        </div>
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span class="text-gray-600">Savings</span>
          <span class="font-medium ${getIndicatorClass(healthScore.savings_status)}">${healthScore.savings_rate || 0}%</span>
        </div>
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span class="text-gray-600">Passive</span>
          <span class="font-medium ${getIndicatorClass(healthScore.passive_status)}">${healthScore.passive_rate || 0}%</span>
        </div>
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span class="text-gray-600">Kiyosaki</span>
          <span class="font-medium ${healthScore.kiyosaki_positive ? 'text-green-600' : 'text-red-600'}">
            ${healthScore.kiyosaki_positive ? 'Positif' : 'Negatif'}
          </span>
        </div>
      </div>
    </div>

    <!-- Balance Sheet -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4">Neraca</h3>

      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">Aktiva</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Lancar</span>
              <span class="font-medium">${formatRupiahShort(balanceSheet.current_assets || 0)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Tetap</span>
              <span class="font-medium">${formatRupiahShort(balanceSheet.fixed_assets || 0)}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="font-medium">Total</span>
              <span class="font-bold">${formatRupiahShort(balanceSheet.total_assets || 0)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-500 uppercase mb-2">Pasiva</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Kewajiban</span>
              <span class="font-medium">${formatRupiahShort(balanceSheet.total_liabilities || 0)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Ekuitas</span>
              <span class="font-medium">${formatRupiahShort(balanceSheet.equity || 0)}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
              <span class="font-medium">Total</span>
              <span class="font-bold">${formatRupiahShort(balanceSheet.total_assets || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Kiyosaki Analysis -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4">Analisis Kiyosaki</h3>

      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-600">Passive Income</span>
          <span class="font-semibold text-green-600">${formatRupiahShort(summary.passive_income || 0)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill progress-fill-green"
               style="width: ${calcProgress(summary.passive_income || 0, summary.passive_expense || 1)}%"></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Target: ${formatRupiahShort(summary.passive_expense || 0)} (passive expense)
        </p>
      </div>

      <!-- Items Status -->
      ${items.length > 0 ? `
        <div class="space-y-3">
          ${items.slice(0, 3).map(item => `
            <div class="p-3 rounded-lg ${item.kiyosaki_status === 'asset' ? 'bg-green-50' : 'bg-red-50'}">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">${item.name}</span>
                <span class="text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(item.kiyosaki_status)}">
                  ${item.kiyosaki_status?.toUpperCase()}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Net Cashflow</span>
                <span class="${item.net_cashflow >= 0 ? 'text-green-600' : 'text-red-600'}">
                  ${item.net_cashflow >= 0 ? '+' : ''}${formatRupiahShort(item.net_cashflow)}/bln
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <p class="text-gray-500 text-sm text-center py-4">Belum ada item tercatat</p>
      `}
    </div>

    <!-- Recommendations -->
    ${recommendations.length > 0 ? `
      <div class="card mb-4">
        <h3 class="font-semibold text-gray-900 mb-4">Rekomendasi</h3>
        <div class="space-y-3">
          ${recommendations.slice(0, 3).map(rec => `
            <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p class="text-sm text-gray-900">${rec.message}</p>
              ${rec.potential ? `
                <p class="text-xs text-blue-600 mt-1">Potensi: ${formatRupiahShort(rec.potential)}</p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Cashflow Chart -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4">Trend Cashflow</h3>
      <div class="chart-container">
        <canvas id="cashflowChart"></canvas>
      </div>
    </div>

    <!-- Export Button -->
    <div class="card text-center">
      <button onclick="exportReportPDF()" class="btn btn-secondary w-full">
        <i data-lucide="download" class="w-5 h-5"></i>
        <span>Download PDF</span>
      </button>
    </div>
  `;
}

/**
 * Navigate to previous/next month
 */
function navigateMonth(delta) {
  currentReportMonth.setMonth(currentReportMonth.getMonth() + delta);
  loadReport(currentReportMonth);
}

/**
 * Get month start date
 */
function getMonthStartDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}

/**
 * Get month end date
 */
function getMonthEndDate(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
}

/**
 * Get health score color class
 */
function getHealthScoreColorClass(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get health score bar class
 */
function getHealthScoreBarClass(score) {
  if (score >= 80) return 'progress-fill-green';
  if (score >= 60) return 'progress-fill-yellow';
  return 'progress-fill-red';
}

/**
 * Get indicator class based on status
 */
function getIndicatorClass(status) {
  if (status === 'good') return 'text-green-600';
  if (status === 'warning') return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Initialize report charts
 */
function initReportCharts(summary, balanceSheet) {
  const ctx = document.getElementById('cashflowChart');
  if (!ctx) return;

  // Simple bar chart for income vs expense
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Pemasukan', 'Pengeluaran', 'Selisih'],
      datasets: [{
        data: [
          summary.month_income || 0,
          summary.month_expense || 0,
          (summary.month_income || 0) - (summary.month_expense || 0)
        ],
        backgroundColor: [
          '#10B981',
          '#EF4444',
          (summary.month_income || 0) >= (summary.month_expense || 0) ? '#3B82F6' : '#F59E0B'
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatRupiahShort(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Export report to PDF
 */
function exportReportPDF() {
  // TODO: Implement PDF export
  showToast('Fitur export PDF dalam pengembangan', 'info');
}

/**
 * Get report loading skeleton
 */
function getReportSkeleton() {
  return `
    <div class="flex items-center justify-between mb-4">
      <div class="skeleton h-10 w-10 rounded-lg"></div>
      <div class="skeleton h-6 w-40"></div>
      <div class="skeleton h-8 w-20 rounded-lg"></div>
    </div>
    <div class="card mb-4">
      <div class="skeleton h-6 w-32 mb-4"></div>
      <div class="space-y-3">
        <div class="skeleton h-6 w-full"></div>
        <div class="skeleton h-6 w-full"></div>
        <div class="skeleton h-8 w-full"></div>
      </div>
    </div>
    <div class="card mb-4">
      <div class="skeleton h-6 w-32 mb-4"></div>
      <div class="skeleton h-32 w-full"></div>
    </div>
  `;
}

// Make functions available globally
window.loadReport = loadReport;
window.navigateMonth = navigateMonth;
window.exportReportPDF = exportReportPDF;
