// Kiyosaki Finance Tracker - Settings Module

/**
 * Load settings view
 */
async function loadSettings() {
  const container = document.getElementById('settingsView');
  if (!container) return;

  container.innerHTML = renderSettings();
  lucide.createIcons();
}

/**
 * Render settings HTML
 */
function renderSettings() {
  const user = currentUser;
  const displayName = getUserDisplayName(user);
  const email = user?.email || '';

  return `
    <!-- Profile Section -->
    <div class="card mb-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
          ${displayName.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1">
          <h2 class="text-lg font-semibold text-gray-900">${displayName}</h2>
          <p class="text-sm text-gray-500">${email}</p>
        </div>
        <button onclick="openEditProfile()" class="text-blue-600">
          <i data-lucide="edit-2" class="w-5 h-5"></i>
        </button>
      </div>
    </div>

    <!-- Menu Items -->
    <div class="card mb-4">
      <div class="space-y-1">
        <button onclick="navigateTo('report')" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i data-lucide="bar-chart-3" class="w-5 h-5 text-purple-600"></i>
            </div>
            <span class="font-medium text-gray-900">Laporan Bulanan</span>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>

        <button onclick="openAccountManager()" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i data-lucide="credit-card" class="w-5 h-5 text-blue-600"></i>
            </div>
            <span class="font-medium text-gray-900">Kelola Akun</span>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>

        <button onclick="openCategoryManager()" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i data-lucide="folder" class="w-5 h-5 text-green-600"></i>
            </div>
            <span class="font-medium text-gray-900">Kelola Kategori</span>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>

        <button onclick="openItemManager()" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <i data-lucide="package" class="w-5 h-5 text-yellow-600"></i>
            </div>
            <span class="font-medium text-gray-900">Aset & Hutang</span>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>
      </div>
    </div>

    <!-- Preferences -->
    <div class="card mb-4">
      <h3 class="font-semibold text-gray-900 mb-3">Preferensi</h3>
      <div class="space-y-1">
        <div class="flex items-center justify-between p-3">
          <div class="flex items-center gap-3">
            <i data-lucide="bell" class="w-5 h-5 text-gray-400"></i>
            <span class="text-gray-700">Notifikasi</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="notificationToggle" class="sr-only peer" checked>
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between p-3">
          <div class="flex items-center gap-3">
            <i data-lucide="moon" class="w-5 h-5 text-gray-400"></i>
            <span class="text-gray-700">Mode Gelap</span>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="darkModeToggle" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="card border border-red-200">
      <button onclick="handleLogout()" class="w-full flex items-center justify-center gap-2 p-3 text-red-600 font-medium">
        <i data-lucide="log-out" class="w-5 h-5"></i>
        <span>Keluar</span>
      </button>
    </div>

    <!-- App Info -->
    <div class="text-center mt-6 text-sm text-gray-400">
      <p>Kiyosaki Tracker v1.0.0</p>
      <p class="mt-1">Made with ❤️ for Financial Freedom</p>
    </div>
  `;
}

/**
 * Open edit profile modal
 */
function openEditProfile() {
  // TODO: Implement profile editing
  showToast('Fitur dalam pengembangan', 'info');
}

/**
 * Open account manager
 */
async function openAccountManager() {
  const container = document.getElementById('settingsView');
  if (!container) return;

  try {
    showLoading();
    const { data: accountsData, error } = await window.db
      .from('accounts')
      .select('*')
      .order('name');

    if (error) throw error;
    hideLoading();

    container.innerHTML = renderAccountManager(accountsData || []);
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load accounts error:', error);
    showToast('Gagal memuat data akun', 'error');
  }
}

/**
 * Render account manager
 */
function renderAccountManager(accountsList) {
  return `
    <div class="flex items-center gap-3 mb-4">
      <button onclick="loadSettings()" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
      </button>
      <h2 class="text-lg font-semibold text-gray-900">Kelola Akun</h2>
    </div>

    <div class="card mb-4">
      <button onclick="showAddAccountForm()" class="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
        <i data-lucide="plus" class="w-5 h-5"></i>
        <span>Tambah Akun Baru</span>
      </button>
    </div>

    <div class="space-y-3">
      ${accountsList.map(acc => `
        <div class="card flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <i data-lucide="${getAccountIcon(acc.type)}" class="w-6 h-6 text-blue-600"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900">${acc.name}</p>
              <p class="text-sm text-gray-500">${acc.type || 'Umum'}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold ${(acc.balance || 0) >= 0 ? 'text-gray-900' : 'text-red-600'}">
              ${formatRupiah(acc.balance || 0)}
            </p>
          </div>
        </div>
      `).join('')}
    </div>

    ${accountsList.length === 0 ? `
      <div class="card text-center py-8">
        <i data-lucide="credit-card" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
        <p class="text-gray-500">Belum ada akun</p>
      </div>
    ` : ''}
  `;
}

/**
 * Get account icon based on type
 */
