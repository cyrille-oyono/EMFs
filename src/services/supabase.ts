import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SystemSettings,
  LatestServiceMedia,
  HomepageCMSState,
  HomepageCarouselSlide,
  WeeklyProgram,
  DynamicPost,
  AppContentRecord,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_CMS_STATE,
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_CAROUSEL_SLIDES,
  INITIAL_WEEKLY_PROGRAMS,
  INITIAL_LATEST_SERVICE_MEDIA,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_EVENTS,
  INITIAL_TESTIMONIALS,
  INITIAL_MEDIA,
} from '../server/initialData';

// Récupération des clés Supabase depuis les variables d'environnement (Vite ou Next)
const envUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rahkriftfhqwgrnkpyiy.supabase.co'
).trim();

const envKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_dHeTb1557Tlo9tJSQCgR4w_PKN_a3P6'
).trim();

// Vérification de la validité de la configuration Supabase
export function isSupabaseConfigured(): boolean {
  if (!envUrl || !envKey) return false;
  if (envUrl.includes('your-project') || envUrl.includes('YOUR_') || envUrl.includes('example.com')) {
    return false;
  }
  return envUrl.startsWith('http://') || envUrl.startsWith('https://');
}

// Initialisation sécurisée du client Supabase
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(envUrl, envKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.error('Erreur lors de l’initialisation de Supabase:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

/**
 * Exécute une promesse avec un délai maximal (timeout) pour garantir qu'aucune
 * requête Supabase lente ou bloquée n'empêche l'application de s'afficher.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 2500,
  fallbackValue: T
): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[Supabase Timeout] La requête a dépassé ${ms}ms. Bascule immédiate sur les données locales.`);
      resolve(fallbackValue);
    }, ms);
  });
  return Promise.race([
    promise
      .then((res) => {
        clearTimeout(timer);
        return res;
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn('Requête Supabase en échec (utilisation du fallback):', err?.message || err);
        return fallbackValue;
      }),
    timeoutPromise,
  ]);
}

export const FALLBACK_DYNAMIC_POSTS: DynamicPost[] = (INITIAL_ANNOUNCEMENTS || []).map((a, idx) => ({
  id: a?.id || `post-${idx}`,
  category: a?.category || 'ACTUALITE',
  title: a?.title || 'Annonce Paroissiale',
  body: a?.content || a?.summary || '',
  media_url: a?.imageUrl || null,
  author: a?.authorName || 'Bureau Pastoral',
  is_published: true,
  metadata: { priority: (a as any)?.priority || 'NORMAL' },
  created_at: a?.createdAt || new Date().toISOString(),
}));

/**
 * Fusionne des paramètres partiels avec les paramètres système par défaut complets
 */
export function mergeWithDefaultSettings(remote?: Partial<SystemSettings> | null): SystemSettings {
  if (!remote || typeof remote !== 'object') return INITIAL_SETTINGS;
  return {
    ...INITIAL_SETTINGS,
    ...remote,
    churchName: remote.churchName || INITIAL_SETTINGS.churchName,
    slogan: remote.slogan || INITIAL_SETTINGS.slogan,
    city: remote.city || INITIAL_SETTINGS.city,
    country: remote.country || INITIAL_SETTINGS.country,
    address: remote.address || INITIAL_SETTINGS.address,
    phone: remote.phone || INITIAL_SETTINGS.phone,
    email: remote.email || INITIAL_SETTINGS.email,
    website: remote.website || INITIAL_SETTINGS.website,
    socials: {
      ...INITIAL_SETTINGS.socials,
      ...(remote.socials || {}),
    },
    theme: {
      ...INITIAL_SETTINGS.theme,
      ...(remote.theme || {}),
    },
    modules: {
      ...INITIAL_SETTINGS.modules,
      ...(remote.modules || {}),
    },
    integrations: {
      ...INITIAL_SETTINGS.integrations,
      ...(remote.integrations || {}),
    },
    treasury: {
      ...INITIAL_SETTINGS.treasury,
      ...(remote.treasury || {}),
    } as any,
  };
}

/**
 * Fusionne l'état CMS Supabase avec les sections et carrousels complets par défaut
 */
export function mergeWithDefaultCMS(remote?: Partial<SupabaseCMSPayload> | any | null): SupabaseCMSPayload {
  const rawCms = remote?.cmsState || remote;
  const rawPublished = rawCms?.publishedSections || remote?.publishedSections;
  const rawDraft = rawCms?.draftSections || remote?.draftSections;

  const published = Array.isArray(rawPublished) && rawPublished.length > 0
    ? rawPublished.filter(Boolean)
    : INITIAL_HOMEPAGE_SECTIONS;
  const draft = Array.isArray(rawDraft) && rawDraft.length > 0
    ? rawDraft.filter(Boolean)
    : INITIAL_HOMEPAGE_SECTIONS;

  const cmsState: HomepageCMSState = {
    publishedSections: published.length > 0 ? published : INITIAL_HOMEPAGE_SECTIONS,
    draftSections: draft.length > 0 ? draft : INITIAL_HOMEPAGE_SECTIONS,
    revisions: Array.isArray(rawCms?.revisions) ? rawCms.revisions : [],
    lastPublishedAt: rawCms?.lastPublishedAt || new Date().toISOString(),
    lastDraftSavedAt: rawCms?.lastDraftSavedAt,
  };

  const slides = remote?.carouselSlides || remote?.slides;
  const programs = remote?.weeklyPrograms || remote?.programs;

  return {
    cmsState,
    carouselSlides: Array.isArray(slides) ? slides.filter(Boolean) : INITIAL_CAROUSEL_SLIDES,
    weeklyPrograms: Array.isArray(programs) ? programs.filter(Boolean) : INITIAL_WEEKLY_PROGRAMS,
    updatedAt: remote?.updatedAt || new Date().toISOString(),
    updatedBy: remote?.updatedBy || 'Bureau Pastoral',
  };
}

/**
 * Fusionne les médias du culte avec des valeurs par défaut complètes
 */
export function mergeWithDefaultLatestMedia(remote?: Partial<LatestServiceMedia> | null): LatestServiceMedia {
  if (!remote || typeof remote !== 'object') return INITIAL_LATEST_SERVICE_MEDIA;
  return {
    ...INITIAL_LATEST_SERVICE_MEDIA,
    ...remote,
    serviceTitle: remote.serviceTitle !== undefined ? remote.serviceTitle : INITIAL_LATEST_SERVICE_MEDIA.serviceTitle,
    serviceDate: remote.serviceDate !== undefined ? remote.serviceDate : INITIAL_LATEST_SERVICE_MEDIA.serviceDate,
    preacherName: remote.preacherName !== undefined ? remote.preacherName : INITIAL_LATEST_SERVICE_MEDIA.preacherName,
    themePassage: remote.themePassage !== undefined ? remote.themePassage : INITIAL_LATEST_SERVICE_MEDIA.themePassage,
    summary: remote.summary !== undefined ? remote.summary : INITIAL_LATEST_SERVICE_MEDIA.summary,
    photos: Array.isArray(remote.photos) ? remote.photos.filter(Boolean) : INITIAL_LATEST_SERVICE_MEDIA.photos,
    videos: Array.isArray(remote.videos) ? remote.videos.filter(Boolean) : INITIAL_LATEST_SERVICE_MEDIA.videos,
  };
}

/**
 * Normalise et sécurise une publication pour éliminer tout champ undefined ou null
 */
export function sanitizeDynamicPost(p: any): DynamicPost {
  return {
    id: String(p?.id || `dyn-${Math.random().toString(36).substring(2, 9)}`),
    category: String(p?.category || 'ACTUALITE'),
    title: String(p?.title || 'Annonce Paroissiale'),
    body: p?.body ? String(p.body) : null,
    media_url: p?.media_url ? String(p.media_url) : null,
    author: String(p?.author || 'Bureau Pastoral'),
    is_published: p?.is_published !== false,
    metadata: p?.metadata || {},
    created_at: String(p?.created_at || new Date().toISOString()),
  };
}

/**
 * Fournit les données par défaut pour une section clé donnée
 */
export function getDefaultAppContentForSection(sectionKey: string): any {
  switch (sectionKey) {
    case 'church_settings':
      return INITIAL_SETTINGS;
    case 'homepage_cms':
      return mergeWithDefaultCMS(null);
    case 'latest_service_media':
      return INITIAL_LATEST_SERVICE_MEDIA;
    case 'carousel_slides':
      return INITIAL_CAROUSEL_SLIDES;
    case 'weekly_programs':
      return INITIAL_WEEKLY_PROGRAMS;
    case 'homepage_sections':
      return INITIAL_HOMEPAGE_SECTIONS;
    case 'dynamic_posts':
      return FALLBACK_DYNAMIC_POSTS;
    case 'events':
      return INITIAL_EVENTS;
    case 'verses':
      return FALLBACK_VERSES;
    case 'testimonials':
      return INITIAL_TESTIMONIALS;
    case 'media':
      return INITIAL_MEDIA;
    default:
      return null;
  }
}

/**
 * ========================================================
 * TABLES MAÎTRESSES SUPABASE POUR LE CONTENU ET PUBLICATIONS
 * ========================================================
 */
export const APP_CONTENT_TABLE = 'app_content';
export const DYNAMIC_POSTS_TABLE = 'dynamic_posts';
export const SETTINGS_TABLE = 'church_settings'; // Pour compatibilité historique
export const SETTINGS_ROW_ID = 'default';
export const MEDIA_ROW_ID = 'latest_service_media';
export const CMS_ROW_ID = 'homepage_cms';

/**
 * Canal Broadcast Supabase partagé pour la réactivité instantanée à zéro latence
 */
let sharedRealtimeBroadcastChannel: any = null;

export function getSharedRealtimeBroadcastChannel() {
  const client = getSupabaseClient();
  if (!client) return null;
  if (!sharedRealtimeBroadcastChannel) {
    try {
      sharedRealtimeBroadcastChannel = client.channel('emf_church_realtime_broadcast', {
        config: { broadcast: { ack: false } },
      });
      sharedRealtimeBroadcastChannel.subscribe();
    } catch (e) {
      console.warn('Realtime broadcast channel init error:', e);
    }
  }
  return sharedRealtimeBroadcastChannel;
}

export function broadcastRealtimeAppContent(sectionKey: string, contentData: any, eventType: string = 'UPDATE') {
  try {
    const ch = getSharedRealtimeBroadcastChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'app_content_changed',
        payload: { sectionKey, contentData, eventType },
      });
    }
  } catch (e) {
    console.warn('Broadcast app_content_changed error:', e);
  }
}

