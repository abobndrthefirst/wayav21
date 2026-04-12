import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unnheqshkxpbflozechm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVubmhlcXNoa3hwYmZsb3plY2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTkwNjksImV4cCI6MjA5MDQzNTA2OX0.XHAbOOdPtuwD0pJErxhBw9C3RJPouPeUhMS9hSThON0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