function getAccountIcon(type) {
  const icons = {
    'cash': 'wallet',
    'bank': 'landmark',
    'e-wallet': 'smartphone',
    'credit_card': 'credit-card',
    'investment': 'trending-up'
  };
  return icons[type] || 'wallet';
}

/**
 * Show add account form
 */
function showAddAccountForm() {
  // TODO: Implement add account form
  showToast('Fitur dalam pengembangan', 'info');
}

/**
 * Open category manager
 */
async function openCategoryManager() {
  const container = document.getElementById('settingsView');
  if (!container) return;

  try {
    showLoading();
    const { data: categoriesData, error } = await window.db
      .from('categories')
      .select('*')
      .order('type, name');

    if (error) throw error;
    hideLoading();

    container.innerHTML = renderCategoryManager(categoriesData || []);
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load categories error:', error);
    showToast('Gagal memuat data kategori', 'error');
  }
}

/**
 * Render category manager
 */
function renderCategoryManager(categoriesList) {
  const expenseCategories = categoriesList.filter(c => c.type === 'expense');
  const incomeCategories = categoriesList.filter(c => c.type === 'income');

  return `
    <div class="flex items-center gap-3 mb-4">
      <button onclick="loadSettings()" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
      </button>
      <h2 class="text-lg font-semibold text-gray-900">Kelola Kategori</h2>
    </div>

    <div class="card mb-4">
      <button onclick="showAddCategoryForm()" class="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
        <i data-lucide="plus" class="w-5 h-5"></i>
        <span>Tambah Kategori Baru</span>
      </button>
    </div>

    <!-- Expense Categories -->
    <div class="mb-4">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Pengeluaran</h3>
      <div class="card">
        <div class="flex flex-wrap gap-2">
          ${expenseCategories.map(cat => `
            <span class="category-chip">
              <span>${cat.icon || '📁'}</span>
              <span>${cat.name}</span>
            </span>
          `).join('')}
          ${expenseCategories.length === 0 ? '<p class="text-gray-500 text-sm">Belum ada kategori</p>' : ''}
        </div>
      </div>
    </div>

    <!-- Income Categories -->
    <div>
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Pemasukan</h3>
      <div class="card">
        <div class="flex flex-wrap gap-2">
          ${incomeCategories.map(cat => `
            <span class="category-chip">
              <span>${cat.icon || '📁'}</span>
              <span>${cat.name}</span>
            </span>
          `).join('')}
          ${incomeCategories.length === 0 ? '<p class="text-gray-500 text-sm">Belum ada kategori</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Show add category form
 */
function showAddCategoryForm() {
  // TODO: Implement add category form
  showToast('Fitur dalam pengembangan', 'info');
}

/**
 * Open item manager (assets & debts)
 */
async function openItemManager() {
  const container = document.getElementById('settingsView');
  if (!container) return;

  try {
    showLoading();

    // Get items with Kiyosaki status
    const { data: itemsData, error: itemsError } = await window.db.rpc('get_items_with_status', {
      p_user_id: currentUser?.id
    });

    // Get debt summary
    const { data: debtData, error: debtError } = await window.db.rpc('get_debt_summary', {
      p_user_id: currentUser?.id
    });

    if (itemsError) throw itemsError;
    if (debtError) throw debtError;

    hideLoading();

    container.innerHTML = renderItemManager(itemsData || [], debtData || {});
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load items error:', error);
    showToast('Gagal memuat data aset', 'error');
  }
}

/**
 * Render item manager
 */
function renderItemManager(items, debtSummary) {
  return `
    <div class="flex items-center gap-3 mb-4">
      <button onclick="loadSettings()" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
      </button>
      <h2 class="text-lg font-semibold text-gray-900">Aset & Hutang</h2>
    </div>

    <!-- Debt Summary -->
    ${debtSummary && debtSummary.total_debt > 0 ? `
      <div class="card mb-4 status-liability">
        <h3 class="font-semibold mb-2">Ringkasan Hutang</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs opacity-70">Total Hutang</p>
            <p class="font-semibold">${formatRupiahShort(debtSummary.total_debt)}</p>
          </div>
          <div>
            <p class="text-xs opacity-70">Cicilan/Bulan</p>
            <p class="font-semibold">${formatRupiahShort(debtSummary.monthly_payment)}</p>
          </div>
        </div>
      </div>
    ` : ''}

    <div class="card mb-4">
      <button onclick="showBuyItemForm()" class="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
        <i data-lucide="plus" class="w-5 h-5"></i>
        <span>Tambah Item Baru</span>
      </button>
    </div>

    <!-- Items List -->
    <div class="space-y-3">
      ${items.map(item => `
        <div class="card ${item.kiyosaki_status === 'asset' ? 'status-asset' : 'status-liability'}">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium">${item.name}</h4>
            <span class="px-2 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(item.kiyosaki_status)}">
              ${item.kiyosaki_status?.toUpperCase() || 'N/A'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p class="opacity-70">Nilai</p>
              <p class="font-medium">${formatRupiahShort(item.current_value)}</p>
            </div>
            <div>
              <p class="opacity-70">Net Cashflow</p>
              <p class="font-medium">${item.net_cashflow >= 0 ? '+' : ''}${formatRupiahShort(item.net_cashflow)}/bln</p>
            </div>
          </div>
        </div>
      `).join('')}

      ${items.length === 0 ? `
        <div class="card text-center py-8">
          <i data-lucide="package" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
          <p class="text-gray-500">Belum ada item tercatat</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Show buy item form
 */
function showBuyItemForm() {
  // TODO: Implement buy item form
  showToast('Fitur dalam pengembangan', 'info');
}

/**
 * Handle logout
 */
async function handleLogout() {
  const confirmed = await showConfirm('Yakin ingin keluar?');
  if (confirmed) {
    await logout();
  }
}

/**
 * Load stats view
 */
async function loadStats() {
  const container = document.getElementById('statsView');
  if (!container) return;

  try {
    showLoading();

    const userId = currentUser?.id;
    if (!userId) return;

    // Get income composition
    const { data: incomeData, error: incomeError } = await window.db.rpc('get_income_composition', {
      p_user_id: userId,
      p_start_date: getMonthStart(),
      p_end_date: getMonthEnd()
    });

    // Get expense breakdown
    const { data: expenseData, error: expenseError } = await window.db.rpc('get_expense_breakdown', {
      p_user_id: userId,
      p_start_date: getMonthStart(),
      p_end_date: getMonthEnd()
    });

    if (incomeError) throw incomeError;
    if (expenseError) throw expenseError;

    hideLoading();

    container.innerHTML = renderStats(incomeData, expenseData);
    lucide.createIcons();

    // Initialize charts
    initStatsCharts(incomeData, expenseData);

  } catch (error) {
    hideLoading();
    console.error('Load stats error:', error);
    container.innerHTML = `
      <div class="card text-center py-8">
        <i data-lucide="alert-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
        <p class="text-gray-500">Gagal memuat statistik</p>
        <button onclick="loadStats()" class="btn btn-secondary mt-4">Coba Lagi</button>
      </div>
    `;
    lucide.createIcons();
  }
}

/**
 * Render stats HTML
 */
function renderStats(incomeData, expenseData) {
  return `
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Statistik Bulan Ini</h2>

    <!-- Income Composition -->
    <div class="card mb-4">
      <h3 class="font-medium text-gray-900 mb-4">Komposisi Pemasukan</h3>
      <div class="chart-container">
        <canvas id="incomeChart"></canvas>
      </div>
      <div class="mt-4 space-y-2">
        ${incomeData && incomeData.length > 0 ? incomeData.map(item => `
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">${item.income_type || 'Lainnya'}</span>
            <span class="font-medium">${formatRupiahShort(item.total)}</span>
          </div>
        `).join('') : '<p class="text-gray-500 text-sm text-center">Belum ada data</p>'}
      </div>
    </div>

    <!-- Expense Breakdown -->
    <div class="card">
      <h3 class="font-medium text-gray-900 mb-4">Breakdown Pengeluaran</h3>
      <div class="chart-container">
        <canvas id="expenseChart"></canvas>
      </div>
      <div class="mt-4 space-y-2">
        ${expenseData && expenseData.length > 0 ? expenseData.slice(0, 5).map(item => `
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span>${item.icon || '📁'}</span>
              <span class="text-gray-600">${item.category_name || 'Lainnya'}</span>
            </div>
            <span class="font-medium">${formatRupiahShort(item.total)}</span>
          </div>
        `).join('') : '<p class="text-gray-500 text-sm text-center">Belum ada data</p>'}
      </div>
    </div>
  `;
}

/**
 * Initialize stats charts
 */
function initStatsCharts(incomeData, expenseData) {
  // Income Chart
  const incomeCtx = document.getElementById('incomeChart');
  if (incomeCtx && incomeData && incomeData.length > 0) {
    new Chart(incomeCtx, {
      type: 'doughnut',
      data: {
        labels: incomeData.map(d => d.income_type || 'Lainnya'),
        datasets: [{
          data: incomeData.map(d => d.total),
          backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // Expense Chart
  const expenseCtx = document.getElementById('expenseChart');
  if (expenseCtx && expenseData && expenseData.length > 0) {
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];
    new Chart(expenseCtx, {
      type: 'doughnut',
      data: {
        labels: expenseData.slice(0, 5).map(d => d.category_name || 'Lainnya'),
        datasets: [{
          data: expenseData.slice(0, 5).map(d => d.total),
          backgroundColor: colors.slice(0, Math.min(5, expenseData.length)),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

// Make functions available globally
window.loadSettings = loadSettings;
window.openEditProfile = openEditProfile;
window.openAccountManager = openAccountManager;
window.openCategoryManager = openCategoryManager;
window.openItemManager = openItemManager;
window.showAddAccountForm = showAddAccountForm;
window.showAddCategoryForm = showAddCategoryForm;
window.showBuyItemForm = showBuyItemForm;
window.handleLogout = handleLogout;
window.loadStats = loadStats;
