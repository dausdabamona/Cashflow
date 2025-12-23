/**
 * Transaction Service
 * File: js/services/transactionService.js
 * Handles all transaction-related operations
 *
 * FIX ERROR 3 (PGRST201): Uses simple query without joins to avoid
 * ambiguous relationship error with accounts table
 */
const TransactionService = {
  tableName: 'transactions',

  /**
   * Get all transactions with optional filters
   * Uses simple query + manual join to avoid PGRST201 error
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of transaction objects
   */
  async getAll(options = {}) {
    try {
      const userId = BaseService.getUserId();
      if (!userId) return [];

      let query = BaseService.getClient()
        .from(this.tableName)
        .select('*')  // Simple query tanpa join untuk menghindari PGRST201
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.startDate) {
        query = query.gte('date', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('date', options.endDate);
      }
      if (options.type) {
        query = query.eq('type', options.type);
      }
      if (options.accountId) {
        query = query.eq('account_id', options.accountId);
      }
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Manual join dengan cache untuk menghindari error PGRST201
      const transactions = data || [];

      // Get unique IDs
      const accountIds = [...new Set([
        ...transactions.map(t => t.account_id).filter(Boolean),
        ...transactions.map(t => t.to_account_id).filter(Boolean)
      ])];
      const categoryIds = [...new Set(transactions.map(t => t.category_id).filter(Boolean))];

      // Fetch related data in parallel
      const [accounts, categories] = await Promise.all([
        this.fetchAccounts(accountIds),
        this.fetchCategories(categoryIds)
      ]);

      // Create lookup maps
      const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]));
      const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));

      // Map relations to transactions
      return transactions.map(t => ({
        ...t,
        account: accountMap[t.account_id] || null,
        to_account: accountMap[t.to_account_id] || null,
        category: categoryMap[t.category_id] || null
      }));

    } catch (error) {
      console.error('[TransactionService.getAll]', error);
      return [];
    }
  },

  /**
   * Fetch accounts by IDs (helper for manual join)
   * @param {Array} ids - Account IDs
   * @returns {Promise<Array>} Array of account objects
   */
  async fetchAccounts(ids) {
    if (!ids.length) return [];
    const { data } = await BaseService.getClient()
      .from('accounts')
      .select('id, name, icon, type')
      .in('id', ids);
    return data || [];
  },

  /**
   * Fetch categories by IDs (helper for manual join)
   * @param {Array} ids - Category IDs
   * @returns {Promise<Array>} Array of category objects
   */
  async fetchCategories(ids) {
    if (!ids.length) return [];
    const { data } = await BaseService.getClient()
      .from('categories')
      .select('id, name, icon, type')
      .in('id', ids);
    return data || [];
  },

  /**
   * Get transactions for current month
   * @param {number} month - Month (1-12), defaults to current
   * @param {number} year - Year, defaults to current
   * @returns {Promise<Array>} Array of transaction objects
   */
  async getMonthly(month, year) {
    const m = month || BaseService.getCurrentMonth();
    const y = year || BaseService.getCurrentYear();

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = new Date(y, m, 0).toISOString().split('T')[0]; // Last day of month

    return this.getAll({ startDate, endDate });
  },

  /**
   * Get recent transactions
   * @param {number} limit - Number of transactions to fetch
   * @returns {Promise<Array>} Array of transaction objects
   */
  async getRecent(limit = 5) {
    return this.getAll({ limit });
  },

  /**
   * Get transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object|null>} Transaction object or null
   */
  async getById(id) {
    try {
      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[TransactionService.getById]', error);
      return null;
    }
  },

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object|null>} Created transaction or null
   */
  async create(transactionData) {
    try {
      const userId = BaseService.getUserId();
      if (!userId) {
        console.warn('[TransactionService] No user ID');
        return null;
      }

      const { data: result, error } = await BaseService.getClient()
        .from(this.tableName)
        .insert({
          ...transactionData,
          user_id: userId,
          is_deleted: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update account balance if needed
      if (result && result.account_id) {
        await this.updateAccountBalance(result);
      }

      return result;

    } catch (error) {
      console.error('[TransactionService.create]', error);
      return null;
    }
  },

  /**
   * Update account balance based on transaction
   * @param {Object} transaction - Transaction object
   */
  async updateAccountBalance(transaction) {
    try {
      const { type, amount, account_id, to_account_id } = transaction;

      if (type === 'income') {
        await AccountService.updateBalance(account_id, parseFloat(amount));
      } else if (type === 'expense') {
        await AccountService.updateBalance(account_id, -parseFloat(amount));
      } else if (type === 'transfer') {
        await AccountService.updateBalance(account_id, -parseFloat(amount));
        if (to_account_id) {
          await AccountService.updateBalance(to_account_id, parseFloat(amount));
        }
      }
    } catch (error) {
      console.error('[TransactionService.updateAccountBalance]', error);
    }
  },

  /**
   * Update a transaction
   * @param {string} id - Transaction ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated transaction or null
   */
  async update(id, updates) {
    try {
      const { data, error } = await BaseService.getClient()
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('[TransactionService.update]', error);
      return null;
    }
  },

  /**
   * Delete a transaction (soft delete)
   * @param {string} id - Transaction ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      // Soft delete
      const { error } = await BaseService.getClient()
        .from(this.tableName)
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('[TransactionService.delete]', error);
      return false;
    }
  },

  /**
   * Get summary statistics for a period
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Summary object
   */
  async getSummary(startDate, endDate) {
    try {
      const transactions = await this.getAll({ startDate, endDate });

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      return {
        income,
        expense,
        balance: income - expense,
        count: transactions.length
      };

    } catch (error) {
      console.error('[TransactionService.getSummary]', error);
      return { income: 0, expense: 0, balance: 0, count: 0 };
    }
  }
};

// Export ke window
window.TransactionService = TransactionService;

console.log('✅ TransactionService loaded');
