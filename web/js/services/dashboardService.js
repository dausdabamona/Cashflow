const DashboardService = {
  async loadDashboard() {
    try {
      const [accounts, categories, transactions, loans] = await Promise.all([
        AccountService.getAll(),
        CategoryService.getAll(),
        TransactionService.getMonthly(),
        this.getLoans()
      ]);

      const summary = TransactionService.getSummary(transactions);
      const totalBalance = accounts
        .filter(a => !a.is_excluded_from_total)
        .reduce((sum, a) => sum + parseFloat(a.current_balance || 0), 0);

      const passiveExpense = loans.reduce((sum, l) => sum + parseFloat(l.monthly_payment || 0), 0);
      const healthScore = this.calculateHealthScore(summary.income, summary.expense, summary.passiveIncome, passiveExpense, totalBalance);
      const status = this.getKiyosakiStatus(summary.passiveIncome, summary.expense);

      return {
        accounts, categories, transactions, loans,
        summary: { ...summary, totalBalance, passiveExpense },
        healthScore, status
      };
    } catch (error) {
      console.error('[DashboardService.loadDashboard]', error);
      throw error;
    }
  },

  async getLoans() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      const { data, error } = await BaseService.getClient()
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('[DashboardService.getLoans]', error);
      return [];
    }
  },

  calculateHealthScore(income, expense, passiveIncome, passiveExpense, totalBalance) {
    let score = 0;

    if (income > 0) {
      const dsr = passiveExpense / income;
      score += dsr < 0.3 ? 25 : dsr < 0.5 ? 15 : 5;
      const savingsRate = (income - expense) / income;
      score += savingsRate >= 0.2 ? 25 : savingsRate >= 0.1 ? 15 : savingsRate > 0 ? 10 : 0;
      const ratio = passiveIncome / income;
      score += ratio >= 0.5 ? 25 : ratio >= 0.2 ? 15 : ratio > 0 ? 10 : 5;
    } else {
      score += 30;
    }

    if (expense > 0) {
      score += totalBalance >= expense * 3 ? 25 : totalBalance >= expense * 2 ? 20 : totalBalance >= expense ? 15 : totalBalance > 0 ? 10 : 0;
    } else {
      score += 15;
    }

    return { score, grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'E' };
  },

  getKiyosakiStatus(passiveIncome, expense) {
    if (passiveIncome >= expense) return { status: 'FREEDOM', label: 'Financial Freedom! 🎉', color: 'green' };
    if (passiveIncome >= expense * 0.5) return { status: 'ALMOST', label: 'Hampir Freedom', color: 'blue' };
    if (passiveIncome > 0) return { status: 'PROGRESS', label: 'Dalam Progress', color: 'yellow' };
    return { status: 'START', label: 'Mulai Passive Income', color: 'red' };
  }
};

window.DashboardService = DashboardService;
console.log('✅ DashboardService loaded');
