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

    const { summary, accounts, transactions } = data;

    // Get recent transactions (limit 5)
    const recentTransactions = (transactions || []).slice(0, 5);

    container.innerHTML = `
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card summary-card">
          <div class="card-icon bg-blue">💰</div>
          <div class="card-content">
            <p class="card-label">Total Saldo</p>
            <p class="card-value">${Formatter.currency(summary.totalBalance || 0)}</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon bg-green">📈</div>
          <div class="card-content">
            <p class="card-label">Pemasukan Bulan Ini</p>
            <p class="card-value text-green">${Formatter.currency(summary.income || 0)}</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon bg-red">📉</div>
          <div class="card-content">
            <p class="card-label">Pengeluaran Bulan Ini</p>
            <p class="card-value text-red">${Formatter.currency(summary.expense || 0)}</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon bg-purple">💵</div>
          <div class="card-content">
            <p class="card-label">Sisa Bulan Ini</p>
            <p class="card-value ${summary.net >= 0 ? 'text-green' : 'text-red'}">
              ${Formatter.currency(summary.net || 0)}
            </p>
          </div>
        </div>
      </div>

      <!-- Asset & Liability Summary (jika ada items) -->
      ${(summary.totalAssets > 0 || summary.totalLiabilities > 0) ? `
        <div class="card" style="padding: 20px; margin-bottom: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="color: white; font-size: 1.125rem; font-weight: 600;">📊 Ringkasan Aset & Liabilitas</h3>
            <button onclick="Navigation.goTo('items')" style="padding: 8px 16px; background: white; color: #667eea; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
              Lihat Detail →
            </button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
            <div>
              <p style="color: rgba(255,255,255,0.8); font-size: 0.875rem; margin-bottom: 4px;">📈 Total Aset</p>
              <p style="color: white; font-size: 1.5rem; font-weight: 700;">${Formatter.currency(summary.totalAssets)}</p>
            </div>
            <div>
              <p style="color: rgba(255,255,255,0.8); font-size: 0.875rem; margin-bottom: 4px;">📉 Total Liabilitas</p>
              <p style="color: white; font-size: 1.5rem; font-weight: 700;">${Formatter.currency(summary.totalLiabilities)}</p>
            </div>
            <div>
              <p style="color: rgba(255,255,255,0.8); font-size: 0.875rem; margin-bottom: 4px;">💎 Net Worth</p>
              <p style="color: white; font-size: 1.5rem; font-weight: 700;">${Formatter.currency(summary.itemsNetWorth)}</p>
            </div>
          </div>
        </div>
      ` : ''}

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
          `).join('') : `
            <div class="empty-state-box">
              <div class="empty-icon">📊</div>
              <h3>Belum ada data</h3>
              <p>Mulai dengan membuat akun dan kategori default</p>
              <button onclick="initializeDefaultData()" class="btn-init">
                🚀 Buat Data Default
              </button>
            </div>
          `}
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

      <!-- Floating Action Buttons -->
      <div class="fab-container">
        <button class="fab fab-income" onclick="Transaction.showIncomeForm()" title="Tambah Pemasukan">
          <span>💵</span>
        </button>
        <button class="fab fab-expense" onclick="Transaction.showExpenseForm()" title="Tambah Pengeluaran">
          <span>💸</span>
        </button>
        <button class="fab fab-transfer" onclick="Transaction.showTransferForm()" title="Transfer">
          <span>🔄</span>
        </button>
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
