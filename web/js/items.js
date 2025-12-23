/**
 * Items Management Module
 * File: web/js/items.js
 * Handles asset and liability tracking
 */
const Items = {
  currentItems: [],
  currentItem: null,

  /**
   * Initialize items page
   */
  async init() {
    console.log('[Items] Initializing...');
    try {
      Loading.show('Memuat data items...');
      await this.loadItems();
      this.render();
      Loading.hide();
    } catch (error) {
      Loading.hide();
      ErrorHandler.handle(error, 'Items.init');
    }
  },

  /**
   * Load all items
   */
  async loadItems() {
    try {
      this.currentItems = await ItemService.getAll();
    } catch (error) {
      console.error('[Items.loadItems]', error);
      throw error;
    }
  },

  /**
   * Render items page
   */
  render() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    // Calculate summary
    const summary = this.calculateSummary(this.currentItems);

    container.innerHTML = `
      <!-- Page Title -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 class="section-title" style="margin-bottom: 0;">📊 Manajemen Aset & Liabilitas</h2>
        <button onclick="Items.showItemForm()" class="btn-add-item" style="padding: 10px 20px; background: #3B82F6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          ➕ Tambah Item
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" style="margin-bottom: 32px;">
        <div class="card summary-card">
          <div class="card-icon" style="background: #D1FAE5;">📈</div>
          <div class="card-content">
            <p class="card-label">Total Aset</p>
            <p class="card-value text-green">${Formatter.currency(summary.totalAssets)}</p>
            <p style="font-size: 0.75rem; color: #9ca3af;">${summary.assetCount} item</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon" style="background: #FEE2E2;">📉</div>
          <div class="card-content">
            <p class="card-label">Total Liabilitas</p>
            <p class="card-value text-red">${Formatter.currency(summary.totalLiabilities)}</p>
            <p style="font-size: 0.75rem; color: #9ca3af;">${summary.liabilityCount} item</p>
          </div>
        </div>

        <div class="card summary-card">
          <div class="card-icon" style="background: #DBEAFE;">💎</div>
          <div class="card-content">
            <p class="card-label">Net Worth dari Items</p>
            <p class="card-value ${summary.netWorth >= 0 ? 'text-green' : 'text-red'}">${Formatter.currency(summary.netWorth)}</p>
            <p style="font-size: 0.75rem; color: #9ca3af;">Total item: ${summary.totalCount}</p>
          </div>
        </div>
      </div>

      <!-- Items List -->
      ${this.renderItemsList(this.currentItems)}

      <!-- Item Modal (akan ditambahkan secara dinamis) -->
      <div id="item-modal" style="display: none;"></div>
    `;
  },

  /**
   * Render items list
   */
  renderItemsList(items) {
    if (!items || items.length === 0) {
      return `
        <div class="empty-state-box">
          <div class="empty-icon">📦</div>
          <h3>Belum ada item</h3>
          <p>Mulai tambahkan aset dan liabilitas Anda untuk tracking yang lebih baik</p>
          <button onclick="Items.showItemForm()" class="btn-init">
            ➕ Tambah Item Pertama
          </button>
        </div>
      `;
    }

    // Group items by type
    const assets = items.filter(i => i.type === 'asset');
    const liabilities = items.filter(i => i.type === 'liability');
    const neutral = items.filter(i => !i.type || i.type === 'neutral');

    return `
      <!-- Assets Section -->
      ${assets.length > 0 ? `
        <div class="section">
          <h3 class="section-title">📈 Aset (${assets.length})</h3>
          <div class="items-grid">
            ${assets.map(item => this.renderItemCard(item, 'asset')).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Liabilities Section -->
      ${liabilities.length > 0 ? `
        <div class="section">
          <h3 class="section-title">📉 Liabilitas (${liabilities.length})</h3>
          <div class="items-grid">
            ${liabilities.map(item => this.renderItemCard(item, 'liability')).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Neutral Section -->
      ${neutral.length > 0 ? `
        <div class="section">
          <h3 class="section-title">⚖️ Lainnya (${neutral.length})</h3>
          <div class="items-grid">
            ${neutral.map(item => this.renderItemCard(item, 'neutral')).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  /**
   * Render single item card
   */
  renderItemCard(item, type) {
    const typeConfig = {
      asset: { bg: '#D1FAE5', border: '#10B981', icon: '📈' },
      liability: { bg: '#FEE2E2', border: '#EF4444', icon: '📉' },
      neutral: { bg: '#F3F4F6', border: '#9CA3AF', icon: '⚖️' }
    };

    const config = typeConfig[type] || typeConfig.neutral;
    const depreciation = item.purchase_value - item.current_value;
    const depreciationPercent = item.purchase_value > 0
      ? ((depreciation / item.purchase_value) * 100).toFixed(1)
      : 0;

    return `
      <div class="item-card" onclick="Items.showItemDetail('${item.id}')" style="cursor: pointer; background: white; border-radius: 12px; padding: 20px; border-left: 4px solid ${config.border}; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <div style="display: inline-block; padding: 4px 12px; background: ${config.bg}; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: ${config.border}; margin-bottom: 8px;">
              ${config.icon} ${type.toUpperCase()}
            </div>
            <h4 style="font-size: 1.125rem; font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.name}</h4>
            <p style="font-size: 0.875rem; color: #6b7280;">${item.description || '-'}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
          <div>
            <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 4px;">Nilai Beli</p>
            <p style="font-size: 0.875rem; font-weight: 600; color: #374151;">${Formatter.currency(item.purchase_value)}</p>
          </div>
          <div>
            <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 4px;">Nilai Sekarang</p>
            <p style="font-size: 0.875rem; font-weight: 600; color: #374151;">${Formatter.currency(item.current_value)}</p>
          </div>
        </div>

        ${depreciation !== 0 ? `
          <div style="margin-top: 12px; padding: 8px 12px; background: ${depreciation > 0 ? '#FEF3C7' : '#D1FAE5'}; border-radius: 6px;">
            <p style="font-size: 0.75rem; color: ${depreciation > 0 ? '#92400E' : '#065F46'};">
              ${depreciation > 0 ? '📉 Penyusutan' : '📈 Apresiasi'}: ${Formatter.currency(Math.abs(depreciation))} (${depreciationPercent}%)
            </p>
          </div>
        ` : ''}

        <div style="margin-top: 12px; font-size: 0.75rem; color: #9ca3af;">
          📅 Dibeli: ${Formatter.date(item.acquired_date)}
        </div>
      </div>
    `;
  },

  /**
   * Calculate items summary
   */
  calculateSummary(items) {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let assetCount = 0;
    let liabilityCount = 0;

    items.forEach(item => {
      const value = parseFloat(item.current_value) || 0;
      if (item.type === 'asset') {
        totalAssets += value;
        assetCount++;
      } else if (item.type === 'liability') {
        totalLiabilities += value;
        liabilityCount++;
      }
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      assetCount,
      liabilityCount,
      totalCount: items.length
    };
  },

  /**
   * Show item form
   */
  showItemForm(itemId = null) {
    const isEdit = !!itemId;
    const item = isEdit ? this.currentItems.find(i => i.id === itemId) : null;

    const modalContent = `
      <div class="modal-overlay" onclick="Items.closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">${isEdit ? 'Edit Item' : '➕ Tambah Item Baru'}</h2>
            <button class="modal-close" onclick="Items.closeModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="item-form" onsubmit="Items.saveItem(event, ${isEdit ? `'${itemId}'` : 'null'})">

              <!-- Nama Item -->
              <div class="form-group">
                <label class="form-label">Nama Item</label>
                <input type="text" id="item-name" class="form-input" placeholder="Contoh: Motor PCX, Laptop, Rumah" value="${item?.name || ''}" required>
              </div>

              <!-- Tipe Item -->
              <div class="form-group">
                <label class="form-label">Tipe Item</label>
                <select id="item-type" class="form-input" required>
                  <option value="">Pilih tipe</option>
                  <option value="asset" ${item?.type === 'asset' ? 'selected' : ''}>📈 Aset (menghasilkan uang / nilai naik)</option>
                  <option value="liability" ${item?.type === 'liability' ? 'selected' : ''}>📉 Liabilitas (mengeluarkan uang / nilai turun)</option>
                  <option value="neutral" ${item?.type === 'neutral' ? 'selected' : ''}>⚖️ Netral (tidak jelas)</option>
                </select>
                <p class="form-hint">
                  <strong>Aset:</strong> Motor ojol, rumah kos, saham<br>
                  <strong>Liabilitas:</strong> Motor pribadi, gadget, pakaian
                </p>
              </div>

              <!-- Deskripsi -->
              <div class="form-group">
                <label class="form-label">Deskripsi <span class="label-optional">(opsional)</span></label>
                <textarea id="item-description" class="form-input" rows="2" placeholder="Tambah keterangan...">${item?.description || ''}</textarea>
              </div>

              <!-- Tanggal Beli -->
              <div class="form-group">
                <label class="form-label">Tanggal Pembelian</label>
                <input type="date" id="item-acquired-date" class="form-input" value="${item?.acquired_date || BaseService.getToday()}" required>
              </div>

              <!-- Cara Pembelian -->
              <div class="form-group">
                <label class="form-label">Cara Pembelian</label>
                <select id="item-acquired-via" class="form-input" required>
                  <option value="purchase" ${item?.acquired_via === 'purchase' ? 'selected' : ''}>💰 Beli Cash</option>
                  <option value="credit" ${item?.acquired_via === 'credit' ? 'selected' : ''}>💳 Kredit/Cicilan</option>
                  <option value="gift" ${item?.acquired_via === 'gift' ? 'selected' : ''}>🎁 Hadiah</option>
                  <option value="other" ${item?.acquired_via === 'other' ? 'selected' : ''}>📦 Lainnya</option>
                </select>
              </div>

              <!-- Nilai Beli -->
              <div class="form-group">
                <label class="form-label">Harga Beli</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">Rp</span>
                  <input type="number" id="item-purchase-value" class="form-input" placeholder="0" value="${item?.purchase_value || ''}" required min="0">
                </div>
              </div>

              <!-- Nilai Sekarang -->
              <div class="form-group">
                <label class="form-label">Nilai Sekarang (estimasi)</label>
                <div class="input-with-prefix">
                  <span class="input-prefix">Rp</span>
                  <input type="number" id="item-current-value" class="form-input" placeholder="0" value="${item?.current_value || ''}" required min="0">
                </div>
                <p class="form-hint">Perkiraan nilai jual sekarang</p>
              </div>

              <!-- Submit Button -->
              <button type="submit" class="btn btn-primary">
                ${isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Item'}
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById('item-modal');
    if (modal) {
      modal.innerHTML = modalContent;
      modal.style.display = 'block';
    }
  },

  /**
   * Save item
   */
  async saveItem(event, itemId = null) {
    event.preventDefault();

    const itemData = {
      name: document.getElementById('item-name').value,
      type: document.getElementById('item-type').value,
      description: document.getElementById('item-description').value,
      acquired_date: document.getElementById('item-acquired-date').value,
      acquired_via: document.getElementById('item-acquired-via').value,
      purchase_value: parseFloat(document.getElementById('item-purchase-value').value),
      current_value: parseFloat(document.getElementById('item-current-value').value)
    };

    if (!itemData.name || !itemData.type) {
      Toast.error('Lengkapi data yang wajib diisi');
      return;
    }

    Loading.show('Menyimpan...');

    let result;
    if (itemId) {
      // Update existing item (not implemented yet in ItemService)
      Toast.error('Fitur edit belum tersedia');
      Loading.hide();
      return;
    } else {
      result = await ItemService.create(itemData);
    }

    Loading.hide();

    if (result) {
      Toast.success('Item berhasil disimpan!');
      this.closeModal();
      await this.init(); // Reload items
    } else {
      Toast.error('Gagal menyimpan item');
    }
  },

  /**
   * Show item detail with transaction history
   */
  async showItemDetail(itemId) {
    const item = this.currentItems.find(i => i.id === itemId);
    if (!item) return;

    Loading.show('Memuat detail...');

    // Get transactions related to this item
    const transactions = await TransactionService.getByItem(itemId);

    Loading.hide();

    // Calculate total income and expense from this item
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
      }
    });

    const typeConfig = {
      asset: { bg: '#D1FAE5', color: '#10B981', icon: '📈', label: 'ASET' },
      liability: { bg: '#FEE2E2', color: '#EF4444', icon: '📉', label: 'LIABILITAS' },
      neutral: { bg: '#F3F4F6', color: '#6B7280', icon: '⚖️', label: 'NETRAL' }
    };

    const config = typeConfig[item.type] || typeConfig.neutral;
    const roi = item.purchase_value > 0
      ? (((totalIncome - totalExpense) / item.purchase_value) * 100).toFixed(2)
      : 0;

    const modalContent = `
      <div class="modal-overlay" onclick="Items.closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
          <div class="modal-header">
            <h2 class="modal-title">📊 Detail Item</h2>
            <button class="modal-close" onclick="Items.closeModal()">&times;</button>
          </div>
          <div class="modal-body">

            <!-- Item Info -->
            <div style="background: ${config.bg}; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <div style="display: inline-block; padding: 4px 12px; background: white; border-radius: 6px; font-size: 0.75rem; font-weight: 600; color: ${config.color}; margin-bottom: 12px;">
                ${config.icon} ${config.label}
              </div>
              <h3 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 8px;">${item.name}</h3>
              <p style="color: #6b7280;">${item.description || 'Tidak ada deskripsi'}</p>
            </div>

            <!-- Value Summary -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
              <div class="card" style="padding: 16px;">
                <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 4px;">Harga Beli</p>
                <p style="font-size: 1.25rem; font-weight: 700;">${Formatter.currency(item.purchase_value)}</p>
                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">📅 ${Formatter.date(item.acquired_date)}</p>
              </div>
              <div class="card" style="padding: 16px;">
                <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 4px;">Nilai Sekarang</p>
                <p style="font-size: 1.25rem; font-weight: 700;">${Formatter.currency(item.current_value)}</p>
                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">
                  ${item.purchase_value > item.current_value ? '📉 Susut' : '📈 Naik'} ${Formatter.currency(Math.abs(item.current_value - item.purchase_value))}
                </p>
              </div>
            </div>

            <!-- Transaction Summary -->
            <div class="card" style="padding: 16px; margin-bottom: 20px;">
              <h4 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 12px;">💰 RINGKASAN TRANSAKSI</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div>
                  <p style="font-size: 0.75rem; color: #9ca3af;">Pemasukan</p>
                  <p style="font-size: 1rem; font-weight: 600; color: #10B981;">+${Formatter.currency(totalIncome)}</p>
                </div>
                <div>
                  <p style="font-size: 0.75rem; color: #9ca3af;">Pengeluaran</p>
                  <p style="font-size: 1rem; font-weight: 600; color: #EF4444;">-${Formatter.currency(totalExpense)}</p>
                </div>
                <div>
                  <p style="font-size: 0.75rem; color: #9ca3af;">ROI</p>
                  <p style="font-size: 1rem; font-weight: 600; color: ${roi >= 0 ? '#10B981' : '#EF4444'};">${roi}%</p>
                </div>
              </div>
            </div>

            <!-- Transaction History -->
            <div>
              <h4 style="font-size: 0.875rem; font-weight: 600; color: #6b7280; margin-bottom: 12px;">📜 RIWAYAT TRANSAKSI (${transactions.length})</h4>

              ${transactions.length > 0 ? `
                <div style="max-height: 300px; overflow-y: auto;">
                  ${transactions.map(tx => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #f3f4f6;">
                      <div>
                        <p style="font-weight: 500; color: #1f2937;">${tx.description || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}</p>
                        <p style="font-size: 0.75rem; color: #9ca3af;">${Formatter.date(tx.date)}</p>
                      </div>
                      <p style="font-weight: 600; color: ${tx.type === 'income' ? '#10B981' : '#EF4444'};">
                        ${tx.type === 'income' ? '+' : '-'}${Formatter.currency(tx.amount)}
                      </p>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="text-align: center; color: #9ca3af; padding: 20px;">Belum ada transaksi terkait item ini</p>
              `}
            </div>

            <!-- Actions -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px;">
              <button onclick="Transaction.showExpenseForm(); Items.closeModal();" class="btn btn-expense">
                💸 Tambah Pengeluaran
              </button>
              <button onclick="Transaction.showIncomeForm(); Items.closeModal();" class="btn btn-income">
                💵 Tambah Pemasukan
              </button>
            </div>

          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById('item-modal');
    if (modal) {
      modal.innerHTML = modalContent;
      modal.style.display = 'block';
    }
  },

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('item-modal');
    if (modal) {
      modal.style.display = 'none';
      modal.innerHTML = '';
    }
  }
};

// Add CSS for items grid
const itemsStyles = document.createElement('style');
itemsStyles.textContent = `
  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  }

  .btn-add-item:hover {
    background: #2563EB !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
`;
document.head.appendChild(itemsStyles);

window.Items = Items;
console.log('✅ Items module loaded');
