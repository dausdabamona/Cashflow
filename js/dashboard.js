// Cashflow Tracker - Dashboard Module

/**
 * Load dashboard view - using direct queries instead of RPC
 */
async function loadDashboard() {
  const container = document.getElementById('dashboardView');
  if (!container) return;

  try {
    // Show loading skeleton
    container.innerHTML = getDashboardSkeleton();

    const userId = currentUser?.id;
    if (!userId) {
      console.log('No user ID found');
      return;
    }

    // 1. Get accounts for total balance
    const { data: accountsData, error: accError } = await window.db
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (accError) throw accError;

    // 2. Calculate month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = startOfMonth.toISOString().split('T')[0];

    // 3. Get transactions for this month
    const { data: monthTransactions, error: txError } = await window.db
      .from('transactions')
      .select('*, category:categories(name, icon, type, income_type)')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (txError) throw txError;

    // 4. Get 5 recent transactions for display (without account embed to avoid relationship ambiguity)
    const { data: recentTx, error: recentError } = await window.db
      .from('transactions')
      .select('*, category:categories(name, icon)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    // 4b. Map account names to recent transactions
    const accountMap = {};
    (accountsData || []).forEach(acc => { accountMap[acc.id] = acc.name; });
    (recentTx || []).forEach(tx => {
      tx.account = { name: accountMap[tx.account_id] || 'Unknown' };
    });

    // 5. Calculate totals
    const totalBalance = (accountsData || []).reduce((sum, acc) =>
      sum + parseFloat(acc.current_balance || 0), 0);

    const transactions = monthTransactions || [];

    // Income and expense this month
    const monthIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Passive income (from categories with income_type = 'passive')
    const passiveIncome = transactions
      .filter(t => t.type === 'income' && t.category?.income_type === 'passive')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // For now, passive expense is considered as recurring expenses (simplified)
    // In a more complete implementation, this would come from items/loans
    const passiveExpense = monthExpense * 0.3; // Estimate 30% as passive/recurring

    // 6. Calculate health score (simplified)
    let healthScore = 50;
    const savingsRate = monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0;

    if (savingsRate >= 30) healthScore = 90;
    else if (savingsRate >= 20) healthScore = 80;
    else if (savingsRate >= 10) healthScore = 70;
    else if (savingsRate >= 0) healthScore = 60;
    else if (savingsRate >= -10) healthScore = 40;
    else healthScore = 20;

    // 7. Build summary object
    const summary = {
      total_balance: totalBalance,
      month_income: monthIncome,
      month_expense: monthExpense,
      passive_income: passiveIncome,
      passive_expense: passiveExpense,
      health_score: healthScore
    };

    // 8. Render dashboard
    container.innerHTML = renderDashboard(summary, recentTx || []);
    lucide.createIcons();

  } catch (error) {
    console.error('Load dashboard error:', error);
    container.innerHTML = `
      <div class="card text-center py-8">
        <i data-lucide="alert-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
        <p class="text-gray-500">Gagal memuat dashboard</p>
        <p class="text-xs text-gray-400 mt-1">${error.message || 'Unknown error'}</p>
        <button onclick="loadDashboard()" class="btn btn-secondary mt-4">Coba Lagi</button>
      </div>
    `;
    lucide.createIcons();
  }
}

/**
 * Render dashboard HTML
 */
function renderDashboard(summary, transactions) {
  const data = summary || {};
  const totalBalance = data.total_balance || 0;
  const monthIncome = data.month_income || 0;
  const monthExpense = data.month_expense || 0;
  const passiveIncome = data.passive_income || 0;
  const passiveExpense = data.passive_expense || 0;
  const healthScore = data.health_score || 50;

  // Determine Cashflow status
  const netCashflow = passiveIncome - passiveExpense;
  const cashflowStatus = netCashflow >= 0 ? 'asset' : 'liability';
  const progressToAsset = passiveExpense > 0
    ? Math.min(100, Math.round((passiveIncome / passiveExpense) * 100))
    : (passiveIncome > 0 ? 100 : 50);

  return `
    <!-- Cashflow Status Card -->
    <div class="card mb-4 ${cashflowStatus === 'asset' ? 'status-asset' : 'status-liability'}">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium uppercase tracking-wide">Status Cashflow</span>
        <span class="px-2 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(cashflowStatus)}">
          ${cashflowStatus === 'asset' ? 'ASSET' : 'LIABILITY'}
        </span>
      </div>

      <div class="mb-3">
        <div class="progress-bar">
          <div class="progress-fill ${cashflowStatus === 'asset' ? 'progress-fill-green' : 'progress-fill-yellow'} progress-animated"
               style="width: ${progressToAsset}%"></div>
        </div>
        <p class="text-sm mt-2 opacity-80">${getProgressMessage(cashflowStatus, progressToAsset)}</p>
      </div>

      <div class="grid grid-cols-2 gap-4 pt-3 border-t border-current border-opacity-20">
        <div title="Pendapatan tanpa kerja aktif: sewa, dividen, royalti">
          <p class="text-xs opacity-70">Pendapatan Pasif</p>
          <p class="font-semibold">${formatRupiahShort(passiveIncome)}</p>
        </div>
        <div title="Cicilan hutang dan pengeluaran rutin wajib">
          <p class="text-xs opacity-70">Cicilan & Rutin</p>
          <p class="font-semibold">${formatRupiahShort(passiveExpense)}</p>
        </div>
      </div>
    </div>

    <!-- Quick Action Buttons -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <button onclick="openQuickExpense()" class="card card-hover flex flex-col items-center py-4">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
          <i data-lucide="arrow-up-circle" class="w-6 h-6 text-red-600"></i>
        </div>
        <span class="text-sm font-medium text-gray-700">Pengeluaran</span>
      </button>
      <button onclick="openQuickIncome()" class="card card-hover flex flex-col items-center py-4">
        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <i data-lucide="arrow-down-circle" class="w-6 h-6 text-green-600"></i>
        </div>
        <span class="text-sm font-medium text-gray-700">Pemasukan</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-4">Ringkasan Bulan Ini</h3>

      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i data-lucide="wallet" class="w-5 h-5 text-blue-600"></i>
            </div>
            <span class="text-gray-600">Saldo Total</span>
          </div>
          <span class="font-semibold text-gray-900">${formatRupiah(totalBalance)}</span>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i data-lucide="trending-up" class="w-5 h-5 text-green-600"></i>
            </div>
            <span class="text-gray-600">Pemasukan</span>
          </div>
          <span class="font-semibold text-green-600">+${formatRupiahShort(monthIncome)}</span>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <i data-lucide="trending-down" class="w-5 h-5 text-red-600"></i>
            </div>
            <span class="text-gray-600">Pengeluaran</span>
          </div>
          <span class="font-semibold text-red-600">-${formatRupiahShort(monthExpense)}</span>
        </div>

        <div class="flex justify-between items-center pt-3 border-t">
          <span class="text-gray-600">Selisih</span>
          <span class="font-bold ${monthIncome - monthExpense >= 0 ? 'text-green-600' : 'text-red-600'}">
            ${monthIncome - monthExpense >= 0 ? '+' : ''}${formatRupiahShort(monthIncome - monthExpense)}
          </span>
        </div>
      </div>
    </div>

    <!-- Health Score -->
    <div class="card mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900">Health Score</h3>
        <div class="text-right">
          <span class="text-2xl font-bold ${getHealthScoreColor(healthScore)}">${healthScore}</span>
          <span class="text-sm text-gray-500">/100</span>
          <span class="ml-1 px-2 py-0.5 rounded text-xs font-bold ${getHealthScoreGradeBadge(healthScore)}">${getHealthScoreGrade(healthScore)}</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${getHealthScoreBarColor(healthScore)} progress-animated" style="width: ${healthScore}%"></div>
      </div>
      <p class="text-sm text-gray-600 mt-2">${getHealthScoreMessage(healthScore)}</p>
      <p class="text-xs text-blue-600 mt-1">💡 ${getHealthScoreTips(healthScore)}</p>
    </div>

    <!-- Recent Transactions -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900">Transaksi Terakhir</h3>
        <button onclick="showView('history')" class="text-blue-600 text-sm font-medium">Lihat Semua</button>
      </div>

      ${transactions.length > 0 ? `
        <div class="space-y-1">
          ${transactions.map(tx => renderTransactionItem(tx)).join('')}
        </div>
      ` : `
        <div class="text-center py-8">
          <span class="text-4xl">📝</span>
          <h4 class="font-medium text-gray-900 mt-2">Belum ada transaksi</h4>
          <p class="text-gray-500 text-sm mt-1">Mulai catat pemasukan dan pengeluaran Anda</p>
          <button onclick="document.getElementById('fabBtn')?.click()" class="btn btn-primary mt-4">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Tambah Transaksi</span>
          </button>
        </div>
      `}
    </div>
  `;
}

/**
 * Render a single transaction item
 */
function renderTransactionItem(tx) {
  const isIncome = tx.type === 'income';
  const icon = tx.category?.icon || (isIncome ? '💰' : '💸');
  const categoryName = tx.category?.name || 'Lainnya';

  return `
    <div class="transaction-item">
      <div class="transaction-icon ${isIncome ? 'bg-green-100' : 'bg-red-100'}">
        <span class="text-lg">${icon}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900 truncate">${tx.description || categoryName}</p>
        <p class="text-sm text-gray-500">${formatRelative(tx.date)} • ${tx.account?.name || 'Akun'}</p>
      </div>
      <span class="font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}">
        ${isIncome ? '+' : '-'}${formatRupiahShort(tx.amount)}
      </span>
    </div>
  `;
}

/**
 * Get dashboard loading skeleton
 */
function getDashboardSkeleton() {
  return `
    <div class="card mb-4">
      <div class="skeleton h-6 w-32 mb-4"></div>
      <div class="skeleton h-4 w-full mb-2"></div>
      <div class="skeleton h-4 w-3/4"></div>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="card py-6"><div class="skeleton h-12 w-12 mx-auto rounded-full"></div></div>
      <div class="card py-6"><div class="skeleton h-12 w-12 mx-auto rounded-full"></div></div>
    </div>
    <div class="card mb-4">
      <div class="skeleton h-6 w-24 mb-4"></div>
      <div class="space-y-3">
        <div class="skeleton h-10 w-full"></div>
        <div class="skeleton h-10 w-full"></div>
        <div class="skeleton h-10 w-full"></div>
      </div>
    </div>
  `;
}

/**
 * Get health score color class
 */
function getHealthScoreColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get health score bar color
 */
function getHealthScoreBarColor(score) {
  if (score >= 80) return 'progress-fill-green';
  if (score >= 60) return 'progress-fill-yellow';
  return 'progress-fill-red';
}

/**
 * Get health score grade (A+, A, B, C, D, E)
 */
function getHealthScoreGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

/**
 * Get health score grade badge class
 */
function getHealthScoreGradeBadge(score) {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

/**
 * Get health score message
 */
function getHealthScoreMessage(score) {
  if (score >= 80) return 'Excellent! Keuangan Anda sangat sehat.';
  if (score >= 60) return 'Good. Keuangan cukup sehat, ada ruang perbaikan.';
  if (score >= 40) return 'Warning. Keuangan perlu perhatian lebih.';
  if (score >= 20) return 'Critical. Segera evaluasi keuangan Anda.';
  return 'Emergency. Butuh tindakan segera!';
}

/**
 * Get health score tips
 */
function getHealthScoreTips(score) {
  if (score >= 80) return 'Pertahankan dan tingkatkan passive income.';
  if (score >= 60) return 'Tingkatkan tabungan, kurangi hutang konsumtif.';
  if (score >= 40) return 'Fokus kurangi pengeluaran tidak perlu.';
  if (score >= 20) return 'Evaluasi cicilan dan pengeluaran besar.';
  return 'Hentikan pengeluaran non-esensial segera.';
}

/**
 * Open quick expense modal
 */
function openQuickExpense() {
  if (typeof openTransactionModal === 'function') {
    openTransactionModal('expense');
  } else {
    document.getElementById('fabBtn')?.click();
    setTimeout(() => {
      document.getElementById('expenseTab')?.click();
    }, 100);
  }
}

/**
 * Open quick income modal
 */
function openQuickIncome() {
  if (typeof openTransactionModal === 'function') {
    openTransactionModal('income');
  } else {
    document.getElementById('fabBtn')?.click();
    setTimeout(() => {
      document.getElementById('incomeTab')?.click();
    }, 100);
  }
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
  return status === 'asset'
    ? 'bg-green-100 text-green-800'
    : 'bg-yellow-100 text-yellow-800';
}

/**
 * Get progress message based on Cashflow status
 */
function getProgressMessage(status, progress) {
  if (status === 'asset') {
    return '🎉 Selamat! Passive income sudah melebihi passive expense!';
  }
  if (progress >= 75) {
    return '💪 Hampir sampai! Terus tingkatkan passive income!';
  }
  if (progress >= 50) {
    return '📈 Bagus! Separuh jalan menuju kebebasan finansial!';
  }
  if (progress >= 25) {
    return '🌱 Awal yang baik! Terus bangun aset produktif!';
  }
  return '🚀 Mulai perjalanan finansialmu! Fokus kurangi liability.';
}

/**
 * Get motivation message based on Cashflow status
 */
function getMotivationMessage(status) {
  const assetMessages = [
    'Kamu sudah menjadi ASSET! Terus pertahankan!',
    'Passive income mengalir! Keep it up!',
    'Kebebasan finansial sudah di depan mata!',
    'Rich Dad akan bangga padamu!'
  ];

  const liabilityMessages = [
    'Jangan menyerah! Kurangi liability, tambah asset!',
    'Setiap langkah kecil mendekatkanmu ke kebebasan finansial!',
    'Fokus ubah pengeluaran konsumtif jadi investasi!',
    'Passive income adalah kunci! Mulai dari yang kecil!'
  ];

  const messages = status === 'asset' ? assetMessages : liabilityMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Make functions available globally
window.loadDashboard = loadDashboard;
window.openQuickExpense = openQuickExpense;
window.openQuickIncome = openQuickIncome;
window.getMotivationMessage = getMotivationMessage;
