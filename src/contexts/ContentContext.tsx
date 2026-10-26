import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HomepageSection,
  HomepageCarouselSlide,
  WeeklyProgram,
  LatestServiceMedia,
  DynamicPost,
  Event,
  Testimonial,
  DailyBibleVerse,
  MediaItem,
} from '../types';
import { apiClient } from '../services/apiClient';
import {
  subscribeToAppContent,
  subscribeToDynamicPosts,
  subscribeToCMSState,
  isSupabaseConfigured,
  FALLBACK_DYNAMIC_POSTS,
} from '../services/supabase';
import { churchSyncService } from '../services/churchSyncService';
import { Storage } from '../server/storage';
import {
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_CAROUSEL_SLIDES,
  INITIAL_WEEKLY_PROGRAMS,
  INITIAL_LATEST_SERVICE_MEDIA,
  INITIAL_EVENTS,
  INITIAL_TESTIMONIALS,
  INITIAL_MEDIA,
} from '../server/initialData';

interface ContentContextType {
  sections: HomepageSection[];
  carouselSlides: HomepageCarouselSlide[];
  weeklyPrograms: WeeklyProgram[];
  latestServiceMedia: LatestServiceMedia;
  dynamicPosts: DynamicPost[];
  events: Event[];
  testimonials: Testimonial[];
  todayVerse: DailyBibleVerse | undefined;
  mediaItems: MediaItem[];
  isContentLoading: boolean;
  lastSyncedTime: string | null;
  refreshContent: () => Promise<void>;
  updateSection: (sectionKey: string, contentData: any) => Promise<boolean>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialisation instantanée avec des données par défaut complètes synchronisées pour bannir la page blanche
  const [sections, setSections] = useState<HomepageSection[]>(() => {
    try {
      const s = Storage.getPublicHomepageSections();
      return Array.isArray(s) && s.length > 0 ? s : INITIAL_HOMEPAGE_SECTIONS;
    } catch {
      return INITIAL_HOMEPAGE_SECTIONS;
    }
  });

  const [carouselSlides, setCarouselSlides] = useState<HomepageCarouselSlide[]>(() => {
    try {
      const s = Storage.getCarouselSlides();
      return Array.isArray(s) && s.length > 0 ? s : INITIAL_CAROUSEL_SLIDES;
    } catch {
      return INITIAL_CAROUSEL_SLIDES;
    }
  });

  const [weeklyPrograms, setWeeklyPrograms] = useState<WeeklyProgram[]>(() => {
    try {
      const p = Storage.getWeeklyPrograms();
      return Array.isArray(p) && p.length > 0 ? p : INITIAL_WEEKLY_PROGRAMS;
    } catch {
      return INITIAL_WEEKLY_PROGRAMS;
    }
  });

  const [latestServiceMedia, setLatestServiceMedia] = useState<LatestServiceMedia>(() => {
    try {
      const m = Storage.getLatestServiceMedia();
      return m && typeof m === 'object' && m.serviceTitle ? m : INITIAL_LATEST_SERVICE_MEDIA;
    } catch {
      return INITIAL_LATEST_SERVICE_MEDIA;
    }
  });

