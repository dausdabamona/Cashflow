// Kiyosaki Finance Tracker - Main App Controller

// Global state
let currentUser = null;
let currentView = 'dashboard';
let accounts = [];
let categories = [];

// Transaction modal state
let transactionType = 'expense';
let selectedCategory = null;
let selectedIncomeType = 'active';

/**
 * Initialize the application
 */
async function initApp() {
  // Initialize Lucide icons
  lucide.createIcons();

  // Check authentication via window.db.auth.getUser()
  try {
    const { data: { user } } = await window.db.auth.getUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    currentUser = user;
    window.currentUser = user;
  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = 'index.html';
    return;
  }

  // Update user name in header with greeting
  const userNameEl = document.getElementById('userName');
  if (userNameEl) {
    const displayName = currentUser.user_metadata?.full_name ||
                       currentUser.email?.split('@')[0] ||
                       'User';
    userNameEl.textContent = `Hai, ${displayName}!`;
  }

  // Load initial data
  await loadInitialData();

  // Setup navigation
  setupNavigation();

  // Setup transaction modal
  setupTransactionModal();

  // Setup transfer modal
  setupTransferModal();

  // Load dashboard
  await loadDashboard();

  // Listen for auth state changes
  window.db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'index.html';
    }
  });

  console.log('✅ App initialized successfully');
}

/**
 * Load initial data (accounts, categories)
 */
async function loadInitialData() {
  try {
    // Load accounts
    await loadAccounts();

    // Load categories
    await loadCategories();

    // Populate account dropdowns
    populateAccountDropdowns();

  } catch (error) {
    console.error('Load initial data error:', error);
    showToast('Gagal memuat data', 'error');
  }
}

/**
 * Load accounts from database and populate dropdown
 */
async function loadAccounts() {
  try {
    const { data, error } = await window.db
      .from('accounts')
      .select('*')
      .order('name');

    if (error) throw error;
    accounts = data || [];
    window.accounts = accounts;
    return accounts;
  } catch (error) {
    console.error('Load accounts error:', error);
    return [];
  }
}

/**
 * Load categories by type from database and populate dropdown
 * @param {string} type - 'income' or 'expense' (optional, loads all if not specified)
 */
async function loadCategories(type = null) {
  try {
    let query = window.db.from('categories').select('*');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    if (!type) {
      categories = data || [];
      window.categories = categories;
    }

    return data || [];
  } catch (error) {
    console.error('Load categories error:', error);
    return [];
  }
}

/**
 * Populate account dropdowns
 */
function populateAccountDropdowns() {
  const dropdowns = ['transactionAccount', 'transferFrom', 'transferTo'];

  dropdowns.forEach(id => {
    const select = document.getElementById(id);
    if (select && accounts.length > 0) {
      select.innerHTML = accounts.map(acc =>
        `<option value="${acc.id}">${acc.name} (${formatRupiahShort(acc.balance || 0)})</option>`
      ).join('');
    } else if (select) {
      select.innerHTML = '<option value="">Belum ada akun</option>';
    }
  });
}

/**
 * Setup navigation handlers
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const settingsBtn = document.getElementById('settingsBtn');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      showView(view);

      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Settings button in header (⚙️)
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      showView('settings');
      navItems.forEach(nav => {
        nav.classList.toggle('active', nav.dataset.view === 'settings');
      });
    });
  }
}

/**
 * Show a view by name - renders view to #mainContent
 * @param {string} name - View name (dashboard/stats/history/settings)
 */
