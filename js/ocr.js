// Cashflow Tracker - OCR Module

let ocrImageData = null;
let ocrWorker = null;
let detectedBank = null;
let suggestedAccountId = null;

// Bank patterns for detection
const BANK_PATTERNS = [
  { pattern: /\b(bca|bank central asia)\b/i, name: 'BCA', keywords: ['bca', 'bank central asia'] },
  { pattern: /\b(bri|bank rakyat indonesia)\b/i, name: 'BRI', keywords: ['bri', 'bank rakyat'] },
  { pattern: /\b(bni|bank negara indonesia)\b/i, name: 'BNI', keywords: ['bni', 'bank negara'] },
  { pattern: /\b(mandiri|bank mandiri)\b/i, name: 'Mandiri', keywords: ['mandiri'] },
  { pattern: /\b(cimb|cimb niaga)\b/i, name: 'CIMB Niaga', keywords: ['cimb', 'niaga'] },
  { pattern: /\b(btn|bank tabungan negara)\b/i, name: 'BTN', keywords: ['btn', 'tabungan negara'] },
  { pattern: /\b(permata|bank permata)\b/i, name: 'Permata', keywords: ['permata'] },
  { pattern: /\b(danamon|bank danamon)\b/i, name: 'Danamon', keywords: ['danamon'] },
  { pattern: /\b(ocbc|ocbc nisp)\b/i, name: 'OCBC NISP', keywords: ['ocbc', 'nisp'] },
  { pattern: /\b(maybank)\b/i, name: 'Maybank', keywords: ['maybank'] },
  { pattern: /\b(gopay|go-pay)\b/i, name: 'GoPay', keywords: ['gopay', 'go-pay', 'gojek'] },
  { pattern: /\b(ovo)\b/i, name: 'OVO', keywords: ['ovo'] },
  { pattern: /\b(dana)\b/i, name: 'DANA', keywords: ['dana'] },
  { pattern: /\b(shopeepay|shopee\s*pay)\b/i, name: 'ShopeePay', keywords: ['shopeepay', 'shopee'] },
  { pattern: /\b(linkaja|link\s*aja)\b/i, name: 'LinkAja', keywords: ['linkaja', 'link aja'] },
  { pattern: /\b(jenius)\b/i, name: 'Jenius', keywords: ['jenius'] },
  { pattern: /\b(blu|blu by bca)\b/i, name: 'Blu BCA', keywords: ['blu'] },
  { pattern: /\b(jago|bank jago)\b/i, name: 'Bank Jago', keywords: ['jago'] },
  { pattern: /\b(seabank|sea bank)\b/i, name: 'SeaBank', keywords: ['seabank'] },
  { pattern: /\b(flip)\b/i, name: 'Flip', keywords: ['flip'] }
];

/**
 * Initialize OCR module
 */
