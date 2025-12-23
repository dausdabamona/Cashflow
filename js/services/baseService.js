/**
 * Base Service
 * File: js/services/baseService.js
 * Core service providing shared functionality for all other services
 */
const BaseService = {
  /**
   * Get the Supabase client instance
   * @returns {Object} Supabase client
   */
  getClient() {
    if (!window.supabaseClient) {
      console.error('[BaseService] Supabase client not initialized');
      throw new Error('Supabase client not initialized');
    }
    return window.supabaseClient;
  },

  /**
   * Get the current authenticated user's ID
   * @returns {string|null} User ID or null if not authenticated
   */
  getUserId() {
    const session = window.supabaseClient?.auth?.session?.();
    if (session?.user?.id) {
      return session.user.id;
    }

    // Alternative: check for stored user
    const user = window.currentUser || window.supabaseClient?.auth?.user?.();
    return user?.id || null;
  },

  /**
   * Get current month (1-12)
   * @returns {number} Current month
   */
  getCurrentMonth() {
    return new Date().getMonth() + 1;
  },

  /**
   * Get current year
   * @returns {number} Current year
   */
  getCurrentYear() {
    return new Date().getFullYear();
  },

  /**
   * Format currency to IDR
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  /**
   * Format date to locale string
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Export to window
window.BaseService = BaseService;

console.log('✅ BaseService loaded');
