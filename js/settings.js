// Kiyosaki Finance Tracker - Settings Module

/**
 * Load settings view
 */
async function loadSettings() {
  const container = document.getElementById('settingsView');
  if (!container) return;

  // Use user metadata from auth instead of separate table
  const user = currentUser || window.currentUser;
  const profile = {
    display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    target_passive_income: user?.user_metadata?.target_passive_income || 0
  };

  container.innerHTML = renderSettings(profile);
  lucide.createIcons();
}

/**
 * Render settings HTML
 */
function renderSettings(profile) {
  const user = currentUser;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const targetPassiveIncome = profile?.target_passive_income || 0;

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
          ${targetPassiveIncome > 0 ? `
            <p class="text-xs text-blue-600 mt-1">Target: ${formatRupiahShort(targetPassiveIncome)}/bulan</p>
          ` : ''}
        </div>
        <button onclick="showEditProfileModal()" class="text-blue-600">
          <i data-lucide="edit-2" class="w-5 h-5"></i>
        </button>
      </div>
    </div>

    <!-- Laporan Bulanan - Highlighted -->
    <div class="card mb-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
      <button onclick="showView('report')" class="w-full flex items-center justify-between p-2">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
            <i data-lucide="bar-chart-3" class="w-6 h-6"></i>
          </div>
          <div class="text-left">
            <span class="font-semibold text-lg">Laporan Bulanan</span>
            <p class="text-sm opacity-80">Lihat analisis keuanganmu</p>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-6 h-6"></i>
      </button>
    </div>

    <!-- Menu Items -->
    <div class="card mb-4">
      <div class="space-y-1">
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
              <i data-lucide="home" class="w-5 h-5 text-yellow-600"></i>
            </div>
            <span class="font-medium text-gray-900">Aset & Hutang</span>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>
      </div>
    </div>

    <!-- Data Management -->
    <div class="card mb-4">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Kelola Data</h3>
      <div class="space-y-1">
        <button onclick="confirmImportData()" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i data-lucide="upload" class="w-5 h-5 text-purple-600"></i>
            </div>
            <div class="text-left">
              <span class="font-medium text-gray-900">Import Data Excel</span>
              <p class="text-xs text-gray-500">Masukkan data transaksi awal</p>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>

        <button onclick="confirmClearData()" class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <i data-lucide="trash-2" class="w-5 h-5 text-red-600"></i>
            </div>
            <div class="text-left">
              <span class="font-medium text-red-600">Hapus Semua Data</span>
              <p class="text-xs text-gray-500">Reset ke kondisi awal</p>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-5 h-5 text-gray-400"></i>
        </button>
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

// ========================================
// PROFILE MANAGEMENT
// ========================================

/**
 * Show edit profile modal
 */
async function showEditProfileModal() {
  const user = currentUser || window.currentUser;
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const targetPassiveIncome = user?.user_metadata?.target_passive_income || 0;

  const modalHtml = `
    <div id="profileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Edit Profil</h3>
          <button onclick="closeModal('profileModal')" class="text-gray-400 hover:text-gray-600">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="profileForm" onsubmit="updateProfile(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <input type="text" id="profileName" value="${displayName}"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Nama tampilan">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Target Passive Income (per bulan)</label>
              <input type="text" id="profileTarget" value="${targetPassiveIncome > 0 ? targetPassiveIncome.toLocaleString('id-ID') : ''}"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Contoh: 10.000.000"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button type="button" onclick="closeModal('profileModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Batal
            </button>
            <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

/**
 * Update user profile
 */
async function updateProfile(event) {
  event.preventDefault();

  const name = document.getElementById('profileName')?.value?.trim() || '';
  const targetStr = document.getElementById('profileTarget')?.value?.replace(/\D/g, '') || '0';
  const target = parseInt(targetStr) || 0;

  try {
    showLoading();

    // Update user metadata via Supabase Auth
    const { error } = await window.db.auth.updateUser({
      data: {
        full_name: name,
        target_passive_income: target
      }
    });

    if (error) throw error;

    // Update local currentUser
    if (currentUser) {
      currentUser.user_metadata = {
        ...currentUser.user_metadata,
        full_name: name,
        target_passive_income: target
      };
    }

    hideLoading();
    closeModal('profileModal');
    showToast('Profil berhasil diperbarui', 'success');
    await loadSettings();

    // Update header name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = `Hai, ${name || 'User'}!`;
    }

  } catch (error) {
    hideLoading();
    console.error('Update profile error:', error);
    showToast('Gagal memperbarui profil', 'error');
  }
}

// ========================================
// ACCOUNT MANAGEMENT
// ========================================

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
      <button onclick="showAddAccountModal()" class="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
        <i data-lucide="plus" class="w-5 h-5"></i>
        <span>Tambah Akun Baru</span>
      </button>
    </div>

    <div class="space-y-3">
      ${accountsList.map(acc => `
        <div class="card flex items-center justify-between" onclick="showEditAccountModal('${acc.id}')">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: ${acc.color || '#E0E7FF'}20">
              <span class="text-2xl">${acc.icon || '💳'}</span>
            </div>
            <div>
              <p class="font-medium text-gray-900">${acc.name}</p>
              <p class="text-sm text-gray-500">${getAccountTypeLabel(acc.type)}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold ${(acc.current_balance || 0) >= 0 ? 'text-gray-900' : 'text-red-600'}">
              ${formatRupiah(acc.current_balance || 0)}
            </p>
            <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400 inline"></i>
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
 * Get account type label
 */
function getAccountTypeLabel(type) {
  const labels = {
    'cash': 'Tunai',
    'bank': 'Bank',
    'e-wallet': 'E-Wallet',
    'credit_card': 'Kartu Kredit',
    'investment': 'Investasi'
  };
  return labels[type] || 'Umum';
}

/**
 * Show add account modal
 */
function showAddAccountModal() {
  const modalHtml = `
    <div id="accountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Tambah Akun</h3>
          <button onclick="closeModal('accountModal')" class="text-gray-400 hover:text-gray-600">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="accountForm" onsubmit="saveAccount(event)">
          <input type="hidden" id="accountId" value="">

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label>
              <input type="text" id="accountName" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="Contoh: BCA, GoPay, Tunai">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select id="accountType"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                <option value="cash">💵 Tunai</option>
                <option value="bank">🏦 Bank</option>
                <option value="e-wallet">📱 E-Wallet</option>
                <option value="credit_card">💳 Kartu Kredit</option>
                <option value="investment">📈 Investasi</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Saldo Awal</label>
              <input type="text" id="accountBalance" value="0"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div class="flex flex-wrap gap-2" id="accountIconPicker">
                ${['💵', '💳', '🏦', '📱', '💰', '🪙', '💎', '🏧'].map((icon, i) => `
                  <button type="button" onclick="selectAccountIcon('${icon}')"
                          class="account-icon-btn w-12 h-12 rounded-lg border-2 ${i === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                 flex items-center justify-center text-xl hover:border-blue-500" data-icon="${icon}">
                    ${icon}
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="accountIcon" value="💵">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button type="button" onclick="closeModal('accountModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Batal
            </button>
            <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

/**
 * Select account icon
 */
function selectAccountIcon(icon) {
  document.getElementById('accountIcon').value = icon;
  document.querySelectorAll('.account-icon-btn').forEach(btn => {
    btn.classList.toggle('border-blue-500', btn.dataset.icon === icon);
    btn.classList.toggle('bg-blue-50', btn.dataset.icon === icon);
    btn.classList.toggle('border-gray-200', btn.dataset.icon !== icon);
  });
}

/**
 * Show edit account modal
 */
async function showEditAccountModal(accountId) {
  try {
    showLoading();
    const { data: account, error } = await window.db
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) throw error;
    hideLoading();

    const modalHtml = `
      <div id="accountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Edit Akun</h3>
            <button onclick="closeModal('accountModal')" class="text-gray-400 hover:text-gray-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>

          <form id="accountForm" onsubmit="saveAccount(event)">
            <input type="hidden" id="accountId" value="${account.id}">

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label>
                <input type="text" id="accountName" value="${account.name}" required
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <select id="accountType"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                  <option value="cash" ${account.type === 'cash' ? 'selected' : ''}>💵 Tunai</option>
                  <option value="bank" ${account.type === 'bank' ? 'selected' : ''}>🏦 Bank</option>
                  <option value="e-wallet" ${account.type === 'e-wallet' ? 'selected' : ''}>📱 E-Wallet</option>
                  <option value="credit_card" ${account.type === 'credit_card' ? 'selected' : ''}>💳 Kartu Kredit</option>
                  <option value="investment" ${account.type === 'investment' ? 'selected' : ''}>📈 Investasi</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Saldo</label>
                <input type="text" id="accountBalance" value="${(account.current_balance || 0).toLocaleString('id-ID')}"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                       oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div class="flex flex-wrap gap-2" id="accountIconPicker">
                  ${['💵', '💳', '🏦', '📱', '💰', '🪙', '💎', '🏧'].map(icon => `
                    <button type="button" onclick="selectAccountIcon('${icon}')"
                            class="account-icon-btn w-12 h-12 rounded-lg border-2 ${icon === account.icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                   flex items-center justify-center text-xl hover:border-blue-500" data-icon="${icon}">
                      ${icon}
                    </button>
                  `).join('')}
                </div>
                <input type="hidden" id="accountIcon" value="${account.icon || '💵'}">
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" onclick="deleteAccount('${account.id}')" class="py-3 px-4 bg-red-100 text-red-600 rounded-xl font-medium">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
              </button>
              <button type="button" onclick="closeModal('accountModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
                Batal
              </button>
              <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load account error:', error);
    showToast('Gagal memuat data akun', 'error');
  }
}

/**
 * Save account (create or update)
 */
async function saveAccount(event) {
  event.preventDefault();

  const id = document.getElementById('accountId')?.value;
  const name = document.getElementById('accountName')?.value?.trim();
  const type = document.getElementById('accountType')?.value;
  const balanceStr = document.getElementById('accountBalance')?.value?.replace(/\D/g, '') || '0';
  const balance = parseInt(balanceStr) || 0;
  const icon = document.getElementById('accountIcon')?.value || '💵';

  if (!name) {
    showToast('Nama akun wajib diisi', 'error');
    return;
  }

  try {
    showLoading();

    if (id) {
      // Update
      const { error } = await window.db
        .from('accounts')
        .update({ name, type, current_balance: balance, icon })
        .eq('id', id);
      if (error) throw error;
    } else {
      // Create
      const { error } = await window.db
        .from('accounts')
        .insert({
          user_id: currentUser?.id,
          name,
          type,
          current_balance: balance,
          icon
        });
      if (error) throw error;
    }

    hideLoading();
    closeModal('accountModal');
    showToast(id ? 'Akun berhasil diperbarui' : 'Akun berhasil ditambahkan', 'success');
    await openAccountManager();

  } catch (error) {
    hideLoading();
    console.error('Save account error:', error);
    showToast('Gagal menyimpan akun', 'error');
  }
}

/**
 * Delete account
 */
async function deleteAccount(accountId) {
  const confirmed = await showConfirm('Hapus akun ini? Semua transaksi terkait akan tetap tersimpan.');
  if (!confirmed) return;

  try {
    showLoading();
    const { error } = await window.db
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;

    hideLoading();
    closeModal('accountModal');
    showToast('Akun berhasil dihapus', 'success');
    await openAccountManager();

  } catch (error) {
    hideLoading();
    console.error('Delete account error:', error);
    showToast('Gagal menghapus akun', 'error');
  }
}

// ========================================
// CATEGORY MANAGEMENT
// ========================================

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
      <button onclick="showAddCategoryModal()" class="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
        <i data-lucide="plus" class="w-5 h-5"></i>
        <span>Tambah Kategori Baru</span>
      </button>
    </div>

    <!-- Expense Categories -->
    <div class="mb-4">
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-red-500"></span>
        Pengeluaran
      </h3>
      <div class="card">
        <div class="space-y-2">
          ${expenseCategories.map(cat => `
            <button onclick="showEditCategoryModal('${cat.id}')"
                    class="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <div class="flex items-center gap-3">
                <span class="text-xl">${cat.icon || '📁'}</span>
                <span class="font-medium text-gray-900">${cat.name}</span>
                ${cat.is_system ? '<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Sistem</span>' : ''}
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
            </button>
          `).join('')}
          ${expenseCategories.length === 0 ? '<p class="text-gray-500 text-sm text-center py-4">Belum ada kategori</p>' : ''}
        </div>
      </div>
    </div>

    <!-- Income Categories -->
    <div>
      <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-green-500"></span>
        Pemasukan
      </h3>
      <div class="card">
        <div class="space-y-2">
          ${incomeCategories.map(cat => `
            <button onclick="showEditCategoryModal('${cat.id}')"
                    class="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
              <div class="flex items-center gap-3">
                <span class="text-xl">${cat.icon || '📁'}</span>
                <span class="font-medium text-gray-900">${cat.name}</span>
                ${cat.income_type ? `<span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">${cat.income_type}</span>` : ''}
                ${cat.is_system ? '<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Sistem</span>' : ''}
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
            </button>
          `).join('')}
          ${incomeCategories.length === 0 ? '<p class="text-gray-500 text-sm text-center py-4">Belum ada kategori</p>' : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Show add category modal
 */
function showAddCategoryModal() {
  const modalHtml = `
    <div id="categoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Tambah Kategori</h3>
          <button onclick="closeModal('categoryModal')" class="text-gray-400 hover:text-gray-600">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="categoryForm" onsubmit="saveCategory(event)">
          <input type="hidden" id="categoryId" value="">

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
              <input type="text" id="categoryName" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="Contoh: Makan, Transport">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
              <div class="flex gap-2">
                <button type="button" onclick="selectCategoryType('expense')"
                        class="category-type-btn flex-1 py-3 rounded-xl border-2 border-red-500 bg-red-50 text-red-700 font-medium" data-type="expense">
                  Pengeluaran
                </button>
                <button type="button" onclick="selectCategoryType('income')"
                        class="category-type-btn flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium" data-type="income">
                  Pemasukan
                </button>
              </div>
              <input type="hidden" id="categoryType" value="expense">
            </div>

            <div id="incomeTypeSection" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">Jenis Pemasukan</label>
              <div class="flex gap-2">
                <button type="button" onclick="selectIncomeType('active')"
                        class="income-type-select flex-1 py-2 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 text-sm font-medium" data-type="active">
                  Active
                </button>
                <button type="button" onclick="selectIncomeType('passive')"
                        class="income-type-select flex-1 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-medium" data-type="passive">
                  Passive
                </button>
                <button type="button" onclick="selectIncomeType('portfolio')"
                        class="income-type-select flex-1 py-2 rounded-lg border-2 border-gray-200 text-gray-600 text-sm font-medium" data-type="portfolio">
                  Portfolio
                </button>
              </div>
              <input type="hidden" id="categoryIncomeType" value="active">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div class="flex flex-wrap gap-2" id="categoryIconPicker">
                ${['🍔', '🚗', '🏠', '💡', '📱', '👕', '🎮', '🎬', '💊', '📚', '✈️', '💰', '💼', '📈', '🎁', '❓'].map((icon, i) => `
                  <button type="button" onclick="selectCategoryIcon('${icon}')"
                          class="category-icon-btn w-10 h-10 rounded-lg border-2 ${i === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                 flex items-center justify-center text-lg hover:border-blue-500" data-icon="${icon}">
                    ${icon}
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="categoryIcon" value="🍔">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button type="button" onclick="closeModal('categoryModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Batal
            </button>
            <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

/**
 * Select category type
 */
function selectCategoryType(type) {
  document.getElementById('categoryType').value = type;
  document.querySelectorAll('.category-type-btn').forEach(btn => {
    const isSelected = btn.dataset.type === type;
    btn.classList.toggle('border-red-500', isSelected && type === 'expense');
    btn.classList.toggle('bg-red-50', isSelected && type === 'expense');
    btn.classList.toggle('text-red-700', isSelected && type === 'expense');
    btn.classList.toggle('border-green-500', isSelected && type === 'income');
    btn.classList.toggle('bg-green-50', isSelected && type === 'income');
    btn.classList.toggle('text-green-700', isSelected && type === 'income');
    btn.classList.toggle('border-gray-200', !isSelected);
    btn.classList.toggle('text-gray-600', !isSelected);
  });

  // Show/hide income type section
  const incomeSection = document.getElementById('incomeTypeSection');
  if (incomeSection) {
    incomeSection.classList.toggle('hidden', type !== 'income');
  }
}

/**
 * Select income type
 */
function selectIncomeType(type) {
  document.getElementById('categoryIncomeType').value = type;
  document.querySelectorAll('.income-type-select').forEach(btn => {
    const isSelected = btn.dataset.type === type;
    btn.classList.toggle('border-blue-500', isSelected);
    btn.classList.toggle('bg-blue-50', isSelected);
    btn.classList.toggle('text-blue-700', isSelected);
    btn.classList.toggle('border-gray-200', !isSelected);
    btn.classList.toggle('text-gray-600', !isSelected);
  });
}

/**
 * Select category icon
 */
function selectCategoryIcon(icon) {
  document.getElementById('categoryIcon').value = icon;
  document.querySelectorAll('.category-icon-btn').forEach(btn => {
    btn.classList.toggle('border-blue-500', btn.dataset.icon === icon);
    btn.classList.toggle('bg-blue-50', btn.dataset.icon === icon);
    btn.classList.toggle('border-gray-200', btn.dataset.icon !== icon);
  });
}

/**
 * Show edit category modal
 */
async function showEditCategoryModal(categoryId) {
  try {
    showLoading();
    const { data: category, error } = await window.db
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) throw error;
    hideLoading();

    const modalHtml = `
      <div id="categoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Edit Kategori</h3>
            <button onclick="closeModal('categoryModal')" class="text-gray-400 hover:text-gray-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>

          ${category.is_system ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p class="text-sm text-yellow-800">Kategori sistem tidak dapat diedit atau dihapus.</p>
            </div>
          ` : ''}

          <form id="categoryForm" onsubmit="saveCategory(event)">
            <input type="hidden" id="categoryId" value="${category.id}">
            <input type="hidden" id="categoryIsSystem" value="${category.is_system}">

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input type="text" id="categoryName" value="${category.name}" required
                       ${category.is_system ? 'disabled' : ''}
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 ${category.is_system ? 'bg-gray-100' : ''}">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                <p class="px-4 py-3 bg-gray-100 rounded-xl text-gray-700">
                  ${category.type === 'expense' ? '🔴 Pengeluaran' : '🟢 Pemasukan'}
                </p>
                <input type="hidden" id="categoryType" value="${category.type}">
              </div>

              ${category.type === 'income' ? `
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Jenis Pemasukan</label>
                  <p class="px-4 py-3 bg-gray-100 rounded-xl text-gray-700 capitalize">${category.income_type || 'active'}</p>
                  <input type="hidden" id="categoryIncomeType" value="${category.income_type || 'active'}">
                </div>
              ` : '<input type="hidden" id="categoryIncomeType" value="">'}

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div class="flex flex-wrap gap-2" id="categoryIconPicker">
                  ${['🍔', '🚗', '🏠', '💡', '📱', '👕', '🎮', '🎬', '💊', '📚', '✈️', '💰', '💼', '📈', '🎁', '❓'].map(icon => `
                    <button type="button" onclick="selectCategoryIcon('${icon}')"
                            ${category.is_system ? 'disabled' : ''}
                            class="category-icon-btn w-10 h-10 rounded-lg border-2 ${icon === category.icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                   flex items-center justify-center text-lg ${category.is_system ? 'opacity-50' : 'hover:border-blue-500'}" data-icon="${icon}">
                      ${icon}
                    </button>
                  `).join('')}
                </div>
                <input type="hidden" id="categoryIcon" value="${category.icon || '📁'}">
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              ${!category.is_system ? `
                <button type="button" onclick="deleteCategory('${category.id}')" class="py-3 px-4 bg-red-100 text-red-600 rounded-xl font-medium">
                  <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
              ` : ''}
              <button type="button" onclick="closeModal('categoryModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
                ${category.is_system ? 'Tutup' : 'Batal'}
              </button>
              ${!category.is_system ? `
                <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
                  Simpan
                </button>
              ` : ''}
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load category error:', error);
    showToast('Gagal memuat data kategori', 'error');
  }
}

/**
 * Save category
 */
async function saveCategory(event) {
  event.preventDefault();

  if (document.getElementById('categoryIsSystem')?.value === 'true') {
    showToast('Kategori sistem tidak dapat diedit', 'warning');
    return;
  }

  const id = document.getElementById('categoryId')?.value;
  const name = document.getElementById('categoryName')?.value?.trim();
  const type = document.getElementById('categoryType')?.value;
  const icon = document.getElementById('categoryIcon')?.value || '📁';
  const incomeType = document.getElementById('categoryIncomeType')?.value || null;

  if (!name) {
    showToast('Nama kategori wajib diisi', 'error');
    return;
  }

  try {
    showLoading();

    if (id) {
      const { error } = await window.db
        .from('categories')
        .update({ name, icon })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await window.db
        .from('categories')
        .insert({
          user_id: currentUser?.id,
          name,
          type,
          icon,
          income_type: type === 'income' ? incomeType : null
        });
      if (error) throw error;
    }

    hideLoading();
    closeModal('categoryModal');
    showToast(id ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan', 'success');
    await openCategoryManager();

  } catch (error) {
    hideLoading();
    console.error('Save category error:', error);
    showToast('Gagal menyimpan kategori', 'error');
  }
}

/**
 * Delete category
 */
async function deleteCategory(categoryId) {
  const confirmed = await showConfirm('Hapus kategori ini?');
  if (!confirmed) return;

  try {
    showLoading();
    const { error } = await window.db
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    hideLoading();
    closeModal('categoryModal');
    showToast('Kategori berhasil dihapus', 'success');
    await openCategoryManager();

  } catch (error) {
    hideLoading();
    console.error('Delete category error:', error);
    showToast('Gagal menghapus kategori', 'error');
  }
}

// ========================================
// ITEMS & LOANS MANAGEMENT
// ========================================

/**
 * Open item manager
 */
async function openItemManager() {
  const container = document.getElementById('settingsView');
  if (!container) return;

  try {
    showLoading();

    const userId = currentUser?.id;

    // Get items
    const { data: itemsData, error: itemsError } = await window.db
      .from('items')
      .select('*, loans(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get debt summary via RPC
    let debtSummary = { total_debt: 0, monthly_payment: 0 };
    try {
      const { data } = await window.db.rpc('get_debt_summary', { p_user_id: userId });
      if (data) debtSummary = data;
    } catch (e) {}

    if (itemsError) throw itemsError;
    hideLoading();

    container.innerHTML = renderItemManager(itemsData || [], debtSummary);
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

    <!-- Add Buttons -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <button onclick="showAddItemCashModal()" class="card card-hover flex flex-col items-center py-4">
        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <i data-lucide="banknote" class="w-6 h-6 text-green-600"></i>
        </div>
        <span class="text-sm font-medium text-gray-700">Beli Cash</span>
      </button>
      <button onclick="showAddItemCreditModal()" class="card card-hover flex flex-col items-center py-4">
        <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
          <i data-lucide="credit-card" class="w-6 h-6 text-orange-600"></i>
        </div>
        <span class="text-sm font-medium text-gray-700">Beli Kredit</span>
      </button>
    </div>

    <!-- Items List -->
    <div class="space-y-3">
      ${items.map(item => {
        const hasLoan = item.loans && item.loans.length > 0;
        const activeLoan = hasLoan ? item.loans.find(l => l.remaining_balance > 0) : null;
        const netCashflow = (item.monthly_income || 0) - (activeLoan?.monthly_payment || 0);
        const status = netCashflow >= 0 ? 'asset' : 'liability';

        return `
          <div class="card ${status === 'asset' ? 'status-asset' : 'status-liability'}">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium">${item.name}</h4>
              <span class="px-2 py-1 rounded-full text-xs font-bold ${status === 'asset' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                ${status.toUpperCase()}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p class="opacity-70">Nilai</p>
                <p class="font-medium">${formatRupiahShort(item.current_value || item.purchase_price)}</p>
              </div>
              <div>
                <p class="opacity-70">Net Cashflow</p>
                <p class="font-medium ${netCashflow >= 0 ? 'text-green-700' : 'text-red-700'}">
                  ${netCashflow >= 0 ? '+' : ''}${formatRupiahShort(netCashflow)}/bln
                </p>
              </div>
            </div>

            ${activeLoan ? `
              <div class="border-t pt-3">
                <div class="flex justify-between text-sm mb-2">
                  <span class="opacity-70">Sisa Hutang</span>
                  <span class="font-medium">${formatRupiahShort(activeLoan.remaining_balance)}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill progress-fill-green"
                       style="width: ${100 - (activeLoan.remaining_balance / activeLoan.total_amount * 100)}%"></div>
                </div>
                <div class="flex justify-between mt-2">
                  <button onclick="showPayLoanModal('${activeLoan.id}')" class="text-sm text-blue-600 font-medium">
                    Bayar Cicilan
                  </button>
                  <span class="text-xs text-gray-500">${formatRupiahShort(activeLoan.monthly_payment)}/bln</span>
                </div>
              </div>
            ` : ''}

            <div class="flex gap-2 mt-3 pt-3 border-t">
              <button onclick="showSellItemModal('${item.id}')" class="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                Jual
              </button>
            </div>
          </div>
        `;
      }).join('')}

      ${items.length === 0 ? `
        <div class="card text-center py-8">
          <i data-lucide="package" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
          <p class="text-gray-500">Belum ada item tercatat</p>
          <p class="text-sm text-gray-400 mt-1">Tambah aset atau barang yang dibeli kredit</p>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Show add item cash modal
 */
function showAddItemCashModal() {
  const modalHtml = `
    <div id="itemCashModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Beli Item (Cash)</h3>
          <button onclick="closeModal('itemCashModal')" class="text-gray-400 hover:text-gray-600">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="itemCashForm" onsubmit="saveItemCash(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
              <input type="text" id="itemCashName" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="Contoh: Rumah, Mobil, Laptop">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
              <input type="text" id="itemCashPrice" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="0"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dari Akun</label>
              <select id="itemCashAccount" required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                ${(window.accounts || []).map(acc =>
                  `<option value="${acc.id}">${acc.name} (${formatRupiahShort(acc.current_balance || 0)})</option>`
                ).join('')}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Penghasilan Bulanan (jika ada)</label>
              <input type="text" id="itemCashIncome"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="0 (kosongkan jika tidak menghasilkan)"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button type="button" onclick="closeModal('itemCashModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Batal
            </button>
            <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

/**
 * Save item purchased with cash
 */
async function saveItemCash(event) {
  event.preventDefault();

  const name = document.getElementById('itemCashName')?.value?.trim();
  const priceStr = document.getElementById('itemCashPrice')?.value?.replace(/\D/g, '') || '0';
  const price = parseInt(priceStr) || 0;
  const accountId = document.getElementById('itemCashAccount')?.value;
  const incomeStr = document.getElementById('itemCashIncome')?.value?.replace(/\D/g, '') || '0';
  const monthlyIncome = parseInt(incomeStr) || 0;

  if (!name || !price || !accountId) {
    showToast('Lengkapi semua data wajib', 'error');
    return;
  }

  try {
    showLoading();

    const { error } = await window.db.rpc('buy_item_cash', {
      p_user_id: currentUser?.id,
      p_name: name,
      p_purchase_price: price,
      p_account_id: accountId,
      p_monthly_income: monthlyIncome,
      p_date: getToday()
    });

    if (error) throw error;

    hideLoading();
    closeModal('itemCashModal');
    showToast('Item berhasil ditambahkan', 'success');
    await openItemManager();

  } catch (error) {
    hideLoading();
    console.error('Save item cash error:', error);
    showToast(error.message || 'Gagal menyimpan item', 'error');
  }
}

/**
 * Show add item credit modal
 */
function showAddItemCreditModal() {
  const modalHtml = `
    <div id="itemCreditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Beli Item (Kredit)</h3>
          <button onclick="closeModal('itemCreditModal')" class="text-gray-400 hover:text-gray-600">
            <i data-lucide="x" class="w-6 h-6"></i>
          </button>
        </div>

        <form id="itemCreditForm" onsubmit="saveItemCredit(event)">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Item</label>
              <input type="text" id="itemCreditName" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="Contoh: Mobil, Motor">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
              <input type="text" id="itemCreditPrice" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="0"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Uang Muka (DP)</label>
              <input type="text" id="itemCreditDP" required
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="0"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">DP dari Akun</label>
              <select id="itemCreditAccount" required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                ${(window.accounts || []).map(acc =>
                  `<option value="${acc.id}">${acc.name} (${formatRupiahShort(acc.current_balance || 0)})</option>`
                ).join('')}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tenor (bulan)</label>
                <input type="number" id="itemCreditTenor" required min="1" max="360"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                       placeholder="12">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bunga (%/tahun)</label>
                <input type="number" id="itemCreditInterest" step="0.1" min="0" max="100"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                       placeholder="10">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Penghasilan Bulanan (jika ada)</label>
              <input type="text" id="itemCreditIncome"
                     class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                     placeholder="0"
                     oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button type="button" onclick="closeModal('itemCreditModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
              Batal
            </button>
            <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

/**
 * Save item purchased with credit
 */
async function saveItemCredit(event) {
  event.preventDefault();

  const name = document.getElementById('itemCreditName')?.value?.trim();
  const priceStr = document.getElementById('itemCreditPrice')?.value?.replace(/\D/g, '') || '0';
  const price = parseInt(priceStr) || 0;
  const dpStr = document.getElementById('itemCreditDP')?.value?.replace(/\D/g, '') || '0';
  const downPayment = parseInt(dpStr) || 0;
  const accountId = document.getElementById('itemCreditAccount')?.value;
  const tenor = parseInt(document.getElementById('itemCreditTenor')?.value) || 12;
  const interest = parseFloat(document.getElementById('itemCreditInterest')?.value) || 0;
  const incomeStr = document.getElementById('itemCreditIncome')?.value?.replace(/\D/g, '') || '0';
  const monthlyIncome = parseInt(incomeStr) || 0;

  if (!name || !price || !accountId) {
    showToast('Lengkapi semua data wajib', 'error');
    return;
  }

  try {
    showLoading();

    const { error } = await window.db.rpc('buy_item_credit', {
      p_user_id: currentUser?.id,
      p_name: name,
      p_purchase_price: price,
      p_down_payment: downPayment,
      p_account_id: accountId,
      p_loan_amount: price - downPayment,
      p_interest_rate: interest,
      p_tenor_months: tenor,
      p_monthly_income: monthlyIncome,
      p_date: getToday()
    });

    if (error) throw error;

    hideLoading();
    closeModal('itemCreditModal');
    showToast('Item berhasil ditambahkan dengan kredit', 'success');
    await openItemManager();

  } catch (error) {
    hideLoading();
    console.error('Save item credit error:', error);
    showToast(error.message || 'Gagal menyimpan item', 'error');
  }
}

/**
 * Show sell item modal
 */
async function showSellItemModal(itemId) {
  try {
    showLoading();
    const { data: item, error } = await window.db
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;
    hideLoading();

    const modalHtml = `
      <div id="sellItemModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Jual ${item.name}</h3>
            <button onclick="closeModal('sellItemModal')" class="text-gray-400 hover:text-gray-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>

          <div class="bg-gray-50 rounded-xl p-4 mb-4">
            <p class="text-sm text-gray-600">Nilai saat ini</p>
            <p class="text-xl font-bold text-gray-900">${formatRupiah(item.current_value || item.purchase_price)}</p>
          </div>

          <form id="sellItemForm" onsubmit="sellItem(event, '${itemId}')">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                <input type="text" id="sellPrice" required
                       value="${(item.current_value || item.purchase_price).toLocaleString('id-ID')}"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                       oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Masuk ke Akun</label>
                <select id="sellAccount" required
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                  ${(window.accounts || []).map(acc =>
                    `<option value="${acc.id}">${acc.name}</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" onclick="closeModal('sellItemModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
                Batal
              </button>
              <button type="submit" class="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium">
                Jual
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load item error:', error);
    showToast('Gagal memuat data item', 'error');
  }
}

/**
 * Sell item
 */
async function sellItem(event, itemId) {
  event.preventDefault();

  const priceStr = document.getElementById('sellPrice')?.value?.replace(/\D/g, '') || '0';
  const sellPrice = parseInt(priceStr) || 0;
  const accountId = document.getElementById('sellAccount')?.value;

  if (!sellPrice || !accountId) {
    showToast('Lengkapi semua data', 'error');
    return;
  }

  try {
    showLoading();

    const { error } = await window.db.rpc('sell_item', {
      p_user_id: currentUser?.id,
      p_item_id: itemId,
      p_sell_price: sellPrice,
      p_account_id: accountId,
      p_date: getToday()
    });

    if (error) throw error;

    hideLoading();
    closeModal('sellItemModal');
    showToast('Item berhasil dijual', 'success');
    await openItemManager();

  } catch (error) {
    hideLoading();
    console.error('Sell item error:', error);
    showToast(error.message || 'Gagal menjual item', 'error');
  }
}

/**
 * Show pay loan modal
 */
async function showPayLoanModal(loanId) {
  try {
    showLoading();
    const { data: loan, error } = await window.db
      .from('loans')
      .select('*, item:items(name)')
      .eq('id', loanId)
      .single();

    if (error) throw error;
    hideLoading();

    const modalHtml = `
      <div id="payLoanModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Bayar Cicilan</h3>
            <button onclick="closeModal('payLoanModal')" class="text-gray-400 hover:text-gray-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>

          <div class="bg-gray-50 rounded-xl p-4 mb-4">
            <p class="text-sm text-gray-600">${loan.item?.name || 'Kredit'}</p>
            <div class="flex justify-between mt-2">
              <span class="text-gray-600">Sisa Hutang</span>
              <span class="font-bold text-gray-900">${formatRupiah(loan.remaining_balance)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Cicilan/bulan</span>
              <span class="font-medium">${formatRupiah(loan.monthly_payment)}</span>
            </div>
          </div>

          <form id="payLoanForm" onsubmit="payLoan(event, '${loanId}')">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar</label>
                <input type="text" id="loanPayAmount" required
                       value="${loan.monthly_payment.toLocaleString('id-ID')}"
                       class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                       oninput="this.value = this.value.replace(/\\D/g, '').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dari Akun</label>
                <select id="loanPayAccount" required
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500">
                  ${(window.accounts || []).map(acc =>
                    `<option value="${acc.id}">${acc.name} (${formatRupiahShort(acc.current_balance || 0)})</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button type="button" onclick="closeModal('payLoanModal')" class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium">
                Batal
              </button>
              <button type="submit" class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium">
                Bayar
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    lucide.createIcons();

  } catch (error) {
    hideLoading();
    console.error('Load loan error:', error);
    showToast('Gagal memuat data pinjaman', 'error');
  }
}

/**
 * Pay loan
 */
async function payLoan(event, loanId) {
  event.preventDefault();

  const amountStr = document.getElementById('loanPayAmount')?.value?.replace(/\D/g, '') || '0';
  const amount = parseInt(amountStr) || 0;
  const accountId = document.getElementById('loanPayAccount')?.value;

  if (!amount || !accountId) {
    showToast('Lengkapi semua data', 'error');
    return;
  }

  try {
    showLoading();

    const { error } = await window.db.rpc('record_loan_payment', {
      p_user_id: currentUser?.id,
      p_loan_id: loanId,
      p_amount: amount,
      p_account_id: accountId,
      p_date: getToday()
    });

    if (error) throw error;

    hideLoading();
    closeModal('payLoanModal');
    showToast('Pembayaran cicilan berhasil', 'success');
    await openItemManager();

  } catch (error) {
    hideLoading();
    console.error('Pay loan error:', error);
    showToast(error.message || 'Gagal membayar cicilan', 'error');
  }
}

// ========================================
// LOGOUT
// ========================================

/**
 * Handle logout
 */
async function handleLogout() {
  const confirmed = await showConfirm('Yakin ingin keluar?');
  if (confirmed) {
    try {
      await window.db.auth.signOut();
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Gagal keluar', 'error');
    }
  }
}

// ========================================
// STATS VIEW
// ========================================

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
    const { data: incomeData } = await window.db.rpc('get_income_composition', {
      p_user_id: userId,
      p_start_date: getMonthStart(),
      p_end_date: getMonthEnd()
    });

    // Get expense breakdown
    const { data: expenseData } = await window.db.rpc('get_expense_breakdown', {
      p_user_id: userId,
      p_start_date: getMonthStart(),
      p_end_date: getMonthEnd()
    });

    hideLoading();

    container.innerHTML = renderStats(incomeData || [], expenseData || []);
    lucide.createIcons();

    // Initialize charts
    setTimeout(() => initStatsCharts(incomeData || [], expenseData || []), 100);

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
  const totalIncome = incomeData.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalExpense = expenseData.reduce((sum, e) => sum + (e.total || 0), 0);

  return `
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Statistik Bulan Ini</h2>

    <!-- Summary -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div class="card bg-green-50">
        <p class="text-sm text-green-600">Total Pemasukan</p>
        <p class="text-lg font-bold text-green-700">${formatRupiahShort(totalIncome)}</p>
      </div>
      <div class="card bg-red-50">
        <p class="text-sm text-red-600">Total Pengeluaran</p>
        <p class="text-lg font-bold text-red-700">${formatRupiahShort(totalExpense)}</p>
      </div>
    </div>

    <!-- Income Composition -->
    <div class="card mb-4">
      <h3 class="font-medium text-gray-900 mb-4">Komposisi Pemasukan</h3>
      <div class="chart-container" style="height: 200px;">
        <canvas id="incomeChart"></canvas>
      </div>
      <div class="mt-4 space-y-2">
        ${incomeData.length > 0 ? incomeData.map(item => `
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 capitalize">${item.income_type || 'Lainnya'}</span>
            <span class="font-medium">${formatRupiahShort(item.total)}</span>
          </div>
        `).join('') : '<p class="text-gray-500 text-sm text-center">Belum ada data pemasukan</p>'}
      </div>
    </div>

    <!-- Expense Breakdown -->
    <div class="card">
      <h3 class="font-medium text-gray-900 mb-4">Breakdown Pengeluaran</h3>
      <div class="chart-container" style="height: 200px;">
        <canvas id="expenseChart"></canvas>
      </div>
      <div class="mt-4 space-y-2">
        ${expenseData.length > 0 ? expenseData.slice(0, 5).map(item => `
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span>${item.icon || '📁'}</span>
              <span class="text-gray-600">${item.category_name || 'Lainnya'}</span>
            </div>
            <span class="font-medium">${formatRupiahShort(item.total)}</span>
          </div>
        `).join('') : '<p class="text-gray-500 text-sm text-center">Belum ada data pengeluaran</p>'}
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
  if (incomeCtx && incomeData.length > 0) {
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
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    });
  }

  // Expense Chart
  const expenseCtx = document.getElementById('expenseChart');
  if (expenseCtx && expenseData.length > 0) {
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
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
      }
    });
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Close modal by ID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}

/**
 * Get today's date
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Make functions available globally
window.loadSettings = loadSettings;
window.showEditProfileModal = showEditProfileModal;
window.updateProfile = updateProfile;
window.openAccountManager = openAccountManager;
window.showAddAccountModal = showAddAccountModal;
window.showEditAccountModal = showEditAccountModal;
window.saveAccount = saveAccount;
window.deleteAccount = deleteAccount;
window.selectAccountIcon = selectAccountIcon;
window.openCategoryManager = openCategoryManager;
window.showAddCategoryModal = showAddCategoryModal;
window.showEditCategoryModal = showEditCategoryModal;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;
window.selectCategoryType = selectCategoryType;
window.selectIncomeType = selectIncomeType;
window.selectCategoryIcon = selectCategoryIcon;
window.openItemManager = openItemManager;
window.showAddItemCashModal = showAddItemCashModal;
window.showAddItemCreditModal = showAddItemCreditModal;
window.saveItemCash = saveItemCash;
window.saveItemCredit = saveItemCredit;
window.showSellItemModal = showSellItemModal;
window.sellItem = sellItem;
window.showPayLoanModal = showPayLoanModal;
window.payLoan = payLoan;
window.handleLogout = handleLogout;
window.loadStats = loadStats;
window.closeModal = closeModal;
window.confirmImportData = confirmImportData;
window.confirmClearData = confirmClearData;

// ========================================
// DATA IMPORT/CLEAR FUNCTIONS
// ========================================

/**
 * Confirm and run import data
 */
async function confirmImportData() {
  const confirmed = await showConfirm(
    'Import data akan MENGHAPUS semua data yang ada dan menggantinya dengan data baru dari Excel.\n\nLanjutkan?'
  );

  if (confirmed) {
    if (typeof importInitialData === 'function') {
      await importInitialData();
    } else {
      showToast('Fungsi import tidak tersedia', 'error');
    }
  }
}

/**
 * Confirm and clear all data
 */
async function confirmClearData() {
  const confirmed = await showConfirm(
    'PERINGATAN: Semua data transaksi, kategori, dan akun akan DIHAPUS PERMANEN!\n\nTindakan ini tidak dapat dibatalkan. Lanjutkan?'
  );

  if (confirmed) {
    if (typeof clearAllData === 'function') {
      await clearAllData();
    } else {
      showToast('Fungsi clear tidak tersedia', 'error');
    }
  }
}