function initOCR() {
  const ocrScanBtn = document.getElementById('ocrScanBtn');
  const closeOcrModal = document.getElementById('closeOcrModal');
  const ocrCameraBtn = document.getElementById('ocrCameraBtn');
  const ocrFileBtn = document.getElementById('ocrFileBtn');
  const ocrPdfBtn = document.getElementById('ocrPdfBtn');
  const ocrCameraInput = document.getElementById('ocrCameraInput');
  const ocrFileInput = document.getElementById('ocrFileInput');
  const ocrPdfInput = document.getElementById('ocrPdfInput');
  const ocrRetakeBtn = document.getElementById('ocrRetakeBtn');
  const ocrProcessBtn = document.getElementById('ocrProcessBtn');
  const ocrCancelBtn = document.getElementById('ocrCancelBtn');
  const ocrApplyBtn = document.getElementById('ocrApplyBtn');
  const ocrAmountInput = document.getElementById('ocrAmount');

  // Open OCR modal
  if (ocrScanBtn) {
    ocrScanBtn.addEventListener('click', openOcrModal);
  }

  // Close modal
  if (closeOcrModal) {
    closeOcrModal.addEventListener('click', closeOcrModal_);
  }

  // Button click handlers to trigger hidden file inputs (more reliable on mobile)
  if (ocrCameraBtn && ocrCameraInput) {
    ocrCameraBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      ocrCameraInput.click();
    });
  }
  if (ocrFileBtn && ocrFileInput) {
    ocrFileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      ocrFileInput.click();
    });
  }
  if (ocrPdfBtn && ocrPdfInput) {
    ocrPdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      ocrPdfInput.click();
    });
  }

  // Handle file input changes
  if (ocrCameraInput) {
    ocrCameraInput.addEventListener('change', handleImageSelect);
  }
  if (ocrFileInput) {
    ocrFileInput.addEventListener('change', handleImageSelect);
  }

  // Handle PDF input
  if (ocrPdfInput) {
    ocrPdfInput.addEventListener('change', handlePdfSelect);
  }

  // Retake button
  if (ocrRetakeBtn) {
    ocrRetakeBtn.addEventListener('click', resetOcrToSource);
  }

  // Process OCR
  if (ocrProcessBtn) {
    ocrProcessBtn.addEventListener('click', processOCR);
  }

  // Cancel button
  if (ocrCancelBtn) {
    ocrCancelBtn.addEventListener('click', closeOcrModal_);
  }

  // Apply extracted data
  if (ocrApplyBtn) {
    ocrApplyBtn.addEventListener('click', applyOcrData);
  }

  // Format amount input
  if (ocrAmountInput) {
    ocrAmountInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value) {
        e.target.value = parseInt(value).toLocaleString('id-ID');
      }
    });
  }

  // Initialize PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  console.log('OCR module initialized');
}

/**
 * Open OCR modal
 */
function openOcrModal() {
  const modal = document.getElementById('ocrModal');
  if (modal) {
    modal.classList.remove('hidden');
    resetOcrToSource();
    lucide.createIcons();
  }
}

/**
 * Close OCR modal
 */
function closeOcrModal_() {
  const modal = document.getElementById('ocrModal');
  if (modal) {
    modal.classList.add('hidden');
    ocrImageData = null;
    detectedBank = null;
    suggestedAccountId = null;
    // Reset file inputs
    const cameraInput = document.getElementById('ocrCameraInput');
    const fileInput = document.getElementById('ocrFileInput');
    const pdfInput = document.getElementById('ocrPdfInput');
    if (cameraInput) cameraInput.value = '';
    if (fileInput) fileInput.value = '';
    if (pdfInput) pdfInput.value = '';
  }
}

/**
 * Reset to source selection view
 */
function resetOcrToSource() {
  document.getElementById('ocrSourceSection')?.classList.remove('hidden');
  document.getElementById('ocrPreviewSection')?.classList.add('hidden');
  document.getElementById('ocrResultSection')?.classList.add('hidden');
  document.getElementById('ocrProcessing')?.classList.add('hidden');
  document.getElementById('ocrProcessBtn')?.classList.remove('hidden');
  document.getElementById('ocrBankDetected')?.classList.add('hidden');
  ocrImageData = null;
  detectedBank = null;
  suggestedAccountId = null;
}

/**
 * Handle image selection from camera or file
 */
function handleImageSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    ocrImageData = e.target.result;
    showImagePreview(ocrImageData);
  };
  reader.readAsDataURL(file);
}

/**
 * Handle PDF file selection
 */
async function handlePdfSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const processingDiv = document.getElementById('ocrProcessing');
  const progressText = document.getElementById('ocrProgress');

  document.getElementById('ocrSourceSection')?.classList.add('hidden');
  document.getElementById('ocrPreviewSection')?.classList.remove('hidden');
  processingDiv?.classList.remove('hidden');
  document.getElementById('ocrProcessBtn')?.classList.add('hidden');

  if (progressText) progressText.textContent = 'Membaca PDF...';

  try {
    // Read PDF file
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (progressText) progressText.textContent = `PDF: ${pdf.numPages} halaman`;

    // Get first page and render to canvas
    const page = await pdf.getPage(1);
    const scale = 2; // Higher scale for better OCR
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to image data
    ocrImageData = canvas.toDataURL('image/jpeg', 0.9);

    // Show preview
    const previewImg = document.getElementById('ocrPreviewImage');
    if (previewImg) {
      previewImg.src = ocrImageData;
    }

    processingDiv?.classList.add('hidden');
    document.getElementById('ocrProcessBtn')?.classList.remove('hidden');

  } catch (error) {
    console.error('PDF processing error:', error);
    showToast('Gagal membaca PDF', 'error');
    resetOcrToSource();
  }
}

