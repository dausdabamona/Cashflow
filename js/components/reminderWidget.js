/**
 * Reminder Widget Component
 * Bill reminders and upcoming payments
 */

const ReminderWidget = {
  /**
   * Render reminder list
   * @param {Array} loans - Active loans with due dates
   * @returns {string}
   */
  render(loans = []) {
    const upcomingPayments = this.getUpcomingPayments(loans);

    if (!upcomingPayments.length) {
      return this.renderEmpty();
    }

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Tagihan Mendatang</h3>
          <span class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
            ${upcomingPayments.length} tagihan
          </span>
        </div>
        <div class="space-y-3">
          ${upcomingPayments.slice(0, 5).map(item => this.renderItem(item)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render single reminder item
   * @param {Object} item
   * @returns {string}
   */
  renderItem(item) {
    const urgency = this.getUrgency(item.daysUntilDue);

    return `
      <div class="flex items-center gap-3 p-3 ${urgency.bgColor} rounded-lg">
        <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
          <span class="text-lg">${item.icon || '💳'}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-white truncate">${item.name}</div>
          <div class="text-xs ${urgency.textColor}">
            ${this.getDueText(item.daysUntilDue)}
          </div>
        </div>
        <div class="text-right">
          <div class="font-semibold text-gray-900 dark:text-white">
            ${Formatter?.currency(item.monthly_payment) || this.formatCurrency(item.monthly_payment)}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render compact reminder (for notification badge)
   * @param {Array} loans
   * @returns {string}
   */
  renderBadge(loans = []) {
    const upcomingPayments = this.getUpcomingPayments(loans, 7);

    if (!upcomingPayments.length) return '';

    const urgentCount = upcomingPayments.filter(p => p.daysUntilDue <= 3).length;

    return `
      <div class="relative">
        <span class="text-xl">🔔</span>
        ${urgentCount > 0 ? `
          <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            ${urgentCount}
          </span>
        ` : ''}
      </div>
    `;
  },

  /**
   * Render reminder summary
   * @param {Array} loans
   * @returns {string}
   */
  renderSummary(loans = []) {
    const upcomingPayments = this.getUpcomingPayments(loans, 30);

    if (!upcomingPayments.length) {
      return '';
    }

    const totalAmount = upcomingPayments.reduce((sum, p) => {
      return sum + (Validator?.currency(p.monthly_payment, 0) || parseFloat(p.monthly_payment) || 0);
    }, 0);

    const urgentPayments = upcomingPayments.filter(p => p.daysUntilDue <= 7);

    return `
      <div class="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white shadow-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm opacity-90">Tagihan Bulan Ini</span>
          <span class="text-xl">📅</span>
        </div>
        <div class="text-2xl font-bold mb-1">
          ${Formatter?.currency(totalAmount) || this.formatCurrency(totalAmount)}
        </div>
        <div class="text-xs opacity-75">
          ${upcomingPayments.length} tagihan
          ${urgentPayments.length > 0 ? `• ${urgentPayments.length} dalam 7 hari` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render empty state
   * @returns {string}
   */
  renderEmpty() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Tagihan Mendatang</h3>
        </div>
        <div class="text-center py-4">
          <div class="text-3xl mb-2">✅</div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Tidak ada tagihan mendatang</p>
        </div>
      </div>
    `;
  },

  /**
   * Get upcoming payments from loans
   * @param {Array} loans
   * @param {number} days
   * @returns {Array}
   */
  getUpcomingPayments(loans = [], days = 14) {
    const now = new Date();
    const upcoming = [];

    loans
      .filter(l => l.status === 'active')
      .forEach(loan => {
        if (loan.due_date) {
          const dueDay = parseInt(loan.due_date);
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay);
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);

          const diffThis = Math.ceil((thisMonth - now) / (1000 * 60 * 60 * 24));
          const diffNext = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));

          if (diffThis > 0 && diffThis <= days) {
            upcoming.push({
              ...loan,
              daysUntilDue: diffThis,
              dueDate: thisMonth
            });
          } else if (diffNext > 0 && diffNext <= days) {
            upcoming.push({
              ...loan,
              daysUntilDue: diffNext,
              dueDate: nextMonth
            });
          }
        }
      });

    return upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  },

  /**
   * Get urgency styling based on days until due
   * @param {number} days
   * @returns {Object}
   */
  getUrgency(days) {
    if (days <= 1) {
      return {
        level: 'critical',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        textColor: 'text-red-600 dark:text-red-400'
      };
    }
    if (days <= 3) {
      return {
        level: 'urgent',
        bgColor: 'bg-orange-50 dark:bg-orange-900/30',
        textColor: 'text-orange-600 dark:text-orange-400'
      };
    }
    if (days <= 7) {
      return {
        level: 'warning',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
        textColor: 'text-yellow-600 dark:text-yellow-400'
      };
    }
    return {
      level: 'normal',
      bgColor: 'bg-gray-50 dark:bg-gray-700',
      textColor: 'text-gray-500 dark:text-gray-400'
    };
  },

  /**
   * Get due text based on days
   * @param {number} days
   * @returns {string}
   */
  getDueText(days) {
    if (days === 0) return 'Jatuh tempo hari ini!';
    if (days === 1) return 'Jatuh tempo besok';
    if (days <= 7) return `${days} hari lagi`;
    return `${days} hari lagi`;
  },

  /**
   * Format currency fallback
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
window.ReminderWidget = ReminderWidget;
