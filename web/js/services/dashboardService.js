/**
 * Dashboard Service
 * File: js/services/dashboardService.js
 * Handles dashboard data loading and aggregation
 *
 * FIX ERROR 2: Uses BaseService.getClient() instead of window.supabase
 */
const DashboardService = {

  /**
   * Load all dashboard data
   * @returns {Promise<Object>} Dashboard data object
   */
  async loadDashboard() {
    try {
      // Gunakan BaseService.getClient() bukan window.supabase
      const [accounts, categories, transactions, loans, items] = await Promise.all([
        AccountService.getAll(),
        CategoryService.getAll(),
        TransactionService.getMonthly(),
        this.getLoans(),
        this.getItems()
      ]);

      // Calculate summaries
      const totalBalance = accounts
        .filter(a => !a.is_excluded_from_total)
        .reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0);

      const monthlyIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const monthlyExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      // Group expenses by category
      const expenseByCategory = this.groupByCategory(
        transactions.filter(t => t.type === 'expense'),
        categories.filter(c => c.type === 'expense')
      );

      return {
        accounts,
        categories,
        transactions,
        loans,
        items,
        summary: {
          totalBalance,
          monthlyIncome,
          monthlyExpense,
          monthlyBalance: monthlyIncome - monthlyExpense
        },
        expenseByCategory,
        recentTransactions: transactions.slice(0, 5)
      };

    } catch (error) {
      console.error('[DashboardService.loadDashboard]', error);
      throw error;
    }
  },

  /**
   * Get all loans for current user
   * FIX: Uses BaseService.getClient() instead of window.supabase
   * @returns {Promise<Array>} Array of loan objects
   */
  async getLoans() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      // PERBAIKAN: Gunakan BaseService.getClient()
      const { data, error } = await BaseService.getClient()
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.warn('[DashboardService.getLoans]', error);
      return [];
    }
  },

  /**
   * Get all items/assets for current user
   * FIX: Uses BaseService.getClient() instead of window.supabase
   * @returns {Promise<Array>} Array of item objects
   */
  async getItems() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      // PERBAIKAN: Gunakan BaseService.getClient()
      const { data, error } = await BaseService.getClient()
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.warn('[DashboardService.getItems]', error);
      return [];
    }
  },

  /**
   * Group transactions by category
   * @param {Array} transactions - Transactions to group
   * @param {Array} categories - Available categories
   * @returns {Array} Grouped data with totals
   */
  groupByCategory(transactions, categories) {
    const categoryMap = new Map();

    transactions.forEach(tx => {
      const categoryId = tx.category_id;
      if (!categoryId) return;

      if (!categoryMap.has(categoryId)) {
        const category = categories.find(c => c.id === categoryId) || {
          id: categoryId,
          name: 'Uncategorized',
          icon: 'help-circle'
        };
        categoryMap.set(categoryId, {
          ...category,
          total: 0,
          count: 0
        });
      }

      const entry = categoryMap.get(categoryId);
      entry.total += parseFloat(tx.amount) || 0;
      entry.count += 1;
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total);
  },

  /**
   * Get monthly trend data
   * @param {number} months - Number of months to fetch
   * @returns {Promise<Array>} Monthly trend data
   */
  async getMonthlyTrend(months = 6) {
    try {
      const trends = [];
      const now = new Date();

      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const transactions = await TransactionService.getAll({
          startDate,
          endDate
        });

        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const expense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        trends.unshift({
          month,
          year,
          label: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          income,
          expense,
          balance: income - expense
        });
      }

      return trends;

    } catch (error) {
      console.error('[DashboardService.getMonthlyTrend]', error);
      return [];
    }
  },

  /**
   * Get quick stats for dashboard widgets
   * @returns {Promise<Object>} Quick stats object
   */
  async getQuickStats() {
    try {
      const [totalBalance, monthlyData] = await Promise.all([
        AccountService.getTotalBalance(),
        TransactionService.getMonthly()
      ]);

      const monthlyIncome = monthlyData
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const monthlyExpense = monthlyData
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      return {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        monthlyBalance: monthlyIncome - monthlyExpense,
        transactionCount: monthlyData.length
      };

    } catch (error) {
      console.error('[DashboardService.getQuickStats]', error);
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlyBalance: 0,
        transactionCount: 0
      };
    }
  }
};

// Export ke window
window.DashboardService = DashboardService;

console.log('✅ DashboardService loaded');