/**
 * Show image preview
 */
function showImagePreview(imageData) {
  const previewImg = document.getElementById('ocrPreviewImage');
  if (previewImg) {
    previewImg.src = imageData;
  }

  document.getElementById('ocrSourceSection')?.classList.add('hidden');
  document.getElementById('ocrPreviewSection')?.classList.remove('hidden');
  document.getElementById('ocrResultSection')?.classList.add('hidden');
  document.getElementById('ocrProcessing')?.classList.add('hidden');
  document.getElementById('ocrProcessBtn')?.classList.remove('hidden');

  lucide.createIcons();
}

/**
 * Process image with OCR
 */
async function processOCR() {
  if (!ocrImageData) {
    showToast('Pilih gambar terlebih dahulu', 'error');
    return;
  }

  const processingDiv = document.getElementById('ocrProcessing');
  const processBtn = document.getElementById('ocrProcessBtn');
  const progressText = document.getElementById('ocrProgress');

  // Show processing state
  processingDiv?.classList.remove('hidden');
  processBtn?.classList.add('hidden');

  try {
    // Use Tesseract.js to recognize text
    const result = await Tesseract.recognize(
      ocrImageData,
      'ind+eng', // Indonesian + English
      {
        logger: m => {
          if (m.status === 'recognizing text' && progressText) {
            progressText.textContent = `${Math.round(m.progress * 100)}%`;
          }
        }
      }
    );

    const text = result.data.text;
    console.log('OCR Result:', text);

    // Parse the extracted text
    const parsed = parseReceiptText(text);

    // Show results
    showOcrResults(text, parsed);

  } catch (error) {
    console.error('OCR Error:', error);
    showToast('Gagal memproses gambar', 'error');
    processingDiv?.classList.add('hidden');
    processBtn?.classList.remove('hidden');
  }
}

/**
 * Parse receipt text to extract transaction data
 */
function parseReceiptText(text) {
  const result = {
    amount: 0,
    date: getToday(),
    description: ''
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // Try to find amount (look for patterns like Rp, Total, Grand Total, etc.)
  const amountPatterns = [
    /(?:total|grand\s*total|jumlah|bayar|tunai|cash|debit|kredit)[:\s]*(?:rp\.?)?[\s]*([0-9.,]+)/gi,
    /(?:rp\.?)[\s]*([0-9.,]+)/gi,
    /([0-9]{1,3}(?:[.,][0-9]{3})+)/g
  ];

  let amounts = [];
  for (const pattern of amountPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numStr = match[1] || match[0];
      const num = parseInt(numStr.replace(/[.,]/g, ''));
      if (num > 100 && num < 100000000) { // Reasonable range for Indonesian Rupiah
        amounts.push(num);
      }
    }
  }

  // Use the largest amount found (usually the total)
  if (amounts.length > 0) {
    result.amount = Math.max(...amounts);
  }

  // Try to find date
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{1,2})\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\s*(\d{2,4})/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        let day, month, year;
        if (match[2] && isNaN(match[2])) {
          // Month name format
          day = parseInt(match[1]);
          const monthNames = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
          month = monthNames.findIndex(m => match[2].toLowerCase().startsWith(m)) + 1;
          year = parseInt(match[3]);
        } else {
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
        }

        if (year < 100) year += 2000;

        if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          result.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      } catch (e) {}
      break;
    }
  }

  // Try to find merchant/store name (usually first few lines)
  const skipWords = ['struk', 'receipt', 'nota', 'invoice', 'kasir', 'cashier', 'tanggal', 'date', 'waktu', 'time'];
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const isSkip = skipWords.some(w => lower.includes(w));
    const hasNumbers = /^\d+$/.test(line.replace(/\s/g, ''));

    if (!isSkip && !hasNumbers && line.length > 3 && line.length < 50) {
      result.description = line;
      break;
    }
  }

  // Detect bank/e-wallet from text
  result.detectedBank = detectBankFromText(text);

  return result;
}

