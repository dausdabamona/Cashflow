/**
 * Category Service
 * Mengelola semua operasi terkait kategori transaksi
 */

class CategoryService extends BaseService {
  constructor() {
    super('categories');
  }

  /**
   * Get all categories dengan caching
   * @param {boolean} forceRefresh - Skip cache
   * @returns {Promise<Array>}
   */
  async getAll(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = AppStore.getCache('categories');
      if (cached) {
        return cached;
      }
    }

    const categories = await super.getAll({ orderBy: 'name', ascending: true });

    // Update store
    AppStore.setCategories(categories);

    return categories;
  }

  /**
   * Get categories by type
   * @param {string} type - income or expense
   * @returns {Promise<Array>}
   */
  async getByType(type) {
    const categories = await this.getAll();
    return categories.filter(c => c.type === type);
  }

  /**
   * Get income categories
   * @returns {Promise<Array>}
   */
  async getIncomeCategories() {
    return this.getByType('income');
  }

  /**
   * Get expense categories
   * @returns {Promise<Array>}
   */
  async getExpenseCategories() {
    return this.getByType('expense');
  }

  /**
   * Create new category
   * @param {Object} data - Category data
   * @returns {Promise<Object>}
   */
  async create(data) {
    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nama kategori wajib diisi');
    }

    if (!data.type || !['income', 'expense'].includes(data.type)) {
      throw new Error('Tipe kategori tidak valid');
    }

    const categoryData = {
      name: Validator.sanitizeString(data.name, 100),
      type: data.type,
      icon: data.icon || '📁',
      color: data.color || '#6B7280',
      budget: Validator.currency(data.budget, 0)
    };

    const result = await super.create(categoryData);

    // Invalidate cache and refresh
    AppStore.invalidateCache('categories');
    await this.getAll(true);

    return result;
  }

  /**
   * Update category
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const updateData = {};

    if (data.name !== undefined) {
      updateData.name = Validator.sanitizeString(data.name, 100);
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }
    if (data.color !== undefined) {
      updateData.color = data.color;
    }
    if (data.budget !== undefined) {
      updateData.budget = Validator.currency(data.budget, 0);
    }

    const result = await super.update(id, updateData);

    // Invalidate cache and refresh
    AppStore.invalidateCache('categories');
    await this.getAll(true);

    return result;
  }

  /**
   * Delete category
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    // Check for existing transactions
    const txCount = await window.TransactionService?.countByCategory(id);
    if (txCount > 0) {
      throw new Error(`Tidak dapat menghapus kategori. Masih ada ${txCount} transaksi terkait.`);
    }

    const result = await super.delete(id);

    // Invalidate cache
    AppStore.invalidateCache('categories');

    return result;
  }

  /**
   * Get category with budget status for current month
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getWithBudgetStatus(id) {
    const category = await this.getById(id);
    if (!category) return null;

    const budget = Validator.currency(category.budget, 0);
    if (budget <= 0) {
      return {
        ...category,
        budgetStatus: null
      };
    }

    // Get this month's spending for this category
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data, error } = await this.getClient()
      .from('transactions')
      .select('amount')
      .eq('user_id', this.getUserId())
      .eq('category_id', id)
      .eq('type', 'expense')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (error) {
      ErrorHandler.warn('Failed to get budget status:', error);
      return { ...category, budgetStatus: null };
    }

    const spent = (data || []).reduce((sum, tx) => {
      return sum + Validator.currency(tx.amount, 0);
    }, 0);

    return {
      ...category,
      budgetStatus: Formatter.budgetStatus(spent, budget)
    };
  }

  /**
   * Get all categories with budget status
   * @returns {Promise<Array>}
   */
  async getAllWithBudgetStatus() {
    const categories = await this.getAll();
    const expenseCategories = categories.filter(c => c.type === 'expense');

    // Get current month's transactions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: transactions, error } = await this.getClient()
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', this.getUserId())
      .eq('type', 'expense')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (error) {
      ErrorHandler.warn('Failed to get transactions for budget:', error);
      return categories;
    }

    // Calculate spending per category
    const spendingByCategory = {};
    (transactions || []).forEach(tx => {
      if (tx.category_id) {
        const current = spendingByCategory[tx.category_id] || 0;
        spendingByCategory[tx.category_id] = current + Validator.currency(tx.amount, 0);
      }
    });

    // Add budget status to expense categories with budget
    return categories.map(cat => {
      if (cat.type !== 'expense') {
        return cat;
      }

      const budget = Validator.currency(cat.budget, 0);
      if (budget <= 0) {
        return { ...cat, budgetStatus: null };
      }

      const spent = spendingByCategory[cat.id] || 0;
      return {
        ...cat,
        budgetStatus: Formatter.budgetStatus(spent, budget)
      };
    });
  }

  /**
   * Get categories over budget
   * @returns {Promise<Array>}
   */
  async getOverBudgetCategories() {
    const categoriesWithStatus = await this.getAllWithBudgetStatus();
    return categoriesWithStatus.filter(c =>
      c.budgetStatus && c.budgetStatus.percentage > 100
    );
  }

  /**
   * Get categories near budget limit (80%+)
   * @returns {Promise<Array>}
   */
  async getNearBudgetCategories() {
    const categoriesWithStatus = await this.getAllWithBudgetStatus();
    return categoriesWithStatus.filter(c =>
      c.budgetStatus &&
      c.budgetStatus.percentage >= 80 &&
      c.budgetStatus.percentage <= 100
    );
  }

  /**
   * Create default categories for new user
   * @returns {Promise<Array>}
   */
  async createDefaultCategories() {
    const defaultCategories = [
      // Income categories
      { name: 'Gaji', type: 'income', icon: '💼' },
      { name: 'Freelance', type: 'income', icon: '💻' },
      { name: 'Investasi', type: 'income', icon: '📈' },
      { name: 'Bonus', type: 'income', icon: '🎁' },
      { name: 'Lainnya', type: 'income', icon: '💰' },

      // Expense categories
      { name: 'Makanan', type: 'expense', icon: '🍔' },
      { name: 'Transportasi', type: 'expense', icon: '🚗' },
      { name: 'Belanja', type: 'expense', icon: '🛒' },
      { name: 'Tagihan', type: 'expense', icon: '📄' },
      { name: 'Hiburan', type: 'expense', icon: '🎬' },
      { name: 'Kesehatan', type: 'expense', icon: '💊' },
      { name: 'Pendidikan', type: 'expense', icon: '📚' },
      { name: 'Lainnya', type: 'expense', icon: '📦' }
    ];

    try {
      const created = await this.batchCreate(defaultCategories);
      ErrorHandler.info('Default categories created:', created.length);
      return created;
    } catch (error) {
      ErrorHandler.handle(error, 'CategoryService.createDefaultCategories');
      return [];
    }
  }
}

// Create singleton instance
const categoryService = new CategoryService();

// Export global
window.CategoryService = categoryService;
