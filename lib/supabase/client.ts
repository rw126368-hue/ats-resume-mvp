import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzpbfpskrnhqzexdokrt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cGJmcHNrcm5ocXpleGRva3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTA1MzYsImV4cCI6MjA3MjQ2NjUzNn0.gfopG05KeYsQBhJw8T4L5bvE2GNaUIUvaN15JKPYQ68';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
