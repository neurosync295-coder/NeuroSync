import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://wpluzesjitwmklpwvqlv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHV6ZXNqaXR3bWtscHd2cWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTU4NTQsImV4cCI6MjA4ODI5MTg1NH0.eTiaHms5sKjd1SM136xtzJn7_6JmnAJg5elbs9PvQ2c';

export const supabase = createClient(supabaseUrl, supabaseKey);
