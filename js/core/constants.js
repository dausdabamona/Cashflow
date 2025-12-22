/**
 * Application Constants
 * Semua konstanta yang digunakan di seluruh aplikasi
 */

// App Info
const APP_NAME = 'Cashflow Tracker';
const APP_VERSION = '2.0.0';

// Cache Settings
const CACHE_TTL = 5 * 60 * 1000; // 5 menit
const DEFAULT_PAGE_SIZE = 20;

// Health Score Thresholds
const HEALTH_SCORE_GRADES = {
  'A+': { min: 90, label: 'Luar Biasa', color: 'green', emoji: '🌟', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  A: { min: 80, label: 'Excellent', color: 'green', emoji: '💪', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  B: { min: 60, label: 'Baik', color: 'blue', emoji: '👍', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
  C: { min: 40, label: 'Cukup', color: 'yellow', emoji: '😐', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  D: { min: 20, label: 'Kurang', color: 'orange', emoji: '😟', bgClass: 'bg-orange-100', textClass: 'text-orange-800' },
  E: { min: 0, label: 'Kritis', color: 'red', emoji: '🚨', bgClass: 'bg-red-100', textClass: 'text-red-800' }
};

// Kiyosaki Status
const KIYOSAKI_STATUS = {
  ASSET: {
    label: 'ASSET',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    borderClass: 'border-green-500',
    cardClass: 'status-asset',
    message: 'Luar biasa! Passive income melebihi pengeluaran pasif.',
    tips: 'Pertahankan dan tingkatkan passive income Anda.'
  },
  BREAKING_EVEN: {
    label: 'IMPAS',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-500',
    cardClass: 'status-neutral',
    message: 'Bagus! Passive income = pengeluaran pasif.',
    tips: 'Sedikit lagi menuju kebebasan finansial!'
  },
  MENUJU_ASSET: {
    label: 'MENUJU ASSET',
    color: 'yellow',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-500',
    cardClass: 'status-liability',
    message: 'Terus semangat! Tingkatkan passive income.',
    tips: 'Fokus bangun aset produktif yang menghasilkan.'
  },
  LIABILITY: {
    label: 'LIABILITY',
    color: 'red',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    borderClass: 'border-red-500',
    cardClass: 'status-liability',
    message: 'Fokus kurangi pengeluaran dan bangun passive income.',
    tips: 'Kurangi hutang konsumtif, mulai investasi kecil.'
  }
};

// Transaction Types
const TX_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer'
};

// Income Types (Kiyosaki)
const INCOME_TYPE = {
  ACTIVE: { value: 'active', label: 'Aktif', description: 'Pendapatan dari kerja langsung (gaji, freelance)', icon: '💼' },
  PASSIVE: { value: 'passive', label: 'Pasif', description: 'Pendapatan tanpa kerja aktif (sewa, dividen, royalti)', icon: '🏠' },
  PORTFOLIO: { value: 'portfolio', label: 'Portfolio', description: 'Keuntungan dari jual-beli aset (saham, properti)', icon: '📈' }
};

// Account Types
const ACCOUNT_TYPE = {
  CASH: { value: 'cash', label: 'Tunai', icon: '💵', description: 'Uang tunai' },
  BANK: { value: 'bank', label: 'Bank', icon: '🏦', description: 'Rekening bank' },
  EWALLET: { value: 'ewallet', label: 'E-Wallet', icon: '📱', description: 'Dompet digital (GoPay, OVO, DANA, dll)' },
  INVESTMENT: { value: 'investment', label: 'Investasi', icon: '📈', description: 'Rekening investasi' },
  RECEIVABLE: { value: 'receivable', label: 'Piutang', icon: '📝', description: 'Uang yang dipinjamkan' },
  OTHER: { value: 'other', label: 'Lainnya', icon: '💰', description: 'Jenis akun lainnya' }
};

// Item Types
const ITEM_TYPE = {
  ASSET: { value: 'asset', label: 'Aset', description: 'Barang yang menghasilkan uang', icon: '🏠' },
  LIABILITY: { value: 'liability', label: 'Liabilitas', description: 'Barang yang menghabiskan uang', icon: '🚗' },
  CONSUMABLE: { value: 'consumable', label: 'Habis Pakai', description: 'Barang sekali pakai', icon: '🛒' },
  IDLE: { value: 'idle', label: 'Idle', description: 'Barang belum ada cashflow', icon: '📦' }
};

// Error Messages (Bahasa Indonesia)
const ERROR_MESSAGES = {
  NETWORK: 'Koneksi terputus. Periksa internet Anda.',
  AUTH_EXPIRED: 'Sesi telah berakhir. Silakan login kembali.',
  VALIDATION: 'Data tidak valid. Periksa input Anda.',
  GENERIC: 'Terjadi kesalahan. Coba lagi nanti.',
  NOT_FOUND: 'Data tidak ditemukan.',
  PERMISSION: 'Anda tidak memiliki akses.',
  DUPLICATE: 'Data sudah ada.',
  INSUFFICIENT_BALANCE: 'Saldo tidak mencukupi.',
  REQUIRED_FIELD: 'Field ini wajib diisi.',
  INVALID_AMOUNT: 'Jumlah tidak valid.',
  INVALID_DATE: 'Tanggal tidak valid.',
  SAME_ACCOUNT: 'Akun asal dan tujuan tidak boleh sama.'
};

// Success Messages
const SUCCESS_MESSAGES = {
  SAVE: 'Data berhasil disimpan!',
  UPDATE: 'Data berhasil diperbarui!',
  DELETE: 'Data berhasil dihapus!',
  TRANSACTION_SAVED: 'Transaksi berhasil dicatat!',
  TRANSFER_SUCCESS: 'Transfer berhasil!',
  IMPORT_SUCCESS: 'Import data berhasil!',
  EXPORT_SUCCESS: 'Export data berhasil!',
  ACCOUNT_CREATED: 'Akun berhasil dibuat!',
  CATEGORY_CREATED: 'Kategori berhasil dibuat!',
  ITEM_CREATED: 'Item berhasil ditambahkan!'
};

// Budget Warning Thresholds
const BUDGET_THRESHOLDS = {
  SAFE: { max: 50, color: 'green', label: 'Aman' },
  WARNING: { max: 80, color: 'yellow', label: 'Peringatan' },
  DANGER: { max: 100, color: 'orange', label: 'Bahaya' },
  OVER: { max: Infinity, color: 'red', label: 'Melebihi Budget' }
};

// Date Formats
const DATE_FORMAT = {
  SHORT: { day: 'numeric', month: 'short' },
  MEDIUM: { day: 'numeric', month: 'short', year: 'numeric' },
  LONG: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  ISO: 'YYYY-MM-DD'
};

// Currency Settings
const CURRENCY = {
  CODE: 'IDR',
  LOCALE: 'id-ID',
  SYMBOL: 'Rp',
  DECIMAL_PLACES: 0
};

// Reminder Settings
const REMINDER_DAYS_BEFORE = [1, 3, 7]; // Ingatkan H-1, H-3, H-7

// Chart Colors
const CHART_COLORS = {
  INCOME: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'],
  EXPENSE: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'],
  NEUTRAL: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#F9FAFB']
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Export untuk digunakan global
window.APP_CONSTANTS = {
  APP_NAME,
  APP_VERSION,
  CACHE_TTL,
  DEFAULT_PAGE_SIZE,
  HEALTH_SCORE_GRADES,
  KIYOSAKI_STATUS,
  TX_TYPE,
  INCOME_TYPE,
  ACCOUNT_TYPE,
  ITEM_TYPE,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BUDGET_THRESHOLDS,
  DATE_FORMAT,
  CURRENCY,
  REMINDER_DAYS_BEFORE,
  CHART_COLORS,
  PAGINATION
};

// Also export individual constants for direct access
window.TX_TYPE = TX_TYPE;
window.INCOME_TYPE = INCOME_TYPE;
window.ACCOUNT_TYPE = ACCOUNT_TYPE;
window.ITEM_TYPE = ITEM_TYPE;
window.ERROR_MESSAGES = ERROR_MESSAGES;
window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
