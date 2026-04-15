import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Log, don't throw. Throwing at module-load time crashes the whole React tree
// (white screen) even for pages that don't need Supabase (landing, privacy,
// terms). We fall back to a placeholder client so feature code that actually
// calls Supabase will fail loudly, but the marketing site still renders.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    '[waya] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env.local and Vercel project env.'
  );
}

export const supabase = createClient(
  SUPABASE_URL || 'https://missing-env.invalid',
  SUPABASE_ANON_KEY || 'missing-env'
);
