/**
 * Export Service
 * Export data ke Excel/CSV
 */

const ExportService = {

  /**
   * Export transaksi ke Excel
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  async toExcel(options = {}) {
    try {
      Loading?.showOverlay('Membuat file Excel...');

      // Load SheetJS if needed
      if (typeof XLSX === 'undefined') {
        await ImportService?.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      }

      const {
        startDate,
        endDate,
        includeAccounts = true,
        includeCategories = false
      } = options;

      // Get data
      const transactions = await TransactionService?.getAll({ startDate, endDate }) || [];
      const accounts = includeAccounts ? await AccountService?.getAll() || [] : [];

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Transaksi
      const txData = transactions.map(tx => ({
        'Tanggal': tx.date,
        'Deskripsi': tx.description || tx.category?.name || '',
        'Kategori': tx.category?.name || '',
        'Akun': tx.account?.name || '',
        'Tipe': tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        'Jumlah': tx.type === 'income' ? tx.amount : -tx.amount
      }));

      const txSheet = XLSX.utils.json_to_sheet(txData);
      XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');

      // Sheet 2: Ringkasan
      const summary = this.calculateSummary(transactions);
      const summaryData = [
        { 'Keterangan': 'Total Pemasukan', 'Jumlah': summary.income },
        { 'Keterangan': 'Total Pengeluaran', 'Jumlah': summary.expense },
        { 'Keterangan': 'Selisih', 'Jumlah': summary.net }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');

      // Sheet 3: Akun (if included)
      if (includeAccounts && accounts.length > 0) {
        const accData = accounts.map(acc => ({
          'Nama Akun': acc.name,
          'Tipe': acc.type,
          'Saldo Awal': acc.opening_balance,
          'Saldo Saat Ini': acc.current_balance
        }));

        const accSheet = XLSX.utils.json_to_sheet(accData);
        XLSX.utils.book_append_sheet(wb, accSheet, 'Akun');
      }

      // Generate filename
      const now = new Date();
      const filename = `Cashflow_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);

      Loading?.hideOverlay();
      Toast?.success('File berhasil di-download!');

      return true;

    } catch (error) {
      Loading?.hideOverlay();
      ErrorHandler.handle(error, 'ExportService.toExcel');
      return false;
    }
  },

  /**
   * Calculate summary from transactions
   * @param {Array} transactions
   * @returns {Object}
   */
  calculateSummary(transactions) {
    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
      const amount = Validator?.currency(tx.amount, 0) || parseFloat(tx.amount) || 0;
      if (tx.type === 'income') {
        income += amount;
      } else if (tx.type === 'expense') {
        expense += amount;
      }
    });

    return {
      income,
      expense,
      net: income - expense
    };
  },

  /**
   * Export ke CSV
   * @param {Array} data
   * @param {string} filename
   */
  toCSV(data, filename = 'export.csv') {
    try {
      if (!data || data.length === 0) {
        Toast?.warning('Tidak ada data untuk di-export');
        return false;
      }

      // Get headers
      const headers = Object.keys(data[0]);

      // Build CSV content
      let csv = headers.join(',') + '\n';

      data.forEach(row => {
        const values = headers.map(h => {
          let val = row[h];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof val === 'string') {
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) {
              val = `"${val}"`;
            }
          }
          return val;
        });
        csv += values.join(',') + '\n';
      });

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      Toast?.success('CSV berhasil di-download!');
      return true;

    } catch (error) {
      ErrorHandler.handle(error, 'ExportService.toCSV');
      return false;
    }
  },

  /**
   * Export transactions to CSV
   * @param {Object} options
   * @returns {Promise<boolean>}
   */
  async transactionsToCSV(options = {}) {
    try {
      const { startDate, endDate } = options;

      const transactions = await TransactionService?.getAll({ startDate, endDate }) || [];

      if (transactions.length === 0) {
        Toast?.warning('Tidak ada transaksi untuk di-export');
        return false;
      }

      const data = transactions.map(tx => ({
        'Tanggal': tx.date,
        'Deskripsi': tx.description || '',
        'Kategori': tx.category?.name || '',
        'Akun': tx.account?.name || '',
        'Tipe': tx.type,
        'Jumlah': tx.amount
      }));

      const now = new Date();
      const filename = `Transaksi_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}.csv`;

      return this.toCSV(data, filename);

    } catch (error) {
      ErrorHandler.handle(error, 'ExportService.transactionsToCSV');
      return false;
    }
  },

  /**
   * Export budget report
   * @returns {Promise<boolean>}
   */
  async budgetToExcel() {
    try {
      Loading?.showOverlay('Membuat laporan budget...');

      if (typeof XLSX === 'undefined') {
        await ImportService?.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      }

      const budgets = await BudgetService?.getCurrentMonth() || [];

      if (budgets.length === 0) {
        Loading?.hideOverlay();
        Toast?.warning('Tidak ada budget untuk di-export');
        return false;
      }

      const data = budgets.map(b => ({
        'Kategori': b.categoryName,
        'Budget': b.budgetAmount,
        'Terpakai': b.spentAmount,
        'Sisa': b.budgetAmount - b.spentAmount,
        'Persentase': `${b.percentage}%`
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Budget');

      const now = new Date();
      const filename = `Budget_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}.xlsx`;

      XLSX.writeFile(wb, filename);

      Loading?.hideOverlay();
      Toast?.success('Laporan budget berhasil di-download!');

      return true;

    } catch (error) {
      Loading?.hideOverlay();
      ErrorHandler.handle(error, 'ExportService.budgetToExcel');
      return false;
    }
  }
};

// Export global
window.ExportService = ExportService;
