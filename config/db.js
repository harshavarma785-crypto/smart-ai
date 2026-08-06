import { supabase } from './supabase.js';

export { supabase };

export const connectDB = async () => {
  try {
    const { error } = await supabase.from('products').select('id', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      console.warn(`Supabase PostgreSQL Status Notice: ${error.message}`);
    } else {
      console.log('Supabase PostgreSQL Connected successfully.');
    }
  } catch (error) {
    console.error(`Supabase Connection Error: ${error.message}`);
    console.warn('Note: Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correctly configured.');
  }
};
