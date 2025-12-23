/**
 * Dashboard Service
 * @type {Object}
 */
var DashboardService = {

  loadDashboard: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      Promise.all([
        AccountService.getAll(),
        CategoryService.getAll(),
        TransactionService.getMonthly(),
        self.getLoans()
      ]).then(function(results) {
        var accounts = results[0];
        var categories = results[1];
        var transactions = results[2];
        var loans = results[3];

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

        var healthScore = self.calculateHealthScore(
          summary.income,
          summary.expense,
          summary.passiveIncome,
          passiveExpense,
          totalBalance
        );

        var status = self.getKiyosakiStatus(summary.passiveIncome, summary.expense);

        resolve({
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
        });

      }).catch(function(error) {
        console.error('[DashboardService.loadDashboard]', error);
        reject(error);
      });
    });
  },

  getLoans: function() {
    return new Promise(function(resolve) {
      var userId = BaseService.getUserId();
      var client = BaseService.getClient();

      if (!client || !userId) {
        resolve([]);
        return;
      }

      client
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .then(function(response) {
          resolve(response.error ? [] : (response.data || []));
        })
        .catch(function() {
          resolve([]);
        });
    });
  },

  calculateHealthScore: function(income, expense, passiveIncome, passiveExpense, totalBalance) {
    var score = 0;

    // DSR (25 points)
    if (income > 0) {
      var dsr = passiveExpense / income;
      if (dsr < 0.3) score += 25;
      else if (dsr < 0.5) score += 15;
      else score += 5;
    } else {
      score += 10;
    }

    // Savings Rate (25 points)
    if (income > 0) {
      var savingsRate = (income - expense) / income;
      if (savingsRate >= 0.2) score += 25;
      else if (savingsRate >= 0.1) score += 15;
      else if (savingsRate > 0) score += 10;
    } else {
      score += 10;
    }

    // Passive Income Ratio (25 points)
    if (income > 0) {
      var ratio = passiveIncome / income;
      if (ratio >= 0.5) score += 25;
      else if (ratio >= 0.2) score += 15;
      else if (ratio > 0) score += 10;
      else score += 5;
    } else {
      score += 10;
    }

    // Emergency Fund (25 points)
    if (expense > 0) {
      if (totalBalance >= expense * 3) score += 25;
      else if (totalBalance >= expense * 2) score += 20;
      else if (totalBalance >= expense) score += 15;
      else if (totalBalance > 0) score += 10;
    } else {
      score += 15;
    }

    var grade = 'E';
    if (score >= 80) grade = 'A';
    else if (score >= 60) grade = 'B';
    else if (score >= 40) grade = 'C';
    else if (score >= 20) grade = 'D';

    return { score: score, grade: grade };
  },

  getKiyosakiStatus: function(passiveIncome, expense) {
    if (expense > 0 && passiveIncome >= expense) {
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

// Export to window
window.DashboardService = DashboardService;
console.log('✅ DashboardService loaded successfully');
