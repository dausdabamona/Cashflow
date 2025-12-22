/**
 * Recurring Transaction Service
 * Mengelola transaksi berulang (gaji, cicilan, tagihan rutin)
 */

const RecurringService = {

  /**
   * Ambil semua recurring transactions
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const userId = BaseService.getUserId();
      const client = BaseService.getClient();

      const response = await client
        .from('recurring_transactions')
        .select(`
          *,
          category:categories(id, name, icon, type),
          account:accounts(id, name, type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return BaseService.handleResponse(response, 'RecurringService.getAll') || [];

    } catch (error) {
      ErrorHandler.handle(error, 'RecurringService.getAll', false);
      return [];
    }
  },

  /**
   * Ambil recurring yang aktif
   * @returns {Promise<Array>}
   */
  async getActive() {
    const all = await this.getAll();
    return all.filter(r => r.is_active);
  },

  /**
   * Buat recurring transaction baru
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async create(data) {
    try {
      const userId = BaseService.getUserId();
      const client = BaseService.getClient();

      // Validasi
      if (!data.name || data.name.trim() === '') {
        throw new Error('Nama transaksi wajib diisi');
      }
      if (!data.amount || Validator.currency(data.amount) <= 0) {
        throw new Error('Jumlah harus lebih dari 0');
      }

      const recurringData = {
        user_id: userId,
        name: Validator.sanitizeString(data.name, 100),
        type: data.type || 'expense',
        amount: Validator.currency(data.amount),
        account_id: data.account_id,
        category_id: data.category_id,
        income_type: data.type === 'income' ? (data.income_type || 'active') : null,

        // Jadwal
        frequency: data.frequency || 'monthly', // daily, weekly, monthly, yearly
        start_date: data.start_date || BaseService.getToday(),
        end_date: data.end_date || null,
        day_of_month: data.day_of_month || new Date().getDate(), // 1-31
        day_of_week: data.day_of_week || null, // 0-6 untuk weekly

        // Status
        is_active: true,
        last_executed: null,
        execution_count: 0,

        // Metadata
        notes: Validator.sanitizeString(data.notes || '', 500)
      };

      const response = await client
        .from('recurring_transactions')
        .insert(recurringData)
        .select(`
          *,
          category:categories(id, name, icon, type),
          account:accounts(id, name, type)
        `)
        .single();

      const result = BaseService.handleResponse(response, 'RecurringService.create');

      Toast?.success('Transaksi berulang berhasil dibuat!');

      return result;

    } catch (error) {
      ErrorHandler.handle(error, 'RecurringService.create');
      return null;
    }
  },

  /**
   * Update recurring transaction
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    try {
      const client = BaseService.getClient();

      const updateData = { updated_at: new Date().toISOString() };

      if (data.name !== undefined) updateData.name = Validator.sanitizeString(data.name, 100);
      if (data.amount !== undefined) updateData.amount = Validator.currency(data.amount);
      if (data.account_id !== undefined) updateData.account_id = data.account_id;
      if (data.category_id !== undefined) updateData.category_id = data.category_id;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.day_of_month !== undefined) updateData.day_of_month = data.day_of_month;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.notes !== undefined) updateData.notes = Validator.sanitizeString(data.notes, 500);
      if (data.last_executed !== undefined) updateData.last_executed = data.last_executed;
      if (data.execution_count !== undefined) updateData.execution_count = data.execution_count;

      const response = await client
        .from('recurring_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return BaseService.handleResponse(response, 'RecurringService.update');

    } catch (error) {
      ErrorHandler.handle(error, 'RecurringService.update');
      return null;
    }
  },

  /**
   * Toggle status aktif
   * @param {string} id
   * @param {boolean} isActive
   * @returns {Promise<boolean>}
   */
  async toggleActive(id, isActive) {
    const result = await this.update(id, { is_active: isActive });
    if (result) {
      Toast?.success(isActive ? 'Transaksi berulang diaktifkan' : 'Transaksi berulang dinonaktifkan');
    }
    return !!result;
  },

  /**
   * Hapus recurring transaction
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const client = BaseService.getClient();

      const response = await client
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      BaseService.handleResponse(response, 'RecurringService.delete');

      Toast?.success('Transaksi berulang dihapus');
      return true;

    } catch (error) {
      ErrorHandler.handle(error, 'RecurringService.delete');
      return false;
    }
  },

  /**
   * Eksekusi recurring transactions yang jatuh tempo
   * Dipanggil saat app dibuka atau secara manual
   * @returns {Promise<Array>} transaksi yang dibuat
   */
  async executeDue() {
    try {
      const activeRecurring = await this.getActive();
      const today = new Date();
      const todayStr = BaseService.getToday();
      const createdTransactions = [];

      for (const recurring of activeRecurring) {
        // Cek apakah sudah dieksekusi hari ini
        if (recurring.last_executed === todayStr) {
          continue;
        }

        // Cek apakah sudah melewati tanggal mulai
        if (new Date(recurring.start_date) > today) {
          continue;
        }

        // Cek apakah sudah melewati tanggal akhir
        if (recurring.end_date && new Date(recurring.end_date) < today) {
          continue;
        }

        // Cek jadwal sesuai frequency
        let shouldExecute = false;

        switch (recurring.frequency) {
          case 'daily':
            shouldExecute = true;
            break;

          case 'weekly':
            shouldExecute = today.getDay() === recurring.day_of_week;
            break;

          case 'monthly':
            const dayOfMonth = recurring.day_of_month || 1;
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            // Jika tanggal > hari dalam bulan, eksekusi di hari terakhir
            const targetDay = Math.min(dayOfMonth, lastDayOfMonth);
            shouldExecute = today.getDate() === targetDay;
            break;

          case 'yearly':
            // Asumsi day_of_month dan month disimpan
            shouldExecute = today.getDate() === recurring.day_of_month &&
                           today.getMonth() === (recurring.month || 0);
            break;
        }

        if (shouldExecute) {
          // Buat transaksi
          const txData = {
            type: recurring.type,
            amount: recurring.amount,
            account_id: recurring.account_id,
            category_id: recurring.category_id,
            date: todayStr,
            description: `[Auto] ${recurring.name}`,
            income_type: recurring.income_type,
            recurring_id: recurring.id
          };

          const newTx = await TransactionService?.create(txData);

          if (newTx) {
            createdTransactions.push(newTx);

            // Update last_executed
            await this.update(recurring.id, {
              last_executed: todayStr,
              execution_count: (recurring.execution_count || 0) + 1
            });
          }
        }
      }

      if (createdTransactions.length > 0) {
        Toast?.info(`${createdTransactions.length} transaksi otomatis dibuat`);
      }

      return createdTransactions;

    } catch (error) {
      ErrorHandler.handle(error, 'RecurringService.executeDue', false);
      return [];
    }
  },

  /**
   * Hitung berapa kali tersisa (untuk cicilan)
   * @param {Object} recurring
   * @returns {number|null}
   */
  calculateRemaining(recurring) {
    if (!recurring.end_date) return null;

    const today = new Date();
    const endDate = new Date(recurring.end_date);

    if (endDate <= today) return 0;

    const diffMonths = (endDate.getFullYear() - today.getFullYear()) * 12 +
                       (endDate.getMonth() - today.getMonth());

    return Math.max(0, diffMonths);
  }
};

// Export global
window.RecurringService = RecurringService;
