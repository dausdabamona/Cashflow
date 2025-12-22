// Cashflow Tracker - Main App Controller

// Global state
let currentUser = null;
let currentView = 'dashboard';
let accounts = [];
let categories = [];

// Transaction modal state
let transactionType = 'expense';
let selectedCategory = null;
let selectedIncomeType = 'active';

// Default categories configuration
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', icon: '🍔', type: 'expense' },
  { name: 'Transportasi', icon: '🚗', type: 'expense' },
  { name: 'Rumah & Utilitas', icon: '🏠', type: 'expense' },
  { name: 'Belanja', icon: '🛒', type: 'expense' },
  { name: 'Kesehatan', icon: '💊', type: 'expense' },
  { name: 'Pendidikan', icon: '🎓', type: 'expense' },
  { name: 'Hiburan', icon: '🎮', type: 'expense' },
  { name: 'Pakaian', icon: '👔', type: 'expense' },
  { name: 'Cicilan/Hutang', icon: '💳', type: 'expense' },
  { name: 'Komunikasi', icon: '📱', type: 'expense' },
  { name: 'Perawatan Diri', icon: '💇', type: 'expense' },
  { name: 'Hadiah/Donasi', icon: '🎁', type: 'expense' },
  { name: 'Liburan', icon: '✈️', type: 'expense' },
  { name: 'Lainnya', icon: '📦', type: 'expense' }
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji', icon: '💼', type: 'income', income_type: 'active' },
  { name: 'Bonus', icon: '💰', type: 'income', income_type: 'active' },
  { name: 'Bisnis', icon: '🏪', type: 'income', income_type: 'active' },
  { name: 'Freelance', icon: '💵', type: 'income', income_type: 'active' },
  { name: 'Sewa Property', icon: '🏠', type: 'income', income_type: 'passive' },
  { name: 'Dividen Saham', icon: '💹', type: 'income', income_type: 'portfolio' },
  { name: 'Capital Gain', icon: '📈', type: 'income', income_type: 'portfolio' },
  { name: 'Bunga Bank', icon: '🏦', type: 'income', income_type: 'passive' },
  { name: 'Royalti', icon: '📚', type: 'income', income_type: 'passive' },
  { name: 'Lainnya', icon: '📦', type: 'income', income_type: 'active' }
];

const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'cash', icon: '💵', current_balance: 0 },
  { name: 'Bank BCA', type: 'bank', icon: '🏦', current_balance: 0 },
  { name: 'GoPay', type: 'ewallet', icon: '📱', current_balance: 0 }
];

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

  // Setup OCR scanning
  if (typeof initOCR === 'function') {
    initOCR();
  }

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
    // Initialize default data if needed (first time user)
    await initDefaultData();

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
 * Initialize default data for new users (categories and accounts)
 */