export function broadcastRealtimeDynamicPost(eventType: string, post?: DynamicPost, oldPostId?: string) {
  try {
    const ch = getSharedRealtimeBroadcastChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'dynamic_post_changed',
        payload: { eventType, newPost: post, oldPostId },
      });
    }
  } catch (e) {
    console.warn('Broadcast dynamic_post_changed error:', e);
  }
}

/**
 * ========================================================
 * 1. TABLE app_content : ÉTAT & MODIFICATIONS DE PAGES (JSON)
 * ========================================================
 */

/**
 * Sauvegarde ou met à jour l'état d'une page/section dans la table maîtresse app_content
 */
export async function saveAppContent(
  sectionKey: string,
  contentData: any
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré.' };
  }

  try {
    const payload = {
      section_key: sectionKey.trim(),
      content_data: contentData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from(APP_CONTENT_TABLE)
      .upsert(payload, { onConflict: 'section_key' });

    if (error) {
      console.error(`Supabase app_content error (${sectionKey}):`, error);
      return { success: false, error: error.message };
    }

    // Diffusion temps réel immédiate aux visiteurs connectés
    broadcastRealtimeAppContent(sectionKey.trim(), contentData, 'UPDATE');

    return { success: true };
  } catch (err: any) {
    console.error(`Supabase app_content exception (${sectionKey}):`, err);
    return { success: false, error: err?.message || 'Erreur inconnue de connexion' };
  }
}

