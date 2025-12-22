/**
 * Account Service
 * Mengelola semua operasi terkait akun/rekening
 */

class AccountService extends BaseService {
  constructor() {
    super('accounts');
  }

  /**
   * Get all accounts dengan caching
   * @param {boolean} forceRefresh - Skip cache
   * @returns {Promise<Array>}
   */
  async getAll(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = AppStore.getCache('accounts');
      if (cached) {
        return cached;
      }
    }

    const accounts = await super.getAll({ orderBy: 'name', ascending: true });

    // Update store
    AppStore.setAccounts(accounts);

    return accounts;
  }

  /**
   * Get accounts by type
   * @param {string} type - cash, bank, ewallet, investment, receivable, other
   * @returns {Promise<Array>}
   */
  async getByType(type) {
    const accounts = await this.getAll();
    return accounts.filter(a => a.type === type);
  }

  /**
   * Create new account
   * @param {Object} data - Account data
   * @returns {Promise<Object>}
   */
  async create(data) {
    // Validate
    const validated = Validator.account(data);

    const result = await super.create(validated);

    // Invalidate cache and refresh
    AppStore.invalidateCache('accounts');
    await this.getAll(true);

    return result;
  }

  /**
   * Update account
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    // Validate
    const validated = Validator.account(data);

    const result = await super.update(id, validated);

    // Invalidate cache and refresh
    AppStore.invalidateCache('accounts');
    await this.getAll(true);

    return result;
  }

  /**
   * Update account balance
   * @param {string} id
   * @param {number} amount - Amount to add (negative for subtract)
   * @returns {Promise<Object>}
   */
  async updateBalance(id, amount) {
    try {
      const account = await this.getById(id);
      if (!account) {
        throw new Error('Akun tidak ditemukan');
      }

      const currentBalance = Validator.currency(account.current_balance, 0);
      const changeAmount = Validator.currency(amount, 0);
      const newBalance = currentBalance + changeAmount;

      const { data, error } = await this.getClient()
        .from(this.tableName)
        .update({ current_balance: newBalance })
        .eq('id', id)
        .eq('user_id', this.getUserId())
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      AppStore.invalidateCache('accounts');
      AppStore.invalidateCache('dashboard');

      ErrorHandler.debug(`Account ${id} balance updated: ${currentBalance} -> ${newBalance}`);
      return data;
    } catch (error) {
      ErrorHandler.handle(error, 'AccountService.updateBalance');
      throw error;
    }
  }

  /**
   * Transfer between accounts
   * @param {Object} transferData
   * @returns {Promise<Object>}
   */
  async transfer(transferData) {
    // Validate
    const validated = Validator.transfer(transferData);

    try {
      // Get both accounts
      const fromAccount = await this.getById(validated.from_account_id);
      const toAccount = await this.getById(validated.to_account_id);

      if (!fromAccount) throw new Error('Akun asal tidak ditemukan');
      if (!toAccount) throw new Error('Akun tujuan tidak ditemukan');

      // Check sufficient balance
      const fromBalance = Validator.currency(fromAccount.current_balance, 0);
      if (fromBalance < validated.total_deducted) {
        throw new Error('Saldo tidak mencukupi');
      }

      // Update both balances
      await this.updateBalance(validated.from_account_id, -validated.total_deducted);
      await this.updateBalance(validated.to_account_id, validated.amount);

      // Return transfer info
      return {
        from: fromAccount,
        to: toAccount,
        amount: validated.amount,
        admin_fee: validated.admin_fee,
        total_deducted: validated.total_deducted
      };
    } catch (error) {
      ErrorHandler.handle(error, 'AccountService.transfer');
      throw error;
    }
  }

  /**
   * Get total balance across all accounts
   * @returns {Promise<number>}
   */
  async getTotalBalance() {
    const accounts = await this.getAll();
    return accounts.reduce((sum, acc) => {
      return sum + Validator.currency(acc.current_balance, 0);
    }, 0);
  }

  /**
   * Delete account
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    // Check for existing transactions
    const txCount = await window.TransactionService?.countByAccount(id);
    if (txCount > 0) {
      throw new Error(`Tidak dapat menghapus akun. Masih ada ${txCount} transaksi terkait.`);
    }

    const result = await super.delete(id);

    // Invalidate cache
    AppStore.invalidateCache('accounts');

    return result;
  }

  /**
   * Recalculate account balance from transactions
   * @param {string} id
   * @returns {Promise<number>}
   */
  async recalculateBalance(id) {
    try {
      const account = await this.getById(id);
      if (!account) throw new Error('Akun tidak ditemukan');

      const initialBalance = Validator.currency(account.initial_balance, 0);

      // Get all transactions for this account
      const { data: transactions, error } = await this.getClient()
        .from('transactions')
        .select('*')
        .eq('user_id', this.getUserId())
        .eq('account_id', id);

      if (error) throw error;

      // Calculate balance from transactions
      let calculatedBalance = initialBalance;

      transactions.forEach(tx => {
        const amount = Validator.currency(tx.amount, 0);
        if (tx.type === 'income') {
          calculatedBalance += amount;
        } else if (tx.type === 'expense') {
          calculatedBalance -= amount;
        }
        // Transfer handling would need to check from/to
      });

      // Update account with recalculated balance
      await this.update(id, { current_balance: calculatedBalance });

      ErrorHandler.info(`Account ${id} balance recalculated:`, calculatedBalance);
      return calculatedBalance;
    } catch (error) {
      ErrorHandler.handle(error, 'AccountService.recalculateBalance');
      throw error;
    }
  }
}

// Create singleton instance
const accountService = new AccountService();

// Export global
window.AccountService = accountService;
