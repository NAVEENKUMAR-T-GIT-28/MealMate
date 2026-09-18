import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service Role Key required for backend overrides

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
