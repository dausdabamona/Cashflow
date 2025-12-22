/**
 * Import Service
 * Import data dari file Excel/CSV/PDF rekening koran
 */

const ImportService = {

  /**
   * Import dari file Excel/CSV
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async importFromExcel(file) {
    try {
      Loading?.showOverlay('Membaca file...');

      // Check if SheetJS is available
      if (typeof XLSX === 'undefined') {
        await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      }

      const data = await this.readExcelFile(file);

      Loading?.hideOverlay();

      return {
        success: true,
        data,
        rowCount: data.length
      };

    } catch (error) {
      Loading?.hideOverlay();
      ErrorHandler.handle(error, 'ImportService.importFromExcel');
      return { success: false, error: error.message };
    }
  },

  /**
   * Read Excel file
   * @param {File} file
   * @returns {Promise<Array>}
   */
  readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          // Ambil sheet pertama
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];

          // Convert ke JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
          });

          resolve(jsonData);
        } catch (err) {
          reject(new Error('Gagal membaca file Excel: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Detect bank dari content
   * @param {Array} data - Raw data dari Excel/CSV
   * @returns {string} bank name
   */
  detectBank(data) {
    const content = JSON.stringify(data).toUpperCase();

    const banks = {
      'BCA': ['BCA', 'BANK CENTRAL ASIA', 'KLIKBCA', 'M-BCA'],
      'MANDIRI': ['MANDIRI', 'BANK MANDIRI', 'LIVIN'],
      'BRI': ['BRI', 'BANK RAKYAT INDONESIA', 'BRIMO'],
      'BNI': ['BNI', 'BANK NEGARA INDONESIA'],
      'CIMB': ['CIMB', 'CIMB NIAGA', 'OCTO'],
      'DANAMON': ['DANAMON', 'D-BANK'],
      'BSI': ['BSI', 'BANK SYARIAH INDONESIA'],
      'PERMATA': ['PERMATA', 'PERMATABANK'],
      'UNKNOWN': []
    };

    for (const [bank, keywords] of Object.entries(banks)) {
      if (keywords.some(k => content.includes(k))) {
        return bank;
      }
    }

    return 'UNKNOWN';
  },

  /**
   * Parse data sesuai format bank
   * @param {Array} data - Raw data
   * @param {string} bank - Bank name
   * @returns {Array} parsed transactions
   */
  parseTransactions(data, bank) {
    // Find header row
    let headerIndex = -1;
    const headerKeywords = ['TANGGAL', 'DATE', 'TGL', 'KETERANGAN', 'DESCRIPTION', 'DEBIT', 'KREDIT', 'CREDIT'];

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = row.join(' ').toUpperCase();
        if (headerKeywords.some(k => rowStr.includes(k))) {
          headerIndex = i;
          break;
        }
      }
    }

    if (headerIndex === -1) {
      // Assume first row is header
      headerIndex = 0;
    }

    const headers = data[headerIndex].map(h => String(h).toUpperCase().trim());
    const transactions = [];

    // Find column indices
    const dateCol = headers.findIndex(h => h.includes('TANGGAL') || h.includes('DATE') || h.includes('TGL'));
    const descCol = headers.findIndex(h => h.includes('KETERANGAN') || h.includes('DESCRIPTION') || h.includes('URAIAN'));
    const debitCol = headers.findIndex(h => h.includes('DEBIT') || h.includes('KELUAR') || h.includes('WITHDRAWAL'));
    const creditCol = headers.findIndex(h => h.includes('KREDIT') || h.includes('CREDIT') || h.includes('MASUK') || h.includes('DEPOSIT'));
    const amountCol = headers.findIndex(h => h.includes('MUTASI') || h.includes('AMOUNT') || h.includes('JUMLAH'));

    // Parse rows
    for (let i = headerIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      // Skip empty rows
      const rowStr = row.join('').trim();
      if (!rowStr) continue;

      try {
        // Parse date
        let date = null;
        if (dateCol >= 0 && row[dateCol]) {
          date = this.parseDate(row[dateCol]);
        }

        // Parse description
        let description = '';
        if (descCol >= 0) {
          description = String(row[descCol] || '').trim();
        }

        // Parse amount
        let amount = 0;
        let type = 'expense';

        if (debitCol >= 0 && row[debitCol]) {
          const debit = this.parseAmount(row[debitCol]);
          if (debit > 0) {
            amount = debit;
            type = 'expense';
          }
        }

        if (creditCol >= 0 && row[creditCol]) {
          const credit = this.parseAmount(row[creditCol]);
          if (credit > 0) {
            amount = credit;
            type = 'income';
          }
        }

        // Jika ada kolom mutasi dengan CR/DB indicator
        if (amountCol >= 0 && row[amountCol]) {
          const amountStr = String(row[amountCol]).toUpperCase();
          amount = this.parseAmount(row[amountCol]);
          type = amountStr.includes('CR') ? 'income' : 'expense';
        }

        // Only add if valid
        if (date && amount > 0 && description) {
          transactions.push({
            date,
            description,
            amount,
            type,
            category: this.suggestCategory(description, type),
            original: row
          });
        }

      } catch (err) {
        // Skip invalid row
        ErrorHandler.log('DEBUG', 'Skip invalid row:', row, err);
      }
    }

    return transactions;
  },

  /**
   * Parse date dari berbagai format
   * @param {any} value
   * @returns {string|null} YYYY-MM-DD
   */
  parseDate(value) {
    if (!value) return null;

    // Jika sudah Date object
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    const str = String(value).trim();

    // Try various formats
    const patterns = [
      { regex: /^(\d{4})-(\d{2})-(\d{2})/, format: 'YYYY-MM-DD' },
      { regex: /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/, format: 'DD/MM/YYYY' },
      { regex: /^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/, format: 'DD/MM/YY' },
    ];

    for (const p of patterns) {
      const match = str.match(p.regex);
      if (match) {
        let year, month, day;

        if (p.format === 'YYYY-MM-DD') {
          [, year, month, day] = match;
        } else {
          [, day, month, year] = match;
          if (year.length === 2) year = '20' + year;
        }

        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Try native Date parsing
    try {
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {}

    return null;
  },

  /**
   * Parse amount dari string
   * @param {any} value
   * @returns {number}
   */
  parseAmount(value) {
    if (!value) return 0;
    if (typeof value === 'number') return Math.abs(value);

    // Remove non-numeric except . and ,
    let str = String(value)
      .replace(/[^\d.,\-]/g, '')
      .replace(/\./g, '')  // Remove thousand separator
      .replace(',', '.');   // Convert decimal separator

    return Math.abs(parseFloat(str)) || 0;
  },

  /**
   * Suggest category berdasarkan deskripsi
   * @param {string} description
   * @param {string} type
   * @returns {string} category name
   */
  suggestCategory(description, type) {
    const desc = description.toUpperCase();

    if (type === 'income') {
      if (desc.includes('GAJI') || desc.includes('SALARY') || desc.includes('PAYROLL')) return 'Gaji';
      if (desc.includes('TRANSFER') || desc.includes('TRF') || desc.includes('TRSF')) return 'Transfer Masuk';
      if (desc.includes('BUNGA') || desc.includes('INTEREST')) return 'Bunga';
      return 'Pemasukan Lainnya';
    }

    // Expense categories
    if (desc.includes('ALFAMART') || desc.includes('INDOMARET') || desc.includes('SUPERINDO')) return 'Belanja';
    if (desc.includes('GRAB') || desc.includes('GOJEK') || desc.includes('UBER')) return 'Transport';
    if (desc.includes('PLN') || desc.includes('LISTRIK')) return 'Listrik';
    if (desc.includes('TELKOM') || desc.includes('INDIHOME') || desc.includes('WIFI')) return 'Internet';
    if (desc.includes('MCDONALD') || desc.includes('KFC') || desc.includes('STARBUCKS') || desc.includes('RESTORAN')) return 'Makan';
    if (desc.includes('TOKOPEDIA') || desc.includes('SHOPEE') || desc.includes('LAZADA') || desc.includes('BUKALAPAK')) return 'Belanja Online';
    if (desc.includes('ATM') || desc.includes('TARIK TUNAI') || desc.includes('WITHDRAWAL')) return 'Tarik Tunai';
    if (desc.includes('TRANSFER') || desc.includes('TRF')) return 'Transfer Keluar';
    if (desc.includes('ANGSURAN') || desc.includes('CICILAN') || desc.includes('KREDIT')) return 'Cicilan';

    return 'Lainnya';
  },

  /**
   * Import transactions ke database
   * @param {Array} transactions - Parsed transactions
   * @param {string} accountId - Target account ID
   * @returns {Promise<Object>}
   */
  async saveTransactions(transactions, accountId) {
    try {
      Loading?.showOverlay('Menyimpan transaksi...');

      const categories = await CategoryService?.getAll() || [];

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (const tx of transactions) {
        try {
          // Find or create category
          let category = categories.find(c =>
            c.name.toLowerCase() === tx.category.toLowerCase() && c.type === tx.type
          );

          if (!category) {
            // Use default category
            category = categories.find(c => c.type === tx.type);
          }

          if (!category) {
            skipCount++;
            continue;
          }

          // Check for duplicate
          const existing = await this.checkDuplicate(tx.date, tx.amount, accountId);
          if (existing) {
            skipCount++;
            continue;
          }

          // Create transaction
          const result = await TransactionService?.create({
            type: tx.type,
            amount: tx.amount,
            account_id: accountId,
            category_id: category.id,
            date: tx.date,
            description: tx.description,
            income_type: tx.type === 'income' ? 'active' : null
          });

          if (result) {
            successCount++;
          } else {
            errorCount++;
          }

        } catch (err) {
          errorCount++;
          ErrorHandler.log('WARN', 'Import row error:', err);
        }
      }

      Loading?.hideOverlay();

      return {
        success: true,
        total: transactions.length,
        imported: successCount,
        skipped: skipCount,
        errors: errorCount
      };

    } catch (error) {
      Loading?.hideOverlay();
      ErrorHandler.handle(error, 'ImportService.saveTransactions');
      return { success: false, error: error.message };
    }
  },

  /**
   * Check for duplicate transaction
   * @param {string} date
   * @param {number} amount
   * @param {string} accountId
   * @returns {Promise<boolean>}
   */
  async checkDuplicate(date, amount, accountId) {
    try {
      const client = BaseService.getClient();

      const { count } = await client
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('date', date)
        .eq('amount', amount)
        .eq('account_id', accountId)
        .eq('is_deleted', false);

      return count > 0;

    } catch (error) {
      return false;
    }
  },

  /**
   * Load external script
   * @param {string} src
   * @returns {Promise}
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
};

// Export global
window.ImportService = ImportService;
