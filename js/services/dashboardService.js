/**
 * Dashboard Service
 * Mengelola data dan kalkulasi untuk dashboard
 */

const DashboardService = {

  /**
   * Load semua data dashboard
   * @param {boolean} forceRefresh - Skip cache
   * @returns {Promise<Object>}
   */
  async loadDashboard(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = AppStore.getCache('dashboard');
      if (cached) {
        return cached;
      }
    }

    AppStore.setLoading(true);

    try {
      // Load all data in parallel
      const [accounts, categories, transactions, loans, items] = await Promise.all([
        window.AccountService?.getAll(forceRefresh) || [],
        window.CategoryService?.getAll(forceRefresh) || [],
        window.TransactionService?.getMonthly() || [],
        this.getLoans() || [],
        this.getItems() || []
      ]);

      // Calculate dashboard metrics
      const dashboardData = this.calculateMetrics(accounts, transactions, loans, items);

      // Update store
      AppStore.setDashboard(dashboardData);
      AppStore.setLoans(loans);
      AppStore.setItems(items);

      return dashboardData;
    } catch (error) {
      ErrorHandler.handle(error, 'DashboardService.loadDashboard');
      throw error;
    } finally {
      AppStore.setLoading(false);
    }
  },

  /**
   * Calculate all dashboard metrics
   * @param {Array} accounts
   * @param {Array} transactions
   * @param {Array} loans
   * @param {Array} items
   * @returns {Object}
   */
  calculateMetrics(accounts, transactions, loans, items) {
    // Total balance
    const totalBalance = accounts.reduce((sum, acc) => {
      return sum + Validator.currency(acc.current_balance, 0);
    }, 0);

    // Monthly income/expense
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let activeIncome = 0;
    let passiveIncome = 0;
    let portfolioIncome = 0;

    transactions.forEach(tx => {
      const amount = Validator.currency(tx.amount, 0);

      if (tx.type === 'income') {
        monthlyIncome += amount;

        if (tx.income_type === 'passive') {
          passiveIncome += amount;
        } else if (tx.income_type === 'portfolio') {
          portfolioIncome += amount;
        } else {
          activeIncome += amount;
        }
      } else if (tx.type === 'expense') {
        monthlyExpense += amount;
      }
    });

    // Passive expense from loans
    const passiveExpense = loans
      .filter(l => l.status === 'active')
      .reduce((sum, l) => sum + Validator.currency(l.monthly_payment, 0), 0);

    // Kiyosaki status
    const kiyosakiStatus = Formatter.kiyosakiStatus(passiveIncome, passiveExpense);

    // Health score
    const healthScore = this.calculateHealthScore({
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      passiveIncome,
      passiveExpense,
      activeIncome,
      loans,
      items
    });

    // Recent transactions (last 5)
    const recentTransactions = transactions.slice(0, 5);

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      netCashflow: monthlyIncome - monthlyExpense,
      activeIncome,
      passiveIncome,
      portfolioIncome,
      passiveExpense,
      kiyosakiStatus,
      healthScore: healthScore.score,
      healthScoreDetails: healthScore,
      recentTransactions,
      accountCount: accounts.length,
      transactionCount: transactions.length,
      loanCount: loans.filter(l => l.status === 'active').length,
      assetCount: items.filter(i => i.type === 'asset').length
    };
  },

  /**
   * Calculate financial health score (0-100)
   * @param {Object} data
   * @returns {Object}
   */
  calculateHealthScore(data) {
    const {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      passiveIncome,
      passiveExpense,
      activeIncome,
      loans,
      items
    } = data;

    let score = 50; // Base score
    const factors = [];

    // Factor 1: Positive balance (+10)
    if (totalBalance > 0) {
      score += 10;
      factors.push({ name: 'Saldo positif', impact: '+10', positive: true });
    } else if (totalBalance < 0) {
      score -= 15;
      factors.push({ name: 'Saldo negatif', impact: '-15', positive: false });
    }

    // Factor 2: Positive cashflow (+15)
    const netCashflow = monthlyIncome - monthlyExpense;
    if (netCashflow > 0) {
      score += 15;
      factors.push({ name: 'Arus kas positif', impact: '+15', positive: true });
    } else if (netCashflow < 0) {
      score -= 20;
      factors.push({ name: 'Arus kas negatif', impact: '-20', positive: false });
    }

    // Factor 3: Savings rate (expense < 50% income) (+10)
    if (monthlyIncome > 0) {
      const expenseRatio = monthlyExpense / monthlyIncome;
      if (expenseRatio < 0.5) {
        score += 10;
        factors.push({ name: 'Rasio pengeluaran < 50%', impact: '+10', positive: true });
      } else if (expenseRatio > 0.9) {
        score -= 10;
        factors.push({ name: 'Rasio pengeluaran > 90%', impact: '-10', positive: false });
      }
    }

    // Factor 4: Has passive income (+15)
    if (passiveIncome > 0) {
      score += 15;
      factors.push({ name: 'Ada passive income', impact: '+15', positive: true });
    }

    // Factor 5: Passive income > passive expense (+10)
    if (passiveIncome > passiveExpense && passiveExpense > 0) {
      score += 10;
      factors.push({ name: 'Passive income > pengeluaran pasif', impact: '+10', positive: true });
    }

    // Factor 6: Diversified income sources (+5)
    const incomeTypes = [activeIncome > 0, passiveIncome > 0, data.portfolioIncome > 0].filter(Boolean).length;
    if (incomeTypes >= 2) {
      score += 5;
      factors.push({ name: 'Income terdiversifikasi', impact: '+5', positive: true });
    }

    // Factor 7: Emergency fund (3x monthly expense in balance) (+10)
    if (monthlyExpense > 0 && totalBalance >= monthlyExpense * 3) {
      score += 10;
      factors.push({ name: 'Dana darurat 3 bulan', impact: '+10', positive: true });
    }

    // Factor 8: Has productive assets (+5)
    const productiveAssets = items.filter(i => i.type === 'asset');
    if (productiveAssets.length > 0) {
      score += 5;
      factors.push({ name: 'Memiliki aset produktif', impact: '+5', positive: true });
    }

    // Factor 9: Loan burden (loan payment > 30% income) (-10)
    if (monthlyIncome > 0 && passiveExpense > 0) {
      const loanRatio = passiveExpense / monthlyIncome;
      if (loanRatio > 0.3) {
        score -= 10;
        factors.push({ name: 'Cicilan > 30% income', impact: '-10', positive: false });
      }
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Get grade and details
    const gradeInfo = Formatter.healthScore(score);

    return {
      score,
      ...gradeInfo,
      factors
    };
  },

  /**
   * Get loans from database
   * @returns {Promise<Array>}
   */
  async getLoans() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      const { data, error } = await BaseService.getClient()
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler?.warn?.('Failed to get loans:', error) || console.warn('Failed to get loans:', error);
      return [];
    }
  },

  /**
   * Get items from database
   * @returns {Promise<Array>}
   */
  async getItems() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      const { data, error } = await BaseService.getClient()
        .from('items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler?.warn?.('Failed to get items:', error) || console.warn('Failed to get items:', error);
      return [];
    }
  },

  /**
   * Get budget status for all categories
   * @returns {Promise<Array>}
   */
  async getBudgetStatus() {
    try {
      return await window.CategoryService?.getAllWithBudgetStatus() || [];
    } catch (error) {
      ErrorHandler.warn('Failed to get budget status:', error);
      return [];
    }
  },

  /**
   * Get spending trend for last N months
   * @param {number} months
   * @returns {Promise<Array>}
   */
  async getSpendingTrend(months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = date.toISOString().split('T')[0];
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

      try {
        const summary = await window.TransactionService?.getSummary(startDate, endDate);
        trends.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          income: summary?.totalIncome || 0,
          expense: summary?.totalExpense || 0,
          net: summary?.netCashflow || 0
        });
      } catch (error) {
        trends.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          income: 0,
          expense: 0,
          net: 0
        });
      }
    }

    return trends;
  },

  /**
   * Get category breakdown for current month
   * @returns {Promise<Object>}
   */
  async getCategoryBreakdown() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
      const spending = await window.TransactionService?.getSpendingByCategory(startDate, endDate);
      return spending || [];
    } catch (error) {
      ErrorHandler.warn('Failed to get category breakdown:', error);
      return [];
    }
  },

  /**
   * Get account distribution
   * @returns {Promise<Array>}
   */
  async getAccountDistribution() {
    const accounts = await window.AccountService?.getAll();

    return (accounts || [])
      .filter(a => Validator.currency(a.current_balance, 0) > 0)
      .map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Validator.currency(a.current_balance, 0),
        icon: window.ACCOUNT_TYPE?.[a.type.toUpperCase()]?.icon || '💰'
      }))
      .sort((a, b) => b.balance - a.balance);
  },

  /**
   * Get upcoming loan payments
   * @param {number} days - Days ahead to check
   * @returns {Promise<Array>}
   */
  async getUpcomingPayments(days = 7) {
    const loans = await this.getLoans();
    const activeLoans = loans.filter(l => l.status === 'active');

    // Simple upcoming check based on due_date
    const now = new Date();
    const upcoming = [];

    activeLoans.forEach(loan => {
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
   * Get quick stats summary
   * @returns {Promise<Object>}
   */
  async getQuickStats() {
    const dashboard = AppStore.getDashboard();

    return {
      balance: Formatter.currencyCompact(dashboard.totalBalance || 0),
      income: Formatter.currencyCompact(dashboard.monthlyIncome || 0),
      expense: Formatter.currencyCompact(dashboard.monthlyExpense || 0),
      cashflow: Formatter.currencyCompact(dashboard.netCashflow || 0),
      healthGrade: dashboard.healthScoreDetails?.grade || '-',
      kiyosakiLabel: dashboard.kiyosakiStatus?.label || '-'
    };
  },

  /**
   * Refresh all dashboard data
   * @returns {Promise<Object>}
   */
  async refresh() {
    AppStore.clearCache();
    return this.loadDashboard(true);
  }
};

// Export global
window.DashboardService = DashboardService;
