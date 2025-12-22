/**
 * OCR Service
 * Scan dan ekstrak data dari struk/nota
 */

const OCRService = {

  // Tesseract worker
  worker: null,
  isReady: false,

  /**
   * Initialize OCR engine
   */
  async init() {
    if (this.isReady) return;

    try {
      // Check if Tesseract is available
      if (typeof Tesseract === 'undefined') {
        // Load Tesseract from CDN
        await this.loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
      }

      this.worker = await Tesseract.createWorker('ind+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            // Update progress jika perlu
            const progress = document.getElementById('ocrProgress');
            if (progress) {
              progress.textContent = `${Math.round(m.progress * 100)}%`;
            }
          }
        }
      });

      this.isReady = true;
      ErrorHandler.log('INFO', 'OCR Service initialized');

    } catch (error) {
      ErrorHandler.log('ERROR', 'Failed to initialize OCR', error);
      throw new Error('Gagal menginisialisasi OCR. Coba refresh halaman.');
    }
  },

  /**
   * Load external script
   * @param {string} src
   * @returns {Promise}
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * Scan image dan ekstrak text
   * @param {File|Blob|string} image - File, Blob, atau base64 string
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} { text, data }
   */
  async scan(image, onProgress = null) {
    try {
      await this.init();

      const { data } = await this.worker.recognize(image);

      return {
        text: data.text,
        confidence: data.confidence,
        lines: data.lines
      };

    } catch (error) {
      ErrorHandler.handle(error, 'OCRService.scan');
      return null;
    }
  },

  /**
   * Parse hasil OCR menjadi data transaksi
   * @param {string} text - Raw text dari OCR
   * @returns {Object} parsed data
   */
  parseReceipt(text) {
    const result = {
      merchant: null,
      date: null,
      total: null,
      items: [],
      rawText: text
    };

    if (!text) return result;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. Cari Merchant (biasanya baris 1-3)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toUpperCase();
      // Skip jika hanya angka atau terlalu pendek
      if (line.length > 3 && !/^\d+$/.test(line)) {
        // Common merchant patterns
        const merchants = ['INDOMARET', 'ALFAMART', 'ALFAMIDI', 'CIRCLE K', 'LAWSON',
                          'MCDONALD', 'KFC', 'STARBUCKS', 'TOKOPEDIA', 'SHOPEE',
                          'GRAB', 'GOJEK', 'OVO', 'DANA', 'GOPAY'];

        const found = merchants.find(m => line.includes(m));
        if (found) {
          result.merchant = found;
          break;
        }

        // Jika tidak match, ambil baris pertama yang bukan tanggal/angka
        if (!result.merchant && i < 3) {
          result.merchant = lines[i];
        }
      }
    }

    // 2. Cari Tanggal
    const datePatterns = [
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,       // DD/MM/YYYY atau DD-MM-YYYY
      /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/,       // DD/MM/YY
      /(\d{1,2})\s+(JAN|FEB|MAR|APR|MEI|MAY|JUN|JUL|AGU|AUG|SEP|OKT|OCT|NOV|DES|DEC)\s+(\d{4})/i
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            // Parse berdasarkan pattern
            if (pattern === datePatterns[2]) {
              // Format: DD MMM YYYY
              const monthMap = {
                'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MEI': 4, 'MAY': 4,
                'JUN': 5, 'JUL': 6, 'AGU': 7, 'AUG': 7, 'SEP': 8,
                'OKT': 9, 'OCT': 9, 'NOV': 10, 'DES': 11, 'DEC': 11
              };
              const day = parseInt(match[1]);
              const month = monthMap[match[2].toUpperCase()];
              const year = parseInt(match[3]);
              result.date = new Date(year, month, day).toISOString().split('T')[0];
            } else {
              // Format: DD/MM/YYYY atau DD/MM/YY
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1;
              let year = parseInt(match[3]);
              if (year < 100) year += 2000;
              result.date = new Date(year, month, day).toISOString().split('T')[0];
            }
            break;
          } catch (e) {
            // Invalid date, continue
          }
        }
      }
      if (result.date) break;
    }

    // 3. Cari Total
    const totalKeywords = ['TOTAL', 'GRAND TOTAL', 'JUMLAH', 'AMOUNT', 'TTL', 'TUNAI', 'BAYAR', 'SUBTOTAL'];

    for (const line of lines) {
      const upperLine = line.toUpperCase();

      for (const keyword of totalKeywords) {
        if (upperLine.includes(keyword)) {
          // Ekstrak angka dari baris ini
          const numbers = line.match(/[\d.,]+/g);
          if (numbers) {
            // Ambil angka terbesar (kemungkinan total)
            const amounts = numbers.map(n => {
              return parseFloat(n.replace(/\./g, '').replace(',', '.'));
            }).filter(n => !isNaN(n) && n > 0);

            if (amounts.length > 0) {
              const maxAmount = Math.max(...amounts);
              // Hanya ambil jika masuk akal (> 100, biasanya minimal segitu)
              if (maxAmount >= 100) {
                result.total = maxAmount;
                break;
              }
            }
          }
        }
      }
      if (result.total) break;
    }

    // Jika total belum ketemu, cari angka terbesar di 5 baris terakhir
    if (!result.total) {
      const lastLines = lines.slice(-5);
      let maxAmount = 0;

      for (const line of lastLines) {
        const numbers = line.match(/[\d.,]+/g);
        if (numbers) {
          numbers.forEach(n => {
            const amount = parseFloat(n.replace(/\./g, '').replace(',', '.'));
            if (!isNaN(amount) && amount > maxAmount && amount >= 1000) {
              maxAmount = amount;
            }
          });
        }
      }

      if (maxAmount > 0) {
        result.total = maxAmount;
      }
    }

    // 4. Cari Items (opsional)
    // Pattern: nama item diikuti angka di akhir
    const itemPattern = /^(.+?)\s+([\d.,]+)$/;

    for (const line of lines) {
      // Skip jika kemungkinan header atau total
      const upperLine = line.toUpperCase();
      if (totalKeywords.some(k => upperLine.includes(k))) continue;
      if (upperLine.includes('STRUK') || upperLine.includes('RECEIPT')) continue;

      const match = line.match(itemPattern);
      if (match) {
        const itemName = match[1].trim();
        const itemPrice = parseFloat(match[2].replace(/\./g, '').replace(',', '.'));

        if (itemName.length > 2 && !isNaN(itemPrice) && itemPrice > 0 && itemPrice < (result.total || Infinity)) {
          result.items.push({
            name: itemName,
            price: itemPrice
          });
        }
      }
    }

    return result;
  },

  /**
   * Proses gambar: scan + parse
   * @param {File|Blob|string} image
   * @returns {Promise<Object>}
   */
  async processReceipt(image) {
    const scanResult = await this.scan(image);

    if (!scanResult) {
      return null;
    }

    const parsed = this.parseReceipt(scanResult.text);

    return {
      ...parsed,
      confidence: scanResult.confidence,
      ocrText: scanResult.text
    };
  },

  /**
   * Cleanup worker
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
};

// Export global
window.OCRService = OCRService;
