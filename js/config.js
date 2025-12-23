// Cashflow Tracker - Supabase Configuration
// GANTI dengan credentials dari Supabase Dashboard
// Settings > API > Project URL & anon key

const SUPABASE_URL = 'https://zgsjkggxrqqbqfzglder.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnc2prZ2d4cnFxYnFmemdsZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNzE1MzgsImV4cCI6MjA4MTk0NzUzOH0.nYUNqMdUCyGMv4mfoE2427GpHOrSfHgFGWiNHnmAjlc';

// Validation - Check if credentials are configured
const isConfigured = SUPABASE_URL &&
                     SUPABASE_ANON_KEY &&
                     !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
                     !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY');

if (!isConfigured) {
  console.error('⚠️ SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi!');
  console.error('Buka js/config.js dan isi dengan credentials dari Supabase Dashboard.');

  // Show alert to user
  window.addEventListener('DOMContentLoaded', () => {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50';
    alertDiv.innerHTML = `
      <strong>⚠️ Konfigurasi Belum Lengkap!</strong><br>
      <span class="text-sm">Buka file js/config.js dan isi SUPABASE_URL & SUPABASE_ANON_KEY</span>
    `;
    document.body.prepend(alertDiv);
  });
}

// Check if Supabase library is loaded
if (typeof window.supabase === 'undefined') {
  console.error('⚠️ Supabase library belum dimuat! Pastikan CDN script sudah ditambahkan.');
  window.db = null;
} else if (isConfigured) {
  // Initialize Supabase client only if configured
  try {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.db = supabase;
    window.supabaseClient = supabase; // Alias for services
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    window.db = null;
  }
} else {
  // Create a mock db object to prevent errors
  window.db = {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } }),
      signOut: async () => ({ error: { message: 'Supabase belum dikonfigurasi' } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      resetPasswordForEmail: async () => ({ error: { message: 'Supabase belum dikonfigurasi' } }),
      updateUser: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ data: [], error: null, order: () => ({ data: [], error: null }) }),
      insert: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } }),
      update: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } }),
      delete: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } })
    }),
    rpc: async () => ({ data: null, error: { message: 'Supabase belum dikonfigurasi' } })
  };
  console.warn('⚠️ Using mock Supabase client - configure credentials to enable full functionality');
}
