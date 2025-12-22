// Kiyosaki Finance Tracker - Main App Controller

// Global state
let currentUser = null;
let currentView = 'dashboard';
let accounts = [];
let categories = [];

/**
 * Initialize the application
 */
async function initApp() {
  // Initialize Lucide icons
  lucide.createIcons();

  // Check authentication
  currentUser = await checkAuth();
  if (!currentUser) return;

  // Update user name in header
  const userNameEl = document.getElementById('userName');
  if (userNameEl) {
    userNameEl.textContent = getUserDisplayName(currentUser);
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
  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'index.html';
    }
  });
}

/**
 * Load initial data (accounts, categories)
 */
async function loadInitialData() {
  try {
    // Load accounts
    const { data: accountsData, error: accountsError } = await window.db
      .from('accounts')
      .select('*')
      .order('name');

    if (accountsError) throw accountsError;
    accounts = accountsData || [];

    // Load categories
    const { data: categoriesData, error: categoriesError } = await window.db
      .from('categories')
      .select('*')
      .order('type, name');

    if (categoriesError) throw categoriesError;
    categories = categoriesData || [];

    // Populate account dropdowns
    populateAccountDropdowns();

  } catch (error) {
    console.error('Load initial data error:', error);
    showToast('Gagal memuat data', 'error');
  }
}

/**
 * Populate account dropdowns
 */
function populateAccountDropdowns() {
  const dropdowns = ['transactionAccount', 'transferFrom', 'transferTo'];

  dropdowns.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = accounts.map(acc =>
        `<option value="${acc.id}">${acc.name} (${formatRupiahShort(acc.balance || 0)})</option>`
      ).join('');
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
      navigateTo(view);

      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Settings button in header
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      navigateTo('settings');
      navItems.forEach(nav => {
        nav.classList.toggle('active', nav.dataset.view === 'settings');
      });
    });
  }
}

/**
 * Navigate to a view
 * @param {string} view - View name
 */
async function navigateTo(view) {
  currentView = view;

  // Hide all views
  const views = ['dashboard', 'stats', 'history', 'settings', 'report'];
  views.forEach(v => {
    const el = document.getElementById(`${v}View`);
    if (el) el.classList.add('hidden');
  });

  // Show selected view
  const viewEl = document.getElementById(`${view}View`);
  if (viewEl) {
    viewEl.classList.remove('hidden');

    // Load view content
    switch (view) {
      case 'dashboard':
        await loadDashboard();
        break;
      case 'stats':
        await loadStats();
        break;
      case 'history':
        await loadHistory();
        break;
      case 'settings':
        await loadSettings();
        break;
      case 'report':
        await loadReport();
        break;
    }
  }

  // Reinitialize icons
  lucide.createIcons();
}

/**
 * Setup transaction modal
 */
