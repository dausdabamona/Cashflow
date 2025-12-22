// Kiyosaki Finance Tracker - Supabase Configuration
// GANTI dengan credentials dari Supabase Dashboard
// Settings > API > Project URL & anon key

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make available globally
window.db = supabase;
