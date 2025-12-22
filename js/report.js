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

    // Helper function to safely call RPC with fallback
    const safeRpc = async (name, params, fallback = {}) => {
      try {
        const result = await window.db.rpc(name, params);
        return result;
      } catch (err) {
        console.warn(`RPC ${name} failed:`, err);
        return { data: fallback };
      }
    };

    // Fetch all data in parallel
    const [
      summaryResult,
      balanceSheetResult,
      healthScoreResult,
      incomeResult,
      expenseResult,
      itemsResult,
      debtResult,
      recommendationsResult
    ] = await Promise.all([
      safeRpc('get_dashboard_summary', { p_user_id: userId }, {}),
      safeRpc('get_balance_sheet', { p_user_id: userId }, {}),
      safeRpc('calculate_health_score', { p_user_id: userId, p_start_date: startDate, p_end_date: endDate }, {}),
      safeRpc('get_income_composition', { p_user_id: userId, p_start_date: startDate, p_end_date: endDate }, []),
      safeRpc('get_expense_breakdown', { p_user_id: userId, p_start_date: startDate, p_end_date: endDate }, []),
      safeRpc('get_items_with_status', { p_user_id: userId }, []),
      safeRpc('get_debt_summary', { p_user_id: userId }, {}),
      safeRpc('generate_recommendations', { p_user_id: userId }, [])
    ]);

    const summary = summaryResult.data || {};
    const balanceSheet = balanceSheetResult.data || {};
    const healthScore = healthScoreResult.data || {};
    const incomeData = incomeResult.data || [];
    const expenseData = expenseResult.data || [];
    const items = itemsResult.data || [];
    const debtSummary = debtResult.data || {};
    const recommendations = recommendationsResult.data || [];

    container.innerHTML = renderReport({
      summary,
      balanceSheet,
      healthScore,
      incomeData,
      expenseData,
      items,
      debtSummary,
      recommendations
    });
    lucide.createIcons();

    // Initialize charts with delay
    setTimeout(() => initReportCharts(summary, incomeData, expenseData), 100);

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
function renderReport(data) {
  const { summary, balanceSheet, healthScore, incomeData, expenseData, items, debtSummary, recommendations } = data;

  const monthName = currentReportMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const monthIncome = summary.month_income || 0;
  const monthExpense = summary.month_expense || 0;
  const netIncome = monthIncome - monthExpense;
  const passiveIncome = summary.passive_income || 0;
  const passiveExpense = summary.passive_expense || 0;
  const score = healthScore.total_score || healthScore.score || 0;
  const grade = getHealthGrade(score);

  return `
    <!-- Header with navigation -->
    <div class="flex items-center justify-between mb-4">
      <button onclick="showView('settings')" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
      </button>
      <div class="flex items-center gap-2">
        <button onclick="prevMonth()" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <i data-lucide="chevron-left" class="w-4 h-4 text-gray-600"></i>
        </button>
        <h2 class="font-semibold text-gray-900 min-w-[140px] text-center">${monthName}</h2>
        <button onclick="nextMonth()" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
        </button>
      </div>
      <div class="w-10"></div>
    </div>

    <!-- 1. RINGKASAN BULANAN -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <i data-lucide="receipt" class="w-5 h-5 text-blue-600"></i>
        Ringkasan
      </h3>
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
          <span class="font-bold text-xl ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${netIncome >= 0 ? '+' : ''}${formatRupiah(netIncome)}
          </span>
        </div>
      </div>
    </div>

    <!-- 2. HEALTH SCORE -->
    <div class="card mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
          <i data-lucide="heart-pulse" class="w-5 h-5 text-red-500"></i>
          Health Score
        </h3>
        <div class="text-right">
          <span class="text-3xl font-bold ${getHealthScoreColorClass(score)}">${score}</span>
          <span class="text-lg font-bold ${getHealthScoreColorClass(score)}">/${100}</span>
          <span class="ml-2 px-2 py-1 rounded-full text-sm font-bold ${getGradeBadgeClass(grade)}">${grade}</span>
        </div>
      </div>

      <div class="progress-bar mb-4">
        <div class="progress-fill ${getHealthScoreBarClass(score)} progress-animated" style="width: ${score}%"></div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">DSR</span>
            <span class="font-medium ${getDSRStatus(healthScore.dsr)}">${healthScore.dsr || 0}%</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Debt Service Ratio</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Savings Rate</span>
            <span class="font-medium ${getSavingsStatus(healthScore.savings_rate)}">${healthScore.savings_rate || 0}%</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Tingkat Tabungan</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Passive Ratio</span>
            <span class="font-medium ${getPassiveStatus(healthScore.passive_rate)}">${healthScore.passive_rate || 0}%</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Passive Income</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-gray-600">Kiyosaki</span>
            <span class="font-medium ${passiveIncome >= passiveExpense ? 'text-green-600' : 'text-red-600'}">
              ${passiveIncome >= passiveExpense ? 'ASSET' : 'LIABILITY'}
            </span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Status Keuangan</p>
        </div>
      </div>
    </div>

    <!-- 3. NERACA -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <i data-lucide="scale" class="w-5 h-5 text-purple-600"></i>
        Neraca
      </h3>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <h4 class="text-sm font-medium text-gray-500 uppercase mb-3 pb-2 border-b">Aktiva</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Lancar</span>
              <span class="font-medium">${formatRupiahShort(balanceSheet.current_assets || 0)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Tetap</span>
              <span class="font-medium">${formatRupiahShort(balanceSheet.fixed_assets || 0)}</span>
            </div>
            <div class="flex justify-between border-t pt-2 mt-2">
              <span class="font-medium">Total</span>
              <span class="font-bold text-blue-600">${formatRupiahShort(balanceSheet.total_assets || 0)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-500 uppercase mb-3 pb-2 border-b">Pasiva</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Kewajiban</span>
              <span class="font-medium text-red-600">${formatRupiahShort(balanceSheet.total_liabilities || 0)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Ekuitas</span>
              <span class="font-medium text-green-600">${formatRupiahShort(balanceSheet.equity || 0)}</span>
            </div>
            <div class="flex justify-between border-t pt-2 mt-2">
              <span class="font-medium">Total</span>
              <span class="font-bold text-blue-600">${formatRupiahShort(balanceSheet.total_assets || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. KIYOSAKI ANALYSIS -->
    <div class="card mb-4 ${passiveIncome >= passiveExpense ? 'status-asset' : 'status-liability'}">
      <h3 class="font-semibold mb-4 flex items-center gap-2">
        <span class="text-xl">📊</span>
        Analisis Kiyosaki
      </h3>

      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <span>Passive Income</span>
          <span class="font-semibold">${formatRupiahShort(passiveIncome)}/bln</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${passiveIncome >= passiveExpense ? 'progress-fill-green' : 'progress-fill-yellow'} progress-animated"
               style="width: ${Math.min(100, passiveExpense > 0 ? (passiveIncome / passiveExpense) * 100 : (passiveIncome > 0 ? 100 : 0))}%"></div>
        </div>
        <p class="text-sm mt-2 opacity-80">
          Target: ${formatRupiahShort(passiveExpense)}/bln (passive expense)
        </p>
      </div>

      <div class="p-3 rounded-lg ${passiveIncome >= passiveExpense ? 'bg-green-100' : 'bg-yellow-100'}">
        <p class="text-sm font-medium">
          ${passiveIncome >= passiveExpense
            ? '🎉 Selamat! Kamu sudah menjadi ASSET. Passive income sudah melebihi passive expense!'
            : `💪 ${Math.round((passiveIncome / (passiveExpense || 1)) * 100)}% menuju kebebasan finansial. Terus tingkatkan passive income!`
          }
        </p>
      </div>
    </div>

    <!-- 5. STATUS ITEM -->
    ${items.length > 0 ? `
      <div class="card mb-4">
        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i data-lucide="package" class="w-5 h-5 text-yellow-600"></i>
          Status Item
        </h3>
        <div class="space-y-3">
          ${items.map(item => {
            const netCashflow = (item.monthly_income || 0) - (item.monthly_expense || 0);
            const status = item.kiyosaki_status || (netCashflow >= 0 ? 'asset' : 'liability');
            return `
              <div class="p-3 rounded-lg ${status === 'asset' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">${item.name}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full font-bold ${status === 'asset' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${status.toUpperCase()}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="opacity-70">Nilai: ${formatRupiahShort(item.current_value || item.purchase_price || 0)}</span>
                  <span class="${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${netCashflow >= 0 ? '+' : ''}${formatRupiahShort(netCashflow)}/bln
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- 6. PROGRESS HUTANG -->
    ${debtSummary && debtSummary.total_debt > 0 ? `
      <div class="card mb-4">
        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i data-lucide="landmark" class="w-5 h-5 text-red-600"></i>
          Progress Hutang
        </h3>

        <div class="bg-red-50 rounded-lg p-4 mb-4">
          <div class="flex justify-between mb-2">
            <span class="text-gray-600">Total Hutang</span>
            <span class="font-bold text-red-600">${formatRupiah(debtSummary.total_debt)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Cicilan/bulan</span>
            <span class="font-medium">${formatRupiah(debtSummary.monthly_payment || 0)}</span>
          </div>
          ${debtSummary.estimated_payoff_months ? `
            <p class="text-sm text-gray-500 mt-2">
              Estimasi lunas: ${debtSummary.estimated_payoff_months} bulan lagi
            </p>
          ` : ''}
        </div>

        <div class="progress-bar">
          <div class="progress-fill progress-fill-green progress-animated"
               style="width: ${Math.max(0, 100 - ((debtSummary.remaining_balance || debtSummary.total_debt) / (debtSummary.original_debt || debtSummary.total_debt) * 100))}%">
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-2 text-center">
          ${Math.round(Math.max(0, 100 - ((debtSummary.remaining_balance || debtSummary.total_debt) / (debtSummary.original_debt || debtSummary.total_debt) * 100)))}% sudah terbayar
        </p>
      </div>
    ` : ''}

    <!-- 7. CHART -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <i data-lucide="pie-chart" class="w-5 h-5 text-indigo-600"></i>
        Visualisasi
      </h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-500 text-center mb-2">Pemasukan</p>
          <div class="chart-container" style="height: 150px;">
            <canvas id="reportIncomeChart"></canvas>
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500 text-center mb-2">Pengeluaran</p>
          <div class="chart-container" style="height: 150px;">
            <canvas id="reportExpenseChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- 8. REKOMENDASI -->
    ${recommendations.length > 0 ? `
      <div class="card mb-4">
        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i data-lucide="lightbulb" class="w-5 h-5 text-yellow-500"></i>
          Rekomendasi
        </h3>
        <div class="space-y-3">
          ${recommendations.slice(0, 5).map((rec, i) => `
            <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div class="flex items-start gap-2">
                <span class="text-blue-600 font-bold">${i + 1}.</span>
                <div>
                  <p class="text-sm text-gray-900">${rec.message || rec.recommendation || rec}</p>
                  ${rec.potential ? `
                    <p class="text-xs text-blue-600 mt-1">Potensi: ${formatRupiahShort(rec.potential)}</p>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="card mb-4">
        <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <i data-lucide="lightbulb" class="w-5 h-5 text-yellow-500"></i>
          Rekomendasi
        </h3>
        <div class="space-y-3">
          <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p class="text-sm text-gray-900">Tingkatkan passive income dengan investasi atau bisnis sampingan.</p>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p class="text-sm text-gray-900">Kurangi pengeluaran konsumtif dan alihkan ke aset produktif.</p>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p class="text-sm text-gray-900">Simpan minimal 20% dari penghasilan untuk dana darurat.</p>
          </div>
        </div>
      </div>
    `}

    <!-- 9. DOWNLOAD PDF -->
    <div class="card text-center">
      <button onclick="exportReportPDF()" class="btn btn-primary w-full">
        <i data-lucide="download" class="w-5 h-5"></i>
        <span>Download Laporan PDF</span>
      </button>
      <p class="text-xs text-gray-400 mt-2">Simpan laporan untuk arsip</p>
    </div>
  `;
}

/**
 * Navigate to previous month
 */
function prevMonth() {
  currentReportMonth.setMonth(currentReportMonth.getMonth() - 1);
  loadReport(currentReportMonth);
}

/**
 * Navigate to next month
 */
function nextMonth() {
  currentReportMonth.setMonth(currentReportMonth.getMonth() + 1);
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
 * Get health grade from score
 */
function getHealthGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

/**
 * Get grade badge class
 */
function getGradeBadgeClass(grade) {
  if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
  if (grade === 'B') return 'bg-blue-100 text-blue-800';
  if (grade === 'C') return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
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
 * Get DSR status color
 */
function getDSRStatus(dsr) {
  if (!dsr) return 'text-gray-600';
  if (dsr <= 30) return 'text-green-600';
  if (dsr <= 50) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get savings rate status color
 */
function getSavingsStatus(rate) {
  if (!rate) return 'text-gray-600';
  if (rate >= 20) return 'text-green-600';
  if (rate >= 10) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get passive income ratio status color
 */
function getPassiveStatus(rate) {
  if (!rate) return 'text-gray-600';
  if (rate >= 100) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Initialize report charts
 */
function initReportCharts(summary, incomeData, expenseData) {
  // Income Chart
  const incomeCtx = document.getElementById('reportIncomeChart');
  if (incomeCtx) {
    if (incomeData && incomeData.length > 0) {
      new Chart(incomeCtx, {
        type: 'doughnut',
        data: {
          labels: incomeData.map(d => d.income_type || 'Lainnya'),
          datasets: [{
            data: incomeData.map(d => d.total),
            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    } else {
      incomeCtx.parentElement.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Tidak ada data</p>';
    }
  }

  // Expense Chart
  const expenseCtx = document.getElementById('reportExpenseChart');
  if (expenseCtx) {
    if (expenseData && expenseData.length > 0) {
      const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];
      new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
          labels: expenseData.slice(0, 6).map(d => d.category_name || 'Lainnya'),
          datasets: [{
            data: expenseData.slice(0, 6).map(d => d.total),
            backgroundColor: colors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    } else {
      expenseCtx.parentElement.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Tidak ada data</p>';
    }
  }
}

/**
 * Export report to PDF
 */
async function exportReportPDF() {
  // Check if html2pdf is available
  if (typeof html2pdf === 'undefined') {
    // Load html2pdf dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => generatePDF();
    document.head.appendChild(script);
  } else {
    generatePDF();
  }
}

/**
 * Generate PDF from report
 */
function generatePDF() {
  const element = document.getElementById('reportView');
  const monthName = currentReportMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  showToast('Membuat PDF...', 'info');

  const opt = {
    margin: 10,
    filename: `Laporan_Keuangan_${monthName.replace(' ', '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    showToast('PDF berhasil diunduh!', 'success');
  }).catch(err => {
    console.error('PDF export error:', err);
    showToast('Gagal membuat PDF', 'error');
  });
}

/**
 * Get report loading skeleton
 */
function getReportSkeleton() {
  return `
    <div class="flex items-center justify-between mb-4">
      <div class="skeleton h-10 w-10 rounded-lg"></div>
      <div class="flex items-center gap-2">
        <div class="skeleton h-8 w-8 rounded-lg"></div>
        <div class="skeleton h-6 w-36"></div>
        <div class="skeleton h-8 w-8 rounded-lg"></div>
      </div>
      <div class="w-10"></div>
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
      <div class="skeleton h-8 w-full mb-4"></div>
      <div class="grid grid-cols-2 gap-3">
        <div class="skeleton h-20 w-full rounded-lg"></div>
        <div class="skeleton h-20 w-full rounded-lg"></div>
        <div class="skeleton h-20 w-full rounded-lg"></div>
        <div class="skeleton h-20 w-full rounded-lg"></div>
      </div>
    </div>
    <div class="card mb-4">
      <div class="skeleton h-6 w-32 mb-4"></div>
      <div class="skeleton h-40 w-full"></div>
    </div>
  `;
}

// Make functions available globally
window.loadReport = loadReport;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.exportReportPDF = exportReportPDF;