function setupTransactionModal() {
  const fabBtn = document.getElementById('fabBtn');
  const overlay = document.getElementById('transactionOverlay');
  const sheet = document.getElementById('transactionSheet');
  const expenseTab = document.getElementById('expenseTab');
  const incomeTab = document.getElementById('incomeTab');
  const amountInput = document.getElementById('transactionAmount');
  const dateInput = document.getElementById('transactionDate');
  const submitBtn = document.getElementById('submitTransaction');
  const incomeTypeSection = document.getElementById('incomeTypeSection');
  const incomeTypeBtns = document.querySelectorAll('.income-type-btn');

  let isExpense = true;
  let selectedCategory = null;
  let selectedIncomeType = 'active';

  // Open modal
  if (fabBtn) {
    fabBtn.addEventListener('click', () => {
      openTransactionModal();
    });
  }

  // Close modal on overlay click
  if (overlay) {
    overlay.addEventListener('click', closeTransactionModal);
  }

  // Tab switching
  if (expenseTab) {
    expenseTab.addEventListener('click', () => {
      isExpense = true;
      expenseTab.className = 'flex-1 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium transition-all';
      incomeTab.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-600 font-medium transition-all';
      incomeTypeSection?.classList.add('hidden');
      loadCategoryChips('expense');
    });
  }

  if (incomeTab) {
    incomeTab.addEventListener('click', () => {
      isExpense = false;
      incomeTab.className = 'flex-1 py-2 px-4 rounded-lg bg-green-100 text-green-700 font-medium transition-all';
      expenseTab.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-600 font-medium transition-all';
      incomeTypeSection?.classList.remove('hidden');
      loadCategoryChips('income');
    });
  }

  // Income type selection
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

  // Format amount input
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('id-ID');
      }
    });
  }

  // Set default date
  if (dateInput) {
    dateInput.value = getToday();
  }

  // Submit transaction
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const amount = parseInt(amountInput.value.replace(/\D/g, '')) || 0;
      const accountId = document.getElementById('transactionAccount').value;
      const date = dateInput.value;
      const description = document.getElementById('transactionDescription').value;

      if (!amount) {
        showToast('Masukkan jumlah', 'error');
        return;
      }

      if (!selectedCategory) {
        showToast('Pilih kategori', 'error');
        return;
      }

      try {
        showLoading();

        if (isExpense) {
          await recordExpense(amount, accountId, selectedCategory, date, description);
        } else {
          await recordIncome(amount, accountId, selectedCategory, date, description, selectedIncomeType);
        }

        hideLoading();
        showToast(isExpense ? 'Pengeluaran tersimpan!' : 'Pemasukan tersimpan!', 'success');
        closeTransactionModal();

        // Refresh data
        await loadInitialData();
        await loadDashboard();

      } catch (error) {
        hideLoading();
        console.error('Transaction error:', error);
        showToast('Gagal menyimpan transaksi', 'error');
      }
    });
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

  /**
   * Open transaction modal
   */
  function openTransactionModal() {
    overlay.classList.add('active');
    sheet.classList.add('active');
    amountInput.value = '';
    dateInput.value = getToday();
    document.getElementById('transactionDescription').value = '';
    selectedCategory = null;
    loadCategoryChips('expense');
    lucide.createIcons();
  }

  /**
   * Load category chips
   */
  function loadCategoryChips(type) {
    const container = document.getElementById('categoryList');
    const filtered = categories.filter(c => c.type === type);

    container.innerHTML = filtered.map(cat => `
      <button class="category-chip" data-id="${cat.id}">
        <span>${cat.icon || '📁'}</span>
        <span>${cat.name}</span>
      </button>
    `).join('');

    if (filtered.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada kategori</p>';
    }
  }
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
  const modal = document.getElementById('transferModal');
  const closeBtn = document.getElementById('closeTransferModal');
  const form = document.getElementById('transferForm');
  const amountInput = document.getElementById('transferAmount');

  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
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
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fromAccountId = document.getElementById('transferFrom').value;
      const toAccountId = document.getElementById('transferTo').value;
      const amount = parseInt(amountInput.value.replace(/\D/g, '')) || 0;
      const description = document.getElementById('transferDescription').value;

      if (fromAccountId === toAccountId) {
        showToast('Pilih akun yang berbeda', 'error');
        return;
      }

      if (!amount) {
        showToast('Masukkan jumlah', 'error');
        return;
      }

      try {
        showLoading();
        await transferFunds(fromAccountId, toAccountId, amount, description);
        hideLoading();

        showToast('Transfer berhasil!', 'success');
        modal.classList.add('hidden');

        // Refresh data
        await loadInitialData();
        await loadDashboard();

      } catch (error) {
        hideLoading();
        console.error('Transfer error:', error);
        showToast('Transfer gagal', 'error');
      }
    });
  }
}

/**
 * Open transfer modal
 */
function openTransferModal() {
  const modal = document.getElementById('transferModal');
  document.getElementById('transferAmount').value = '';
  document.getElementById('transferDescription').value = '';
  populateAccountDropdowns();
  modal?.classList.remove('hidden');
  lucide.createIcons();
}

// Make functions available globally
window.initApp = initApp;
window.navigateTo = navigateTo;
window.openTransferModal = openTransferModal;
window.accounts = accounts;
window.categories = categories;
window.currentUser = currentUser;
