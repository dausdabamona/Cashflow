/**
 * Account Service
 * File: js/services/accountService.js
 * Handles all account-related operations
 */
const AccountService = {
  tableName: 'accounts',

  /**
   * Get all active accounts for the current user
   * @returns {Promise<Array>} Array of account objects
   */
  async getAll() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) {
        console.warn('[AccountService] No user ID');
        return [];
      }

      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[AccountService.getAll]', error);
      return [];
    }
  },

  /**
   * Get account by ID
   * @param {string} id - Account ID
   * @returns {Promise<Object|null>} Account object or null
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
      console.error('[AccountService.getById]', error);
      return null;
    }
  },

  /**
   * Get total balance across all accounts (excluding excluded accounts)
   * @returns {Promise<number>} Total balance
   */
  async getTotalBalance() {
    const accounts = await this.getAll();
    return accounts
      .filter(a => !a.is_excluded_from_total)
      .reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0);
  },

  /**
   * Create a new account
   * @param {Object} accountData - Account data
   * @returns {Promise<Object|null>} Created account or null
   */
  async create(accountData) {
    try {
      const userId = BaseService.getUserId();
      if (!userId) {
        console.warn('[AccountService] No user ID');
        return null;
      }

      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .insert({
          ...accountData,
          user_id: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('[AccountService.create]', error);
      return null;
    }
  },

  /**
   * Update an account
   * @param {string} id - Account ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated account or null
   */
  async update(id, updates) {
    try {
      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('[AccountService.update]', error);
      return null;
    }
  },

  /**
   * Update account balance
   * @param {string} id - Account ID
   * @param {number} amount - Amount to add (negative to subtract)
   * @returns {Promise<Object|null>} Updated account or null
   */
  async updateBalance(id, amount) {
    try {
      const account = await this.getById(id);
      if (!account) return null;

      const newBalance = (parseFloat(account.current_balance) || 0) + amount;
      return this.update(id, { current_balance: newBalance });

    } catch (error) {
      console.error('[AccountService.updateBalance]', error);
      return null;
    }
  },

  /**
   * Delete an account (soft delete)
   * @param {string} id - Account ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    try {
      const client = BaseService.getClient();
      const { error } = await client
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('[AccountService.delete]', error);
      return false;
    }
  }
};

// PENTING: Export ke window
window.AccountService = AccountService;

console.log('✅ AccountService loaded');