/**
 * Récupère le contenu d'une section/page depuis la table maîtresse app_content
 */
export async function getAppContent<T = any>(sectionKey: string): Promise<T | null> {
  const defaultVal = getDefaultAppContentForSection(sectionKey) as T | null;
  const client = getSupabaseClient();
  if (!client) return defaultVal;

  return withTimeout(
    (async () => {
      try {
        const { data, error } = await client
          .from(APP_CONTENT_TABLE)
          .select('section_key, content_data, updated_at')
          .eq('section_key', sectionKey.trim())
          .maybeSingle();

        if (error) {
          console.warn(`Supabase: Erreur getAppContent(${sectionKey}):`, error.message);
          return defaultVal;
        }

        if (data && data.content_data !== undefined && data.content_data !== null) {
          if (sectionKey === 'church_settings') {
            return mergeWithDefaultSettings(data.content_data) as unknown as T;
          }
          if (sectionKey === 'homepage_cms') {
            return mergeWithDefaultCMS(data.content_data) as unknown as T;
          }
          if (sectionKey === 'latest_service_media') {
            return mergeWithDefaultLatestMedia(data.content_data) as unknown as T;
          }
          if (sectionKey === 'carousel_slides') {
            if (Array.isArray(data.content_data) && data.content_data.length > 0) {
              return data.content_data as T;
            }
            return INITIAL_CAROUSEL_SLIDES as unknown as T;
          }
          if (sectionKey === 'weekly_programs') {
            if (Array.isArray(data.content_data) && data.content_data.length > 0) {
              return data.content_data as T;
            }
            return INITIAL_WEEKLY_PROGRAMS as unknown as T;
          }
          if (sectionKey === 'homepage_sections') {
            if (Array.isArray(data.content_data) && data.content_data.length > 0) {
              return data.content_data as T;
            }
            return INITIAL_HOMEPAGE_SECTIONS as unknown as T;
          }
          if (sectionKey === 'dynamic_posts') {
            if (Array.isArray(data.content_data) && data.content_data.length > 0) {
              return data.content_data.map(sanitizeDynamicPost) as unknown as T;
            }
            return FALLBACK_DYNAMIC_POSTS as unknown as T;
          }
          return data.content_data as T;
        }
        return defaultVal;
      } catch (err: any) {
        console.warn(`Supabase: Exception getAppContent(${sectionKey}):`, err?.message || err);
        return defaultVal;
      }
    })(),
    2500,
    defaultVal
  );
}

/**
 * Récupère toutes les sections enregistrées dans app_content sous forme d'un dictionnaire indexé par section_key
 */
export async function getAllAppContent(): Promise<Record<string, any>> {
  const client = getSupabaseClient();
  if (!client) return {};

  try {
    const { data, error } = await client
      .from(APP_CONTENT_TABLE)
      .select('section_key, content_data, updated_at');

    if (error || !data) return {};

    const map: Record<string, any> = {};
    for (const row of data) {
      if (row.section_key) {
        map[row.section_key] = row.content_data;
      }
    }
    return map;
  } catch (err) {
    return {};
  }
}

