/**
 * Budget Widget Component
 * Budget progress visualization
 */

const BudgetWidget = {
  /**
   * Render budget progress list
   * @param {Array} categories - Categories with budget data
   * @returns {string}
   */
  render(categories = []) {
    const budgetCategories = categories.filter(c => c.budget && c.budget > 0);

    if (!budgetCategories.length) {
      return this.renderEmpty();
    }

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Bulan Ini</h3>
          <a href="#" onclick="showBudgetPage(); return false;" class="text-blue-500 hover:text-blue-600 text-xs">
            Lihat Semua
          </a>
        </div>
        <div class="space-y-3">
          ${budgetCategories.slice(0, 5).map(cat => this.renderItem(cat)).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Render single budget item
   * @param {Object} category
   * @returns {string}
   */
  renderItem(category) {
    const budget = Validator?.currency(category.budget, 0) || parseFloat(category.budget) || 0;
    const spent = Validator?.currency(category.spent, 0) || parseFloat(category.spent) || 0;
    const remaining = budget - spent;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

    const status = this.getStatus(percentage);

    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">${category.icon || '📁'}</span>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${category.name}</span>
          </div>
          <span class="text-xs ${status.textColor}">${percentage.toFixed(0)}%</span>
        </div>

        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full ${status.bgColor} rounded-full transition-all duration-300"
               style="width: ${percentage}%"></div>
        </div>

        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>${Formatter?.currencyCompact(spent) || this.formatCompact(spent)} terpakai</span>
          <span>Sisa: ${Formatter?.currencyCompact(remaining) || this.formatCompact(remaining)}</span>
        </div>
      </div>
    `;
  },

  /**
   * Render compact budget progress (single line)
   * @param {Object} category
   * @returns {string}
   */
  renderCompact(category) {
    const budget = Validator?.currency(category.budget, 0) || parseFloat(category.budget) || 0;
    const spent = Validator?.currency(category.spent, 0) || parseFloat(category.spent) || 0;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const status = this.getStatus(percentage);

    return `
      <div class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <span>${category.icon || '📁'}</span>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full ${status.bgColor} rounded-full" style="width: ${percentage}%"></div>
            </div>
            <span class="text-xs ${status.textColor} w-10 text-right">${percentage.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render budget summary card
   * @param {Array} categories
   * @returns {string}
   */
  renderSummary(categories = []) {
    const budgetCategories = categories.filter(c => c.budget && c.budget > 0);

    if (!budgetCategories.length) {
      return '';
    }

    const totalBudget = budgetCategories.reduce((sum, c) => sum + (Validator?.currency(c.budget, 0) || 0), 0);
    const totalSpent = budgetCategories.reduce((sum, c) => sum + (Validator?.currency(c.spent, 0) || 0), 0);
    const overBudget = budgetCategories.filter(c => {
      const budget = Validator?.currency(c.budget, 0) || 0;
      const spent = Validator?.currency(c.spent, 0) || 0;
      return spent > budget;
    }).length;

    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const status = this.getStatus(percentage);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-gray-500 dark:text-gray-400">Budget Overview</span>
          <span class="text-xl">📊</span>
        </div>

        <div class="mb-3">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full ${status.bgColor} rounded-full transition-all duration-500"
                 style="width: ${Math.min(percentage, 100)}%"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div class="text-gray-500 dark:text-gray-400">Terpakai</div>
            <div class="font-semibold ${status.textColor}">
              ${Formatter?.currencyCompact(totalSpent) || this.formatCompact(totalSpent)}
            </div>
          </div>
          <div>
            <div class="text-gray-500 dark:text-gray-400">Total Budget</div>
            <div class="font-semibold text-gray-700 dark:text-gray-300">
              ${Formatter?.currencyCompact(totalBudget) || this.formatCompact(totalBudget)}
            </div>
          </div>
        </div>

        ${overBudget > 0 ? `
          <div class="mt-3 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <span class="text-xs text-red-600 dark:text-red-400">
              ⚠️ ${overBudget} kategori melebihi budget
            </span>
          </div>
        ` : ''}
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
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Bulan Ini</h3>
        </div>
        <div class="text-center py-4">
          <div class="text-3xl mb-2">📊</div>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-3">Belum ada budget</p>
          <button onclick="showCategoryModal()" class="text-sm text-blue-500 hover:text-blue-600">
            Atur Budget
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Get status based on percentage
   * @param {number} percentage
   * @returns {Object}
   */
  getStatus(percentage) {
    if (percentage >= 100) {
      return {
        level: 'over',
        bgColor: 'bg-red-500',
        textColor: 'text-red-500'
      };
    }
    if (percentage >= 80) {
      return {
        level: 'warning',
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-500'
      };
    }
    return {
      level: 'safe',
      bgColor: 'bg-green-500',
      textColor: 'text-green-500'
    };
  },

  /**
   * Format compact currency fallback
   * @param {number} value
   * @returns {string}
   */
  formatCompact(value) {
    if (value >= 1000000000) return `Rp${(value / 1000000000).toFixed(1)}M`;
    if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}jt`;
    if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}rb`;
    return `Rp${value.toFixed(0)}`;
  }
};

// Export global
window.BudgetWidget = BudgetWidget;
