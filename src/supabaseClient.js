import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yachrevrwmwhuihplnml.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhY2hyZXZyd213aHVpaHBsbm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjMxMzUsImV4cCI6MjA5NDE5OTEzNX0.ZVH-_PzyiECKfa8J5wf5Lv8x2iKPXSvmw9lTRsPqhyg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
