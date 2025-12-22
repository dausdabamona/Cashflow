/**
 * Transaction Item Component
 * Render transaction list items
 */

const TransactionItem = {
  /**
   * Render single transaction item
   * @param {Object} tx - Transaction data
   * @param {Object} options
   * @returns {string}
   */
  render(tx, options = {}) {
    if (!tx) return '';

    const {
      showDate = true,
      showAccount = true,
      showCategory = true,
      compact = false,
      onClick = ''
    } = options;

    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const amount = Validator?.currency(tx.amount, 0) || parseFloat(tx.amount) || 0;

    const icon = this.getIcon(tx);
    const categoryName = tx.category?.name || tx.category_name || 'Uncategorized';
    const accountName = tx.account?.name || tx.account_name || '';

    return `
      <div class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors ${onClick ? 'cursor-pointer' : ''}"
           ${onClick ? `onclick="${onClick}"` : ''}>
        <!-- Icon -->
        <div class="w-10 h-10 rounded-full flex items-center justify-center ${this.getBgColor(tx.type)}">
          <span class="text-lg">${icon}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-white truncate">
            ${tx.description || categoryName}
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            ${showCategory && !compact ? `<span>${categoryName}</span>` : ''}
            ${showCategory && showAccount && !compact ? '<span>•</span>' : ''}
            ${showAccount && !compact ? `<span>${accountName}</span>` : ''}
            ${showDate ? `<span>${this.formatDate(tx.date || tx.created_at)}</span>` : ''}
          </div>
        </div>

        <!-- Amount -->
        <div class="text-right">
          <div class="font-semibold ${this.getAmountColor(tx.type)}">
            ${isTransfer ? '' : (isIncome ? '+' : '-')}${Formatter?.currency(amount) || this.formatCurrency(amount)}
          </div>
          ${tx.income_type && tx.income_type !== 'active' ? `
            <div class="text-xs text-gray-400">${this.getIncomeTypeLabel(tx.income_type)}</div>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render transaction list
   * @param {Array} transactions
   * @param {Object} options
   * @returns {string}
   */
  renderList(transactions = [], options = {}) {
    if (!transactions.length) {
      return EmptyState?.preset('transactions', 'sm') || '<div class="text-center py-4 text-gray-400">Tidak ada transaksi</div>';
    }

    const { groupByDate = true, limit = 0 } = options;
    const list = limit > 0 ? transactions.slice(0, limit) : transactions;

    if (!groupByDate) {
      return `
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          ${list.map(tx => this.render(tx, options)).join('')}
        </div>
      `;
    }

    // Group by date
    const grouped = this.groupByDate(list);

    return Object.entries(grouped).map(([date, txs]) => `
      <div class="mb-4">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          ${this.formatDateHeader(date)}
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-b-lg divide-y divide-gray-100 dark:divide-gray-700">
          ${txs.map(tx => this.render(tx, { ...options, showDate: false })).join('')}
        </div>
      </div>
    `).join('');
  },

  /**
   * Group transactions by date
   * @param {Array} transactions
   * @returns {Object}
   */
  groupByDate(transactions) {
    return transactions.reduce((groups, tx) => {
      const date = (tx.date || tx.created_at || '').split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
      return groups;
    }, {});
  },

  /**
   * Get transaction icon
   * @param {Object} tx
   * @returns {string}
   */
  getIcon(tx) {
    if (tx.type === 'transfer') return '🔄';
    if (tx.type === 'income') {
      if (tx.income_type === 'passive') return '💎';
      if (tx.income_type === 'portfolio') return '📈';
      return '💵';
    }
    // Expense - use category icon if available
    return tx.category?.icon || tx.category_icon || '💸';
  },

  /**
   * Get background color for icon
   * @param {string} type
   * @returns {string}
   */
  getBgColor(type) {
    const colors = {
      income: 'bg-green-100 dark:bg-green-900/30',
      expense: 'bg-red-100 dark:bg-red-900/30',
      transfer: 'bg-blue-100 dark:bg-blue-900/30'
    };
    return colors[type] || colors.expense;
  },

  /**
   * Get amount color
   * @param {string} type
   * @returns {string}
   */
  getAmountColor(type) {
    const colors = {
      income: 'text-green-500',
      expense: 'text-red-500',
      transfer: 'text-blue-500'
    };
    return colors[type] || colors.expense;
  },

  /**
   * Get income type label
   * @param {string} type
   * @returns {string}
   */
  getIncomeTypeLabel(type) {
    const labels = {
      passive: 'Passive',
      portfolio: 'Portfolio',
      active: 'Active'
    };
    return labels[type] || type;
  },

  /**
   * Format date
   * @param {string} dateStr
   * @returns {string}
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  },

  /**
   * Format date header
   * @param {string} dateStr
   * @returns {string}
   */
  formatDateHeader(dateStr) {
    if (!dateStr) return 'Tanggal tidak diketahui';

    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hari Ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';

    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
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
window.TransactionItem = TransactionItem;
