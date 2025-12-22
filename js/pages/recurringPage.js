/**
 * Recurring Page
 * Halaman kelola transaksi berulang
 */

const RecurringPage = {

  /**
   * Render halaman recurring
   * @param {HTMLElement} container
   */
  async render(container) {
    container.innerHTML = `
      <div class="p-4 pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Transaksi Berulang</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Kelola gaji, cicilan, tagihan rutin</p>
          </div>
          <button onclick="RecurringPage.showAddForm()"
                  class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div id="recurring-list">
          ${Loading?.skeleton('list', 3) || '<div class="animate-pulse bg-gray-200 h-20 rounded-xl mb-2"></div>'}
        </div>
      </div>
    `;

    await this.loadList();
  },

  /**
   * Load dan render list
   */
  async loadList() {
    const listContainer = document.getElementById('recurring-list');
    if (!listContainer) return;

    try {
      const recurring = await RecurringService?.getAll() || [];

      if (recurring.length === 0) {
        listContainer.innerHTML = EmptyState?.render({
          icon: 'calendar',
          title: 'Belum ada transaksi berulang',
          description: 'Tambahkan gaji, cicilan, atau tagihan rutin',
          actionText: '+ Tambah',
          actionHandler: 'RecurringPage.showAddForm()'
        }) || '<p class="text-center text-gray-500 py-8">Belum ada transaksi berulang</p>';
        return;
      }

      // Group by type
      const incomes = recurring.filter(r => r.type === 'income');
      const expenses = recurring.filter(r => r.type === 'expense');

      let html = '';

      // Income section
      if (incomes.length > 0) {
        html += `
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
              <span>💰</span> PEMASUKAN RUTIN
            </h3>
            <div class="space-y-2">
              ${incomes.map(r => this.renderItem(r)).join('')}
            </div>
          </div>
        `;
      }

      // Expense section
      if (expenses.length > 0) {
        html += `
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
              <span>💸</span> PENGELUARAN RUTIN
            </h3>
            <div class="space-y-2">
              ${expenses.map(r => this.renderItem(r)).join('')}
            </div>
          </div>
        `;
      }

      // Summary
      const totalIncome = incomes.reduce((sum, r) => sum + Validator.currency(r.amount, 0), 0);
      const totalExpense = expenses.reduce((sum, r) => sum + Validator.currency(r.amount, 0), 0);

      html += `
        <div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mt-4">
          <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ringkasan Bulanan</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs text-gray-500">Total Masuk</p>
              <p class="font-semibold text-green-600">${Formatter?.currency(totalIncome) || totalIncome}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Total Keluar</p>
              <p class="font-semibold text-red-600">${Formatter?.currency(totalExpense) || totalExpense}</p>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500">Net per Bulan</p>
            <p class="font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}">
              ${Formatter?.currency(totalIncome - totalExpense) || (totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      `;

      listContainer.innerHTML = html;

    } catch (error) {
      ErrorHandler?.handle(error, 'RecurringPage.loadList');
      listContainer.innerHTML = EmptyState?.preset('error') || '<p class="text-center text-red-500 py-8">Gagal memuat data</p>';
    }
  },

  /**
   * Render single item
   * @param {Object} recurring
   * @returns {string} HTML
   */
  renderItem(recurring) {
    const {
      id,
      name,
      type,
      amount,
      frequency,
      day_of_month,
      is_active,
      last_executed,
      category,
      account
    } = recurring;

    const isIncome = type === 'income';
    const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
    const amountPrefix = isIncome ? '+' : '-';

    const frequencyLabels = {
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      yearly: 'Tahunan'
    };

    const scheduleText = frequency === 'monthly'
      ? `Setiap tgl ${day_of_month || 1}`
      : frequencyLabels[frequency] || frequency;

    const remaining = RecurringService?.calculateRemaining(recurring);
    const remainingText = remaining !== null ? `${remaining} kali lagi` : '';

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 ${!is_active ? 'opacity-60' : ''}"
           onclick="RecurringPage.showDetail('${id}')">
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div class="w-10 h-10 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} flex items-center justify-center text-xl">
            ${category?.icon || (isIncome ? '💰' : '💸')}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-medium text-gray-800 dark:text-white">${name}</p>
              ${!is_active ? '<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">Nonaktif</span>' : ''}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">${scheduleText} • ${account?.name || ''}</p>
            ${remainingText ? `<p class="text-xs text-gray-400">${remainingText}</p>` : ''}
          </div>

          <!-- Amount -->
          <div class="text-right">
            <p class="${amountClass} font-semibold">${amountPrefix}${Formatter?.currency(amount) || amount}</p>
            <p class="text-xs text-gray-400">per bulan</p>
          </div>
        </div>

        ${last_executed ? `
          <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
            Terakhir: ${Formatter?.relativeDate?.(last_executed) || last_executed}
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Show add form modal
   */
  async showAddForm() {
    const accounts = await AccountService?.getAll() || [];
    const categories = await CategoryService?.getAll() || [];

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const html = `
      <form id="recurring-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama</label>
          <input type="text" name="name" required placeholder="cth: Gaji Bulanan"
                 class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
              <input type="radio" name="type" value="income" class="hidden">
              <span>💰 Pemasukan</span>
            </label>
            <label class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer has-[:checked]:border-red-500 has-[:checked]:bg-red-50">
              <input type="radio" name="type" value="expense" checked class="hidden">
              <span>💸 Pengeluaran</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
            <input type="text" name="amount" required inputmode="numeric" placeholder="0"
                   class="w-full pl-10 pr-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                   oninput="this.value = this.value.replace(/[^0-9]/g, '')">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
          <select name="category_id" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            <option value="">Pilih kategori</option>
            <optgroup label="Pemasukan">${incomeCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</optgroup>
            <optgroup label="Pengeluaran">${expenseCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</optgroup>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Akun</label>
          <select name="account_id" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            <option value="">Pilih akun</option>
            ${accounts.map(a => `<option value="${a.id}">${a.icon || '💳'} ${a.name}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frekuensi</label>
          <select name="frequency" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            <option value="monthly" selected>Bulanan</option>
            <option value="weekly">Mingguan</option>
            <option value="daily">Harian</option>
            <option value="yearly">Tahunan</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setiap Tanggal</label>
          <select name="day_of_month" class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mulai dari</label>
          <input type="date" name="start_date" value="${BaseService?.getToday() || new Date().toISOString().split('T')[0]}"
                 class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Berakhir pada (opsional)</label>
          <input type="date" name="end_date" class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2 border rounded-lg">Batal</button>
          <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
        </div>
      </form>
    `;

    Modal?.show({
      title: 'Tambah Transaksi Berulang',
      html,
      showCancel: false,
      confirmText: ''
    });

    document.getElementById('recurring-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveRecurring(new FormData(e.target));
    });
  },

  /**
   * Save recurring dari form
   * @param {FormData} formData
   */
  async saveRecurring(formData) {
    try {
      const data = {
        name: formData.get('name'),
        type: formData.get('type'),
        amount: formData.get('amount'),
        category_id: formData.get('category_id'),
        account_id: formData.get('account_id'),
        frequency: formData.get('frequency'),
        day_of_month: parseInt(formData.get('day_of_month')) || 1,
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date') || null
      };

      const result = await RecurringService?.create(data);

      if (result) {
        Modal?.close();
        await this.loadList();
      }

    } catch (error) {
      ErrorHandler?.handle(error, 'RecurringPage.saveRecurring');
    }
  },

  /**
   * Show detail/edit modal
   * @param {string} id
   */
  async showDetail(id) {
    const recurring = (await RecurringService?.getAll() || []).find(r => r.id === id);
    if (!recurring) return;

    const confirmed = await Modal?.confirm(
      `${recurring.is_active ? 'Nonaktifkan' : 'Aktifkan'} atau hapus transaksi "${recurring.name}"?`,
      recurring.name
    );

    if (confirmed) {
      await RecurringService?.toggleActive(id, !recurring.is_active);
      await this.loadList();
    } else if (confirmed === false) {
      const deleteConfirmed = await Modal?.confirm(`Yakin hapus "${recurring.name}"?`, 'Hapus');
      if (deleteConfirmed) {
        await RecurringService?.delete(id);
        await this.loadList();
      }
    }
  }
};

// Export global
window.RecurringPage = RecurringPage;