async function showView(name) {
  currentView = name;

  // Hide all views
  const views = ['dashboard', 'stats', 'history', 'settings', 'report'];
  views.forEach(v => {
    const el = document.getElementById(`${v}View`);
    if (el) el.classList.add('hidden');
  });

  // Show selected view
  const viewEl = document.getElementById(`${name}View`);
  if (viewEl) {
    viewEl.classList.remove('hidden');

    // Load view content
    switch (name) {
      case 'dashboard':
        if (typeof loadDashboard === 'function') await loadDashboard();
        break;
      case 'stats':
        if (typeof loadStats === 'function') await loadStats();
        break;
      case 'history':
        if (typeof loadHistory === 'function') await loadHistory();
        break;
      case 'settings':
        if (typeof loadSettings === 'function') await loadSettings();
        break;
      case 'report':
        if (typeof loadReport === 'function') await loadReport();
        break;
    }
  }

  // Reinitialize icons
  lucide.createIcons();
}

// Alias for backward compatibility
const navigateTo = showView;

/**
 * Show a modal by ID
 * @param {string} id - Modal element ID
 */
function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    lucide.createIcons();
  }
}

/**
 * Hide a modal by ID
 * @param {string} id - Modal element ID
 */
function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Show toast notification - appears for 3 seconds then disappears
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  toast.className = `fixed bottom-20 left-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 transform transition-all duration-300`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-5 h-5"></i>
    <span>${message}</span>
  `;
  toast.classList.remove('translate-y-full', 'opacity-0');

  // Re-initialize Lucide icons
  lucide.createIcons();

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-y-full', 'opacity-0');
  }, 3000);
}

/**
 * Show loading overlay
 */
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User's choice
 */
async function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const yesBtn = document.getElementById('confirmYes');
    const noBtn = document.getElementById('confirmNo');

    if (!modal || !messageEl) {
      resolve(confirm(message));
      return;
    }

    messageEl.textContent = message;
    modal.classList.remove('hidden');

    const handleYes = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve(true);
    };

    const handleNo = () => {
      modal.classList.add('hidden');
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
  });
}

/**
 * Setup transaction modal
 */
function setupTransactionModal() {
  const fabBtn = document.getElementById('fabBtn');
  const overlay = document.getElementById('transactionOverlay');
  const expenseTab = document.getElementById('expenseTab');
  const incomeTab = document.getElementById('incomeTab');
  const amountInput = document.getElementById('transactionAmount');
  const dateInput = document.getElementById('transactionDate');
  const submitBtn = document.getElementById('submitTransaction');
  const incomeTypeSection = document.getElementById('incomeTypeSection');
  const incomeTypeBtns = document.querySelectorAll('.income-type-btn');

  // Open modal on FAB click
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      openTransactionModal('expense');
    });
  }

  // Close modal on overlay click
  if (overlay) {
    overlay.addEventListener('click', closeTransactionModal);
  }

  // Tab switching - Expense
  if (expenseTab) {
    expenseTab.addEventListener('click', () => {
      transactionType = 'expense';
      expenseTab.className = 'flex-1 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium transition-all';
      incomeTab.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-600 font-medium transition-all';
      incomeTypeSection?.classList.add('hidden');
      loadCategoryChips('expense');
    });
  }

  // Tab switching - Income
  if (incomeTab) {
    incomeTab.addEventListener('click', () => {
      transactionType = 'income';
      incomeTab.className = 'flex-1 py-2 px-4 rounded-lg bg-green-100 text-green-700 font-medium transition-all';
      expenseTab.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-600 font-medium transition-all';
      incomeTypeSection?.classList.remove('hidden');
      loadCategoryChips('income');
    });
  }

  // Income type selection (active/passive/portfolio)
  incomeTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedIncomeType = btn.dataset.type;
      incomeTypeBtns.forEach(b => {
        b.className = b === btn
          ? 'income-type-btn flex-1 py-2 px-3 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 text-sm font-medium'
          : 'income-type-btn flex-1 py-2 px-3 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-medium';
      });
    });
  });

  // Format amount input (auto format to Indonesian number)
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('id-ID');
      }
    });
  }

  // Set default date to today
  if (dateInput) {
    dateInput.value = getToday();
  }

  // Submit transaction
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmitTransaction);
  }

  // Category selection handler (delegated)
  document.getElementById('categoryList')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (chip) {
      selectedCategory = chip.dataset.id;
      document.querySelectorAll('.category-chip').forEach(c => {
        c.classList.toggle('selected', c.dataset.id === selectedCategory);
      });
    }
  });
}

/**
 * Open transaction modal with specific type
 * @param {string} type - 'expense', 'income', or 'transfer'
 */
function openTransactionModal(type = 'expense') {
  transactionType = type;

  // If transfer, open transfer modal instead
  if (type === 'transfer') {
    openTransferModal();
    return;
  }

  const overlay = document.getElementById('transactionOverlay');
  const sheet = document.getElementById('transactionSheet');
  const amountInput = document.getElementById('transactionAmount');
  const dateInput = document.getElementById('transactionDate');
  const expenseTab = document.getElementById('expenseTab');
  const incomeTab = document.getElementById('incomeTab');

  overlay?.classList.add('active');
  sheet?.classList.add('active');

  // Reset form
  if (amountInput) amountInput.value = '';
  if (dateInput) dateInput.value = getToday();
  const descInput = document.getElementById('transactionDescription');
  if (descInput) descInput.value = '';
  selectedCategory = null;

  // Set tab state based on type
  if (type === 'income') {
    incomeTab?.click();
  } else {
    expenseTab?.click();
  }

  lucide.createIcons();
}

/**
 * Handle transaction form submission
 */
async function handleSubmitTransaction() {
  const amountInput = document.getElementById('transactionAmount');
  const dateInput = document.getElementById('transactionDate');
  const descInput = document.getElementById('transactionDescription');
  const accountSelect = document.getElementById('transactionAccount');

  const amount = parseInt(amountInput?.value.replace(/\D/g, '')) || 0;
  const accountId = accountSelect?.value;
  const date = dateInput?.value;
  const description = descInput?.value || '';

  // Validation
  if (!amount || amount <= 0) {
    showToast('Masukkan jumlah yang valid', 'error');
    return;
  }

  if (!selectedCategory) {
    showToast('Pilih kategori', 'error');
    return;
  }

  if (!accountId) {
    showToast('Pilih akun', 'error');
    return;
  }

  if (!date) {
    showToast('Pilih tanggal', 'error');
    return;
  }

  try {
    showLoading();

    if (transactionType === 'expense') {
      await submitExpense(amount, accountId, selectedCategory, date, description);
      showToast('Pengeluaran tersimpan!', 'success');
    } else {
      await submitIncome(amount, accountId, selectedCategory, date, description, selectedIncomeType);
      showToast('Pemasukan tersimpan!', 'success');
    }

    hideLoading();
    closeTransactionModal();

    // Refresh data and dashboard
    await onSuccess();

  } catch (error) {
    hideLoading();
    console.error('Transaction error:', error);
    showToast(error.message || 'Gagal menyimpan transaksi', 'error');
  }
}

/**
 * Submit expense - calls window.db.rpc('record_expense', {...})
 */
async function submitExpense(amount, accountId, categoryId, date, description) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User tidak terautentikasi');

  const { data, error } = await window.db.rpc('record_expense', {
    p_user_id: userId,
    p_amount: amount,
    p_account_id: accountId,
    p_category_id: categoryId,
    p_date: date,
    p_description: description || null,
    p_item_id: null
  });

  if (error) throw error;
  return data;
}

/**
 * Submit income - calls window.db.rpc('record_income', {...})
 */
async function submitIncome(amount, accountId, categoryId, date, description, incomeType = 'active') {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User tidak terautentikasi');

  const { data, error } = await window.db.rpc('record_income', {
    p_user_id: userId,
    p_amount: amount,
    p_account_id: accountId,
    p_category_id: categoryId,
    p_date: date,
    p_description: description || null,
    p_income_type: incomeType,
    p_item_id: null
  });

  if (error) throw error;
  return data;
}

/**
 * Submit transfer - calls window.db.rpc('transfer_funds', {...})
 */
async function submitTransfer(fromAccountId, toAccountId, amount, description) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User tidak terautentikasi');

  const { data, error } = await window.db.rpc('transfer_funds', {
    p_user_id: userId,
    p_from_account_id: fromAccountId,
    p_to_account_id: toAccountId,
    p_amount: amount,
    p_date: getToday(),
    p_description: description || null
  });

  if (error) throw error;
  return data;
}

/**
 * Called after successful transaction - closes modal, shows toast, reloads dashboard
 */
async function onSuccess() {
  await loadInitialData();
  await loadDashboard();
}

/**
 * Load category chips for transaction modal
 * @param {string} type - 'income' or 'expense'
 */
function loadCategoryChips(type) {
  const container = document.getElementById('categoryList');
  if (!container) return;

  const filtered = categories.filter(c => c.type === type);

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada kategori. Tambah di Pengaturan.</p>';
    return;
  }

  container.innerHTML = filtered.map(cat => `
    <button class="category-chip" data-id="${cat.id}">
      <span>${cat.icon || '📁'}</span>
      <span>${cat.name}</span>
    </button>
  `).join('');

  // Reset selection
  selectedCategory = null;
}

/**
 * Close transaction modal
 */
function closeTransactionModal() {
  document.getElementById('transactionOverlay')?.classList.remove('active');
  document.getElementById('transactionSheet')?.classList.remove('active');
}

/**
 * Setup transfer modal
 */
function setupTransferModal() {
  const closeBtn = document.getElementById('closeTransferModal');
  const form = document.getElementById('transferForm');
  const amountInput = document.getElementById('transferAmount');

  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideModal('transferModal');
    });
  }

  // Format amount input
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('id-ID');
      }
    });
  }

  // Submit transfer
  if (form) {
    form.addEventListener('submit', handleSubmitTransfer);
  }
}

/**
 * Handle transfer form submission
 */
async function handleSubmitTransfer(e) {
  e.preventDefault();

  const fromAccountId = document.getElementById('transferFrom')?.value;
  const toAccountId = document.getElementById('transferTo')?.value;
  const amountInput = document.getElementById('transferAmount');
  const amount = parseInt(amountInput?.value.replace(/\D/g, '')) || 0;
  const description = document.getElementById('transferDescription')?.value || '';

  // Validation
  if (fromAccountId === toAccountId) {
    showToast('Pilih akun yang berbeda', 'error');
    return;
  }

  if (!amount || amount <= 0) {
    showToast('Masukkan jumlah yang valid', 'error');
    return;
  }

  try {
    showLoading();
    await submitTransfer(fromAccountId, toAccountId, amount, description);
    hideLoading();

    showToast('Transfer berhasil!', 'success');
    hideModal('transferModal');

    // Refresh data
    await onSuccess();

  } catch (error) {
    hideLoading();
    console.error('Transfer error:', error);
    showToast(error.message || 'Transfer gagal', 'error');
  }
}

/**
 * Open transfer modal
 */
function openTransferModal() {
  const amountInput = document.getElementById('transferAmount');
  const descInput = document.getElementById('transferDescription');

  if (amountInput) amountInput.value = '';
  if (descInput) descInput.value = '';

  populateAccountDropdowns();
  showModal('transferModal');
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Make functions available globally
window.initApp = initApp;
window.currentUser = currentUser;
window.accounts = accounts;
window.categories = categories;
window.showView = showView;
window.navigateTo = navigateTo;
window.showModal = showModal;
window.hideModal = hideModal;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showConfirm = showConfirm;
window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.openTransferModal = openTransferModal;
window.loadAccounts = loadAccounts;
window.loadCategories = loadCategories;
window.submitExpense = submitExpense;
window.submitIncome = submitIncome;
window.submitTransfer = submitTransfer;
window.onSuccess = onSuccess;
window.getToday = getToday;
