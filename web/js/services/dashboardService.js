var DashboardService = {
  loadDashboard: async function() {
    try {
      var accounts = await AccountService.getAll();
      var categories = await CategoryService.getAll();
      var transactions = await TransactionService.getMonthly();
      var loans = await this.getLoans();
      
      var summary = TransactionService.getSummary(transactions);
      var totalBalance = 0;
      for (var i = 0; i < accounts.length; i++) {
        if (!accounts[i].is_excluded_from_total) {
          totalBalance += parseFloat(accounts[i].current_balance) || 0;
        }
      }
      
      var passiveExpense = 0;
      for (var j = 0; j < loans.length; j++) {
        passiveExpense += parseFloat(loans[j].monthly_payment) || 0;
      }
      
      var healthScore = this.calculateHealthScore(summary.income, summary.expense, summary.passiveIncome, passiveExpense, totalBalance);
      var status = this.getKiyosakiStatus(summary.passiveIncome, summary.expense);
      
      return {
        accounts: accounts,
        categories: categories,
        transactions: transactions,
        loans: loans,
        summary: {
          income: summary.income,
          expense: summary.expense,
          passiveIncome: summary.passiveIncome,
          net: summary.net,
          totalBalance: totalBalance,
          passiveExpense: passiveExpense
        },
        healthScore: healthScore,
        status: status
      };
    } catch (error) {
      console.error('[DashboardService.loadDashboard]', error);
      throw error;
    }
  },
  
  getLoans: async function() {
    try {
      var userId = BaseService.getUserId();
      if (!userId) return [];
      
      var result = await BaseService.getClient()
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.warn('[DashboardService.getLoans]', error);
      return [];
    }
  },
  
  calculateHealthScore: function(income, expense, passiveIncome, passiveExpense, totalBalance) {
    var score = 0;
    
    if (income > 0) {
      var dsr = passiveExpense / income;
      if (dsr < 0.3) score += 25;
      else if (dsr < 0.5) score += 15;
      else score += 5;
      
      var savingsRate = (income - expense) / income;
      if (savingsRate >= 0.2) score += 25;
      else if (savingsRate >= 0.1) score += 15;
      else if (savingsRate > 0) score += 10;
      
      var ratio = passiveIncome / income;
      if (ratio >= 0.5) score += 25;
      else if (ratio >= 0.2) score += 15;
      else if (ratio > 0) score += 10;
      else score += 5;
    } else {
      score += 30;
    }
    
    if (expense > 0) {
      if (totalBalance >= expense * 3) score += 25;
      else if (totalBalance >= expense * 2) score += 20;
      else if (totalBalance >= expense) score += 15;
      else if (totalBalance > 0) score += 10;
    } else {
      score += 15;
    }
    
    var grade;
    if (score >= 80) grade = 'A';
    else if (score >= 60) grade = 'B';
    else if (score >= 40) grade = 'C';
    else if (score >= 20) grade = 'D';
    else grade = 'E';
    
    return { score: score, grade: grade };
  },
  
  getKiyosakiStatus: function(passiveIncome, expense) {
    if (passiveIncome >= expense && expense > 0) {
      return { status: 'FREEDOM', label: 'Financial Freedom! 🎉', color: 'green' };
    }
    if (passiveIncome >= expense * 0.5) {
      return { status: 'ALMOST', label: 'Hampir Freedom', color: 'blue' };
    }
    if (passiveIncome > 0) {
      return { status: 'PROGRESS', label: 'Dalam Progress', color: 'yellow' };
    }
    return { status: 'START', label: 'Mulai Bangun Aset', color: 'gray' };
  }
};

window.DashboardService = DashboardService;
console.log('✅ DashboardService loaded (object literal)');