/**
 * Souscription Supabase Realtime à TOUTES les modifications de la table maîtresse app_content
 */
export function subscribeToAppContent(
  onUpdate: (payload: { sectionKey: string; contentData: any; eventType: string }) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channelId = `app-content-rt-${Math.random().toString(36).substring(2, 8)}`;
    const channel = client
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: APP_CONTENT_TABLE,
        },
        (payload) => {
          const rec = (payload.new || payload.old) as any;
          if (rec && rec.section_key) {
            onUpdate({
              sectionKey: rec.section_key,
              contentData: (payload.new as any)?.content_data,
              eventType: payload.eventType,
            });
          }
        }
      )
      .on('broadcast', { event: 'app_content_changed' }, ({ payload }) => {
        if (payload && payload.sectionKey) {
          onUpdate({
            sectionKey: payload.sectionKey,
            contentData: payload.contentData,
            eventType: payload.eventType || 'UPDATE',
          });
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase: Erreur souscription temps réel app_content:', err);
    return () => {};
  }
}

/**
 * ========================================================
 * 2. TABLE dynamic_posts : PUBLICATIONS, ENSEIGNEMENTS, ANNONCES & ACTUALITÉS
 * ========================================================
 */

/**
 * Récupère les publications et contenus dynamiques depuis Supabase
 */
export async function getDynamicPosts(options?: {
  category?: string;
  publishedOnly?: boolean;
  limit?: number;
}): Promise<DynamicPost[]> {
  const client = getSupabaseClient();
  if (!client) return FALLBACK_DYNAMIC_POSTS;

  return withTimeout(
    (async () => {
      try {
        let query = client
          .from(DYNAMIC_POSTS_TABLE)
          .select('*')
          .order('created_at', { ascending: false });

        if (options?.publishedOnly !== false) {
          query = query.eq('is_published', true);
        }
        if (options?.category && options.category !== 'ALL' && options.category !== 'TOUS') {
          query = query.eq('category', options.category);
        }
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error || !data || data.length === 0) {
          return FALLBACK_DYNAMIC_POSTS;
        }

        const sanitized = data.map(sanitizeDynamicPost);
        return sanitized.length > 0 ? sanitized : FALLBACK_DYNAMIC_POSTS;
      } catch (err: any) {
        console.warn('Supabase: Exception lecture dynamic_posts:', err?.message || err);
        return FALLBACK_DYNAMIC_POSTS;
      }
    })(),
    2500,
    FALLBACK_DYNAMIC_POSTS
  );
}

/**
 * Ajoute une nouvelle publication ou enseignement dans dynamic_posts
 */