/**
 * Detect bank or e-wallet from OCR text
 */
function detectBankFromText(text) {
  const lowerText = text.toLowerCase();

  for (const bank of BANK_PATTERNS) {
    if (bank.pattern.test(text)) {
      return bank.name;
    }
  }

  return null;
}

/**
 * Show OCR results
 */
async function showOcrResults(rawText, parsed) {
  document.getElementById('ocrSourceSection')?.classList.add('hidden');
  document.getElementById('ocrPreviewSection')?.classList.add('hidden');
  document.getElementById('ocrResultSection')?.classList.remove('hidden');

  // Fill in the form
  const amountInput = document.getElementById('ocrAmount');
  const dateInput = document.getElementById('ocrDate');
  const descInput = document.getElementById('ocrDescription');
  const rawTextArea = document.getElementById('ocrRawText');
  const bankDetectedDiv = document.getElementById('ocrBankDetected');
  const bankNameSpan = document.getElementById('ocrDetectedBankName');
  const accountSelect = document.getElementById('ocrSuggestedAccount');

  if (amountInput && parsed.amount) {
    amountInput.value = parsed.amount.toLocaleString('id-ID');
  }
  if (dateInput && parsed.date) {
    dateInput.value = parsed.date;
  }
  if (descInput && parsed.description) {
    descInput.value = parsed.description;
  }
  if (rawTextArea) {
    rawTextArea.value = rawText;
  }

  // Handle bank detection
  detectedBank = parsed.detectedBank;
  if (detectedBank && bankDetectedDiv && bankNameSpan) {
    bankDetectedDiv.classList.remove('hidden');
    bankNameSpan.textContent = detectedBank;
  } else {
    bankDetectedDiv?.classList.add('hidden');
  }

  // Load accounts and suggest based on detected bank
  await loadAccountsForOcr(accountSelect, detectedBank);

  lucide.createIcons();
}

/**
 * Load accounts into OCR select and auto-select matching account
 */
async function loadAccountsForOcr(selectElement, bankName) {
  if (!selectElement) return;

  try {
    const userId = currentUser?.id;
    if (!userId) return;

    const { data: accounts } = await window.db
      .from('accounts')
      .select('id, name, type')
      .eq('user_id', userId)
      .order('name');

    selectElement.innerHTML = '<option value="">-- Pilih Akun --</option>';

    let matchedAccountId = null;

    (accounts || []).forEach(acc => {
      const option = document.createElement('option');
      option.value = acc.id;
      option.textContent = `${acc.name} (${acc.type})`;
      selectElement.appendChild(option);

      // Try to match account with detected bank
      if (bankName) {
        const accNameLower = acc.name.toLowerCase();
        const bankLower = bankName.toLowerCase();

        // Check if account name contains bank keywords
        const bankPattern = BANK_PATTERNS.find(p => p.name === bankName);
        if (bankPattern) {
          for (const keyword of bankPattern.keywords) {
            if (accNameLower.includes(keyword)) {
              matchedAccountId = acc.id;
              break;
            }
          }
        }

        // Direct name match
        if (!matchedAccountId && accNameLower.includes(bankLower)) {
          matchedAccountId = acc.id;
        }
      }
    });

    // Auto-select matched account
    if (matchedAccountId) {
      selectElement.value = matchedAccountId;
      suggestedAccountId = matchedAccountId;
    }

  } catch (error) {
    console.error('Failed to load accounts:', error);
  }
}

/**
 * Apply OCR data to transaction form and save image
 */
