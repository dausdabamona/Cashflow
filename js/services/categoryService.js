/**
 * Category Service
 * File: js/services/categoryService.js
 * Handles all category-related operations
 */
const CategoryService = {
  tableName: 'categories',

  /**
   * Get all categories for the current user
   * @returns {Promise<Array>} Array of category objects
   */
  async getAll() {
    try {
      const userId = BaseService.getUserId();
      if (!userId) {
        console.warn('[CategoryService] No user ID');
        return [];
      }

      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[CategoryService.getAll]', error);
      return [];
    }
  },

  /**
   * Get categories by type (income/expense)
   * @param {string} type - Category type ('income' or 'expense')
   * @returns {Promise<Array>} Array of category objects
   */
  async getByType(type) {
    try {
      const userId = BaseService.getUserId();
      if (!userId) {
        console.warn('[CategoryService] No user ID');
        return [];
      }

      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('[CategoryService.getByType]', error);
      return [];
    }
  },

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Promise<Object|null>} Category object or null
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
      console.error('[CategoryService.getById]', error);
      return null;
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<Object|null>} Created category or null
   */
  async create(categoryData) {
    try {
      const userId = BaseService.getUserId();
      if (!userId) {
        console.warn('[CategoryService] No user ID');
        return null;
      }

      const client = BaseService.getClient();
      const { data, error } = await client
        .from(this.tableName)
        .insert({
          ...categoryData,
          user_id: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('[CategoryService.create]', error);
      return null;
    }
  },

  /**
   * Update a category
   * @param {string} id - Category ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated category or null
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
      console.error('[CategoryService.update]', error);
      return null;
    }
  },

  /**
   * Delete a category (soft delete)
   * @param {string} id - Category ID
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
      console.error('[CategoryService.delete]', error);
      return false;
    }
  }
};

// Export ke window
window.CategoryService = CategoryService;

console.log('✅ CategoryService loaded');
