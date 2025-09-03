const { createClient } = require('../node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://yiezeelqulecqgdpeuii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZXplZWxxdWxlY3FnZHBldWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTg4NTAsImV4cCI6MjA3MjM5NDg1MH0.GesXoyP0Oclk23z34yHs2O2c1dK9X2A6nh2kA2kN97A';

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
    console.log('Supabase sign up success:', data);
  }
}

testSignUp();