export async function createDynamicPost(post: {
  category: string;
  title: string;
  body?: string | null;
  media_url?: string | null;
  author?: string;
  is_published?: boolean;
  metadata?: Record<string, any> | null;
}): Promise<{ success: boolean; data?: DynamicPost; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré.' };
  }

  try {
    const payload = {
      category: (post.category || 'ACTUALITE').trim(),
      title: post.title.trim(),
      body: post.body || null,
      media_url: post.media_url || null,
      author: post.author || 'Bureau Pastoral',
      is_published: post.is_published !== false,
      metadata: post.metadata || {},
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from(DYNAMIC_POSTS_TABLE)
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase: Erreur insertion dynamic_posts:', error);
      return { success: false, error: error.message };
    }

    const created = data as DynamicPost;
    broadcastRealtimeDynamicPost('INSERT', created);

    return { success: true, data: created };
  } catch (err: any) {
    console.error('Supabase: Exception insertion dynamic_posts:', err);
    return { success: false, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Met à jour une publication existante dans dynamic_posts
 */
export async function updateDynamicPost(
  id: string,
  updates: Partial<DynamicPost>
): Promise<{ success: boolean; data?: DynamicPost; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase n’est pas configuré.' };

  try {
    const { data, error } = await client
      .from(DYNAMIC_POSTS_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    const updated = data as DynamicPost;
    broadcastRealtimeDynamicPost('UPDATE', updated);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Supprime une publication dans dynamic_posts
 */
export async function deleteDynamicPost(id: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase n’est pas configuré.' };

  try {
    const { error } = await client
      .from(DYNAMIC_POSTS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    broadcastRealtimeDynamicPost('DELETE', undefined, id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Souscription Supabase Realtime à TOUTES les modifications dans la table dynamic_posts
 */
export function subscribeToDynamicPosts(
  onUpdate: (payload: { eventType: string; newPost?: DynamicPost; oldPostId?: string }) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channelId = `dyn-posts-rt-${Math.random().toString(36).substring(2, 8)}`;
    const channel = client
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: DYNAMIC_POSTS_TABLE,
        },
        (payload) => {
          onUpdate({
            eventType: payload.eventType,
            newPost: payload.new ? (payload.new as DynamicPost) : undefined,
            oldPostId: (payload.old as any)?.id,
          });
        }
      )
      .on('broadcast', { event: 'dynamic_post_changed' }, ({ payload }) => {
        if (payload) {
          onUpdate({
            eventType: payload.eventType || 'INSERT',
            newPost: payload.newPost,
            oldPostId: payload.oldPostId,
          });
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase: Erreur souscription temps réel dynamic_posts:', err);
    return () => {};
  }
}

/**
 * ========================================================
 * 3. GESTION DES PARAMÈTRES (SYNC DOUBLE APP_CONTENT & CHURCH_SETTINGS)
 * ========================================================
 */

/**
 * Récupère les paramètres de l'église (priorité app_content, fallback church_settings)
 */
export async function getChurchSettingsFromSupabase(): Promise<SystemSettings> {
  const client = getSupabaseClient();
  if (!client) return INITIAL_SETTINGS;

  return withTimeout(
    (async () => {
      try {
        // 1. Priorité à la table maîtresse app_content
        const appContentSettings = await getAppContent<SystemSettings>('church_settings');
        if (appContentSettings && appContentSettings.churchName) {
          return mergeWithDefaultSettings(appContentSettings);
        }

        // 2. Fallback sur la table church_settings
        const { data, error } = await client
          .from(SETTINGS_TABLE)
          .select('settings, updated_at')
          .eq('id', SETTINGS_ROW_ID)
          .maybeSingle();

        if (!error && data && data.settings) {
          return mergeWithDefaultSettings(data.settings as SystemSettings);
        }
        return INITIAL_SETTINGS;
      } catch (err: any) {
        console.warn('Supabase: Exception lors de la lecture des paramètres:', err?.message || err);
        return INITIAL_SETTINGS;
      }
    })(),
    2500,
    INITIAL_SETTINGS
  );
}

/**
 * Sauvegarde / Upsert les paramètres de l'église dans app_content et church_settings
 */
export async function saveChurchSettingsToSupabase(
  settings: SystemSettings
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase n’est pas configuré. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    // 1. Sauvegarde dans app_content (table maîtresse)
    await saveAppContent('church_settings', settings);

    // 2. Sauvegarde de réplication dans church_settings
    const payload = {
      id: SETTINGS_ROW_ID,
      settings: settings,
      updated_at: new Date().toISOString(),
    };
    await client.from(SETTINGS_TABLE).upsert(payload, { onConflict: 'id' });

    return { success: true };
  } catch (err: any) {
    console.error('Supabase: Exception lors de la sauvegarde:', err);
    return { success: false, error: err?.message || 'Erreur inconnue de connexion à Supabase' };
  }
}

/**
 * Abonnement en temps réel aux changements de paramètres dans Supabase
 */
export function subscribeToChurchSettings(
  onUpdate: (newSettings: SystemSettings) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    // Écoute sur app_content (prioritaire)
    const unsubAppContent = subscribeToAppContent(({ sectionKey, contentData }) => {
      if (sectionKey === 'church_settings' && contentData) {
        onUpdate(contentData as SystemSettings);
      }
    });

    // Écoute également sur church_settings
    const channel = client
      .channel('church-settings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SETTINGS_TABLE,
          filter: `id=eq.${SETTINGS_ROW_ID}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).settings) {
            const updated = (payload.new as any).settings as SystemSettings;
            onUpdate(updated);
          }
        }
      )
      .subscribe();

    return () => {
      unsubAppContent();
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase: Impossible de souscrire au canal temps réel:', err);
    return () => {};
  }
}

/**
 * ========================================================
 * 4. DERNIER CULTE & MÉDIAS (PHOTOS / VIDÉOS)
 * ========================================================
 */

/**
 * Récupère les photos et vidéos du dernier culte depuis Supabase
 */
export async function getLatestServiceMediaFromSupabase(): Promise<LatestServiceMedia> {
  const client = getSupabaseClient();
  if (!client) return INITIAL_LATEST_SERVICE_MEDIA;

  return withTimeout(
    (async () => {
      try {
        // 1. Priorité app_content
        const remote = await getAppContent<LatestServiceMedia>('latest_service_media');
        if (remote) {
          return mergeWithDefaultLatestMedia(remote);
        }

        // 2. Fallback
        const { data } = await client
          .from(SETTINGS_TABLE)
          .select('settings')
          .eq('id', MEDIA_ROW_ID)
          .maybeSingle();

        if (data && data.settings) {
          return mergeWithDefaultLatestMedia(data.settings as LatestServiceMedia);
        }
        return INITIAL_LATEST_SERVICE_MEDIA;
      } catch (err) {
        return INITIAL_LATEST_SERVICE_MEDIA;
      }
    })(),
    2500,
    INITIAL_LATEST_SERVICE_MEDIA
  );
}

/**
 * Sauvegarde les photos et vidéos du dernier culte dans Supabase
 */
export async function saveLatestServiceMediaToSupabase(
  media: LatestServiceMedia
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré.' };
  }

  try {
    // 1. Sauvegarde dans app_content
    await saveAppContent('latest_service_media', media);

    // 2. Sauvegarde de réplication
    const payload = {
      id: MEDIA_ROW_ID,
      settings: media,
      updated_at: new Date().toISOString(),
    };
    await client.from(SETTINGS_TABLE).upsert(payload, { onConflict: 'id' });

    return { success: true };
  } catch (err: any) {
    console.error('Supabase: Exception lors de la sauvegarde média:', err);
    return { success: false, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Abonnement en temps réel aux changements de photos/vidéos dans Supabase
 */
export function subscribeToLatestServiceMedia(
  onUpdate: (media: LatestServiceMedia) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const unsubApp = subscribeToAppContent(({ sectionKey, contentData }) => {
      if (sectionKey === 'latest_service_media' && contentData) {
        onUpdate(contentData as LatestServiceMedia);
      }
    });

    const channel = client
      .channel('church-media-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SETTINGS_TABLE,
          filter: `id=eq.${MEDIA_ROW_ID}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).settings) {
            onUpdate((payload.new as any).settings as LatestServiceMedia);
          }
        }
      )
      .subscribe();

    return () => {
      unsubApp();
      client.removeChannel(channel);
    };
  } catch (err) {
    return () => {};
  }
}

/**
 * ========================================================
 * 5. SYNCHRONISATION CMS PAGES D'ACCUEIL & CONTENU (app_content)
 * ========================================================
 */

export interface SupabaseCMSPayload {
  cmsState: HomepageCMSState;
  carouselSlides?: HomepageCarouselSlide[];
  weeklyPrograms?: WeeklyProgram[];
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Récupère l'état complet du CMS (pages, sections, slides, cultes) depuis Supabase
 */
export async function getCMSStateFromSupabase(): Promise<SupabaseCMSPayload> {
  const fallback = mergeWithDefaultCMS(null);
  const client = getSupabaseClient();
  if (!client) return fallback;

  return withTimeout(
    (async () => {
      try {
        // 1. Lecture prioritaire depuis app_content
        const remoteCMS = await getAppContent<SupabaseCMSPayload>('homepage_cms');
        if (remoteCMS?.cmsState) {
          const remoteSlides = await getAppContent<HomepageCarouselSlide[]>('carousel_slides');
          const remotePrograms = await getAppContent<WeeklyProgram[]>('weekly_programs');
          return mergeWithDefaultCMS({
            ...remoteCMS,
            carouselSlides: remoteSlides || remoteCMS.carouselSlides,
            weeklyPrograms: remotePrograms || remoteCMS.weeklyPrograms,
          });
        }

        // 2. Fallback historique sur church_settings
        const { data, error } = await client
          .from(SETTINGS_TABLE)
          .select('settings, updated_at')
          .eq('id', CMS_ROW_ID)
          .maybeSingle();

        if (!error && data && data.settings) {
          return mergeWithDefaultCMS(data.settings as SupabaseCMSPayload);
        }
        return fallback;
      } catch (err: any) {
        console.warn('Supabase: Exception lors de la lecture du CMS:', err?.message || err);
        return fallback;
      }
    })(),
    2500,
    fallback
  );
}

/**
 * Sauvegarde et publie en direct le contenu des pages dans Supabase (app_content & church_settings)
 */
export async function saveCMSStateToSupabase(
  payload: SupabaseCMSPayload
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré.' };
  }

  try {
    // 1. Sauvegarde dans app_content pour chaque section maîtresse
    await Promise.all([
      saveAppContent('homepage_cms', payload),
      payload.carouselSlides ? saveAppContent('carousel_slides', payload.carouselSlides) : Promise.resolve(),
      payload.weeklyPrograms ? saveAppContent('weekly_programs', payload.weeklyPrograms) : Promise.resolve(),
      payload.cmsState?.publishedSections ? saveAppContent('homepage_sections', payload.cmsState.publishedSections) : Promise.resolve(),
    ]);

    // 2. Sauvegarde de réplication historique
    const record = {
      id: CMS_ROW_ID,
      settings: payload,
      updated_at: new Date().toISOString(),
    };
    await client.from(SETTINGS_TABLE).upsert(record, { onConflict: 'id' });

    return { success: true };
  } catch (err: any) {
    console.error('Supabase: Exception lors de la sauvegarde du contenu:', err);
    return { success: false, error: err?.message || 'Erreur inconnue de connexion' };
  }
}

/**
 * Abonnement en temps réel aux modifications des pages de l'église dans Supabase
 */
export function subscribeToCMSState(
  onUpdate: (payload: SupabaseCMSPayload) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    // Écoute temps réel directe sur app_content
    const unsubApp = subscribeToAppContent(({ sectionKey, contentData }) => {
      if (sectionKey === 'homepage_cms' && contentData?.cmsState) {
        onUpdate(contentData as SupabaseCMSPayload);
      }
    });

    const channel = client
      .channel('church-cms-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SETTINGS_TABLE,
          filter: `id=eq.${CMS_ROW_ID}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).settings) {
            onUpdate((payload.new as any).settings as SupabaseCMSPayload);
          }
        }
      )
      .subscribe();

    return () => {
      unsubApp();
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase: Erreur souscription temps réel CMS:', err);
    return () => {};
  }
}

/**
 * ========================================================
 * NOUVELLE TABLE SUPABASE : 'verses' (Versets Bibliques)
 * ========================================================
 */
export const VERSES_TABLE = 'verses';

export interface SupabaseVerse {
  id?: string;
  reference: string;
  text: string;
  translation?: string;
  theme?: string;
  meditation?: string;
  prayer?: string;
  created_at?: string;
  isFromSupabase?: boolean;
}

export const FALLBACK_VERSES: SupabaseVerse[] = [
  {
    reference: 'Jean 3:16',
    text: 'Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.',
    translation: 'Louis Segond 1910',
    theme: 'Amour & Salut',
    meditation: 'L’amour divin transcende toute circonstance humaine. C’est un don parfait qui nous offre la paix et la vie éternelle.',
    prayer: 'Seigneur Jésus, merci pour Ton amour infini manifesté à la croix. Affermis ma foi en Toi chaque jour. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Philippiens 4:13',
    text: 'Je puis tout par celui qui me fortifie.',
    translation: 'Louis Segond 1910',
    theme: 'Victoire & Force',
    meditation: 'Face aux défis du travail, de la famille et des épreuves, notre force ne réside pas dans nos capacités, mais dans le Christ en nous.',
    prayer: 'Père Céleste, renouvelle mes forces aujourd’hui. Que Ta grâce triomphe dans chacune de mes faiblesses. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Jérémie 29:11',
    text: 'Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance.',
    translation: 'Louis Segond 1910',
    theme: 'Espérance & Destinée',
    meditation: 'Dieu a tracé pour chacun de Ses enfants un chemin de paix. Avançons avec confiance vers Ses promesses.',
    prayer: 'Seigneur Dieu, je remets mes projets et mon avenir entre Tes mains bienveillantes. Conduis mes pas vers Ta gloire. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Psaume 23:1-3',
    text: 'L’Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages, Il me dirige près des eaux paisibles.',
    translation: 'Louis Segond 1910',
    theme: 'Protection & Paix',
    meditation: 'Le bon Berger veille sans cesse sur nous. Il nous nourrit de Sa Parole et restaure notre âme fatiguée.',
    prayer: 'Seigneur, sois mon guide et mon repos. Éloigne de mon esprit l’anxiété et inonde mon cœur de Ta sainte présence. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Josué 1:9',
    text: 'Ne t’ai-je pas donné cet ordre : Fortifie-toi et prends courage ? Ne t’effraie point et ne t’épouvante point, car l’Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.',
    translation: 'Louis Segond 1910',
    theme: 'Courage & Foi',
    meditation: 'L’ordre divin est clair : marcher avec hardiesse et assurance, sachant que la présence divine ne nous abandonne jamais.',
    prayer: 'Éternel mon Dieu, bannis la peur de mon cœur et remplis-moi de Ton Esprit de force et de courage pour ce jour. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Ésaïe 40:31',
    text: 'Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent le vol comme les aigles ; ils courent, et ne se lassent point ; ils marchent, et ne se fatiguent point.',
    translation: 'Louis Segond 1910',
    theme: 'Renouvellement',
    meditation: 'Attendre l’Éternel n’est pas une passivité, mais une posture de foi qui puise une énergie céleste inépuisable.',
    prayer: 'Seigneur, je m’attends à Toi. Élève ma vie au-dessus des tempêtes terrestres par la puissance de Ton Esprit. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Proverbes 3:5-6',
    text: 'Confie-toi en l’Éternel de tout ton cœur, et ne t’appuie pas sur ta sagesse ; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.',
    translation: 'Louis Segond 1910',
    theme: 'Direction Divine',
    meditation: 'L’abandon total à la sagesse de Dieu ouvre les portes que nos efforts humains ne sauraient ouvrir.',
    prayer: 'Mon Dieu, guide mes décisions professionnelles et familiales. Que Ta volonté soit ma seule boussole. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Romains 8:28',
    text: 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.',
    translation: 'Louis Segond 1910',
    theme: 'Fidélité Divine',
    meditation: 'Même les moments difficiles sont transformés en témoignages par la souveraineté bienveillante de notre Père.',
    prayer: 'Seigneur, je crois que Tu orchestres chaque événement pour mon élévation spirituelle et pour Ta gloire. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Matthieu 11:28',
    text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
    translation: 'Louis Segond 1910',
    theme: 'Repos en Christ',
    meditation: 'Jésus nous invite à déposer nos fardeaux spirituels, émotionnels et matériels à Ses pieds bénis.',
    prayer: 'Seigneur Jésus, je viens à Toi avec mes fatigues. Reçois-moi et remplis-moi de Ta paix inaltérable. Amen.',
    isFromSupabase: false,
  },
  {
    reference: 'Psaume 121:1-2',
    text: 'Je lève mes yeux vers les montagnes... D’où me viendra le secours ? Le secours me vient de l’Éternel, qui a fait les cieux et la terre.',
    translation: 'Louis Segond 1910',
    theme: 'Secours Divin',
    meditation: 'Notre Créateur ne sommeille ni ne dort. Son regard protecteur veille sur l’assemblée d’Akon et sur nos demeures.',
    prayer: 'Éternel Tout-Puissant, Créateur des cieux et de la terre, sois mon bouclier et mon rocher en tout temps. Amen.',
    isFromSupabase: false,
  },
];

/**
 * Normalise un enregistrement brut issu de Supabase vers SupabaseVerse
 */
function normalizeSupabaseVerse(raw: any): SupabaseVerse | null {
  if (!raw) return null;
  const text = (raw.text || raw.verse_text || raw.content || raw.body || raw.verset || raw.message || '').trim();
  if (!text) return null;

  const reference = (
    raw.reference ||
    raw.ref ||
    raw.passage ||
    raw.verse_ref ||
    raw.verset_ref ||
    'Parole de Dieu'
  ).trim();

  return {
    id: raw.id ? String(raw.id) : undefined,
    reference,
    text,
    translation: raw.translation || raw.version || 'Louis Segond 1910',
    theme: raw.theme || raw.category || raw.tag || 'Parole de Vie',
    meditation: raw.meditation || raw.reflection || '',
    prayer: raw.prayer || raw.priere || '',
    created_at: raw.created_at || raw.createdAt || '',
    isFromSupabase: true,
  };
}

/**
 * Récupère tous les versets enregistrés dans la table Supabase 'verses'
 */
export async function getVersesFromSupabase(): Promise<SupabaseVerse[]> {
  const client = getSupabaseClient();
  if (!client) {
    return FALLBACK_VERSES;
  }

  return withTimeout(
    (async () => {
      try {
        const { data, error } = await client
          .from(VERSES_TABLE)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Supabase: Erreur de lecture de la table verses:', error.message);
          return FALLBACK_VERSES;
        }

        if (data && data.length > 0) {
          const normalized = data
            .map(normalizeSupabaseVerse)
            .filter((v): v is SupabaseVerse => v !== null);

          if (normalized.length > 0) {
            return normalized;
          }
        }

        return FALLBACK_VERSES;
      } catch (err: any) {
        console.warn('Supabase: Exception lors de la lecture de la table verses:', err?.message || err);
        return FALLBACK_VERSES;
      }
    })(),
    2500,
    FALLBACK_VERSES
  );
}

/**
 * Récupère un verset aléatoire tiré de la table Supabase 'verses'
 */
export async function getRandomVerseFromSupabase(): Promise<SupabaseVerse> {
  try {
    const verses = await getVersesFromSupabase();
    if (!Array.isArray(verses) || verses.length === 0) {
      return FALLBACK_VERSES[0];
    }
    const randomIndex = Math.floor(Math.random() * verses.length);
    return verses[randomIndex] || FALLBACK_VERSES[0];
  } catch {
    return FALLBACK_VERSES[0];
  }
}

/**
 * Ajoute un nouveau verset dans la table Supabase 'verses'
 */
export async function addVerseToSupabase(
  verse: {
    reference: string;
    text: string;
    translation?: string;
    theme?: string;
    meditation?: string;
    prayer?: string;
  }
): Promise<{ success: boolean; data?: SupabaseVerse; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase n’est pas configuré.' };
  }

  try {
    const payload = {
      reference: verse.reference.trim(),
      text: verse.text.trim(),
      translation: verse.translation?.trim() || 'Louis Segond 1910',
      theme: verse.theme?.trim() || 'Méditation & Foi',
      meditation: verse.meditation?.trim() || '',
      prayer: verse.prayer?.trim() || '',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from(VERSES_TABLE)
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Supabase: Erreur d’insertion dans la table verses:', error);
      return { success: false, error: error.message };
    }

    const normalized = normalizeSupabaseVerse(data) || {
      ...payload,
      isFromSupabase: true,
    };

    return { success: true, data: normalized };
  } catch (err: any) {
    console.error('Supabase: Exception lors de l’ajout du verset:', err);
    return { success: false, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Initialise / Alimente la table 'verses' de Supabase avec la sélection biblique par défaut
 */
export async function seedDefaultVersesToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase n’est pas configuré.' };
  }

  try {
    const rows = FALLBACK_VERSES.map((v) => ({
      reference: v.reference,
      text: v.text,
      translation: v.translation || 'Louis Segond 1910',
      theme: v.theme || 'Foi & Espérance',
      meditation: v.meditation || '',
      prayer: v.prayer || '',
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await client
      .from(VERSES_TABLE)
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase: Erreur lors du seeding de la table verses:', error);
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data?.length || rows.length };
  } catch (err: any) {
    console.error('Supabase: Exception lors du seeding de la table verses:', err);
    return { success: false, count: 0, error: err?.message || 'Erreur inconnue' };
  }
}

/**
 * Souscrit en temps réel aux ajouts/modifications dans la table 'verses' de Supabase
 */
export function subscribeToVersesTable(onUpdate: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('church-verses-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: VERSES_TABLE,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    return () => {};
  }
}


