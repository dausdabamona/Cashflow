/**
 * Error Handler
 * Penanganan error terpusat
 */

const ErrorHandler = {

  // Log level
  LOG_LEVEL: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  },

  currentLogLevel: 1, // INFO by default

  /**
   * Handle error dengan feedback ke user
   * @param {Error} error
   * @param {string} context - Di mana error terjadi
   * @param {boolean} showToast - Tampilkan toast ke user
   */
  handle(error, context = '', showToast = true) {
    // Log ke console
    this.log('ERROR', `[${context}]`, error);

    // Tentukan pesan untuk user
    const message = this.getUserMessage(error);

    // Tampilkan toast jika perlu
    if (showToast && typeof window.showToast === 'function') {
      window.showToast(message, 'error');
    }

    // Handle error khusus
    if (this.isAuthError(error)) {
      this.log('WARN', 'Auth error detected, redirecting to login...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  },

  /**
   * Dapatkan pesan error yang user-friendly
   * @param {Error} error
   * @returns {string}
   */
  getUserMessage(error) {
    const messages = window.APP_CONSTANTS?.ERROR_MESSAGES || {
      NETWORK: 'Koneksi terputus. Periksa internet Anda.',
      AUTH_EXPIRED: 'Sesi telah berakhir. Silakan login kembali.',
      VALIDATION: 'Data tidak valid. Periksa input Anda.',
      GENERIC: 'Terjadi kesalahan. Coba lagi nanti.',
      NOT_FOUND: 'Data tidak ditemukan.',
      PERMISSION: 'Anda tidak memiliki akses.',
      DUPLICATE: 'Data sudah ada.',
      INSUFFICIENT_BALANCE: 'Saldo tidak mencukupi.'
    };

    if (!error) return messages.GENERIC;

    const code = error.code || '';
    const msg = error.message || '';

    // Supabase specific errors
    if (code === 'PGRST301' || code === '401' || msg.includes('JWT')) {
      return messages.AUTH_EXPIRED;
    }
    if (code.startsWith('23')) { // PostgreSQL constraint errors
      if (code === '23505') return messages.DUPLICATE;
      if (code === '23503') return 'Data terkait dengan data lain, tidak dapat dihapus.';
      return messages.VALIDATION;
    }
    if (code === 'PGRST204') {
      return 'Struktur data tidak sesuai. Hubungi administrator.';
    }
    if (code === '42P01') {
      return 'Tabel tidak ditemukan. Database mungkin belum dikonfigurasi.';
    }

    // Network errors
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('Failed to fetch')) {
      return messages.NETWORK;
    }

    // Permission errors
    if (msg.includes('permission') || msg.includes('denied') || msg.includes('policy')) {
      return messages.PERMISSION;
    }

    // Validation errors (dari Validator)
    if (msg.includes('wajib') || msg.includes('harus') || msg.includes('tidak valid') || msg.includes('tidak boleh')) {
      return msg; // Tampilkan pesan validasi asli
    }

    // Insufficient balance
    if (msg.includes('saldo') || msg.includes('balance') || msg.includes('insufficient')) {
      return messages.INSUFFICIENT_BALANCE;
    }

    // Not found
    if (msg.includes('not found') || msg.includes('tidak ditemukan')) {
      return messages.NOT_FOUND;
    }

    return messages.GENERIC;
  },

  /**
   * Cek apakah error terkait auth
   * @param {Error} error
   * @returns {boolean}
   */
  isAuthError(error) {
    if (!error) return false;
    const code = error.code || '';
    const msg = (error.message || '').toLowerCase();
    return code === 'PGRST301' || code === '401' ||
           msg.includes('jwt') || msg.includes('auth') ||
           msg.includes('session') || msg.includes('token');
  },

  /**
   * Cek apakah error adalah network error
   * @param {Error} error
   * @returns {boolean}
   */
  isNetworkError(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    return msg.includes('network') || msg.includes('fetch') ||
           msg.includes('failed to fetch') || msg.includes('offline');
  },

  /**
   * Log dengan level
   * @param {string} level - DEBUG, INFO, WARN, ERROR
   * @param {...any} args
   */
  log(level, ...args) {
    const levelNum = this.LOG_LEVEL[level] || 0;
    if (levelNum < this.currentLogLevel) return;

    const timestamp = new Date().toLocaleTimeString('id-ID');
    const prefix = `[${timestamp}] [${level}]`;

    switch (level) {
      case 'ERROR':
        console.error(prefix, ...args);
        break;
      case 'WARN':
        console.warn(prefix, ...args);
        break;
      case 'INFO':
        console.info(prefix, ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  },

  /**
   * Debug log (hanya tampil jika level DEBUG)
   * @param {...any} args
   */
  debug(...args) {
    this.log('DEBUG', ...args);
  },

  /**
   * Info log
   * @param {...any} args
   */
  info(...args) {
    this.log('INFO', ...args);
  },

  /**
   * Warning log
   * @param {...any} args
   */
  warn(...args) {
    this.log('WARN', ...args);
  },

  /**
   * Error log
   * @param {...any} args
   */
  error(...args) {
    this.log('ERROR', ...args);
  },

  /**
   * Wrapper untuk async function dengan error handling
   * @param {Function} fn
   * @param {string} context
   * @returns {Function}
   */
  wrapAsync(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, context);
        return null;
      }
    };
  },

  /**
   * Try-catch wrapper yang lebih simple
   * @param {Function} fn
   * @param {string} context
   * @param {any} defaultValue - Nilai default jika error
   */
  async tryCatch(fn, context, defaultValue = null) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      return defaultValue;
    }
  },

  /**
   * Synchronous try-catch wrapper
   * @param {Function} fn
   * @param {string} context
   * @param {any} defaultValue
   */
  tryCatchSync(fn, context, defaultValue = null) {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      return defaultValue;
    }
  },

  /**
   * Set log level
   * @param {string} level - DEBUG, INFO, WARN, ERROR
   */
  setLogLevel(level) {
    if (this.LOG_LEVEL.hasOwnProperty(level)) {
      this.currentLogLevel = this.LOG_LEVEL[level];
      this.info(`Log level set to ${level}`);
    }
  },

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.setLogLevel('DEBUG');
  },

  /**
   * Disable debug mode (production)
   */
  disableDebug() {
    this.setLogLevel('WARN');
  },

  /**
   * Tampilkan success message
   * @param {string} key - Key dari SUCCESS_MESSAGES
   * @param {string} fallback - Pesan fallback
   */
  showSuccess(key, fallback = 'Berhasil!') {
    const messages = window.APP_CONSTANTS?.SUCCESS_MESSAGES || {};
    const message = messages[key] || fallback;

    if (typeof window.showToast === 'function') {
      window.showToast(message, 'success');
    }
  },

  /**
   * Tampilkan warning message
   * @param {string} message
   */
  showWarning(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'warning');
    }
    this.warn(message);
  },

  /**
   * Tampilkan info message
   * @param {string} message
   */
  showInfo(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'info');
    }
    this.info(message);
  }
};

// Export global
window.ErrorHandler = ErrorHandler;

// Enable debug in development (check URL or localStorage)
if (window.location.hostname === 'localhost' || localStorage.getItem('debug') === 'true') {
  ErrorHandler.enableDebug();
}
