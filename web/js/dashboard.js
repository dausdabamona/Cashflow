/**
 * Dashboard Module
 * File: web/js/dashboard.js
 */
const Dashboard = {
  /**
   * Initialize dashboard
   */
  async init() {
    console.log('[Dashboard] Initializing...');

    try {
      Loading.show('Memuat dashboard...');
      await this.loadData();
      Loading.hide();
    } catch (error) {
      Loading.hide();
      ErrorHandler.handle(error, 'Dashboard.init');
    }
  },

  /**
   * Load dashboard data
   */
  async loadData() {
    try {
      const data = await DashboardService.loadDashboard();

      // Update store
      AppStore.setState({
        accounts: data.accounts,
        categories: data.categories,
        transactions: data.transactions
      });

      // Render dashboard
      this.render(data);

    } catch (error) {
      console.error('[Dashboard.loadData]', error);
      throw error;
    }
  },

  /**
   * Render dashboard
   * @param {Object} data - Dashboard data
   */
  render(data) {
    const container = document.getElementById('dashboard-content');
    if (!container) {
      console.warn('[Dashboard] Container not found');
      return;
    }

    const { summary, accounts, recentTransactions, expenseByCategory } = data;

    container.innerHTML = `
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card summary-card">
          <div class="card-icon bg-blue">💰</div>
          <div class="card-content">
            <p class="card-label">Total Saldo</p>
            <p class="card-value">${Formatter.currency(summary.totalBalance)}</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon bg-green">📈</div>
          <div class="card-content">
            <p class="card-label">Pemasukan Bulan Ini</p>
            <p class="card-value text-green">${Formatter.currency(summary.monthlyIncome)}</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon bg-red">📉</div>
          <div class="card-content">
            <p class="card-label">Pengeluaran Bulan Ini</p>
            <p class="card-value text-red">${Formatter.currency(summary.monthlyExpense)}</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon bg-purple">💵</div>
          <div class="card-content">
            <p class="card-label">Sisa Bulan Ini</p>
            <p class="card-value ${summary.monthlyBalance >= 0 ? 'text-green' : 'text-red'}">
              ${Formatter.currency(summary.monthlyBalance)}
            </p>
          </div>
        </div>
      </div>

      <!-- Accounts Section -->
      <div class="section">
        <h2 class="section-title">Akun</h2>
        <div class="accounts-grid">
          ${accounts.length ? accounts.map(acc => `
            <div class="card account-card">
              <div class="account-icon">${acc.icon || '🏦'}</div>
              <div class="account-info">
                <p class="account-name">${acc.name}</p>
                <p class="account-balance">${Formatter.currency(acc.current_balance)}</p>
              </div>
            </div>
          `).join('') : '<p class="empty-state">Belum ada akun</p>'}
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="section">
        <h2 class="section-title">Transaksi Terakhir</h2>
        <div class="transactions-list">
          ${recentTransactions.length ? recentTransactions.map(tx => `
            <div class="transaction-item">
              <div class="transaction-icon ${tx.type}">${tx.category?.icon || (tx.type === 'income' ? '💵' : '💸')}</div>
              <div class="transaction-info">
                <p class="transaction-desc">${tx.description || tx.category?.name || 'Transaksi'}</p>
                <p class="transaction-meta">${Formatter.date(tx.date)} • ${tx.account?.name || '-'}</p>
              </div>
              <p class="transaction-amount ${tx.type}">
                ${tx.type === 'income' ? '+' : '-'}${Formatter.currency(tx.amount)}
              </p>
            </div>
          `).join('') : '<p class="empty-state">Belum ada transaksi</p>'}
        </div>
      </div>
    `;
  },

  /**
   * Refresh dashboard data
   */
  async refresh() {
    await this.loadData();
    Toast.success('Dashboard diperbarui');
  }
};

window.Dashboard = Dashboard;

console.log('✅ Dashboard loaded');