async function applyOcrData() {
  const amountInput = document.getElementById('ocrAmount');
  const dateInput = document.getElementById('ocrDate');
  const descInput = document.getElementById('ocrDescription');
  const accountSelect = document.getElementById('ocrSuggestedAccount');

  const amount = amountInput?.value || '';
  const date = dateInput?.value || getToday();
  const description = descInput?.value || '';
  const selectedAccountId = accountSelect?.value || '';

  // Save image to storage first
  let receiptUrl = null;
  if (ocrImageData) {
    try {
      receiptUrl = await saveReceiptImage(ocrImageData);
    } catch (error) {
      console.error('Failed to save receipt image:', error);
      // Continue without image
    }
  }

  // Fill transaction form
  const txAmountInput = document.getElementById('transactionAmount');
  const txDateInput = document.getElementById('transactionDate');
  const txDescInput = document.getElementById('transactionDescription');
  const txAccountSelect = document.getElementById('transactionAccount');

  if (txAmountInput) txAmountInput.value = amount;
  if (txDateInput) txDateInput.value = date;
  if (txDescInput) txDescInput.value = description;

  // Set suggested account
  if (txAccountSelect && selectedAccountId) {
    txAccountSelect.value = selectedAccountId;
  }

  // Store receipt URL for later use when saving transaction
  window.pendingReceiptUrl = receiptUrl;

  closeOcrModal_();

  // Show success message with bank info if detected
  if (detectedBank) {
    showToast(`Data dari ${detectedBank} berhasil diisi`, 'success');
  } else {
    showToast('Data berhasil diisi dari struk', 'success');
  }
}

/**
 * Compress image while keeping it readable
 * Target: max 800px width, 60% quality JPEG
 */
async function compressImage(imageData, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with specified quality
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    img.onerror = () => resolve(imageData); // Return original if compression fails
    img.src = imageData;
  });
}

/**
 * Save receipt image to Supabase storage
 */
async function saveReceiptImage(imageData) {
  const userId = currentUser?.id;
  if (!userId) throw new Error('User not authenticated');

  // Compress image before saving (max 800px width, 60% quality)
  const compressedImage = await compressImage(imageData, 800, 0.6);
  console.log('Image compressed for storage');

  // Convert base64 to blob
  const response = await fetch(compressedImage);
  const blob = await response.blob();

  // Generate unique filename
  const timestamp = Date.now();
  const filename = `receipts/${userId}/${timestamp}.jpg`;

  // Upload to Supabase storage
  const { data, error } = await window.db.storage
    .from('receipts')
    .upload(filename, blob, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    console.error('Storage upload error:', error);
    // If bucket doesn't exist, save compressed image as base64
    return compressedImage;
  }

  // Get public URL
  const { data: urlData } = window.db.storage
    .from('receipts')
    .getPublicUrl(filename);

  return urlData?.publicUrl || compressedImage;
}

/**
 * View receipt image
 */
function viewReceiptImage(imageUrl) {
  if (!imageUrl) {
    showToast('Tidak ada gambar struk', 'error');
    return;
  }

  // Create modal to view image
  const modalHtml = `
    <div id="receiptViewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onclick="closeReceiptViewer(event)">
      <div class="relative max-w-full max-h-full">
        <button onclick="closeReceiptViewer()" class="absolute -top-10 right-0 text-white">
          <i data-lucide="x" class="w-8 h-8"></i>
        </button>
        <img src="${imageUrl}" class="max-w-full max-h-[80vh] rounded-lg" alt="Receipt">
      </div>
    </div>
  `;

  const existingModal = document.getElementById('receiptViewModal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  lucide.createIcons();
}

/**
 * Close receipt viewer
 */
function closeReceiptViewer(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('receiptViewModal');
  if (modal) modal.remove();
}

// Make functions available globally
window.initOCR = initOCR;
window.openOcrModal = openOcrModal;
window.viewReceiptImage = viewReceiptImage;
window.closeReceiptViewer = closeReceiptViewer;
