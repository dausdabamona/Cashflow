// Kiyosaki Finance Tracker - Transaction Module

/**
 * Record an expense
 */
async function recordExpense(amount, accountId, categoryId, date, description) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await window.db.rpc('record_expense', {
    p_user_id: userId,
    p_amount: amount,
    p_account_id: accountId,
    p_category_id: categoryId,
    p_date: date,
    p_description: description || null,
    p_item_id: null
  });

  if (error) throw error;
  return data;
}

/**
 * Record an income
 */
async function recordIncome(amount, accountId, categoryId, date, description, incomeType = 'active') {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await window.db.rpc('record_income', {
    p_user_id: userId,
    p_amount: amount,
    p_account_id: accountId,
    p_category_id: categoryId,
    p_date: date,
    p_description: description || null,
    p_income_type: incomeType,
    p_item_id: null
  });

  if (error) throw error;
  return data;
}

/**
 * Transfer funds between accounts
 */
async function transferFunds(fromAccountId, toAccountId, amount, description) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User not authenticated');

  const { data, error } = await window.db.rpc('transfer_funds', {
    p_user_id: userId,
    p_from_account_id: fromAccountId,
    p_to_account_id: toAccountId,
    p_amount: amount,
    p_date: getToday(),
    p_description: description || null
  });

  if (error) throw error;
  return data;
}

/**
 * Load transaction history view
 */
async function loadHistory(page = 0) {
  const container = document.getElementById('historyView');
  if (!container) return;

  const pageSize = 20;
  const offset = page * pageSize;

  try {
    container.innerHTML = getHistorySkeleton();

    const userId = currentUser?.id;
    if (!userId) return;

    // Fetch transactions
    const { data: transactions, error, count } = await window.db
      .from('transactions')
      .select('*, account:accounts(name), category:categories(name, icon)', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    container.innerHTML = renderHistory(transactions || [], page, count || 0, pageSize);
    lucide.createIcons();

  } catch (error) {
    console.error('Load history error:', error);
    container.innerHTML = `
      <div class="card text-center py-8">
        <i data-lucide="alert-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
        <p class="text-gray-500">Gagal memuat riwayat transaksi</p>
        <button onclick="loadHistory()" class="btn btn-secondary mt-4">Coba Lagi</button>
      </div>
    `;
    lucide.createIcons();
  }
}

/**
 * Render history HTML
 */
function renderHistory(transactions, currentPage, totalCount, pageSize) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (transactions.length === 0) {
    return `
      <div class="card text-center py-12">
        <i data-lucide="inbox" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
        <h3 class="text-lg font-medium text-gray-700 mb-2">Belum Ada Transaksi</h3>
        <p class="text-gray-500 mb-4">Mulai catat pengeluaran dan pemasukanmu</p>
        <button onclick="document.getElementById('fabBtn').click()" class="btn btn-primary">
          <i data-lucide="plus" class="w-5 h-5"></i>
          <span>Tambah Transaksi</span>
        </button>
      </div>
    `;
  }

  // Group transactions by date
  const grouped = groupTransactionsByDate(transactions);

  return `
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Riwayat Transaksi</h2>
      <button onclick="openTransferModal()" class="btn btn-secondary text-sm py-2">
        <i data-lucide="arrow-left-right" class="w-4 h-4"></i>
        <span>Transfer</span>
      </button>
    </div>

    <div class="space-y-4">
      ${Object.entries(grouped).map(([date, txs]) => `
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-gray-500">${formatDateHeader(date)}</span>
            <span class="text-sm font-medium ${getDayTotal(txs) >= 0 ? 'text-green-600' : 'text-red-600'}">
              ${getDayTotal(txs) >= 0 ? '+' : ''}${formatRupiahShort(getDayTotal(txs))}
            </span>
          </div>
          <div class="space-y-1">
            ${txs.map(tx => renderHistoryItem(tx)).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    ${totalPages > 1 ? `
      <div class="flex items-center justify-center gap-2 mt-6">
        ${currentPage > 0 ? `
          <button onclick="loadHistory(${currentPage - 1})" class="btn btn-secondary">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
        ` : ''}
        <span class="text-sm text-gray-500">
          Halaman ${currentPage + 1} dari ${totalPages}
        </span>
        ${currentPage < totalPages - 1 ? `
          <button onclick="loadHistory(${currentPage + 1})" class="btn btn-secondary">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        ` : ''}
      </div>
    ` : ''}
  `;
}

/**
 * Render a single history item
 */
function renderHistoryItem(tx) {
  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const icon = isTransfer ? '🔄' : (tx.category?.icon || (isIncome ? '💰' : '💸'));
  const categoryName = isTransfer ? 'Transfer' : (tx.category?.name || 'Lainnya');

  return `
    <div class="transaction-item" onclick="showTransactionDetail('${tx.id}')">
      <div class="transaction-icon ${isIncome ? 'bg-green-100' : isTransfer ? 'bg-blue-100' : 'bg-red-100'}">
        <span class="text-lg">${icon}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900 truncate">${tx.description || categoryName}</p>
        <p class="text-xs text-gray-500">${tx.account?.name || 'Unknown'}</p>
      </div>
      <div class="text-right">
        <span class="font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}">
          ${isIncome ? '+' : '-'}${formatRupiahShort(tx.amount)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Group transactions by date
 */
function groupTransactionsByDate(transactions) {
  return transactions.reduce((groups, tx) => {
    const date = tx.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {});
}

/**
 * Format date header
 */
function formatDateHeader(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hari Ini';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }
  return formatDateFull(dateStr);
}

/**
 * Calculate day total
 */
function getDayTotal(transactions) {
  return transactions.reduce((sum, tx) => {
    if (tx.type === 'income') {
      return sum + tx.amount;
    } else if (tx.type === 'expense') {
      return sum - tx.amount;
    }
    return sum;
  }, 0);
}

/**
 * Show transaction detail (for future implementation)
 */
function showTransactionDetail(transactionId) {
  // TODO: Implement transaction detail view
  console.log('Show detail for:', transactionId);
}

/**
 * Delete transaction
 */
async function deleteTransaction(transactionId) {
  const confirmed = await showConfirm('Hapus transaksi ini?');
  if (!confirmed) return;

  try {
    showLoading();
    const { error } = await window.db
      .from('transactions')
      .update({ is_deleted: true })
      .eq('id', transactionId);

    if (error) throw error;

    hideLoading();
    showToast('Transaksi dihapus', 'success');
    await loadHistory();

  } catch (error) {
    hideLoading();
    console.error('Delete transaction error:', error);
    showToast('Gagal menghapus transaksi', 'error');
  }
}

/**
 * Get history loading skeleton
 */
function getHistorySkeleton() {
  return `
    <div class="flex items-center justify-between mb-4">
      <div class="skeleton h-6 w-40"></div>
      <div class="skeleton h-8 w-24 rounded-lg"></div>
    </div>
    <div class="space-y-4">
      ${[1, 2, 3].map(() => `
        <div class="card">
          <div class="skeleton h-4 w-24 mb-3"></div>
          <div class="space-y-3">
            <div class="skeleton h-14 w-full"></div>
            <div class="skeleton h-14 w-full"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Make functions available globally
window.recordExpense = recordExpense;
window.recordIncome = recordIncome;
window.transferFunds = transferFunds;
window.loadHistory = loadHistory;
window.deleteTransaction = deleteTransaction;
window.showTransactionDetail = showTransactionDetail;
