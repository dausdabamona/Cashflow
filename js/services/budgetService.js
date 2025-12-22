/**
 * Budget Service
 * Mengelola anggaran per kategori
 */

const BudgetService = {

  /**
   * Ambil semua budget untuk bulan/tahun tertentu
   * @param {number} month - 0-11
   * @param {number} year
   * @returns {Promise<Array>}
   */
  async getByPeriod(month = null, year = null) {
    try {
      const userId = BaseService.getUserId();
      const client = BaseService.getClient();

      // Default ke bulan/tahun ini
      const now = new Date();
      month = month !== null ? month : now.getMonth();
      year = year !== null ? year : now.getFullYear();

      const response = await client
        .from('budgets')
        .select(`
          *,
          category:categories(id, name, icon, type)
        `)
        .eq('user_id', userId)
        .eq('month', month + 1) // Database 1-12
        .eq('year', year);

      const budgets = BaseService.handleResponse(response, 'BudgetService.getByPeriod') || [];

      // Hitung spent amount untuk setiap budget
      const { startDate, endDate } = BaseService.getMonthRange(month, year);

      const transactions = await TransactionService?.getAll({
        startDate,
        endDate,
        type: 'expense'
      }) || [];

      // Group transactions by category
      const spentByCategory = {};
      transactions.forEach(tx => {
        const catId = tx.category_id;
        spentByCategory[catId] = (spentByCategory[catId] || 0) + Validator.currency(tx.amount, 0);
      });

      // Combine budget dengan spent
      return budgets.map(budget => ({
        ...budget,
        categoryName: budget.category?.name || 'Unknown',
        categoryIcon: budget.category?.icon || '📁',
        budgetAmount: Validator.currency(budget.amount, 0),
        spentAmount: spentByCategory[budget.category_id] || 0,
        percentage: budget.amount > 0
          ? Math.round((spentByCategory[budget.category_id] || 0) / budget.amount * 100)
          : 0
      }));

    } catch (error) {
      ErrorHandler.handle(error, 'BudgetService.getByPeriod', false);
      return [];
    }
  },

  /**
   * Ambil budget bulan ini
   * @returns {Promise<Array>}
   */
  async getCurrentMonth() {
    const now = new Date();
    return this.getByPeriod(now.getMonth(), now.getFullYear());
  },

  /**
   * Set/Update budget untuk kategori
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async set(data) {
    try {
      const userId = BaseService.getUserId();
      const client = BaseService.getClient();

      if (!data.category_id) {
        throw new Error('Kategori wajib dipilih');
      }
      if (!data.amount || Validator.currency(data.amount) <= 0) {
        throw new Error('Jumlah budget harus lebih dari 0');
      }

      const now = new Date();
      const month = data.month !== undefined ? data.month : now.getMonth() + 1;
      const year = data.year !== undefined ? data.year : now.getFullYear();

      const budgetData = {
        user_id: userId,
        category_id: data.category_id,
        amount: Validator.currency(data.amount),
        month: month,
        year: year,
        is_recurring: data.is_recurring || false
      };

      // Upsert - update jika sudah ada, insert jika belum
      const response = await client
        .from('budgets')
        .upsert(budgetData, {
          onConflict: 'user_id,category_id,month,year'
        })
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .single();

      const result = BaseService.handleResponse(response, 'BudgetService.set');

      Toast?.success('Budget berhasil disimpan!');

      return result;

    } catch (error) {
      ErrorHandler.handle(error, 'BudgetService.set');
      return null;
    }
  },

  /**
   * Hapus budget
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const client = BaseService.getClient();

      const response = await client
        .from('budgets')
        .delete()
        .eq('id', id);

      BaseService.handleResponse(response, 'BudgetService.delete');

      Toast?.success('Budget dihapus');
      return true;

    } catch (error) {
      ErrorHandler.handle(error, 'BudgetService.delete');
      return false;
    }
  },

  /**
   * Copy budget dari bulan sebelumnya
   * @param {number} toMonth - 0-11
   * @param {number} toYear
   * @returns {Promise<Array>}
   */
  async copyFromPreviousMonth(toMonth, toYear) {
    try {
      // Hitung bulan sebelumnya
      let fromMonth = toMonth - 1;
      let fromYear = toYear;
      if (fromMonth < 0) {
        fromMonth = 11;
        fromYear = toYear - 1;
      }

      const previousBudgets = await this.getByPeriod(fromMonth, fromYear);

      if (previousBudgets.length === 0) {
        Toast?.warning('Tidak ada budget di bulan sebelumnya');
        return [];
      }

      const created = [];

      for (const budget of previousBudgets) {
        const result = await this.set({
          category_id: budget.category_id,
          amount: budget.budgetAmount,
          month: toMonth + 1,
          year: toYear,
          is_recurring: true
        });

        if (result) created.push(result);
      }

      Toast?.success(`${created.length} budget berhasil dicopy`);

      return created;

    } catch (error) {
      ErrorHandler.handle(error, 'BudgetService.copyFromPreviousMonth');
      return [];
    }
  },

  /**
   * Cek budget saat transaksi (untuk warning)
   * @param {string} categoryId
   * @param {number} amount - Jumlah transaksi baru
   * @returns {Promise<Object|null>} warning jika ada
   */
  async checkBudget(categoryId, amount) {
    try {
      const budgets = await this.getCurrentMonth();
      const budget = budgets.find(b => b.category_id === categoryId);

      if (!budget) return null;

      const newSpent = budget.spentAmount + Validator.currency(amount, 0);
      const newPercentage = Math.round((newSpent / budget.budgetAmount) * 100);

      if (newPercentage >= 100) {
        return {
          type: 'danger',
          message: `Budget ${budget.categoryName} sudah habis! (${newPercentage}%)`,
          budget: budget.budgetAmount,
          spent: newSpent,
          percentage: newPercentage
        };
      } else if (newPercentage >= 80) {
        return {
          type: 'warning',
          message: `Budget ${budget.categoryName} hampir habis (${newPercentage}%)`,
          budget: budget.budgetAmount,
          spent: newSpent,
          percentage: newPercentage,
          remaining: budget.budgetAmount - newSpent
        };
      }

      return null;

    } catch (error) {
      ErrorHandler.log('WARN', 'checkBudget error', error);
      return null;
    }
  },

  /**
   * Get budget summary
   * @returns {Promise<Object>}
   */
  async getSummary() {
    const budgets = await this.getCurrentMonth();

    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const overBudgetCount = budgets.filter(b => b.percentage >= 100).length;
    const warningCount = budgets.filter(b => b.percentage >= 80 && b.percentage < 100).length;

    return {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
      percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      categoriesCount: budgets.length,
      overBudgetCount,
      warningCount,
      budgets
    };
  }
};

// Export global
window.BudgetService = BudgetService;
