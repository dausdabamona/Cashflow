/**
 * Transaction Service
 * Mengelola semua operasi terkait transaksi
 */

class TransactionService extends BaseService {
  constructor() {
    super('transactions');
  }

  /**
   * Get transactions dengan filter dan caching
   * @param {Object} options - Filter options
   * @param {boolean} forceRefresh - Skip cache
   * @returns {Promise<Array>}
   */
  async getAll(options = {}, forceRefresh = false) {
    const {
      limit = 50,
      offset = 0,
      startDate = null,
      endDate = null,
      type = null,
      accountId = null,
      categoryId = null,
      includeRelations = true
    } = options;

    // Check cache only for default query (no filters)
    const isDefaultQuery = !startDate && !endDate && !type && !accountId && !categoryId && offset === 0;
    if (!forceRefresh && isDefaultQuery) {
      const cached = AppStore.getCache('transactions');
      if (cached) {
        return cached.slice(0, limit);
      }
    }

    try {
      let query = this.getClient()
        .from(this.tableName)
        .select(includeRelations ? '*, accounts(*), categories(*)' : '*')
        .eq('user_id', this.getUserId())
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (accountId) {
        query = query.eq('account_id', accountId);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      const transactions = data || [];

      // Update store only for default query
      if (isDefaultQuery) {
        AppStore.setTransactions(transactions);
      }

      return transactions;
    } catch (error) {
      ErrorHandler.handle(error, 'TransactionService.getAll');
      throw error;
    }
  }

  /**
   * Get transactions for current month
   * @returns {Promise<Array>}
   */
  async getMonthly() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return this.getAll({ startDate, endDate, limit: 500 });
  }

  /**
   * Get transactions by date range
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  async getByDateRange(startDate, endDate) {
    return this.getAll({ startDate, endDate, limit: 1000 });
  }

  /**
   * Get transactions by type
   * @param {string} type - income, expense, transfer
   * @returns {Promise<Array>}
   */
  async getByType(type) {
    return this.getAll({ type, limit: 100 });
  }

  /**
   * Create new transaction
   * @param {Object} data - Transaction data
   * @returns {Promise<Object>}
   */
  async create(data) {
    // Validate
    const validated = Validator.transaction(data);

    try {
      const result = await super.create(validated);

      // Update account balance
      if (validated.type === 'income') {
        await window.AccountService?.updateBalance(validated.account_id, validated.amount);
      } else if (validated.type === 'expense') {
        await window.AccountService?.updateBalance(validated.account_id, -validated.amount);
      }

      // Invalidate caches
      AppStore.invalidateCache('transactions');
      AppStore.invalidateCache('dashboard');

      return result;
    } catch (error) {
      ErrorHandler.handle(error, 'TransactionService.create');
      throw error;
    }
  }

  /**
   * Create transfer transaction (uses AccountService.transfer)
   * @param {Object} data - Transfer data
   * @returns {Promise<Object>}
   */
  async createTransfer(data) {
    const validated = Validator.transfer(data);

    try {
      // Perform the transfer
      const transfer = await window.AccountService?.transfer(validated);

      // Create transaction records for both sides
      const outgoingTx = await super.create({
        type: 'transfer',
        amount: validated.total_deducted,
        account_id: validated.from_account_id,
        date: validated.date,
        description: validated.description || `Transfer ke ${transfer.to.name}`,
        category_id: null
      });

      const incomingTx = await super.create({
        type: 'transfer',
        amount: validated.amount,
        account_id: validated.to_account_id,
        date: validated.date,
        description: validated.description || `Transfer dari ${transfer.from.name}`,
        category_id: null
      });

      // Invalidate caches
      AppStore.invalidateCache('transactions');
      AppStore.invalidateCache('dashboard');

      return {
        outgoing: outgoingTx,
        incoming: incomingTx,
        transfer
      };
    } catch (error) {
      ErrorHandler.handle(error, 'TransactionService.createTransfer');
      throw error;
    }
  }

