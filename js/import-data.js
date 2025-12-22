// Kiyosaki Finance Tracker - Data Import Script
// Import data transaksi dari Excel ke database

/**
 * Import initial data (categories, accounts, transactions)
 * Jalankan sekali untuk memasukkan data awal
 */
async function importInitialData() {
  const userId = window.currentUser?.id;
  if (!userId) {
    showToast('User belum login!', 'error');
    return;
  }

  showLoading();
  console.log('Starting data import for user:', userId);

  try {
    // =============================================
    // STEP 1: Create Income Categories
    // =============================================
    const incomeCategories = [
      { name: 'Gaji', type: 'income', income_type: 'active', icon: '💼' },
      { name: 'Tukin', type: 'income', income_type: 'active', icon: '💰' },
      { name: 'Honor', type: 'income', income_type: 'active', icon: '🎁' },
      { name: 'Uma', type: 'income', income_type: 'passive', icon: '🏠' },
      { name: 'Pemasukan Lainnya', type: 'income', income_type: 'active', icon: '➕' }
    ];

    // =============================================
    // STEP 2: Create Expense Categories
    // =============================================
    const expenseCategories = [
      { name: 'Pengeluaran lain - lain', type: 'expense', icon: '🛍️' },
      { name: 'Bensin', type: 'expense', icon: '⛽' },
      { name: 'Cicilan Bank', type: 'expense', icon: '🏦', is_loan_payment: true },
      { name: 'Cicilan Motor', type: 'expense', icon: '🏍️', is_loan_payment: true },
      { name: 'DP', type: 'expense', icon: '💳' },
      { name: 'Internet', type: 'expense', icon: '📶' },
      { name: 'Shodaqoh', type: 'expense', icon: '❤️' },
      { name: 'Pengeluaran Makan', type: 'expense', icon: '🍽️' },
      { name: 'Kantor', type: 'expense', icon: '🏢' },
      { name: 'Dana Titipan', type: 'expense', icon: '👥' },
      { name: 'Invest', type: 'expense', icon: '📈' }
    ];

    // Delete existing categories first (to avoid duplicates)
    console.log('Clearing existing categories...');
    await window.db.from('categories').delete().eq('user_id', userId);

    // Insert all categories
    console.log('Creating categories...');
    const allCategories = [...incomeCategories, ...expenseCategories].map(cat => ({
      ...cat,
      user_id: userId
    }));

    const { error: catError } = await window.db.from('categories').insert(allCategories);
    if (catError) throw new Error('Failed to create categories: ' + catError.message);
    console.log('✅ Categories created:', allCategories.length);

    // =============================================
    // STEP 3: Create Cash Account
    // =============================================
    console.log('Creating Cash account...');

    // Delete existing accounts first
    await window.db.from('accounts').delete().eq('user_id', userId);

    const { data: accountData, error: accError } = await window.db
      .from('accounts')
      .insert({
        user_id: userId,
        name: 'Cash',
        type: 'cash',
        icon: '💵',
        current_balance: 805365
      })
      .select()
      .single();

    if (accError) throw new Error('Failed to create account: ' + accError.message);
    const accountId = accountData.id;
    console.log('✅ Account created:', accountData.name, 'ID:', accountId);

    // =============================================
    // STEP 4: Get Category ID Map
    // =============================================
    const { data: categories } = await window.db
      .from('categories')
      .select('id, name, type, income_type')
      .eq('user_id', userId);

    const catMap = {};
    categories.forEach(c => catMap[c.name] = c);
    console.log('Category map:', Object.keys(catMap));

    // =============================================
    // STEP 5: Transaction Data from Excel
    // =============================================
    const transactions = [
      // May 2025
      { date: '2025-05-01', desc: 'Gaji', category: 'Gaji', amount: 4993400, type: 'income' },
      { date: '2025-05-09', desc: 'biaya', category: 'Pengeluaran lain - lain', amount: 60000, type: 'expense' },
      { date: '2025-05-09', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 500000, type: 'expense' },
      { date: '2025-05-09', desc: 'biaya', category: 'Pengeluaran lain - lain', amount: 60000, type: 'expense' },
      { date: '2025-05-09', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 500000, type: 'expense' },
      { date: '2025-05-09', desc: 'biaya', category: 'Pengeluaran lain - lain', amount: 3000, type: 'expense' },
      { date: '2025-05-09', desc: 'listrik masjid', category: 'Pengeluaran lain - lain', amount: 200000, type: 'expense' },
      { date: '2025-05-09', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 300000, type: 'expense' },
      { date: '2025-05-09', desc: 'biaya potongan rumdis mony', category: 'Pengeluaran lain - lain', amount: 307692, type: 'expense' },
      { date: '2025-05-09', desc: 'biaya', category: 'Pengeluaran lain - lain', amount: 3000, type: 'expense' },
      { date: '2025-05-09', desc: 'biaya', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      { date: '2025-05-09', desc: 'Listrik rumah', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      { date: '2025-05-09', desc: 'Tukin', category: 'Tukin', amount: 4570226, type: 'income' },
      { date: '2025-05-09', desc: 'STNK', category: 'Pengeluaran lain - lain', amount: 1530500, type: 'expense' },
      { date: '2025-05-09', desc: 'panjar motor', category: 'DP', amount: 2502500, type: 'expense' },
      { date: '2025-05-09', desc: 'belanja', category: 'Bensin', amount: 202500, type: 'expense' },
      { date: '2025-05-09', desc: 'Cicilan bank Mandiri', category: 'Cicilan Bank', amount: 3950000, type: 'expense' },
      { date: '2025-05-09', desc: 'Honor', category: 'Honor', amount: 1662500, type: 'income' },
      { date: '2025-05-09', desc: 'Cicilan bank Mandiri', category: 'Cicilan Bank', amount: 1662500, type: 'expense' },
      { date: '2025-05-12', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      { date: '2025-05-13', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      { date: '2025-05-13', desc: 'belanja', category: 'Bensin', amount: 150000, type: 'expense' },
      { date: '2025-05-14', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      { date: '2025-05-15', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 50000, type: 'expense' },
      { date: '2025-05-19', desc: 'kiriman mama', category: 'Pemasukan Lainnya', amount: 500000, type: 'income' },
      { date: '2025-05-20', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      { date: '2025-05-21', desc: 'belanja', category: 'Bensin', amount: 100000, type: 'expense' },
      { date: '2025-05-26', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 300000, type: 'expense' },
      { date: '2025-05-29', desc: 'pulsa', category: 'Pengeluaran lain - lain', amount: 100000, type: 'expense' },
      // June 2025
      { date: '2025-06-01', desc: 'Gaji', category: 'Gaji', amount: 6281600, type: 'income' },
      { date: '2025-06-02', desc: 'Cicilan bank Mandiri', category: 'Cicilan Bank', amount: 3950000, type: 'expense' },
      { date: '2025-06-02', desc: 'Tukin', category: 'Tukin', amount: 4570226, type: 'income' },
      { date: '2025-06-02', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 500000, type: 'expense' },
      { date: '2025-06-07', desc: 'Honor', category: 'Honor', amount: 1662500, type: 'income' },
      { date: '2025-06-07', desc: 'Cicilan bank Mandiri', category: 'Cicilan Bank', amount: 1662500, type: 'expense' },
      { date: '2025-06-07', desc: 'Belanja harian', category: 'Pengeluaran lain - lain', amount: 300000, type: 'expense' }
    ];

    // =============================================
    // STEP 6: Insert Transactions
    // =============================================
    console.log('Inserting transactions...');

    // Delete existing transactions first
    await window.db.from('transactions').delete().eq('user_id', userId);

    let successCount = 0;
    let errorCount = 0;
    let runningBalance = 805365; // Starting balance

    for (const tx of transactions) {
      const cat = catMap[tx.category];
      if (!cat) {
        console.error('Category not found:', tx.category);
        errorCount++;
        continue;
      }

      // Calculate running balance
      if (tx.type === 'income') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }

      const txData = {
        user_id: userId,
        date: tx.date,
        type: tx.type,
        amount: tx.amount,
        description: tx.desc,
        account_id: accountId,
        category_id: cat.id
      };

      if (tx.type === 'income') {
        txData.income_type = cat.income_type || 'active';
      }

      const { error } = await window.db.from('transactions').insert(txData);
      if (error) {
        console.error('Insert error:', tx.desc, error);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // =============================================
    // STEP 7: Update Account Balance
    // =============================================
    console.log('Updating account balance to:', runningBalance);
    await window.db
      .from('accounts')
      .update({ current_balance: runningBalance })
      .eq('id', accountId);

    // =============================================
    // DONE
    // =============================================
    hideLoading();

    const summary = `
Import selesai!
✅ Transaksi berhasil: ${successCount}
❌ Transaksi gagal: ${errorCount}
💰 Saldo akhir: Rp ${runningBalance.toLocaleString('id-ID')}
    `;

    console.log(summary);
    alert(summary);
    showToast('Data berhasil diimport!', 'success');

    // Reload data
    if (typeof loadInitialData === 'function') await loadInitialData();
    if (typeof loadDashboard === 'function') await loadDashboard();

    return { success: true, imported: successCount, errors: errorCount };

  } catch (error) {
    hideLoading();
    console.error('Import failed:', error);
    showToast('Import gagal: ' + error.message, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Clear all user data (for testing)
 */
async function clearAllData() {
  const userId = window.currentUser?.id;
  if (!userId) return;

  if (!confirm('PERINGATAN: Semua data akan dihapus!\n\nLanjutkan?')) {
    return;
  }

  showLoading();

  try {
    await window.db.from('transactions').delete().eq('user_id', userId);
    await window.db.from('categories').delete().eq('user_id', userId);
    await window.db.from('accounts').delete().eq('user_id', userId);

    hideLoading();
    showToast('Semua data telah dihapus', 'success');

    if (typeof loadInitialData === 'function') await loadInitialData();
    if (typeof loadDashboard === 'function') await loadDashboard();

  } catch (error) {
    hideLoading();
    console.error('Clear data failed:', error);
    showToast('Gagal menghapus data', 'error');
  }
}

// Make functions globally available
window.importInitialData = importInitialData;
window.clearAllData = clearAllData;

console.log('📥 Import script loaded. Run importInitialData() to import data.');