  const [dynamicPosts, setDynamicPosts] = useState<DynamicPost[]>(() => {
    return FALLBACK_DYNAMIC_POSTS;
  });

  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const e = Storage.getEvents();
      return Array.isArray(e) && e.length > 0 ? e : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    try {
      const t = Storage.getTestimonials(true);
      return Array.isArray(t) && t.length > 0 ? t : INITIAL_TESTIMONIALS;
    } catch {
      return INITIAL_TESTIMONIALS;
    }
  });

  const [todayVerse, setTodayVerse] = useState<DailyBibleVerse | undefined>(() => {
    try {
      return Storage.getTodayVerse();
    } catch {
      return undefined;
    }
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    try {
      const m = Storage.getMediaItems();
      return Array.isArray(m) && m.length > 0 ? m : INITIAL_MEDIA;
    } catch {
      return INITIAL_MEDIA;
    }
  });

  const [isContentLoading, setIsContentLoading] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Fonction de chargement avec protection totale contre les blocages réseau
  const refreshContent = useCallback(async () => {
    try {
      const [secList, evts, tst, vrs, med, slides, lastMedia, progs, posts] = await Promise.all([
        apiClient.getPublicHomepageSections().catch(() => Storage.getPublicHomepageSections()),
        apiClient.getEvents().catch(() => Storage.getEvents()),
        apiClient.getTestimonials(true).catch(() => Storage.getTestimonials(true)),
        apiClient.getTodayVerse().catch(() => Storage.getTodayVerse()),
        apiClient.getMediaItems().catch(() => Storage.getMediaItems()),
        apiClient.getCarouselSlides().catch(() => Storage.getCarouselSlides()),
        apiClient.getLatestServiceMedia().catch(() => Storage.getLatestServiceMedia()),
        apiClient.getWeeklyPrograms().catch(() => Storage.getWeeklyPrograms()),
        apiClient.getDynamicPosts().catch(() => FALLBACK_DYNAMIC_POSTS),
      ]);

      if (Array.isArray(secList) && secList.length > 0) setSections(secList);
      if (Array.isArray(evts) && evts.length > 0) setEvents(evts);
      if (Array.isArray(tst) && tst.length > 0) setTestimonials(tst);
      if (vrs) setTodayVerse(vrs);
      if (Array.isArray(med) && med.length > 0) setMediaItems(med);
      if (Array.isArray(slides) && slides.length > 0) setCarouselSlides(slides);
      if (lastMedia && lastMedia.serviceTitle) setLatestServiceMedia(lastMedia);
      if (Array.isArray(progs) && progs.length > 0) setWeeklyPrograms(progs);
      if (Array.isArray(posts) && posts.length > 0) setDynamicPosts(posts);

      setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement du contenu (données par défaut conservées):', err);
    } finally {
      setIsContentLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Timeout de sécurité pour ne jamais bloquer l'interface
    const timer = setTimeout(() => {
      if (isMounted) setIsContentLoading(false);
    }, 1500);

    refreshContent().finally(() => {
      if (isMounted) setIsContentLoading(false);
    });

    // 1. Souscription temps réel à la table app_content
    let unsubAppContent = () => {};
    try {
      unsubAppContent = subscribeToAppContent(({ sectionKey, contentData }) => {
        if (!isMounted) return;
        if (sectionKey === 'homepage_cms' && contentData?.cmsState?.publishedSections) {
          setSections(contentData.cmsState.publishedSections.filter((s: any) => s.isVisible));
          if (contentData.carouselSlides) setCarouselSlides(contentData.carouselSlides);
          if (contentData.weeklyPrograms) setWeeklyPrograms(contentData.weeklyPrograms);
        } else if (sectionKey === 'carousel_slides' && Array.isArray(contentData)) {
          setCarouselSlides(contentData);
        } else if (sectionKey === 'weekly_programs' && Array.isArray(contentData)) {
          setWeeklyPrograms(contentData);
        } else if (sectionKey === 'latest_service_media') {
          setLatestServiceMedia(contentData);
        } else if (sectionKey === 'homepage_sections' && Array.isArray(contentData)) {
          setSections(contentData.filter((s: any) => s.isVisible));
        }
        setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      });
    } catch (e) {
      console.warn('Erreur souscription subscribeToAppContent:', e);
    }

    // 2. Souscription temps réel à la table dynamic_posts
    let unsubDynamicPosts = () => {};
    try {
      unsubDynamicPosts = subscribeToDynamicPosts(() => {
        if (!isMounted) return;
        apiClient.getDynamicPosts().then((posts) => {
          if (isMounted && posts) {
            setDynamicPosts(posts);
            setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }
        }).catch(() => {});
      });
    } catch (e) {
      console.warn('Erreur souscription subscribeToDynamicPosts:', e);
    }

    // 3. Souscription CMS Supabase
    let unsubCmsSupabase = () => {};
    try {
      unsubCmsSupabase = subscribeToCMSState((payload) => {
        if (!isMounted) return;
        if (payload.cmsState?.publishedSections) {
          setSections(payload.cmsState.publishedSections.filter((s) => s.isVisible));
        }
        if (payload.carouselSlides && payload.carouselSlides.length > 0) {
          setCarouselSlides(payload.carouselSlides);
        }
        if (payload.weeklyPrograms && payload.weeklyPrograms.length > 0) {
          setWeeklyPrograms(payload.weeklyPrograms);
        }
        setLastSyncedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      });
    } catch (e) {
      console.warn('Erreur souscription subscribeToCMSState:', e);
    }

    // 4. Événements réseau local
    let unsubLocal = () => {};
    try {
      unsubLocal = churchSyncService.subscribe((event) => {
        if (!isMounted) return;
        if (event.type === 'church:cms_updated') {
          refreshContent();
        }
      });
    } catch (e) {
      console.warn('Erreur souscription churchSyncService:', e);
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
      try {
        unsubAppContent();
        unsubDynamicPosts();
        unsubCmsSupabase();
        unsubLocal();
      } catch {}
    };
  }, [refreshContent]);

  const updateSection = async (sectionKey: string, contentData: any): Promise<boolean> => {
    try {
      const res = await apiClient.saveAppContent(sectionKey, contentData);
      return res.success;
    } catch {
      return false;
    }
  };

  return (
    <ContentContext.Provider
      value={{
        sections,
        carouselSlides,
        weeklyPrograms,
        latestServiceMedia,
        dynamicPosts,
        events,
        testimonials,
        todayVerse,
        mediaItems,
        isContentLoading,
        lastSyncedTime,
        refreshContent,
        updateSection,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    // Si appelé hors du ContentProvider, fournir un objet par défaut pour éviter tout crash
    return {
      sections: INITIAL_HOMEPAGE_SECTIONS,
      carouselSlides: INITIAL_CAROUSEL_SLIDES,
      weeklyPrograms: INITIAL_WEEKLY_PROGRAMS,
      latestServiceMedia: INITIAL_LATEST_SERVICE_MEDIA,
      dynamicPosts: FALLBACK_DYNAMIC_POSTS,
      events: INITIAL_EVENTS,
      testimonials: INITIAL_TESTIMONIALS,
      todayVerse: Storage.getTodayVerse(),
      mediaItems: INITIAL_MEDIA,
      isContentLoading: false,
      lastSyncedTime: null,
      refreshContent: async () => {},
      updateSection: async () => false,
    };
  }
  return context;
};
