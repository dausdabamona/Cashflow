/**
 * Scan Page
 * Halaman scan struk dengan OCR
 */

const ScanPage = {

  // Current image data
  currentImage: null,

  /**
   * Render halaman scan
   * @param {HTMLElement} container
   */
  async render(container) {
    container.innerHTML = `
      <div class="p-4 pb-24">
        <!-- Header -->
        <div class="mb-4">
          <h1 class="text-xl font-bold text-gray-800 dark:text-white">Scan Struk</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Foto struk untuk input otomatis</p>
        </div>

        <!-- Upload Area -->
        <div id="upload-area" class="mb-4">
          <label class="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
            <input type="file" accept="image/*" capture="environment" class="hidden"
                   onchange="ScanPage.handleFileSelect(event)">
            <div class="space-y-2">
              <span class="text-5xl">📸</span>
              <p class="font-medium text-gray-700 dark:text-gray-300">Tap untuk ambil foto</p>
              <p class="text-sm text-gray-500">atau pilih dari galeri</p>
            </div>
          </label>
        </div>

        <!-- Preview Area -->
        <div id="preview-area" class="hidden mb-4">
          <div class="relative">
            <img id="preview-image" src="" alt="Preview" class="w-full rounded-xl">
            <button onclick="ScanPage.clearPreview()"
                    class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
              ✕
            </button>
          </div>

          <button onclick="ScanPage.processImage()"
                  class="w-full mt-3 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
            🔍 Scan & Ekstrak Data
          </button>
        </div>

        <!-- Processing -->
        <div id="processing-area" class="hidden mb-4">
          <div class="text-center py-8">
            <div class="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Memindai struk...</p>
            <p id="ocr-progress" class="text-sm text-gray-400 mt-1">0%</p>
          </div>
        </div>

        <!-- Result Area -->
        <div id="result-area" class="hidden">
          <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
            <div class="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
              <span>✓</span>
              <span class="font-medium">Data berhasil diekstrak</span>
            </div>
          </div>

          <!-- Extracted Data Form -->
          <form id="extracted-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Toko/Merchant</label>
              <input type="text" name="merchant" id="extracted-merchant"
                     class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
              <input type="date" name="date" id="extracted-date"
                     class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                <input type="text" name="amount" id="extracted-amount" required inputmode="numeric"
                       class="w-full pl-10 pr-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                       oninput="this.value = this.value.replace(/[^0-9]/g, '')">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
              <select name="category_id" id="extracted-category" required
                      class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
                <option value="">Pilih kategori</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dari Akun</label>
              <select name="account_id" id="extracted-account" required
                      class="w-full px-3 py-2 border dark:border-gray-600 dark:bg-gray-700 rounded-lg">
                <option value="">Pilih akun</option>
              </select>
            </div>

            <details class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <summary class="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Lihat hasil OCR mentah</summary>
              <pre id="ocr-raw-text" class="mt-2 text-xs text-gray-500 whitespace-pre-wrap max-h-40 overflow-y-auto"></pre>
            </details>

            <button type="submit" class="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
              💾 Simpan Transaksi
            </button>
          </form>
        </div>

        <!-- Tips -->
        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <h4 class="font-medium text-blue-800 dark:text-blue-300 mb-2">💡 Tips untuk hasil terbaik:</h4>
          <ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Pastikan pencahayaan cukup</li>
            <li>• Struk dalam posisi tegak lurus</li>
            <li>• Hindari bayangan dan lipatan</li>
            <li>• Fokuskan pada area total</li>
          </ul>
        </div>
      </div>
    `;

    await this.loadOptions();
  },

  /**
   * Load options untuk dropdown
   */
  async loadOptions() {
    const categories = await CategoryService?.getByType?.('expense') || (await CategoryService?.getAll() || []).filter(c => c.type === 'expense');
    const accounts = await AccountService?.getAll() || [];

    const categorySelect = document.getElementById('extracted-category');
    const accountSelect = document.getElementById('extracted-account');

    if (categorySelect) {
      categorySelect.innerHTML = `
        <option value="">Pilih kategori</option>
        ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
      `;
    }

    if (accountSelect) {
      accountSelect.innerHTML = `
        <option value="">Pilih akun</option>
        ${accounts.map(a => `<option value="${a.id}">${a.icon || '💳'} ${a.name}</option>`).join('')}
      `;
    }
  },

  /**
   * Handle file selection
   * @param {Event} event
   */
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Toast?.error('Pilih file gambar');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Toast?.error('Ukuran file maksimal 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentImage = e.target.result;

      document.getElementById('preview-image').src = this.currentImage;
      document.getElementById('upload-area').classList.add('hidden');
      document.getElementById('preview-area').classList.remove('hidden');
      document.getElementById('result-area').classList.add('hidden');
    };
    reader.readAsDataURL(file);
  },

  /**
   * Clear preview
   */
  clearPreview() {
    this.currentImage = null;
    document.getElementById('upload-area').classList.remove('hidden');
    document.getElementById('preview-area').classList.add('hidden');
    document.getElementById('processing-area').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');

    const fileInput = document.querySelector('#upload-area input[type="file"]');
    if (fileInput) fileInput.value = '';
  },

  /**
   * Process image with OCR
   */
  async processImage() {
    if (!this.currentImage) return;

    try {
      document.getElementById('preview-area').classList.add('hidden');
      document.getElementById('processing-area').classList.remove('hidden');

      const result = await OCRService?.processReceipt(this.currentImage);

      document.getElementById('processing-area').classList.add('hidden');

      if (!result) {
        Toast?.error('Gagal memproses gambar');
        document.getElementById('preview-area').classList.remove('hidden');
        return;
      }

      // Fill form
      document.getElementById('extracted-merchant').value = result.merchant || '';
      document.getElementById('extracted-date').value = result.date || BaseService?.getToday() || new Date().toISOString().split('T')[0];
      document.getElementById('extracted-amount').value = result.total ? Math.round(result.total) : '';
      document.getElementById('ocr-raw-text').textContent = result.ocrText || '';

      document.getElementById('result-area').classList.remove('hidden');

      document.getElementById('extracted-form').onsubmit = async (e) => {
        e.preventDefault();
        await this.saveTransaction(new FormData(e.target));
      };

      Toast?.success('Data berhasil diekstrak!');

    } catch (error) {
      document.getElementById('processing-area').classList.add('hidden');
      document.getElementById('preview-area').classList.remove('hidden');
      ErrorHandler?.handle(error, 'ScanPage.processImage');
    }
  },

  /**
   * Save transaction
   * @param {FormData} formData
   */
  async saveTransaction(formData) {
    try {
      const data = {
        type: 'expense',
        amount: formData.get('amount'),
        account_id: formData.get('account_id'),
        category_id: formData.get('category_id'),
        date: formData.get('date'),
        description: formData.get('merchant') || 'Scan struk'
      };

      const result = await TransactionService?.create(data);

      if (result) {
        Toast?.success('Transaksi berhasil disimpan!');
        this.clearPreview();
        document.getElementById('result-area').classList.add('hidden');
        document.getElementById('upload-area').classList.remove('hidden');

        if (typeof navigateTo === 'function') {
          setTimeout(() => navigateTo('dashboard'), 1000);
        }
      }

    } catch (error) {
      ErrorHandler?.handle(error, 'ScanPage.saveTransaction');
    }
  }
};

// Export global
window.ScanPage = ScanPage;