async function initDefaultData() {
  const userId = currentUser?.id;
  if (!userId) return;

  try {
    // Check if user has any categories
    const { data: existingCategories, error: catError } = await window.db
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (catError) throw catError;

    // If no categories exist, create defaults
    if (!existingCategories || existingCategories.length === 0) {
      console.log('Creating default categories for new user...');

      // Insert expense categories
      const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
        ...cat,
        user_id: userId
      }));

      const { error: expError } = await window.db
        .from('categories')
        .insert(expenseCategories);

      if (expError) console.error('Error creating expense categories:', expError);

      // Insert income categories
      const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(cat => ({
        ...cat,
        user_id: userId
      }));

      const { error: incError } = await window.db
        .from('categories')
        .insert(incomeCategories);

      if (incError) console.error('Error creating income categories:', incError);

      console.log('✅ Default categories created');
    }

    // Check if user has any accounts
    const { data: existingAccounts, error: accError } = await window.db
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (accError) throw accError;

    // If no accounts exist, create defaults
    if (!existingAccounts || existingAccounts.length === 0) {
      console.log('Creating default accounts for new user...');

      const defaultAccounts = DEFAULT_ACCOUNTS.map(acc => ({
        ...acc,
        user_id: userId
      }));

      const { error: insertError } = await window.db
        .from('accounts')
        .insert(defaultAccounts);

      if (insertError) console.error('Error creating default accounts:', insertError);

      console.log('✅ Default accounts created');
    }

  } catch (error) {
    console.error('Init default data error:', error);
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
        `<option value="${acc.id}">${acc.name} (${formatRupiahShort(acc.current_balance || 0)})</option>`
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
  const itemPurchaseSection = document.getElementById('itemPurchaseSection');
  const itemPurchaseCheckbox = document.getElementById('isItemPurchase');
  const itemDetails = document.getElementById('itemDetails');

  if (expenseTab) {
    expenseTab.addEventListener('click', () => {
      transactionType = 'expense';
      expenseTab.className = 'flex-1 py-2 px-4 rounded-lg bg-red-100 text-red-700 font-medium transition-all';
      incomeTab.className = 'flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-600 font-medium transition-all';
      incomeTypeSection?.classList.add('hidden');
      itemPurchaseSection?.classList.remove('hidden');
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
      itemPurchaseSection?.classList.add('hidden');
      // Reset item checkbox when switching to income
      if (itemPurchaseCheckbox) itemPurchaseCheckbox.checked = false;
      itemDetails?.classList.add('hidden');
      loadCategoryChips('income');
    });
  }

  // Toggle item details when checkbox is clicked
  if (itemPurchaseCheckbox) {
    itemPurchaseCheckbox.addEventListener('change', () => {
      if (itemPurchaseCheckbox.checked) {
        itemDetails?.classList.remove('hidden');
        // Pre-fill item name from description if available
        const descInput = document.getElementById('transactionDescription');
        const itemNameInput = document.getElementById('itemName');
        if (descInput?.value && itemNameInput && !itemNameInput.value) {
          itemNameInput.value = descInput.value;
        }
      } else {
        itemDetails?.classList.add('hidden');
      }
      lucide.createIcons();
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

  // Reset item purchase fields
  const itemPurchaseCheckbox = document.getElementById('isItemPurchase');
  const itemDetails = document.getElementById('itemDetails');
  const itemNameInput = document.getElementById('itemName');
  if (itemPurchaseCheckbox) itemPurchaseCheckbox.checked = false;
  itemDetails?.classList.add('hidden');
  if (itemNameInput) itemNameInput.value = '';

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

  // Check if this is an item purchase
  const isItemPurchase = document.getElementById('isItemPurchase')?.checked || false;
  const itemName = document.getElementById('itemName')?.value?.trim() || '';
  const itemType = document.getElementById('itemType')?.value || 'other';

  // Validate item name if item purchase is checked
  if (transactionType === 'expense' && isItemPurchase && !itemName) {
    showToast('Masukkan nama barang', 'error');
    return;
  }

  try {
    showLoading();

    if (transactionType === 'expense') {
      if (isItemPurchase) {
        // Use buy_item_cash which creates item AND records expense
        await createItemWithExpense(amount, accountId, date, itemName, itemType, description);
        showToast(`Barang "${itemName}" berhasil ditambahkan!`, 'success');
      } else {
        await submitExpense(amount, accountId, selectedCategory, date, description);
        showToast('Pengeluaran tersimpan!', 'success');
      }
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
 * Create item with expense using buy_item_cash RPC
 * Initial classification is 'idle' - will be calculated based on cashflow
 */
async function createItemWithExpense(amount, accountId, date, itemName, itemType, description) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User tidak terautentikasi');

  // Build description - use item name as primary description
  const itemDescription = description || `Pembelian ${itemName}`;

  const { error } = await window.db.rpc('buy_item_cash', {
    p_user_id: userId,
    p_name: itemName,
    p_type: itemType,
    p_purchase_value: amount,
    p_account_id: accountId,
    p_description: itemDescription,
    p_depreciation_method: 'none',
    p_useful_life_months: 0,
    p_date: date
  });

  if (error) throw error;
}

/**
 * Submit expense - calls window.db.rpc('record_expense', {...})
 */
async function submitExpense(amount, accountId, categoryId, date, description) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User tidak terautentikasi');

  // Check if there's a pending receipt from OCR
  const receiptUrl = window.pendingReceiptUrl || null;
  window.pendingReceiptUrl = null; // Clear after use

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

  // If we have a receipt URL and got a transaction ID, update the transaction
  if (receiptUrl && data) {
    try {
      await window.db
        .from('transactions')
        .update({ receipt_url: receiptUrl })
        .eq('id', data);
    } catch (e) {
      // If receipt_url column doesn't exist, store in metadata or ignore
      console.log('Could not save receipt URL:', e.message);
    }
  }

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
  const feeInput = document.getElementById('transferFee');

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

  // Format fee input
  if (feeInput) {
    feeInput.addEventListener('input', (e) => {
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
  const feeInput = document.getElementById('transferFee');
  const amount = parseInt(amountInput?.value.replace(/\D/g, '')) || 0;
  const fee = parseInt(feeInput?.value.replace(/\D/g, '')) || 0;
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

    // 1. Process the transfer
    await submitTransfer(fromAccountId, toAccountId, amount, description);

    // 2. If there's a transfer fee, record it as an expense
    if (fee > 0) {
      const feeCategoryId = await getOrCreateTransferFeeCategory();
      if (feeCategoryId) {
        await window.db.rpc('record_expense', {
          p_user_id: currentUser?.id,
          p_amount: fee,
          p_account_id: fromAccountId,
          p_category_id: feeCategoryId,
          p_date: getToday(),
          p_description: 'Biaya transfer' + (description ? ': ' + description : ''),
          p_item_id: null
        });
      }
    }

    hideLoading();

    const feeMsg = fee > 0 ? ` (+ biaya Rp ${fee.toLocaleString('id-ID')})` : '';
    showToast('Transfer berhasil!' + feeMsg, 'success');
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
 * Get or create "Biaya Transfer" expense category
 */
async function getOrCreateTransferFeeCategory() {
  const userId = currentUser?.id;
  if (!userId) return null;

  // Try to find existing "Biaya Transfer" category
  const { data: existing } = await window.db
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'Biaya Transfer')
    .eq('type', 'expense')
    .single();

  if (existing) return existing.id;

  // Create new "Biaya Transfer" category
  const { data: newCat, error } = await window.db
    .from('categories')
    .insert({
      user_id: userId,
      name: 'Biaya Transfer',
      type: 'expense',
      icon: '💸'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create Biaya Transfer category:', error);
    return null;
  }

  return newCat?.id;
}

/**
 * Open transfer modal
 */
function openTransferModal() {
  const amountInput = document.getElementById('transferAmount');
  const feeInput = document.getElementById('transferFee');
  const descInput = document.getElementById('transferDescription');

  if (amountInput) amountInput.value = '';
  if (feeInput) feeInput.value = '';
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