  /**
   * Update transaction
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      // Get original transaction
      const original = await this.getById(id);
      if (!original) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // Validate new data
      const validated = Validator.transaction({ ...original, ...data });

      // Reverse original balance change
      if (original.type === 'income') {
        await window.AccountService?.updateBalance(original.account_id, -original.amount);
      } else if (original.type === 'expense') {
        await window.AccountService?.updateBalance(original.account_id, original.amount);
      }

      // Apply new balance change
      if (validated.type === 'income') {
        await window.AccountService?.updateBalance(validated.account_id, validated.amount);
      } else if (validated.type === 'expense') {
        await window.AccountService?.updateBalance(validated.account_id, -validated.amount);
      }

      const result = await super.update(id, validated);

      // Invalidate caches
      AppStore.invalidateCache('transactions');
      AppStore.invalidateCache('dashboard');

      return result;
    } catch (error) {
      ErrorHandler.handle(error, 'TransactionService.update');
      throw error;
    }
  }

  /**
   * Delete transaction
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      // Get transaction first
      const transaction = await this.getById(id);
      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // Reverse balance change
      if (transaction.type === 'income') {
        await window.AccountService?.updateBalance(transaction.account_id, -transaction.amount);
      } else if (transaction.type === 'expense') {
        await window.AccountService?.updateBalance(transaction.account_id, transaction.amount);
      }

      const result = await super.delete(id);

      // Invalidate caches
      AppStore.invalidateCache('transactions');
      AppStore.invalidateCache('dashboard');

      return result;
    } catch (error) {
      ErrorHandler.handle(error, 'TransactionService.delete');
      throw error;
    }
  }

  /**
   * Count transactions by account
   * @param {string} accountId
   * @returns {Promise<number>}
   */
  async countByAccount(accountId) {
    return this.count({ account_id: accountId });
  }

  /**
   * Count transactions by category
   * @param {string} categoryId
   * @returns {Promise<number>}
   */
  async countByCategory(categoryId) {
    return this.count({ category_id: categoryId });
  }

  /**
   * Get summary statistics for a period
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Object>}
   */
  async getSummary(startDate, endDate) {
    const transactions = await this.getByDateRange(startDate, endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    let activeIncome = 0;
    let passiveIncome = 0;
    let portfolioIncome = 0;

    transactions.forEach(tx => {
      const amount = Validator.currency(tx.amount, 0);

      if (tx.type === 'income') {
        totalIncome += amount;

        if (tx.income_type === 'passive') {
          passiveIncome += amount;
        } else if (tx.income_type === 'portfolio') {
          portfolioIncome += amount;
        } else {
          activeIncome += amount;
        }
      } else if (tx.type === 'expense') {
        totalExpense += amount;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      activeIncome,
      passiveIncome,
      portfolioIncome,
      transactionCount: transactions.length
    };
  }

  /**
   * Get spending by category for a period
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Array>}
   */
  async getSpendingByCategory(startDate, endDate) {
    const transactions = await this.getByDateRange(startDate, endDate);
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Group by category
    const byCategory = {};
    expenseTransactions.forEach(tx => {
      const categoryId = tx.category_id || 'uncategorized';
      const categoryName = tx.categories?.name || 'Tidak Berkategori';
      const categoryIcon = tx.categories?.icon || '📦';

      if (!byCategory[categoryId]) {
        byCategory[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: categoryIcon,
          total: 0,
          count: 0
        };
      }

      byCategory[categoryId].total += Validator.currency(tx.amount, 0);
      byCategory[categoryId].count++;
    });

    // Convert to array and sort by total
    return Object.values(byCategory).sort((a, b) => b.total - a.total);
  }

  /**
   * Get daily spending for a period
   * @param {string} startDate
   * @param {string} endDate
   * @returns {Promise<Object>}
   */
  async getDailyTotals(startDate, endDate) {
    const transactions = await this.getByDateRange(startDate, endDate);

    const dailyTotals = {};

    transactions.forEach(tx => {
      const date = tx.date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = { income: 0, expense: 0 };
      }

      const amount = Validator.currency(tx.amount, 0);
      if (tx.type === 'income') {
        dailyTotals[date].income += amount;
      } else if (tx.type === 'expense') {
        dailyTotals[date].expense += amount;
      }
    });

    return dailyTotals;
  }

  /**
   * Search transactions by description
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async search(query, limit = 20) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const { data, error } = await this.getClient()
        .from(this.tableName)
        .select('*, accounts(*), categories(*)')
        .eq('user_id', this.getUserId())
        .ilike('description', `%${query}%`)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.handle(error, 'TransactionService.search');
      return [];
    }
  }

  /**
   * Import transactions from array
   * @param {Array} transactions
   * @returns {Promise<Object>}
   */
  async import(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const tx of transactions) {
      try {
        await this.create(tx);
        success++;
      } catch (error) {
        failed++;
        errors.push({
          transaction: tx,
          error: error.message
        });
      }
    }

    ErrorHandler.info(`Import completed: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }
}

// Create singleton instance
const transactionService = new TransactionService();

// Export global
window.TransactionService = transactionService;
