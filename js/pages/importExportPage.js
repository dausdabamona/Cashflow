/**
 * Import Export Page
 * Halaman untuk import dan export data
 */

const ImportExportPage = {

  // Store transactions for import
  pendingTransactions: [],

  /**
   * Render halaman
   * @param {HTMLElement} container
   */
  async render(container) {
    container.innerHTML = `
      <div class="p-4 pb-24">
        <h1 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Import & Export</h1>

        <!-- Export Section -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 mb-4">
          <h2 class="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <span>📤</span> Export Data
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Download data transaksi ke Excel</p>

          <form id="export-form" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Dari</label>
                <input type="date" name="startDate" value="${this.getFirstDayOfMonth()}"
                       class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Sampai</label>
                <input type="date" name="endDate" value="${BaseService?.getToday() || new Date().toISOString().split('T')[0]}"
                       class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg text-sm">
              </div>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="includeAccounts" value="1" checked class="w-4 h-4 rounded">
              <span class="text-sm text-gray-700 dark:text-gray-300">Sertakan daftar akun</span>
            </label>

            <button type="submit" class="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              📥 Download Excel
            </button>
          </form>
        </div>

        <!-- Import Section -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border dark:border-gray-700 mb-4">
          <h2 class="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <span>📥</span> Import Data
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Import dari rekening koran atau file Excel</p>

          <label class="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors mb-4">
            <input type="file" accept=".xlsx,.xls,.csv" class="hidden"
                   onchange="ImportExportPage.handleImportFile(event)">
            <span class="text-3xl">📄</span>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Pilih file Excel atau CSV</p>
            <p class="text-xs text-gray-400">Format: .xlsx, .xls, .csv</p>
          </label>

          <div id="import-preview" class="hidden"></div>
        </div>

        <!-- Supported Banks -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">🏦 Bank yang Didukung</h3>
          <div class="flex flex-wrap gap-2">
            ${['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB', 'Danamon', 'BSI', 'Permata'].map(bank => `
              <span class="px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 border dark:border-gray-600">${bank}</span>
            `).join('')}
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Download rekening koran dalam format Excel/CSV dari internet banking Anda
          </p>
        </div>
      </div>
    `;

    document.getElementById('export-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleExport(new FormData(e.target));
    });
  },

  /**
   * Get first day of current month
   * @returns {string} YYYY-MM-DD
   */
  getFirstDayOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  },

  /**
   * Handle export
   * @param {FormData} formData
   */
  async handleExport(formData) {
    const options = {
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      includeAccounts: formData.get('includeAccounts') === '1'
    };

    await ExportService?.toExcel(options);
  },

  /**
   * Handle import file selection
   * @param {Event} event
   */
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      Loading?.showOverlay?.('Membaca file...');

      const result = await ImportService?.importFromExcel(file);

      Loading?.hideOverlay?.();

      if (!result?.success) {
        Toast?.error(result?.error || 'Gagal membaca file');
        return;
      }

      const bank = ImportService?.detectBank(result.data) || 'UNKNOWN';
      const transactions = ImportService?.parseTransactions(result.data, bank) || [];

      if (transactions.length === 0) {
        Toast?.warning('Tidak ada transaksi yang dapat diimpor');
        return;
      }

      await this.showImportPreview(transactions, bank);

    } catch (error) {
      Loading?.hideOverlay?.();
      ErrorHandler?.handle(error, 'ImportExportPage.handleImportFile');
    }
  },

  /**
   * Show import preview
   * @param {Array} transactions
   * @param {string} bank
   */
  async showImportPreview(transactions, bank) {
    this.pendingTransactions = transactions;

    const accounts = await AccountService?.getAll() || [];
    const previewContainer = document.getElementById('import-preview');

    const incomeTotal = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    previewContainer.innerHTML = `
      <div class="border dark:border-gray-700 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="font-medium text-gray-800 dark:text-white">Bank: ${bank}</p>
            <p class="text-sm text-gray-500">${transactions.length} transaksi ditemukan</p>
          </div>
          <button onclick="ImportExportPage.clearImport()" class="text-sm text-red-600 hover:text-red-700">Batal</button>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Import ke Akun</label>
          <select id="import-account" class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            ${accounts.map(a => `<option value="${a.id}">${a.icon || '💳'} ${a.name}</option>`).join('')}
          </select>
        </div>

        <div class="max-h-60 overflow-y-auto border dark:border-gray-700 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th class="px-2 py-1 text-left">
                  <input type="checkbox" checked onchange="ImportExportPage.toggleAll(this.checked)">
                </th>
                <th class="px-2 py-1 text-left">Tanggal</th>
                <th class="px-2 py-1 text-left">Deskripsi</th>
                <th class="px-2 py-1 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx, i) => `
                <tr class="border-t dark:border-gray-700 ${tx.type === 'income' ? 'bg-green-50 dark:bg-green-900/20' : ''}">
                  <td class="px-2 py-1"><input type="checkbox" checked data-index="${i}" class="import-checkbox"></td>
                  <td class="px-2 py-1">${tx.date || '-'}</td>
                  <td class="px-2 py-1 truncate max-w-[150px]" title="${tx.description}">${tx.description}</td>
                  <td class="px-2 py-1 text-right ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                    ${tx.type === 'income' ? '+' : '-'}${Formatter?.currency(tx.amount) || tx.amount}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div class="bg-green-50 dark:bg-green-900/30 p-2 rounded">
            <p class="text-green-600">Pemasukan</p>
            <p class="font-semibold text-green-700">${Formatter?.currency(incomeTotal) || incomeTotal}</p>
          </div>
          <div class="bg-red-50 dark:bg-red-900/30 p-2 rounded">
            <p class="text-red-600">Pengeluaran</p>
            <p class="font-semibold text-red-700">${Formatter?.currency(expenseTotal) || expenseTotal}</p>
          </div>
        </div>

        <button onclick="ImportExportPage.executeImport()"
                class="w-full mt-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          ✓ Import <span id="import-count">${transactions.length}</span> Transaksi
        </button>
      </div>
    `;

    previewContainer.classList.remove('hidden');
  },

  /**
   * Toggle all checkboxes
   * @param {boolean} checked
   */
  toggleAll(checked) {
    document.querySelectorAll('.import-checkbox').forEach(cb => cb.checked = checked);
    this.updateImportCount();
  },

  /**
   * Update import count
   */
  updateImportCount() {
    const count = document.querySelectorAll('.import-checkbox:checked').length;
    const countEl = document.getElementById('import-count');
    if (countEl) countEl.textContent = count;
  },

  /**
   * Clear import
   */
  clearImport() {
    this.pendingTransactions = [];
    const preview = document.getElementById('import-preview');
    if (preview) {
      preview.classList.add('hidden');
      preview.innerHTML = '';
    }
  },

  /**
   * Execute import
   */
  async executeImport() {
    const accountId = document.getElementById('import-account')?.value;
    if (!accountId) {
      Toast?.error('Pilih akun tujuan');
      return;
    }

    const checkboxes = document.querySelectorAll('.import-checkbox:checked');
    const selectedIndexes = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    const selectedTx = this.pendingTransactions.filter((_, i) => selectedIndexes.includes(i));

    if (selectedTx.length === 0) {
      Toast?.warning('Pilih minimal 1 transaksi');
      return;
    }

    const result = await ImportService?.saveTransactions(selectedTx, accountId);

    if (result?.success) {
      Toast?.success(`${result.imported} transaksi berhasil diimport`);
      if (result.skipped > 0) {
        Toast?.info(`${result.skipped} transaksi dilewati (duplikat)`);
      }
      this.clearImport();
    }
  }
};

// Export global
window.ImportExportPage = ImportExportPage;
