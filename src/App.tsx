import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ReceiptModal } from './components/common/ReceiptModal';
import { MemberBadgeModal } from './components/common/MemberBadgeModal';

// Client Supabase
import { supabase } from './supabaseClient';
import { apiClient } from './services/apiClient';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { PublicHomePage } from './pages/PublicHomePage';
import { EventsAndNewsPage } from './pages/EventsAndNewsPage';
import { MembersPage } from './pages/MembersPage';
import { FamiliesPage } from './pages/FamiliesPage';
import { AttendancePage } from './pages/AttendancePage';
import { FinancesPage } from './pages/FinancesPage';
import { EventsPage } from './pages/EventsPage';
import { MinistriesPage } from './pages/MinistriesPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { TestimonialsPage } from './pages/TestimonialsPage';
import { ForumPage } from './pages/ForumPage';
import { VersesPage } from './pages/VersesPage';
import { MediaPage } from './pages/MediaPage';
import { MediaGalleryPage } from './pages/MediaGalleryPage';
import { ParakletosPage } from './pages/ParakletosPage';
import { ReportsPage } from './pages/ReportsPage';
import { CMSHomepagePage } from './pages/CMSHomepagePage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditPage } from './pages/AuditPage';
import { BackupsPage } from './pages/BackupsPage';
import { PrayerRequestsPage } from './pages/PrayerRequestsPage';
import { AssociatedChurchesPage } from './pages/AssociatedChurchesPage';
import { HomeCellsPage } from './pages/HomeCellsPage';
import { WebPublishPage } from './pages/WebPublishPage';
import { WebPublishModal } from './components/publish/WebPublishModal';
import { ResourcesPage } from './pages/ResourcesPage';
import { AuthModal } from './components/auth/AuthModal';
import { Lock, LogIn, UserPlus } from 'lucide-react';

import { Transaction, Member } from './types';

