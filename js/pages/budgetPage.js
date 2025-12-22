/**
 * Budget Page
 * Halaman kelola anggaran per kategori
 */

const BudgetPage = {

  /**
   * Render halaman budget
   * @param {HTMLElement} container
   */
  async render(container) {
    const now = new Date();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    container.innerHTML = `
      <div class="p-4 pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-white">Budget</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">${monthNames[now.getMonth()]} ${now.getFullYear()}</p>
          </div>
          <button onclick="BudgetPage.showAddForm()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            + Set Budget
          </button>
        </div>

        <!-- Summary Card -->
        <div id="budget-summary" class="mb-4">
          ${Loading?.skeleton('card', 1) || '<div class="animate-pulse bg-gray-200 h-32 rounded-xl"></div>'}
        </div>

        <!-- Budget List -->
        <div id="budget-list">
          ${Loading?.skeleton('list', 3) || '<div class="animate-pulse bg-gray-200 h-20 rounded-xl mb-2"></div>'}
        </div>

        <!-- Actions -->
        <div class="mt-4">
          <button onclick="BudgetPage.copyFromPrevious()"
                  class="w-full px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            📋 Copy dari Bulan Lalu
          </button>
        </div>
      </div>
    `;

    await this.loadData();
  },

  /**
   * Load dan render data
   */
  async loadData() {
    try {
      const summary = await BudgetService?.getSummary() || { budgets: [], totalBudget: 0, totalSpent: 0, percentage: 0 };

      document.getElementById('budget-summary').innerHTML = this.renderSummary(summary);
      document.getElementById('budget-list').innerHTML = this.renderList(summary.budgets);

    } catch (error) {
      ErrorHandler?.handle(error, 'BudgetPage.loadData');
    }
  },

  /**
   * Render summary card
   * @param {Object} summary
   * @returns {string} HTML
   */
  renderSummary(summary) {
    const { totalBudget, totalSpent, totalRemaining, percentage, overBudgetCount, warningCount } = summary;

    return `
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <div class="flex justify-between items-start mb-3">
          <div>
            <p class="text-blue-100 text-sm">Total Budget</p>
            <p class="text-2xl font-bold">${Formatter?.currency(totalBudget) || totalBudget}</p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold">${percentage || 0}%</p>
            <p class="text-blue-100 text-xs">terpakai</p>
          </div>
        </div>

        <div class="h-3 bg-white/30 rounded-full overflow-hidden mb-3">
          <div class="h-full bg-white rounded-full transition-all duration-500"
               style="width: ${Math.min(percentage || 0, 100)}%"></div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-blue-100">Terpakai</p>
            <p class="font-semibold">${Formatter?.currency(totalSpent) || totalSpent}</p>
          </div>
          <div class="text-right">
            <p class="text-blue-100">Sisa</p>
            <p class="font-semibold ${(totalRemaining || 0) < 0 ? 'text-red-200' : ''}">${Formatter?.currency(totalRemaining) || totalRemaining}</p>
          </div>
        </div>

        ${(overBudgetCount > 0 || warningCount > 0) ? `
          <div class="mt-3 pt-3 border-t border-white/20 flex gap-4 text-xs">
            ${overBudgetCount > 0 ? `<span class="text-red-200">🔴 ${overBudgetCount} over budget</span>` : ''}
            ${warningCount > 0 ? `<span class="text-yellow-200">🟡 ${warningCount} hampir habis</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Render budget list
   * @param {Array} budgets
   * @returns {string} HTML
   */
  renderList(budgets) {
    if (!budgets || budgets.length === 0) {
      return EmptyState?.render({
        icon: 'chart',
        title: 'Belum ada budget',
        description: 'Atur anggaran untuk kontrol pengeluaran',
        actionText: 'Set Budget Pertama',
        actionHandler: 'BudgetPage.showAddForm()'
      }) || '<p class="text-center text-gray-500 py-8">Belum ada budget</p>';
    }

    const sorted = [...budgets].sort((a, b) => b.percentage - a.percentage);

    return `<div class="space-y-3">${sorted.map(b => this.renderItem(b)).join('')}</div>`;
  },

  /**
   * Render single budget item
   * @param {Object} budget
   * @returns {string} HTML
   */
  renderItem(budget) {
    const { id, categoryName, categoryIcon, budgetAmount, spentAmount, percentage } = budget;
    const remaining = budgetAmount - spentAmount;

    let barColor, statusBg;
    if (percentage >= 100) {
      barColor = 'bg-red-500';
      statusBg = 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    } else if (percentage >= 80) {
      barColor = 'bg-orange-500';
      statusBg = 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
    } else if (percentage >= 50) {
      barColor = 'bg-yellow-500';
      statusBg = 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    } else {
      barColor = 'bg-green-500';
      statusBg = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }

    return `
      <div class="${statusBg} rounded-xl p-4 border cursor-pointer" onclick="BudgetPage.showEditForm('${id}')">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">${categoryIcon || '📁'}</span>
            <span class="font-medium text-gray-800 dark:text-white">${categoryName}</span>
          </div>
          <span class="text-sm font-semibold ${percentage >= 100 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}">
            ${percentage}%
          </span>
        </div>

        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
          <div class="${barColor} h-full rounded-full transition-all duration-300"
               style="width: ${Math.min(percentage, 100)}%"></div>
        </div>

        <div class="flex justify-between text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            ${Formatter?.currencyCompact?.(spentAmount) || spentAmount} / ${Formatter?.currencyCompact?.(budgetAmount) || budgetAmount}
          </span>
          <span class="${remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'}">
            ${remaining < 0 ? 'Over ' : 'Sisa '}${Formatter?.currencyCompact?.(Math.abs(remaining)) || Math.abs(remaining)}
          </span>
        </div>
      </div>
    `;
  },

  /**
   * Show add budget form
   */
  async showAddForm() {
    const categories = await CategoryService?.getByType?.('expense') || (await CategoryService?.getAll() || []).filter(c => c.type === 'expense');
    const existingBudgets = await BudgetService?.getCurrentMonth() || [];
    const existingCategoryIds = existingBudgets.map(b => b.category_id);
    const availableCategories = categories.filter(c => !existingCategoryIds.includes(c.id));

    if (availableCategories.length === 0) {
      Toast?.info('Semua kategori sudah memiliki budget');
      return;
    }

    const html = `
      <form id="budget-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
          <select name="category_id" required class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            <option value="">Pilih kategori</option>
            ${availableCategories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Budget</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
            <input type="text" name="amount" required inputmode="numeric" placeholder="0"
                   class="w-full pl-10 pr-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                   oninput="this.value = this.value.replace(/[^0-9]/g, '')">
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          ${[500000, 1000000, 2000000, 5000000].map(amt => `
            <button type="button" onclick="document.querySelector('[name=amount]').value = '${amt}'"
                    class="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm hover:bg-gray-200">
              ${Formatter?.currencyCompact?.(amt) || amt}
            </button>
          `).join('')}
        </div>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_recurring" value="1" class="w-4 h-4 rounded">
          <span class="text-sm text-gray-700 dark:text-gray-300">Terapkan setiap bulan</span>
        </label>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick="Modal.close()" class="flex-1 px-4 py-2 border rounded-lg">Batal</button>
          <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Simpan</button>
        </div>
      </form>
    `;

    Modal?.show({ title: 'Set Budget', html, showCancel: false, confirmText: '' });

    document.getElementById('budget-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveBudget(new FormData(e.target));
    });
  },

  /**
   * Save budget
   * @param {FormData} formData
   */
  async saveBudget(formData) {
    try {
      const data = {
        category_id: formData.get('category_id'),
        amount: formData.get('amount'),
        is_recurring: formData.get('is_recurring') === '1'
      };

      const result = await BudgetService?.set(data);

      if (result) {
        Modal?.close();
        await this.loadData();
      }
    } catch (error) {
      ErrorHandler?.handle(error, 'BudgetPage.saveBudget');
    }
  },

  /**
   * Show edit form
   * @param {string} id
   */
  async showEditForm(id) {
    const budgets = await BudgetService?.getCurrentMonth() || [];
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;

    const confirmed = await Modal?.confirm(`Hapus budget untuk ${budget.categoryName}?`, 'Hapus Budget');

    if (confirmed) {
      await BudgetService?.delete(id);
      await this.loadData();
    }
  },

  /**
   * Copy budgets dari bulan sebelumnya
   */
  async copyFromPrevious() {
    const confirmed = await Modal?.confirm('Copy semua budget dari bulan sebelumnya?', 'Copy Budget');

    if (confirmed) {
      const now = new Date();
      await BudgetService?.copyFromPreviousMonth(now.getMonth(), now.getFullYear());
      await this.loadData();
    }
  }
};

// Export global
window.BudgetPage = BudgetPage;
