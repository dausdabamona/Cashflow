/**
 * Formatter Utilities
 * File: web/js/core/formatter.js
 */
const Formatter = {
  /**
   * Format number as currency (IDR)
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  currency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  /**
   * Format number with thousands separator
   * @param {number} number - Number to format
   * @returns {string} Formatted number string
   */
  number(number) {
    return new Intl.NumberFormat('id-ID').format(number || 0);
  },

  /**
   * Format date
   * @param {string|Date} date - Date to format
   * @param {string} format - Format type ('short', 'long', 'full')
   * @returns {string} Formatted date string
   */
  date(date, format = 'short') {
    if (!date) return '-';

    const d = new Date(date);

    const options = {
      short: { day: 'numeric', month: 'short', year: 'numeric' },
      long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
      full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };

    return d.toLocaleDateString('id-ID', options[format] || options.short);
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {string|Date} date - Date to format
   * @returns {string} Relative time string
   */
  relativeTime(date) {
    if (!date) return '-';

    const now = new Date();
    const d = new Date(date);
    const diff = now - d;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;

    return this.date(date);
  },

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  }
};

window.Formatter = Formatter;

console.log('✅ Formatter loaded');