const MainApp: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';
  const [currentPage, setCurrentPage] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash) return hash;
      }
    } catch {}
    // Le portail de l'application est la première page d'affichage lorsque l'utilisateur accède à l'application
    return 'public-home';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [activeBadgeMember, setActiveBadgeMember] = useState<Member | null>(null);
  const [isWebPublishOpen, setIsWebPublishOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);

  // Sécurité anti-blocage : délai maximal absolu de 1.2s pour l'écran de chargement
  const [maxWaitExceeded, setMaxWaitExceeded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMaxWaitExceeded(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Test de connexion à Supabase au chargement avec try-catch complet
  useEffect(() => {
    async function testSupabaseConnection() {
      try {
        if (supabase && supabase.auth && typeof supabase.auth.getSession === 'function') {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Note connexion Supabase :', error.message);
          } else {
            console.log('Connexion Supabase active. Session active :', Boolean(data?.session));
          }
        }
        // Hydratation initiale globale depuis les tables Supabase app_content et dynamic_posts
        await apiClient.bootstrapInitialDataFromSupabase();
      } catch (err) {
        console.warn('Impossible de contacter Supabase (chargement secours actif) :', err);
      }
    }
    testSupabaseConnection();
  }, []);

  const handleOpenAuth = (tab: 'login' | 'register' = 'login', notice?: string) => {
    setAuthModalTab(tab);
    setAuthNotice(notice);
    setIsAuthModalOpen(true);
  };

  // Sync hash changes
  React.useEffect(() => {
    const handleHash = () => {
      try {
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.replace('#', '').trim();
          if (hash && hash !== currentPage) setCurrentPage(hash);
        }
      } catch {}
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentPage]);

  // Sync hash with current page
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && currentPage) {
        if (window.location.hash.replace('#', '') !== currentPage) {
          window.location.hash = currentPage;
        }
      }
    } catch {}
  }, [currentPage]);

  // Protection des routes administratives : ne s'exécute JAMAIS pendant le chargement (évite l'éjection au F5)
  React.useEffect(() => {
    if (isLoading) return;

    if (!isPastorOrAdmin && ['dashboard', 'cms-homepage', 'web-publish', 'settings', 'users', 'audit', 'backups'].includes(currentPage)) {
      setCurrentPage('public-home');
    } else if (currentUser?.role !== 'ADMIN' && ['users', 'settings', 'audit', 'backups'].includes(currentPage)) {
      setCurrentPage(isPastorOrAdmin ? 'dashboard' : 'public-home');
    }
  }, [currentUser?.role, currentPage, isLoading, isPastorOrAdmin]);

  // Écran de chargement sécurisé anti-flicker pendant la vérification de session
  if (isLoading && !maxWaitExceeded) {
    return (
      <div className="min-h-screen bg-[#FAF0F2] flex items-center justify-center font-sans text-slate-800">
        <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-[#6E1325]/10 max-w-sm w-full mx-4 space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 border-4 border-[#6E1325]/20 border-t-[#6E1325] border-r-[#C99B2E] rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center font-serif font-black text-[#6E1325] text-xs">
              EMF
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#4A0E17]">EMF SMART — Sangmelima</h2>
            <p className="text-xs text-[#C99B2E] font-medium tracking-wide mt-0.5">Grand Temple d'Akon</p>
          </div>
          <p className="text-xs text-slate-500 animate-pulse">Vérification de la session sécurisée...</p>
        </div>
      </div>
    );
  }

  // If viewing the public homepage, render it in full-bleed mode
  if (currentPage === 'public-home') {
    return (
      <div className="min-h-screen bg-[#FCFCFD] dark:bg-[#0B0204] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <PublicHomePage
          onGoToDashboard={() => {
            if (currentUser) {
              setCurrentPage(isPastorOrAdmin ? 'dashboard' : 'prayer-requests');
            } else {
              handleOpenAuth('login', 'Veuillez vous connecter avec votre mot de passe pour accéder à cet espace.');
            }
          }}
          onGoToCMS={() => {
            if (isPastorOrAdmin) {
              setCurrentPage('cms-homepage');
            } else {
              handleOpenAuth('login', 'Veuillez vous connecter avec votre compte pour accéder à cet espace.');
            }
          }}
          onGoToPrayers={() => setCurrentPage('prayer-requests')}
          onNavigateToPage={(page) => setCurrentPage(page)}
          onOpenPublish={isPastorOrAdmin ? () => setIsWebPublishOpen(true) : undefined}
          onOpenAuth={handleOpenAuth}
        />
        {isPastorOrAdmin && (
          <WebPublishModal
            isOpen={isWebPublishOpen}
            onClose={() => setIsWebPublishOpen(false)}
            onNavigateToPublicHome={() => setCurrentPage('public-home')}
            onNavigateToPage={(page) => setCurrentPage(page)}
          />
        )}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab={authModalTab}
          titleNotice={authNotice}
        />
      </div>
    );
  }

  // Affichage en mode public de la page dédiée Événements, Enseignements & Actualités
  if (currentPage === 'events-and-news') {
    return (
      <div className="min-h-screen bg-[#FCFCFD] dark:bg-[#0B0204] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <EventsAndNewsPage
          onNavigate={(page) => setCurrentPage(page)}
          onOpenAuth={handleOpenAuth}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab={authModalTab}
          titleNotice={authNotice}
        />
      </div>
    );
  }

  const renderActivePage = () => {
    // Si l'utilisateur n'est pas connecté, exiger la connexion ou l'inscription
    if (!currentUser) {
      return (
        <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center mx-auto border border-[#4A0E17]/20">
            <Lock className="w-8 h-8 text-[#6E1325]" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#C99B2E] block">
              Espace Protégé • Connexion Requise
            </span>
            <h2 className="text-xl font-black text-[#4A0E17]">
              Authentification par Mot de Passe
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pour accéder aux fonctionnalités et registres de l'église, vous devez obligatoirement vous connecter avec votre mot de passe, ou créer un compte membre/visiteur.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => handleOpenAuth('login', 'Veuillez saisir votre mot de passe pour accéder à cet espace.')}
              className="w-full py-3 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#C99B2E]" />
              <span>Se Connecter avec un Mot de Passe</span>
            </button>
            <button
              onClick={() => handleOpenAuth('register')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#C99B2E]" />
              <span>Créer un Compte (S'inscrire)</span>
            </button>
            <button
              onClick={() => setCurrentPage('public-home')}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium pt-1 cursor-pointer"
            >
              ← Revenir au Portail Public de l'Église
            </button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        if (!isPastorOrAdmin) {
          return <PrayerRequestsPage onNavigate={(page) => setCurrentPage(page)} />;
        }
        return (
          <DashboardPage
            onNavigate={(page) => setCurrentPage(page)}
            onOpenReceipt={(tx) => setActiveReceipt(tx)}
          />
        );
      case 'prayer-requests':
        return <PrayerRequestsPage onNavigate={(page) => setCurrentPage(page)} />;
      case 'members':
        return <MembersPage onOpenBadge={(m) => setActiveBadgeMember(m)} />;
      case 'families':
        return <FamiliesPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'finances':
        return <FinancesPage onOpenReceipt={(tx) => setActiveReceipt(tx)} />;
      case 'events':
        return <EventsPage />;
      case 'ministries':
        return <MinistriesPage />;
      case 'home-cells':
        return <HomeCellsPage />;
      case 'associated-churches':
        return <AssociatedChurchesPage />;
      case 'communication':
        return <CommunicationPage />;
      case 'testimonials':
        return <TestimonialsPage />;
      case 'forum':
        return <ForumPage onNavigate={(page) => setCurrentPage(page)} />;
      case 'verses':
        return <VersesPage />;
      case 'resources':
        return <ResourcesPage onNavigate={(page) => setCurrentPage(page)} />;
      case 'media':
      case 'media-gallery':
        return <MediaGalleryPage />;
      case 'parakletos':
        return <ParakletosPage />;
      case 'reports':
        return <ReportsPage />;
      case 'cms-homepage':
        if (!isPastorOrAdmin) {
          return <PrayerRequestsPage onNavigate={(page) => setCurrentPage(page)} />;
        }
        return (
          <CMSHomepagePage
            onPreviewPublic={() => setCurrentPage('public-home')}
            onOpenPublish={() => setIsWebPublishOpen(true)}
          />
        );
      case 'web-publish':
        if (!isPastorOrAdmin) {
          return <PrayerRequestsPage onNavigate={(page) => setCurrentPage(page)} />;
        }
        return (
          <WebPublishPage
            onNavigateToPublicHome={() => setCurrentPage('public-home')}
            onNavigateToPage={(page) => setCurrentPage(page)}
          />
        );
      case 'users':
      case 'settings':
      case 'audit':
      case 'backups':
        if (currentUser?.role !== 'ADMIN') {
          return <PrayerRequestsPage onNavigate={(page) => setCurrentPage(page)} />;
        }
        if (currentPage === 'users') return <UsersPage />;
        if (currentPage === 'settings') return <SettingsPage />;
        if (currentPage === 'audit') return <AuditPage />;
        return <BackupsPage />;
      default:
        if (isPastorOrAdmin) {
          return (
            <DashboardPage
              onNavigate={(page) => setCurrentPage(page)}
              onOpenReceipt={(tx) => setActiveReceipt(tx)}
            />
          );
        }
        return <PrayerRequestsPage onNavigate={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFD] dark:bg-[#0B0204] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-[#C99B2E] selection:text-[#4A0E17] transition-colors duration-200">
      {/* Top Header */}
      <Header
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
        onNavigate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        onOpenAuth={handleOpenAuth}
      />

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            currentPage={currentPage}
            onNavigate={(page) => setCurrentPage(page)}
          />
        </div>

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileNav
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {renderActivePage()}
        </main>
      </div>

      {/* Official Modals */}
      <ReceiptModal
        transaction={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      <MemberBadgeModal
        member={activeBadgeMember}
        onClose={() => setActiveBadgeMember(null)}
      />

      {isPastorOrAdmin && (
        <WebPublishModal
          isOpen={isWebPublishOpen}
          onClose={() => setIsWebPublishOpen(false)}
          onNavigateToPublicHome={() => setCurrentPage('public-home')}
          onNavigateToPage={(page) => setCurrentPage(page)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        titleNotice={authNotice}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ContentProvider>
            <MainApp />
          </ContentProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
