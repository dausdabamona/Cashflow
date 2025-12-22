// Cashflow Tracker - OCR Module

let ocrImageData = null;
let ocrWorker = null;

/**
 * Initialize OCR module
 */
function initOCR() {
  const ocrScanBtn = document.getElementById('ocrScanBtn');
  const closeOcrModal = document.getElementById('closeOcrModal');
  const ocrCameraInput = document.getElementById('ocrCameraInput');
  const ocrFileInput = document.getElementById('ocrFileInput');
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

  // Handle image inputs
  if (ocrCameraInput) {
    ocrCameraInput.addEventListener('change', handleImageSelect);
  }
  if (ocrFileInput) {
    ocrFileInput.addEventListener('change', handleImageSelect);
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
    // Reset file inputs
    const cameraInput = document.getElementById('ocrCameraInput');
    const fileInput = document.getElementById('ocrFileInput');
    if (cameraInput) cameraInput.value = '';
    if (fileInput) fileInput.value = '';
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
  ocrImageData = null;
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

  return result;
}

/**
 * Show OCR results
 */
function showOcrResults(rawText, parsed) {
  document.getElementById('ocrSourceSection')?.classList.add('hidden');
  document.getElementById('ocrPreviewSection')?.classList.add('hidden');
  document.getElementById('ocrResultSection')?.classList.remove('hidden');

  // Fill in the form
  const amountInput = document.getElementById('ocrAmount');
  const dateInput = document.getElementById('ocrDate');
  const descInput = document.getElementById('ocrDescription');
  const rawTextArea = document.getElementById('ocrRawText');

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

  lucide.createIcons();
}

/**
 * Apply OCR data to transaction form and save image
 */
async function applyOcrData() {
  const amountInput = document.getElementById('ocrAmount');
  const dateInput = document.getElementById('ocrDate');
  const descInput = document.getElementById('ocrDescription');

  const amount = amountInput?.value || '';
  const date = dateInput?.value || getToday();
  const description = descInput?.value || '';

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

  if (txAmountInput) txAmountInput.value = amount;
  if (txDateInput) txDateInput.value = date;
  if (txDescInput) txDescInput.value = description;

  // Store receipt URL for later use when saving transaction
  window.pendingReceiptUrl = receiptUrl;

  closeOcrModal_();
  showToast('Data berhasil diisi dari struk', 'success');
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
