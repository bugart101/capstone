
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CREDENTIALS SETUP
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://mboojysxqgunsydarigg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ib29qeXN4cWd1bnN5ZGFyaWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MTQyODcsImV4cCI6MjA3OTI5MDI4N30.nsV6G552UyxRjKPkBVI4DIUqh_8NA_qajYbiAgdhlmg';

// ------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
