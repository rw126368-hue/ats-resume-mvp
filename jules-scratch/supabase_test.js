const { createClient } = require('../node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://tzpbfpskrnhqzexdokrt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cGJmcHNrcm5ocXpleGRva3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTA1MzYsImV4cCI6MjA3MjQ2NjUzNn0.gfopG05KeYsQBhJw8T4L5bvE2GNaUIUvaN15JKPYQ68';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  const email = 'test@example.com';
  const password = 'Password123!';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Supabase sign up error:', error);
  } else {
    console.log('Supabase sign up success:');
    console.log('Access Token:', data.session.access_token);
  }
}

testSignUp();
