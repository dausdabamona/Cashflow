// Kiyosaki Finance Tracker - Dashboard Module

/**
 * Load dashboard view
 */
async function loadDashboard() {
  const container = document.getElementById('dashboardView');
  if (!container) return;

  try {
    // Show loading skeleton
    container.innerHTML = getDashboardSkeleton();

    // Fetch dashboard data
    const userId = currentUser?.id;
    if (!userId) return;

    const { data: summary, error } = await window.db.rpc('get_dashboard_summary', {
      p_user_id: userId
    });

    if (error) throw error;

    // Fetch recent transactions
    const { data: transactions, error: txError } = await window.db
      .from('transactions')
      .select('*, account:accounts(name), category:categories(name, icon)')
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(5);

    if (txError) throw txError;

    // Render dashboard
    container.innerHTML = renderDashboard(summary, transactions || []);
    lucide.createIcons();

  } catch (error) {
    console.error('Load dashboard error:', error);
    container.innerHTML = `
      <div class="card text-center py-8">
        <i data-lucide="alert-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
        <p class="text-gray-500">Gagal memuat dashboard</p>
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
  const healthScore = data.health_score || 0;

  // Determine Kiyosaki status
  const netCashflow = passiveIncome - passiveExpense;
  const kiyosakiStatus = netCashflow >= 0 ? 'asset' : 'liability';
  const progressToAsset = passiveExpense > 0
    ? Math.min(100, Math.round((passiveIncome / passiveExpense) * 100))
    : (passiveIncome > 0 ? 100 : 0);

  return `
    <!-- Kiyosaki Status Card -->
    <div class="card mb-4 ${kiyosakiStatus === 'asset' ? 'status-asset' : 'status-liability'}">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium uppercase tracking-wide">Status Kiyosaki</span>
        <span class="px-2 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(kiyosakiStatus)}">
          ${kiyosakiStatus === 'asset' ? 'ASSET' : 'LIABILITY'}
        </span>
      </div>

      <div class="mb-3">
        <div class="progress-bar">
          <div class="progress-fill ${kiyosakiStatus === 'asset' ? 'progress-fill-green' : 'progress-fill-yellow'}"
               style="width: ${progressToAsset}%"></div>
        </div>
        <p class="text-sm mt-2 opacity-80">${getProgressMessage(kiyosakiStatus, progressToAsset)}</p>
      </div>

      <div class="grid grid-cols-2 gap-4 pt-3 border-t border-current border-opacity-20">
        <div>
          <p class="text-xs opacity-70">Passive Income</p>
          <p class="font-semibold">${formatRupiahShort(passiveIncome)}</p>
        </div>
        <div>
          <p class="text-xs opacity-70">Passive Expense</p>
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
      <h3 class="font-semibold text-gray-900 mb-4">Ringkasan</h3>

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
            <span class="text-gray-600">Pemasukan Bulan Ini</span>
          </div>
          <span class="font-semibold text-green-600">+${formatRupiahShort(monthIncome)}</span>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <i data-lucide="trending-down" class="w-5 h-5 text-red-600"></i>
            </div>
            <span class="text-gray-600">Pengeluaran Bulan Ini</span>
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
        <span class="text-2xl font-bold ${getHealthScoreColor(healthScore)}">${healthScore}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${getHealthScoreBarColor(healthScore)}" style="width: ${healthScore}%"></div>
      </div>
      <p class="text-sm text-gray-500 mt-2">${getHealthScoreMessage(healthScore)}</p>
    </div>

    <!-- Recent Transactions -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900">Transaksi Terakhir</h3>
        <button onclick="navigateTo('history')" class="text-blue-600 text-sm font-medium">Lihat Semua</button>
      </div>

      ${transactions.length > 0 ? `
        <div class="space-y-1">
          ${transactions.map(tx => renderTransactionItem(tx)).join('')}
        </div>
      ` : `
        <div class="text-center py-8">
          <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-2"></i>
          <p class="text-gray-500 text-sm">Belum ada transaksi</p>
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
        <p class="text-sm text-gray-500">${formatRelative(tx.date)} • ${tx.account?.name || 'Unknown'}</p>
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
 * Get health score message
 */
function getHealthScoreMessage(score) {
  if (score >= 80) return 'Kesehatan keuangan sangat baik! Pertahankan!';
  if (score >= 60) return 'Kesehatan keuangan cukup baik. Ada ruang untuk perbaikan.';
  if (score >= 40) return 'Kesehatan keuangan perlu perhatian.';
  return 'Kesehatan keuangan perlu perbaikan segera.';
}

/**
 * Open quick expense modal
 */
function openQuickExpense() {
  document.getElementById('fabBtn')?.click();
  setTimeout(() => {
    document.getElementById('expenseTab')?.click();
  }, 100);
}

/**
 * Open quick income modal
 */
function openQuickIncome() {
  document.getElementById('fabBtn')?.click();
  setTimeout(() => {
    document.getElementById('incomeTab')?.click();
  }, 100);
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
 * Get progress message based on Kiyosaki status
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
 * Get motivation message based on Kiyosaki status
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

/**
 * Navigate to a specific view
 */
function navigateTo(viewName) {
  const navButtons = {
    'home': 'navHome',
    'dashboard': 'navHome',
    'stats': 'navStats',
    'history': 'navHistory',
    'profile': 'navProfile'
  };

  const btnId = navButtons[viewName];
  if (btnId) {
    document.getElementById(btnId)?.click();
  }
}

// Make functions available globally
window.loadDashboard = loadDashboard;
window.openQuickExpense = openQuickExpense;
window.openQuickIncome = openQuickIncome;
window.getMotivationMessage = getMotivationMessage;
window.navigateTo = navigateTo;
