/**
 * Reminder Service
 * Mengelola pengingat tagihan dan jatuh tempo
 */

const ReminderService = {

  /**
   * Ambil semua reminders
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const userId = BaseService.getUserId();
      const client = BaseService.getClient();

      const response = await client
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('due_day', { ascending: true });

      const reminders = BaseService.handleResponse(response, 'ReminderService.getAll') || [];

      // Calculate days left untuk setiap reminder
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      return reminders.map(r => {
        let dueDate;
        let daysLeft;

        // Hitung tanggal jatuh tempo bulan ini atau bulan depan
        const dueDay = r.due_day || 1;
        const lastDayThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        if (dueDay >= currentDay) {
          // Jatuh tempo masih bulan ini
          dueDate = new Date(currentYear, currentMonth, Math.min(dueDay, lastDayThisMonth));
        } else {
          // Jatuh tempo bulan depan
          const lastDayNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate();
          dueDate = new Date(currentYear, currentMonth + 1, Math.min(dueDay, lastDayNextMonth));
        }

        // Hitung hari tersisa
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const diffTime = dueMidnight - todayMidnight;
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...r,
          dueDate: dueDate.toISOString().split('T')[0],
          daysLeft,
          isOverdue: daysLeft < 0,
          isUrgent: daysLeft <= 3 && daysLeft >= 0
        };
      });

    } catch (error) {
      ErrorHandler.handle(error, 'ReminderService.getAll', false);
      return [];
    }
  },

  /**
   * Ambil reminders yang urgent (3 hari atau kurang)
   * @returns {Promise<Array>}
   */
  async getUrgent() {
    const all = await this.getAll();
    return all.filter(r => r.daysLeft <= 3).sort((a, b) => a.daysLeft - b.daysLeft);
  },

  /**
   * Buat reminder baru
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async create(data) {
    try {
      const userId = BaseService.getUserId();
      const client = BaseService.getClient();

      if (!data.name || data.name.trim() === '') {
        throw new Error('Nama tagihan wajib diisi');
      }
      if (!data.due_day || data.due_day < 1 || data.due_day > 31) {
        throw new Error('Tanggal jatuh tempo tidak valid (1-31)');
      }

      const reminderData = {
        user_id: userId,
        name: Validator.sanitizeString(data.name, 100),
        type: data.type || 'bill', // bill, loan, other
        amount: Validator.currency(data.amount, 0),
        due_day: data.due_day,
        remind_days_before: data.remind_days_before || 3,
        is_active: true,
        loan_id: data.loan_id || null,
        recurring_id: data.recurring_id || null,
        notes: Validator.sanitizeString(data.notes || '', 500)
      };

      const response = await client
        .from('reminders')
        .insert(reminderData)
        .select()
        .single();

      const result = BaseService.handleResponse(response, 'ReminderService.create');

      Toast?.success('Pengingat berhasil dibuat!');

      return result;

    } catch (error) {
      ErrorHandler.handle(error, 'ReminderService.create');
      return null;
    }
  },

  /**
   * Update reminder
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
      if (data.due_day !== undefined) updateData.due_day = data.due_day;
      if (data.remind_days_before !== undefined) updateData.remind_days_before = data.remind_days_before;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.notes !== undefined) updateData.notes = Validator.sanitizeString(data.notes, 500);

      const response = await client
        .from('reminders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      return BaseService.handleResponse(response, 'ReminderService.update');

    } catch (error) {
      ErrorHandler.handle(error, 'ReminderService.update');
      return null;
    }
  },

  /**
   * Hapus reminder
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const client = BaseService.getClient();

      const response = await client
        .from('reminders')
        .delete()
        .eq('id', id);

      BaseService.handleResponse(response, 'ReminderService.delete');

      Toast?.success('Pengingat dihapus');
      return true;

    } catch (error) {
      ErrorHandler.handle(error, 'ReminderService.delete');
      return false;
    }
  },

  /**
   * Tandai reminder sebagai sudah dibayar (buat transaksi)
   * @param {string} reminderId
   * @param {Object} paymentData
   * @returns {Promise<Object|null>}
   */
  async markAsPaid(reminderId, paymentData = {}) {
    try {
      const reminders = await this.getAll();
      const reminder = reminders.find(r => r.id === reminderId);

      if (!reminder) {
        throw new Error('Pengingat tidak ditemukan');
      }

      // Buat transaksi pembayaran
      const txData = {
        type: 'expense',
        amount: paymentData.amount || reminder.amount,
        account_id: paymentData.account_id,
        category_id: paymentData.category_id,
        date: paymentData.date || BaseService.getToday(),
        description: `Pembayaran: ${reminder.name}`
      };

      const transaction = await TransactionService?.create(txData);

      if (transaction) {
        Toast?.success(`${reminder.name} berhasil dibayar!`);
      }

      return transaction;

    } catch (error) {
      ErrorHandler.handle(error, 'ReminderService.markAsPaid');
      return null;
    }
  },

  /**
   * Cek dan tampilkan notifikasi untuk reminders
   * Dipanggil saat app dibuka
   */
  async checkAndNotify() {
    try {
      const urgent = await this.getUrgent();

      if (urgent.length === 0) return;

      // Group by urgency
      const overdue = urgent.filter(r => r.daysLeft < 0);
      const today = urgent.filter(r => r.daysLeft === 0);
      const upcoming = urgent.filter(r => r.daysLeft > 0);

      // Show notifications
      if (overdue.length > 0) {
        Toast?.error(`${overdue.length} tagihan sudah lewat jatuh tempo!`, 5000);
      }

      if (today.length > 0) {
        Toast?.warning(`${today.length} tagihan jatuh tempo HARI INI!`, 5000);
      }

      if (upcoming.length > 0 && overdue.length === 0 && today.length === 0) {
        Toast?.info(`${upcoming.length} tagihan dalam 3 hari ke depan`);
      }

    } catch (error) {
      ErrorHandler.log('WARN', 'checkAndNotify error', error);
    }
  }
};

// Export global
window.ReminderService = ReminderService;
