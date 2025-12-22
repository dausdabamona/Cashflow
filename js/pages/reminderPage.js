/**
 * Reminder Page
 * Halaman kelola pengingat tagihan
 */

const ReminderPage = {

  /**
   * Render halaman reminder
   * @param {HTMLElement} container
   */
  async render(container) {
    container.innerHTML = `
      <div class="p-4 pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Pengingat Tagihan</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Jangan sampai telat bayar</p>
          </div>
          <button onclick="ReminderPage.showAddForm()"
                  class="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div id="reminder-list">
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
    const listContainer = document.getElementById('reminder-list');
    if (!listContainer) return;

    try {
      const reminders = await ReminderService?.getAll() || [];

      if (reminders.length === 0) {
        listContainer.innerHTML = EmptyState?.render({
          icon: 'bell',
          title: 'Belum ada pengingat',
          description: 'Tambahkan pengingat untuk tagihan rutin',
          actionText: '+ Tambah Pengingat',
          actionHandler: 'ReminderPage.showAddForm()'
        }) || '<p class="text-center text-gray-500 py-8">Belum ada pengingat</p>';
        return;
      }

      // Group by urgency
      const overdue = reminders.filter(r => r.daysLeft < 0);
      const today = reminders.filter(r => r.daysLeft === 0);
      const thisWeek = reminders.filter(r => r.daysLeft > 0 && r.daysLeft <= 7);
      const later = reminders.filter(r => r.daysLeft > 7);

      let html = '';

      if (overdue.length > 0) {
        html += `
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-red-600 mb-2">🚨 TERLAMBAT</h3>
            <div class="space-y-2">${overdue.map(r => this.renderItem(r)).join('')}</div>
          </div>
        `;
      }

      if (today.length > 0) {
        html += `
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-orange-600 mb-2">⚠️ HARI INI</h3>
            <div class="space-y-2">${today.map(r => this.renderItem(r)).join('')}</div>
          </div>
        `;
      }

      if (thisWeek.length > 0) {
        html += `
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-yellow-600 mb-2">📅 MINGGU INI</h3>
            <div class="space-y-2">${thisWeek.map(r => this.renderItem(r)).join('')}</div>
          </div>
        `;
      }

      if (later.length > 0) {
        html += `
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-600 mb-2">📆 NANTI</h3>
            <div class="space-y-2">${later.map(r => this.renderItem(r)).join('')}</div>
          </div>
        `;
      }

      // Summary
      const totalAmount = reminders
        .filter(r => r.daysLeft <= 30)
        .reduce((sum, r) => sum + Validator.currency(r.amount, 0), 0);

      html += `
        <div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mt-4 border border-blue-100 dark:border-blue-800">
          <p class="text-sm text-blue-600 dark:text-blue-400">Total tagihan 30 hari ke depan</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">${Formatter?.currency(totalAmount) || totalAmount}</p>
        </div>
      `;

      listContainer.innerHTML = html;

    } catch (error) {
      ErrorHandler?.handle(error, 'ReminderPage.loadList');
      listContainer.innerHTML = EmptyState?.preset('error') || '<p class="text-center text-red-500">Gagal memuat</p>';
    }
  },

  /**
   * Render single item
   * @param {Object} reminder
   * @returns {string} HTML
   */
  renderItem(reminder) {
    const { id, name, amount, daysLeft, due_day, type } = reminder;

    let urgencyClass, urgencyLabel, bgClass;

    if (daysLeft < 0) {
      urgencyClass = 'text-red-600';
      urgencyLabel = `Terlambat ${Math.abs(daysLeft)} hari`;
      bgClass = 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    } else if (daysLeft === 0) {
      urgencyClass = 'text-orange-600';
      urgencyLabel = 'HARI INI';
      bgClass = 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
    } else if (daysLeft === 1) {
      urgencyClass = 'text-yellow-600';
      urgencyLabel = 'BESOK';
      bgClass = 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    } else {
      urgencyClass = 'text-gray-600 dark:text-gray-400';
      urgencyLabel = `${daysLeft} hari lagi`;
      bgClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }

    const typeIcons = { bill: '📄', loan: '💳', other: '🔔' };

    return `
      <div class="${bgClass} rounded-xl p-4 border" onclick="ReminderPage.showDetail('${id}')">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${typeIcons[type] || '🔔'}</span>
            <div>
              <p class="font-medium text-gray-800 dark:text-white">${name}</p>
              <p class="text-sm ${urgencyClass}">${urgencyLabel} • Tgl ${due_day}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-800 dark:text-white">${Formatter?.currency(amount) || amount}</p>
            <button onclick="event.stopPropagation(); ReminderPage.payReminder('${id}')"
                    class="text-xs text-blue-600 hover:text-blue-700 mt-1">Bayar →</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Show add form
   */
  async showAddForm() {
    const html = `
      <form id="reminder-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Tagihan</label>
          <input type="text" name="name" required placeholder="cth: Listrik, Cicilan Motor"
                 class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe</label>
          <select name="type" class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            <option value="bill">📄 Tagihan</option>
            <option value="loan">💳 Cicilan</option>
            <option value="other">🔔 Lainnya</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perkiraan Jumlah</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
            <input type="text" name="amount" inputmode="numeric" placeholder="0"
                   class="w-full pl-10 pr-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                   oninput="this.value = this.value.replace(/[^0-9]/g, '')">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jatuh Tempo Tanggal</label>
          <select name="due_day" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingatkan</label>
          <select name="remind_days_before" class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            <option value="1">1 hari sebelum</option>
            <option value="3" selected>3 hari sebelum</option>
            <option value="7">7 hari sebelum</option>
          </select>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2 border rounded-lg">Batal</button>
          <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
        </div>
      </form>
    `;

    Modal?.show({ title: 'Tambah Pengingat', html, showCancel: false, confirmText: '' });

    document.getElementById('reminder-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveReminder(new FormData(e.target));
    });
  },

  /**
   * Save reminder
   * @param {FormData} formData
   */
  async saveReminder(formData) {
    try {
      const data = {
        name: formData.get('name'),
        type: formData.get('type'),
        amount: formData.get('amount') || 0,
        due_day: parseInt(formData.get('due_day')),
        remind_days_before: parseInt(formData.get('remind_days_before'))
      };

      const result = await ReminderService?.create(data);

      if (result) {
        Modal?.close();
        await this.loadList();
      }
    } catch (error) {
      ErrorHandler?.handle(error, 'ReminderPage.saveReminder');
    }
  },

  /**
   * Show detail
   * @param {string} id
   */
  async showDetail(id) {
    const reminders = await ReminderService?.getAll() || [];
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const confirmed = await Modal?.confirm(`Hapus pengingat "${reminder.name}"?`, 'Hapus');

    if (confirmed) {
      await ReminderService?.delete(id);
      await this.loadList();
    }
  },

  /**
   * Pay reminder
   * @param {string} id
   */
  async payReminder(id) {
    const reminders = await ReminderService?.getAll() || [];
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const accounts = await AccountService?.getAll() || [];
    const categories = await CategoryService?.getByType?.('expense') || (await CategoryService?.getAll() || []).filter(c => c.type === 'expense');

    const html = `
      <form id="pay-form" class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-4">
          <p class="text-sm text-blue-600 dark:text-blue-400">Membayar: <strong>${reminder.name}</strong></p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
            <input type="text" name="amount" required inputmode="numeric" value="${reminder.amount || ''}"
                   class="w-full pl-10 pr-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                   oninput="this.value = this.value.replace(/[^0-9]/g, '')">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dari Akun</label>
          <select name="account_id" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            ${accounts.map(a => `<option value="${a.id}">${a.icon || '💳'} ${a.name}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
          <select name="category_id" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
          <input type="date" name="date" value="${BaseService?.getToday() || new Date().toISOString().split('T')[0]}"
                 class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2 border rounded-lg">Batal</button>
          <button type="submit" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">💸 Bayar</button>
        </div>
      </form>
    `;

    Modal?.show({ title: 'Bayar Tagihan', html, showCancel: false, confirmText: '' });

    document.getElementById('pay-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const result = await ReminderService?.markAsPaid(id, {
        amount: formData.get('amount'),
        account_id: formData.get('account_id'),
        category_id: formData.get('category_id'),
        date: formData.get('date')
      });

      if (result) {
        Modal?.close();
        await this.loadList();
      }
    });
  }
};

// Export global
window.ReminderPage = ReminderPage;
