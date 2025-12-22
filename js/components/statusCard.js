/**
 * Status Card Component
 * Kiyosaki status dan summary cards
 */

const StatusCard = {
  /**
   * Render Kiyosaki status card
   * @param {Object} status - Data dari Formatter.kiyosakiStatus()
   * @returns {string}
   */
  renderKiyosaki(status) {
    if (!status) {
      return this.renderEmpty('Status Keuangan');
    }

    const { label, color, icon, passiveIncome, passiveExpense, ratio } = status;

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Status Kiyosaki</h3>
          <span class="text-2xl">${icon}</span>
        </div>

        <div class="mb-3">
          <div class="text-lg font-bold ${this.getTextColor(color)}">${label}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Rasio: ${typeof ratio === 'number' ? ratio.toFixed(2) : '-'}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Passive Income</div>
            <div class="text-sm font-semibold text-green-500">
              ${Formatter?.currency(passiveIncome) || this.formatCurrency(passiveIncome)}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Passive Expense</div>
            <div class="text-sm font-semibold text-red-500">
              ${Formatter?.currency(passiveExpense) || this.formatCurrency(passiveExpense)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render summary stat card
   * @param {Object} options
   * @returns {string}
   */
  renderStat(options = {}) {
    const {
      title = '',
      value = 0,
      subtitle = '',
      icon = '',
      color = 'blue',
      trend = null
    } = options;

    const trendHtml = trend !== null ? `
      <div class="flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="${trend >= 0 ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}"></path>
        </svg>
        <span>${Math.abs(trend)}%</span>
      </div>
    ` : '';

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">${title}</span>
          ${icon ? `<span class="text-xl">${icon}</span>` : ''}
        </div>
        <div class="flex items-end justify-between">
          <div>
            <div class="text-xl font-bold ${this.getTextColor(color)}">
              ${typeof value === 'number' ? (Formatter?.currency(value) || this.formatCurrency(value)) : value}
            </div>
            ${subtitle ? `<div class="text-xs text-gray-400 dark:text-gray-500">${subtitle}</div>` : ''}
          </div>
          ${trendHtml}
        </div>
      </div>
    `;
  },

  /**
   * Render cashflow summary
   * @param {Object} data
   * @returns {string}
   */
  renderCashflow(data = {}) {
    const { income = 0, expense = 0, net = 0 } = data;

    return `
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
        <div class="text-sm opacity-90 mb-1">Arus Kas Bulan Ini</div>
        <div class="text-2xl font-bold mb-3">
          ${Formatter?.currency(net) || this.formatCurrency(net)}
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
          <div>
            <div class="text-xs opacity-75">Pemasukan</div>
            <div class="font-semibold text-green-300">
              +${Formatter?.currency(income) || this.formatCurrency(income)}
            </div>
          </div>
          <div>
            <div class="text-xs opacity-75">Pengeluaran</div>
            <div class="font-semibold text-red-300">
              -${Formatter?.currency(expense) || this.formatCurrency(expense)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render balance card
   * @param {number} balance
   * @param {number} accountCount
   * @returns {string}
   */
  renderBalance(balance = 0, accountCount = 0) {
    const isPositive = balance >= 0;

    return `
      <div class="bg-gradient-to-br ${isPositive ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-xl p-4 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm opacity-90">Total Saldo</span>
          <span class="text-xl">💰</span>
        </div>
        <div class="text-2xl font-bold mb-1">
          ${Formatter?.currency(balance) || this.formatCurrency(balance)}
        </div>
        <div class="text-xs opacity-75">
          dari ${accountCount} akun
        </div>
      </div>
    `;
  },

  /**
   * Render empty state
   * @param {string} title
   * @returns {string}
   */
  renderEmpty(title = 'Data') {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">${title}</div>
        <div class="text-gray-400 dark:text-gray-500 text-center py-4">Belum ada data</div>
      </div>
    `;
  },

  /**
   * Get text color class
   * @param {string} color
   * @returns {string}
   */
  getTextColor(color) {
    const colors = {
      green: 'text-green-500',
      blue: 'text-blue-500',
      yellow: 'text-yellow-500',
      orange: 'text-orange-500',
      red: 'text-red-500',
      purple: 'text-purple-500',
      gray: 'text-gray-500'
    };
    return colors[color] || 'text-gray-900 dark:text-white';
  },

  /**
   * Simple currency format fallback
   * @param {number} value
   * @returns {string}
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  }
};

// Export global
window.StatusCard = StatusCard;
