/**
 * Data Validator
 * Validasi dan sanitasi semua input data
 */

const Validator = {

  /**
   * Validasi dan parse nilai currency
   * @param {any} value - Nilai yang akan divalidasi
   * @param {number} defaultValue - Nilai default jika invalid
   * @returns {number}
   */
  currency(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }

    // Jika sudah number, langsung return
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }

    // Hapus karakter non-numerik kecuali titik, koma, dan minus
    let cleaned = String(value)
      .replace(/[^\d.,-]/g, '')  // Hapus semua kecuali digit, titik, koma, minus
      .replace(/,/g, '');        // Ganti koma dengan nothing (format Indonesia: 1.000.000)

    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultValue : num;
  },

  /**
   * Pastikan nilai adalah angka positif
   * @param {any} value
   * @param {string} fieldName - Untuk pesan error
   * @returns {number}
   */
  positiveNumber(value, fieldName = 'Nilai') {
    const num = this.currency(value, 0);
    if (num < 0) {
      console.warn(`${fieldName} adalah negatif: ${num}, dikonversi ke positif`);
      return Math.abs(num);
    }
    return num;
  },

  /**
   * Validasi field wajib
   * @param {any} value
   * @param {string} fieldName
   * @throws {Error} jika kosong
   */
  required(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} wajib diisi`);
    }
    return value;
  },

  /**
   * Validasi format email
   * @param {string} email
   * @returns {boolean}
   */
  isValidEmail(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validasi dan parse tanggal
   * @param {any} value
   * @returns {Date|null}
   */
  date(value) {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },

  /**
   * Validasi dan format tanggal ke YYYY-MM-DD
   * @param {any} value
   * @param {string} defaultValue
   * @returns {string}
   */
  dateString(value, defaultValue = null) {
    const date = this.date(value);
    if (!date) return defaultValue || new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  },

  /**
   * Validasi data transaksi lengkap
   * @param {Object} data
   * @returns {Object} data yang sudah divalidasi
   * @throws {Error} jika tidak valid
   */
  transaction(data) {
    const errors = [];

    // Validasi amount
    const amount = this.currency(data.amount, 0);
    if (amount <= 0) {
      errors.push('Jumlah harus lebih dari 0');
    }

    // Validasi akun
    if (!data.account_id) {
      errors.push('Pilih akun');
    }

    // Validasi kategori (tidak wajib untuk transfer)
    if (data.type !== 'transfer' && !data.category_id) {
      errors.push('Pilih kategori');
    }

    // Validasi tanggal
    if (!data.date) {
      errors.push('Tanggal wajib diisi');
    }

    // Validasi tipe
    if (!data.type || !['income', 'expense', 'transfer'].includes(data.type)) {
      errors.push('Tipe transaksi tidak valid');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return {
      amount: amount,
      account_id: data.account_id,
      category_id: data.category_id || null,
      date: this.dateString(data.date),
      type: data.type,
      description: this.sanitizeString(data.description || ''),
      income_type: data.income_type || null,
      item_id: data.item_id || null
    };
  },

  /**
   * Validasi data transfer
   * @param {Object} data
   * @returns {Object} data yang sudah divalidasi
   */
  transfer(data) {
    const errors = [];

    const amount = this.currency(data.amount, 0);
    if (amount <= 0) {
      errors.push('Jumlah transfer harus lebih dari 0');
    }

    if (!data.from_account_id) {
      errors.push('Pilih akun asal');
    }

    if (!data.to_account_id) {
      errors.push('Pilih akun tujuan');
    }

    if (data.from_account_id === data.to_account_id) {
      errors.push('Akun asal dan tujuan tidak boleh sama');
    }

    const adminFee = this.currency(data.admin_fee, 0);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return {
      amount: amount,
      admin_fee: adminFee,
      total_deducted: amount + adminFee,
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      date: this.dateString(data.date),
      description: this.sanitizeString(data.description || '')
    };
  },

  /**
   * Validasi data akun
   * @param {Object} data
   * @returns {Object} data yang sudah divalidasi
   */
  account(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Nama akun wajib diisi');
    }

    if (!data.type) {
      errors.push('Tipe akun wajib dipilih');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return {
      name: this.sanitizeString(data.name, 100),
      type: data.type,
      initial_balance: this.currency(data.initial_balance, 0),
      current_balance: this.currency(data.current_balance || data.initial_balance, 0),
      description: this.sanitizeString(data.description || '', 255)
    };
  },

  /**
   * Validasi data item/barang
   * @param {Object} data
   * @returns {Object} data yang sudah divalidasi
   */
  item(data) {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Nama item wajib diisi');
    }

    const purchaseValue = this.currency(data.purchase_value || data.purchase_price, 0);
    if (purchaseValue <= 0) {
      errors.push('Nilai pembelian harus lebih dari 0');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return {
      name: this.sanitizeString(data.name, 100),
      type: data.type || 'asset',
      purchase_price: purchaseValue,
      current_value: this.currency(data.current_value, purchaseValue),
      description: this.sanitizeString(data.description || '', 500)
    };
  },

  /**
   * Sanitasi string input
   * @param {string} value
   * @param {number} maxLength
   * @returns {string}
   */
  sanitizeString(value, maxLength = 500) {
    if (!value) return '';
    return String(value)
      .trim()
      .replace(/[<>]/g, '') // Hapus karakter HTML berbahaya
      .substring(0, maxLength);
  },

  /**
   * Cek apakah nilai kosong
   * @param {any} value
   * @returns {boolean}
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  },

  /**
   * Cek apakah nilai adalah UUID valid
   * @param {string} value
   * @returns {boolean}
   */
  isValidUUID(value) {
    if (!value) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(value);
  },

  /**
   * Validasi password strength
   * @param {string} password
   * @returns {Object} { valid: boolean, message: string, strength: 'weak'|'medium'|'strong' }
   */
  password(password) {
    if (!password) {
      return { valid: false, message: 'Password wajib diisi', strength: 'weak' };
    }

    if (password.length < 6) {
      return { valid: false, message: 'Password minimal 6 karakter', strength: 'weak' };
    }

    // Check strength
    let strength = 'weak';
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars].filter(Boolean).length;

    if (password.length >= 8 && strengthScore >= 3) {
      strength = 'strong';
    } else if (password.length >= 6 && strengthScore >= 2) {
      strength = 'medium';
    }

    return { valid: true, message: 'Password valid', strength };
  },

  /**
   * Validasi nomor telepon Indonesia
   * @param {string} phone
   * @returns {boolean}
   */
  isValidPhone(phone) {
    if (!phone) return false;
    // Format: +62xxx, 62xxx, 08xxx
    const cleaned = phone.replace(/\D/g, '');
    return /^(62|0)8\d{8,11}$/.test(cleaned);
  }
};

// Export global
window.Validator = Validator;
