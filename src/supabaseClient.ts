import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération souple et sécurisée des clés Supabase (Vite, Next, Process ou Fallback par défaut)
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env[key]) return String(import.meta.env[key]).trim();
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key]) return String(process.env[key]).trim();
    }
  } catch {}
  return '';
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  'https://rahkriftfhqwgrnkpyiy.supabase.co';

const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY') ||
  'sb_publishable_dHeTb1557Tlo9tJSQCgR4w_PKN_a3P6';

// Création sécurisée avec fallback mock pour éviter tout crash au démarrage
function createSafeSupabaseClient(): SupabaseClient {
  try {
    if (supabaseUrl && supabaseAnonKey && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
    }
  } catch (err) {
    console.warn('Initialisation standard Supabase échouée, activation du client résilient:', err);
  }

  // Fallback client mock sécurisé si createClient échoue pour empêcher toute page blanche
  const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  };

  const mockChannel = {
    on: function () {
      return this;
    },
    subscribe: function () {
      return this;
    },
    unsubscribe: () => {},
  };

  const mockQuery = {
    select: function () {
      return this;
    },
    insert: function () {
      return this;
    },
    update: function () {
      return this;
    },
    upsert: function () {
      return this;
    },
    delete: function () {
      return this;
    },
    eq: function () {
      return this;
    },
    neq: function () {
      return this;
    },
    filter: function () {
      return this;
    },
    match: function () {
      return this;
    },
    in: function () {
      return this;
    },
    is: function () {
      return this;
    },
    gt: function () {
      return this;
    },
    lt: function () {
      return this;
    },
    gte: function () {
      return this;
    },
    lte: function () {
      return this;
    },
    range: function () {
      return this;
    },
    order: function () {
      return this;
    },
    limit: function () {
      return this;
    },
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: (val: any) => any) => Promise.resolve({ data: [], error: null }).then(resolve),
  };

  return {
    auth: mockAuth,
    from: () => mockQuery,
    channel: () => mockChannel,
    removeChannel: () => {},
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = createSafeSupabaseClient();
export const isSupabaseReady = Boolean(supabaseUrl && supabaseAnonKey);
