/**
 * Data Formatter
 * Format tampilan untuk currency, tanggal, dll
 */

const Formatter = {

  /**
   * Format angka ke Rupiah
   * @param {number} amount
   * @param {boolean} showSymbol - Tampilkan "Rp"
   * @param {boolean} showSign - Tampilkan +/- di depan
   * @returns {string}
   */
  currency(amount, showSymbol = true, showSign = false) {
    // Gunakan Validator jika tersedia, jika tidak parse manual
    const num = typeof Validator !== 'undefined'
      ? Validator.currency(amount, 0)
      : (parseFloat(amount) || 0);

    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(num));

    let result = '';

    // Tambah tanda +/-
    if (showSign) {
      result += num >= 0 ? '+' : '-';
    } else if (num < 0) {
      result += '-';
    }

    // Tambah simbol Rp
    if (showSymbol) {
      result += 'Rp ';
    }

    result += formatted;

    return result;
  },

  /**
   * Format ke currency compact (1.5jt, 500rb)
   * @param {number} amount
   * @param {boolean} showSign
   * @returns {string}
   */
  currencyCompact(amount, showSign = false) {
    const num = typeof Validator !== 'undefined'
      ? Validator.currency(amount, 0)
      : (parseFloat(amount) || 0);

    const absNum = Math.abs(num);
    const sign = showSign ? (num >= 0 ? '+' : '-') : (num < 0 ? '-' : '');

    if (absNum >= 1000000000) {
      return `${sign}Rp ${(absNum / 1000000000).toFixed(1)}M`;
    } else if (absNum >= 1000000) {
      return `${sign}Rp ${(absNum / 1000000).toFixed(1)}jt`;
    } else if (absNum >= 1000) {
      return `${sign}Rp ${(absNum / 1000).toFixed(0)}rb`;
    }
    return `${sign}Rp ${absNum}`;
  },

  /**
   * Format tanggal ke format Indonesia
   * @param {string|Date} dateValue
   * @param {string} format - 'short', 'medium', 'long', 'full'
   * @returns {string}
   */
  date(dateValue, format = 'short') {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';

    const options = {
      short: { day: 'numeric', month: 'short' },
      medium: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };

    return date.toLocaleDateString('id-ID', options[format] || options.short);
  },

  /**
   * Format ke tanggal relatif (Hari ini, Kemarin, 3 hari lalu)
   * @param {string|Date} dateValue
   * @returns {string}
   */
  relativeDate(dateValue) {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    const diffTime = now - inputDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;

    return this.date(date, 'medium');
  },

  /**
   * Format waktu
   * @param {string} timeValue
   * @returns {string}
   */
  time(timeValue) {
    if (!timeValue) return '-';
    return String(timeValue).substring(0, 5); // HH:MM
  },

  /**
   * Format persentase
   * @param {number} value
   * @param {number} decimals
   * @returns {string}
   */
  percentage(value, decimals = 0) {
    const num = typeof Validator !== 'undefined'
      ? Validator.currency(value, 0)
      : (parseFloat(value) || 0);
    return `${num.toFixed(decimals)}%`;
  },

  /**
   * Format angka dengan pemisah ribuan
   * @param {number} value
   * @returns {string}
   */
  number(value) {
    const num = typeof Validator !== 'undefined'
      ? Validator.currency(value, 0)
      : (parseFloat(value) || 0);
    return new Intl.NumberFormat('id-ID').format(num);
  },

  /**
   * Potong text dengan ellipsis
   * @param {string} text
   * @param {number} maxLength
   * @returns {string}
   */
  truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Format nama akun dengan icon
   * @param {Object} account
   * @returns {string}
   */
  accountName(account) {
    if (!account) return '-';
    const icons = {
      cash: '💵',
      bank: '🏦',
      ewallet: '📱',
      investment: '📈',
      receivable: '📝',
      other: '💰'
    };
    const icon = icons[account.type] || '💰';
    return `${icon} ${account.name}`;
  },

  /**
   * Format nama kategori dengan icon
   * @param {Object} category
   * @returns {string}
   */
  categoryName(category) {
    if (!category) return '-';
    const icon = category.icon || '📁';
    return `${icon} ${category.name}`;
  },

  /**
   * Format Health Score dengan grade
   * @param {number} score
   * @returns {Object} { score, grade, label, color, emoji, bgClass, textClass }
   */
  healthScore(score) {
    const num = typeof Validator !== 'undefined'
      ? Validator.currency(score, 0)
      : (parseFloat(score) || 0);

    // Default grades if constants not loaded
    const defaultGrades = {
      'A+': { min: 90, label: 'Luar Biasa', color: 'green', emoji: '🌟', bgClass: 'bg-green-100', textClass: 'text-green-800' },
      A: { min: 80, label: 'Excellent', color: 'green', emoji: '💪', bgClass: 'bg-green-100', textClass: 'text-green-800' },
      B: { min: 60, label: 'Baik', color: 'blue', emoji: '👍', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
      C: { min: 40, label: 'Cukup', color: 'yellow', emoji: '😐', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
      D: { min: 20, label: 'Kurang', color: 'orange', emoji: '😟', bgClass: 'bg-orange-100', textClass: 'text-orange-800' },
      E: { min: 0, label: 'Kritis', color: 'red', emoji: '🚨', bgClass: 'bg-red-100', textClass: 'text-red-800' }
    };

    const grades = window.APP_CONSTANTS?.HEALTH_SCORE_GRADES || defaultGrades;

    // Find matching grade
    for (const [grade, config] of Object.entries(grades)) {
      if (num >= config.min) {
        return { score: num, grade, ...config };
      }
    }

    // Fallback to E grade
    return { score: num, grade: 'E', ...defaultGrades.E };
  },

  /**
   * Format status Kiyosaki
   * @param {number} passiveIncome
   * @param {number} passiveExpense
   * @returns {Object}
   */
  kiyosakiStatus(passiveIncome, passiveExpense) {
    const income = typeof Validator !== 'undefined'
      ? Validator.currency(passiveIncome, 0)
      : (parseFloat(passiveIncome) || 0);

    const expense = typeof Validator !== 'undefined'
      ? Validator.currency(passiveExpense, 0)
      : (parseFloat(passiveExpense) || 0);

    const defaultStatuses = window.APP_CONSTANTS?.KIYOSAKI_STATUS || {
      ASSET: { label: 'ASSET', color: 'green', bgClass: 'bg-green-100', textClass: 'text-green-800' },
      BREAKING_EVEN: { label: 'IMPAS', color: 'blue', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
      MENUJU_ASSET: { label: 'MENUJU ASSET', color: 'yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
      LIABILITY: { label: 'LIABILITY', color: 'red', bgClass: 'bg-red-100', textClass: 'text-red-800' }
    };

    if (expense === 0) {
      if (income > 0) {
        return { ...defaultStatuses.ASSET, progress: 100, ratio: Infinity };
      }
      return { ...defaultStatuses.MENUJU_ASSET, progress: 50, ratio: 0, message: 'Mulai bangun passive income!' };
    }

    const ratio = income / expense;

    if (ratio >= 1.5) {
      return { ...defaultStatuses.ASSET, progress: 100, ratio };
    } else if (ratio >= 1) {
      return { ...defaultStatuses.BREAKING_EVEN, progress: 85, ratio };
    } else if (ratio >= 0.5) {
      return { ...defaultStatuses.MENUJU_ASSET, progress: Math.round(50 + (ratio * 35)), ratio };
    } else {
      return { ...defaultStatuses.LIABILITY, progress: Math.round(ratio * 50), ratio };
    }
  },

  /**
   * Format file size
   * @param {number} bytes
   * @returns {string}
   */
  fileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  /**
   * Format tipe transaksi ke Bahasa Indonesia
   * @param {string} type
   * @returns {string}
   */
  transactionType(type) {
    const types = {
      income: 'Pemasukan',
      expense: 'Pengeluaran',
      transfer: 'Transfer'
    };
    return types[type] || type;
  },

  /**
   * Format tipe income ke Bahasa Indonesia
   * @param {string} type
   * @returns {string}
   */
  incomeType(type) {
    const types = {
      active: 'Aktif',
      passive: 'Pasif',
      portfolio: 'Portfolio'
    };
    return types[type] || type || 'Lainnya';
  },

  /**
   * Format budget status dengan warna
   * @param {number} used
   * @param {number} budget
   * @returns {Object} { percentage, status, color, message }
   */
  budgetStatus(used, budget) {
    const usedAmount = typeof Validator !== 'undefined'
      ? Validator.currency(used, 0)
      : (parseFloat(used) || 0);

    const budgetAmount = typeof Validator !== 'undefined'
      ? Validator.currency(budget, 0)
      : (parseFloat(budget) || 0);

    if (budgetAmount <= 0) {
      return { percentage: 0, status: 'none', color: 'gray', message: 'Budget belum diset' };
    }

    const percentage = Math.round((usedAmount / budgetAmount) * 100);

    if (percentage > 100) {
      return { percentage, status: 'over', color: 'red', message: `Melebihi budget ${percentage - 100}%` };
    } else if (percentage >= 80) {
      return { percentage, status: 'danger', color: 'orange', message: 'Hampir mencapai budget' };
    } else if (percentage >= 50) {
      return { percentage, status: 'warning', color: 'yellow', message: 'Sudah setengah jalan' };
    } else {
      return { percentage, status: 'safe', color: 'green', message: 'Budget masih aman' };
    }
  }
};

// Export global
window.Formatter = Formatter;

// Legacy compatibility - redirect old functions to Formatter
window.formatRupiah = (amount) => Formatter.currency(amount);
window.formatRupiahShort = (amount) => Formatter.currencyCompact(amount);
window.formatDate = (date) => Formatter.date(date, 'medium');
window.formatRelative = (date) => Formatter.relativeDate(date);
