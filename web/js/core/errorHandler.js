/**
 * Error Handler
 * File: web/js/core/errorHandler.js
 */
const ErrorHandler = {
  /**
   * Handle and log errors
   * @param {Error} error - Error object
   * @param {string} context - Where the error occurred
   */
  handle(error, context = 'Unknown') {
    console.error(`[${context}]`, error);

    // Show user-friendly message
    if (window.Toast) {
      Toast.error(this.getUserMessage(error));
    }
  },

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} User-friendly message
   */
  getUserMessage(error) {
    if (!error) return 'Terjadi kesalahan';

    const message = error.message || error.toString();

    // Common error translations
    if (message.includes('network')) {
      return 'Koneksi jaringan bermasalah';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Sesi telah berakhir, silakan login kembali';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'Data tidak ditemukan';
    }

    return 'Terjadi kesalahan, silakan coba lagi';
  },

  /**
   * Log error for debugging
   * @param {string} context - Context
   * @param {any} data - Data to log
   */
  log(context, data) {
    if (AppConfig?.app?.debug) {
      console.log(`[DEBUG:${context}]`, data);
    }
  }
};

window.ErrorHandler = ErrorHandler;

console.log('✅ ErrorHandler loaded');
