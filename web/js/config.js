/**
 * Application Configuration
 * File: web/js/config.js
 */
const AppConfig = {
  // Supabase Configuration - GANTI DENGAN CREDENTIALS ANDA
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  },

  // App Settings
  app: {
    name: 'Cashflow Tracker',
    version: '2.0.0',
    currency: 'IDR',
    locale: 'id-ID'
  },

  // Default Settings
  defaults: {
    pageSize: 20,
    dateFormat: 'dd MMM yyyy',
    monthlyStartDay: 1
  }
};

// Initialize Supabase Client
if (typeof supabase !== 'undefined' && AppConfig.supabase.url !== 'YOUR_SUPABASE_URL') {
  window.supabaseClient = supabase.createClient(
    AppConfig.supabase.url,
    AppConfig.supabase.anonKey
  );
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase not configured - please update config.js with your credentials');
}

// Export
window.AppConfig = AppConfig;

console.log('✅ Config loaded');
