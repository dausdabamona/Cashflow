/**
 * Transaction Module
 * File: web/js/transaction.js
 * Handles transaction forms (income, expense, transfer)
 */
const Transaction = {
  currentType: null,

  /**
   * Show expense form
   */
  showExpenseForm() {
    this.currentType = 'expense';
    this.showModal('Tambah Pengeluaran', this.renderExpenseForm());
    this.loadFormData();
  },

  /**
   * Show income form
   */
  showIncomeForm() {
    this.currentType = 'income';
    this.showModal('Tambah Pemasukan', this.renderIncomeForm());
    this.loadFormData();
  },

  /**
   * Show transfer form
   */
  showTransferForm() {
    this.currentType = 'transfer';
    this.showModal('Transfer Antar Akun', this.renderTransferForm());
    this.loadFormData();
  },

  /**
   * Show modal with content
   */
  showModal(title, content) {
    var modal = document.getElementById('transaction-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'transaction-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-overlay" onclick="Transaction.closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            <button class="modal-close" onclick="Transaction.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'block';
  },

  /**
   * Close modal
   */
  closeModal() {
    var modal = document.getElementById('transaction-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  /**
   * Render expense form HTML
   */
  renderExpenseForm() {
    return `
      <form id="expense-form" onsubmit="Transaction.saveExpense(event)">
        <!-- Jumlah -->
        <div class="form-group">
          <label class="form-label">Jumlah</label>
          <div class="input-with-prefix">
            <span class="input-prefix">Rp</span>
            <input type="number" id="expense-amount" class="form-input" placeholder="0" required min="1">
          </div>
        </div>

        <!-- Kategori -->
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="expense-category" class="form-input">
            <option value="">Pilih kategori</option>
          </select>
        </div>

        <!-- Dari Akun -->
        <div class="form-group">
          <label class="form-label">Dari Akun</label>
          <select id="expense-account" class="form-input">
            <option value="">Pilih akun</option>
          </select>
        </div>

        <!-- Terkait Barang/Item (BARU) -->
        <div class="form-group">
          <label class="form-label">
            Terkait Barang/Item <span class="label-optional">(opsional)</span>
          </label>
          <select id="expense-item" class="form-input">
            <option value="">-- Tidak terkait barang --</option>
          </select>
          <p class="form-hint">Pilih jika pengeluaran ini untuk barang tertentu (bensin motor, cicilan laptop)</p>
        </div>

        <!-- Tanggal -->
        <div class="form-group">
          <label class="form-label">Tanggal</label>
          <input type="date" id="expense-date" class="form-input" value="${BaseService.getToday()}">
        </div>

        <!-- Catatan -->
        <div class="form-group">
          <label class="form-label">Catatan <span class="label-optional">(opsional)</span></label>
          <textarea id="expense-description" class="form-input" rows="2" placeholder="Tambah catatan..."></textarea>
        </div>

        <!-- Tombol Simpan -->
        <button type="submit" class="btn btn-expense">
          <span>💸</span> Simpan Pengeluaran
        </button>
      </form>
    `;
  },

  /**
   * Render income form HTML
   */
  renderIncomeForm() {
    return `
      <form id="income-form" onsubmit="Transaction.saveIncome(event)">
        <!-- Jumlah -->
        <div class="form-group">
          <label class="form-label">Jumlah</label>
          <div class="input-with-prefix">
            <span class="input-prefix">Rp</span>
            <input type="number" id="income-amount" class="form-input" placeholder="0" required min="1">
          </div>
        </div>

        <!-- Tipe Pemasukan -->
        <div class="form-group">
          <label class="form-label">Tipe Pemasukan</label>
          <select id="income-type" class="form-input">
            <option value="active">💼 Aktif (Gaji, Freelance)</option>
            <option value="passive">💰 Pasif (Dividen, Sewa, Royalti)</option>
          </select>
        </div>

        <!-- Kategori -->
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="income-category" class="form-input">
            <option value="">Pilih kategori</option>
          </select>
        </div>

        <!-- Ke Akun -->
        <div class="form-group">
          <label class="form-label">Ke Akun</label>
          <select id="income-account" class="form-input">
            <option value="">Pilih akun</option>
          </select>
        </div>

        <!-- Terkait Barang/Item -->
        <div class="form-group">
          <label class="form-label">
            Dari Barang/Item <span class="label-optional">(opsional)</span>
          </label>
          <select id="income-item" class="form-input">
            <option value="">-- Tidak terkait barang --</option>
          </select>
          <p class="form-hint">Pilih jika pemasukan dari barang tertentu (ojol dari motor, sewa dari properti)</p>
        </div>

        <!-- Tanggal -->
        <div class="form-group">
          <label class="form-label">Tanggal</label>
          <input type="date" id="income-date" class="form-input" value="${BaseService.getToday()}">
        </div>

        <!-- Catatan -->
        <div class="form-group">
          <label class="form-label">Catatan <span class="label-optional">(opsional)</span></label>
          <textarea id="income-description" class="form-input" rows="2" placeholder="Tambah catatan..."></textarea>
        </div>

        <!-- Tombol Simpan -->
        <button type="submit" class="btn btn-income">
          <span>💵</span> Simpan Pemasukan
        </button>
      </form>
    `;
  },

  /**
   * Render transfer form HTML
   */
  renderTransferForm() {
    return `
      <form id="transfer-form" onsubmit="Transaction.saveTransfer(event)">
        <!-- Jumlah -->
        <div class="form-group">
          <label class="form-label">Jumlah</label>
          <div class="input-with-prefix">
            <span class="input-prefix">Rp</span>
            <input type="number" id="transfer-amount" class="form-input" placeholder="0" required min="1">
          </div>
        </div>

        <!-- Dari Akun -->
        <div class="form-group">
          <label class="form-label">Dari Akun</label>
          <select id="transfer-from-account" class="form-input" required>
            <option value="">Pilih akun asal</option>
          </select>
        </div>

        <!-- Ke Akun -->
        <div class="form-group">
          <label class="form-label">Ke Akun</label>
          <select id="transfer-to-account" class="form-input" required>
            <option value="">Pilih akun tujuan</option>
          </select>
        </div>

        <!-- Tanggal -->
        <div class="form-group">
          <label class="form-label">Tanggal</label>
          <input type="date" id="transfer-date" class="form-input" value="${BaseService.getToday()}">
        </div>

        <!-- Catatan -->
        <div class="form-group">
          <label class="form-label">Catatan <span class="label-optional">(opsional)</span></label>
          <textarea id="transfer-description" class="form-input" rows="2" placeholder="Tambah catatan..."></textarea>
        </div>

        <!-- Tombol Simpan -->
        <button type="submit" class="btn btn-transfer">
          <span>🔄</span> Simpan Transfer
        </button>
      </form>
    `;
  },

  /**
   * Load form data (categories, accounts, items)
   */
  async loadFormData() {
    await Promise.all([
      this.loadAccountsDropdown(),
      this.loadCategoriesDropdown(),
      this.loadItemsDropdown()
    ]);
  },

  /**
   * Load accounts into dropdown
   */
  async loadAccountsDropdown() {
    try {
      var accounts = await AccountService.getAll();

      // Expense form
      var expenseAccount = document.getElementById('expense-account');
      if (expenseAccount) {
        expenseAccount.innerHTML = '<option value="">Pilih akun</option>';
        accounts.forEach(function(acc) {
          var opt = document.createElement('option');
          opt.value = acc.id;
          opt.textContent = (acc.icon || '🏦') + ' ' + acc.name;
          expenseAccount.appendChild(opt);
        });
      }

      // Income form
      var incomeAccount = document.getElementById('income-account');
      if (incomeAccount) {
        incomeAccount.innerHTML = '<option value="">Pilih akun</option>';
        accounts.forEach(function(acc) {
          var opt = document.createElement('option');
          opt.value = acc.id;
          opt.textContent = (acc.icon || '🏦') + ' ' + acc.name;
          incomeAccount.appendChild(opt);
        });
      }

      // Transfer form
      var transferFrom = document.getElementById('transfer-from-account');
      var transferTo = document.getElementById('transfer-to-account');
      if (transferFrom && transferTo) {
        transferFrom.innerHTML = '<option value="">Pilih akun asal</option>';
        transferTo.innerHTML = '<option value="">Pilih akun tujuan</option>';
        accounts.forEach(function(acc) {
          var opt1 = document.createElement('option');
          opt1.value = acc.id;
          opt1.textContent = (acc.icon || '🏦') + ' ' + acc.name;
          transferFrom.appendChild(opt1);

          var opt2 = document.createElement('option');
          opt2.value = acc.id;
          opt2.textContent = (acc.icon || '🏦') + ' ' + acc.name;
          transferTo.appendChild(opt2);
        });
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  },

  /**
   * Load categories into dropdown
   */
  async loadCategoriesDropdown() {
    try {
      var categories = await CategoryService.getAll();

      // Expense categories
      var expenseCategory = document.getElementById('expense-category');
      if (expenseCategory) {
        var expenseCats = categories.filter(function(c) { return c.type === 'expense'; });
        expenseCategory.innerHTML = '<option value="">Pilih kategori</option>';
        expenseCats.forEach(function(cat) {
          var opt = document.createElement('option');
          opt.value = cat.id;
          opt.textContent = (cat.icon || '📁') + ' ' + cat.name;
          expenseCategory.appendChild(opt);
        });
      }

      // Income categories
      var incomeCategory = document.getElementById('income-category');
      if (incomeCategory) {
        var incomeCats = categories.filter(function(c) { return c.type === 'income'; });
        incomeCategory.innerHTML = '<option value="">Pilih kategori</option>';
        incomeCats.forEach(function(cat) {
          var opt = document.createElement('option');
          opt.value = cat.id;
          opt.textContent = (cat.icon || '📁') + ' ' + cat.name;
          incomeCategory.appendChild(opt);
        });
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  },

  /**
   * Load items into dropdown (grouped by type)
   */
  async loadItemsDropdown() {
    try {
      var items = await ItemService.getActive();

      var selects = ['expense-item', 'income-item'];

      selects.forEach(function(selectId) {
        var select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = '<option value="">-- Tidak terkait barang --</option>';

        if (items.length === 0) return;

        // Group by type
        var assetItems = items.filter(function(i) { return i.type === 'asset'; });
        var liabilityItems = items.filter(function(i) { return i.type === 'liability'; });
        var neutralItems = items.filter(function(i) { return !i.type || i.type === 'neutral'; });

        // Add Asset items
        if (assetItems.length > 0) {
          var assetGroup = document.createElement('optgroup');
          assetGroup.label = '📈 Aset';
          assetItems.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.name;
            assetGroup.appendChild(opt);
          });
          select.appendChild(assetGroup);
        }

        // Add Liability items
        if (liabilityItems.length > 0) {
          var liabGroup = document.createElement('optgroup');
          liabGroup.label = '📉 Liabilitas';
          liabilityItems.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.name;
            liabGroup.appendChild(opt);
          });
          select.appendChild(liabGroup);
        }

        // Add Neutral/Other items
        if (neutralItems.length > 0) {
          var neutralGroup = document.createElement('optgroup');
          neutralGroup.label = '⚖️ Lainnya';
          neutralItems.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.name;
            neutralGroup.appendChild(opt);
          });
          select.appendChild(neutralGroup);
        }
      });
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  },

  /**
   * Save expense transaction
   */
  async saveExpense(event) {
    event.preventDefault();

    var amount = document.getElementById('expense-amount').value;
    var categoryId = document.getElementById('expense-category').value;
    var accountId = document.getElementById('expense-account').value;
    var itemId = document.getElementById('expense-item').value;
    var date = document.getElementById('expense-date').value;
    var description = document.getElementById('expense-description').value;

    if (!amount || parseFloat(amount) <= 0) {
      Toast.error('Masukkan jumlah yang valid');
      return;
    }

    Loading.show('Menyimpan...');

    var data = {
      type: 'expense',
      amount: parseFloat(amount),
      category_id: categoryId || null,
      account_id: accountId || null,
      item_id: itemId || null,
      date: date || BaseService.getToday(),
      description: description || null
    };

    var result = await TransactionService.create(data);

    Loading.hide();

    if (result) {
      Toast.success('Pengeluaran berhasil disimpan');
      this.closeModal();
      Dashboard.refresh();
    } else {
      Toast.error('Gagal menyimpan pengeluaran');
    }
  },

  /**
   * Save income transaction
   */
  async saveIncome(event) {
    event.preventDefault();

    var amount = document.getElementById('income-amount').value;
    var incomeType = document.getElementById('income-type').value;
    var categoryId = document.getElementById('income-category').value;
    var accountId = document.getElementById('income-account').value;
    var itemId = document.getElementById('income-item').value;
    var date = document.getElementById('income-date').value;
    var description = document.getElementById('income-description').value;

    if (!amount || parseFloat(amount) <= 0) {
      Toast.error('Masukkan jumlah yang valid');
      return;
    }

    Loading.show('Menyimpan...');

    var data = {
      type: 'income',
      income_type: incomeType || 'active',
      amount: parseFloat(amount),
      category_id: categoryId || null,
      account_id: accountId || null,
      item_id: itemId || null,
      date: date || BaseService.getToday(),
      description: description || null
    };

    var result = await TransactionService.create(data);

    Loading.hide();

    if (result) {
      Toast.success('Pemasukan berhasil disimpan');
      this.closeModal();
      Dashboard.refresh();
    } else {
      Toast.error('Gagal menyimpan pemasukan');
    }
  },

  /**
   * Save transfer transaction
   */
  async saveTransfer(event) {
    event.preventDefault();

    var amount = document.getElementById('transfer-amount').value;
    var fromAccountId = document.getElementById('transfer-from-account').value;
    var toAccountId = document.getElementById('transfer-to-account').value;
    var date = document.getElementById('transfer-date').value;
    var description = document.getElementById('transfer-description').value;

    if (!amount || parseFloat(amount) <= 0) {
      Toast.error('Masukkan jumlah yang valid');
      return;
    }

    if (!fromAccountId || !toAccountId) {
      Toast.error('Pilih akun asal dan tujuan');
      return;
    }

    if (fromAccountId === toAccountId) {
      Toast.error('Akun asal dan tujuan tidak boleh sama');
      return;
    }

    Loading.show('Menyimpan...');

    var data = {
      type: 'transfer',
      amount: parseFloat(amount),
      account_id: fromAccountId,
      to_account_id: toAccountId,
      date: date || BaseService.getToday(),
      description: description || null
    };

    var result = await TransactionService.create(data);

    Loading.hide();

    if (result) {
      Toast.success('Transfer berhasil disimpan');
      this.closeModal();
      Dashboard.refresh();
    } else {
      Toast.error('Gagal menyimpan transfer');
    }
  }
};

window.Transaction = Transaction;
console.log('✅ Transaction module loaded');
