/**
 * Base Service
 * Abstract base class untuk semua services
 */

class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Get Supabase client
   * @returns {Object} Supabase client
   * @throws {Error} jika tidak terautentikasi
   */
  getClient() {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return window.supabase;
  }

  /**
   * Get current user ID
   * @returns {string}
   * @throws {Error} jika tidak terautentikasi
   */
  getUserId() {
    const userId = AppStore.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return userId;
  }

  /**
   * Get all records untuk user saat ini
   * @param {Object} options - Query options
   * @param {string} options.orderBy - Column to order by
   * @param {boolean} options.ascending - Order direction
   * @param {number} options.limit - Limit results
   * @returns {Promise<Array>}
   */
  async getAll(options = {}) {
    const {
      orderBy = 'created_at',
      ascending = false,
      limit = null
    } = options;

    try {
      let query = this.getClient()
        .from(this.tableName)
        .select('*')
        .eq('user_id', this.getUserId())
        .order(orderBy, { ascending });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.getAll`);
      throw error;
    }
  }

  /**
   * Get single record by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    if (!Validator.isValidUUID(id)) {
      throw new Error('Invalid ID format');
    }

    try {
      const { data, error } = await this.getClient()
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', this.getUserId())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.getById`);
      throw error;
    }
  }

  /**
   * Create new record
   * @param {Object} data - Data to insert
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const insertData = {
        ...data,
        user_id: this.getUserId()
      };

      const { data: result, error } = await this.getClient()
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      ErrorHandler.info(`${this.tableName} created:`, result.id);
      return result;
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.create`);
      throw error;
    }
  }

  /**
   * Update record by ID
   * @param {string} id
   * @param {Object} data - Data to update
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    if (!Validator.isValidUUID(id)) {
      throw new Error('Invalid ID format');
    }

    try {
      // Remove fields that shouldn't be updated
      const { id: _id, user_id, created_at, ...updateData } = data;

      const { data: result, error } = await this.getClient()
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', this.getUserId())
        .select()
        .single();

      if (error) throw error;

      ErrorHandler.info(`${this.tableName} updated:`, id);
      return result;
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.update`);
      throw error;
    }
  }

  /**
   * Delete record by ID
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (!Validator.isValidUUID(id)) {
      throw new Error('Invalid ID format');
    }

    try {
      const { error } = await this.getClient()
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', this.getUserId());

      if (error) throw error;

      ErrorHandler.info(`${this.tableName} deleted:`, id);
      return true;
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.delete`);
      throw error;
    }
  }

  /**
   * Batch insert multiple records
   * @param {Array} items - Array of data to insert
   * @returns {Promise<Array>}
   */
  async batchCreate(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    try {
      const userId = this.getUserId();
      const insertData = items.map(item => ({
        ...item,
        user_id: userId
      }));

      const { data, error } = await this.getClient()
        .from(this.tableName)
        .insert(insertData)
        .select();

      if (error) throw error;

      ErrorHandler.info(`${this.tableName} batch created:`, data.length, 'records');
      return data || [];
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.batchCreate`);
      throw error;
    }
  }

  /**
   * Count records with optional filter
   * @param {Object} filters - Column filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    try {
      let query = this.getClient()
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', this.getUserId());

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.count`);
      throw error;
    }
  }

  /**
   * Check if record exists
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    try {
      const record = await this.getById(id);
      return record !== null;
    } catch {
      return false;
    }
  }

  /**
   * Query with custom filters
   * @param {Function} queryBuilder - Function to build query
   * @returns {Promise<Array>}
   */
  async query(queryBuilder) {
    try {
      let query = this.getClient()
        .from(this.tableName)
        .select('*')
        .eq('user_id', this.getUserId());

      // Apply custom query modifications
      query = queryBuilder(query);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      ErrorHandler.handle(error, `${this.tableName}.query`);
      throw error;
    }
  }
}

// Export global
window.BaseService = BaseService;
