/**
 * Navigation Module
 * File: web/js/navigation.js
 * Handles page navigation
 */
const Navigation = {
  currentPage: 'dashboard',

  /**
   * Navigate to a page
   * @param {string} page - Page name (dashboard, items, transactions)
   */
  async goTo(page) {
    console.log('[Navigation] Going to:', page);

    // Update active menu item
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }

    // Store current page
    this.currentPage = page;

    // Load the appropriate page
    try {
      switch (page) {
        case 'dashboard':
          await Dashboard.init();
          break;
        case 'items':
          await Items.init();
          break;
        case 'transactions':
          await this.showTransactions();
          break;
        default:
          console.warn('[Navigation] Unknown page:', page);
          await Dashboard.init();
      }
    } catch (error) {
      console.error('[Navigation] Error loading page:', error);
      Toast.error('Gagal memuat halaman');
    }
  },

  /**
   * Show transactions page
   */
  async showTransactions() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    Loading.show('Memuat transaksi...');

    try {
      const transactions = await TransactionService.getAll();
      const accounts = await AccountService.getAll();
      const categories = await CategoryService.getAll();

      Loading.hide();

      // Create a map for quick lookup
      const accountMap = {};
      accounts.forEach(acc => {
        accountMap[acc.id] = acc;
      });

      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.id] = cat;
      });

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h2 class="section-title" style="margin-bottom: 0;">💳 Semua Transaksi</h2>
          <div style="display: flex; gap: 8px;">
            <button onclick="Transaction.showIncomeForm()" style="padding: 10px 16px; background: #10B981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              💵 Pemasukan
            </button>
            <button onclick="Transaction.showExpenseForm()" style="padding: 10px 16px; background: #EF4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              💸 Pengeluaran
            </button>
          </div>
        </div>

        ${transactions.length > 0 ? `
          <div class="card transactions-list">
            ${transactions.map(tx => {
              const account = accountMap[tx.account_id];
              const category = categoryMap[tx.category_id];
              return `
                <div class="transaction-item">
                  <div class="transaction-icon ${tx.type}">${category?.icon || (tx.type === 'income' ? '💵' : '💸')}</div>
                  <div class="transaction-info">
                    <p class="transaction-desc">${tx.description || category?.name || 'Transaksi'}</p>
                    <p class="transaction-meta">
                      ${Formatter.date(tx.date)} • ${account?.name || '-'}
                      ${tx.income_type === 'passive' ? ' • <strong>PASIF</strong>' : ''}
                    </p>
                  </div>
                  <p class="transaction-amount ${tx.type}">
                    ${tx.type === 'income' ? '+' : '-'}${Formatter.currency(tx.amount)}
                  </p>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state-box">
            <div class="empty-icon">💳</div>
            <h3>Belum ada transaksi</h3>
            <p>Mulai catat pemasukan dan pengeluaran Anda</p>
            <button onclick="Transaction.showExpenseForm()" class="btn-init">
              ➕ Tambah Transaksi
            </button>
          </div>
        `}
      `;

    } catch (error) {
      Loading.hide();
      console.error('[Navigation.showTransactions]', error);
      Toast.error('Gagal memuat transaksi');
    }
  },

  /**
   * Get current page
   */
  getCurrentPage() {
    return this.currentPage;
  }
};

window.Navigation = Navigation;
console.log('✅ Navigation module loaded');
