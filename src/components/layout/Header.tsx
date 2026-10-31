import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  Shield,
  ExternalLink,
  Menu,
  ChevronDown,
  Share2,
  LogIn,
  UserPlus,
  Settings,
  FileText,
  Save,
  CheckCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChurchLogo } from '../common/ChurchLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onNavigate,
  currentPage,
  onOpenAuth,
}) => {
  const { currentUser, logout, settings, updateSettings, isSupabaseConfigured } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [adminSaveFeedback, setAdminSaveFeedback] = useState<string | null>(null);

  const handleAdminSave = async () => {
    setIsAdminSaving(true);
    try {
      await updateSettings(settings);
      setAdminSaveFeedback('✓ Enregistré (Supabase)');
      setTimeout(() => setAdminSaveFeedback(null), 3500);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setAdminSaveFeedback('Erreur');
      setTimeout(() => setAdminSaveFeedback(null), 3000);
    } finally {
      setIsAdminSaving(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#4A0E17] text-white shadow-md border-b border-[#C99B2E]/30">
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-rose-100 hover:text-white hover:bg-[#6E1325] rounded-lg transition cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => {
              const isLeadership = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';
              onNavigate(isLeadership ? 'dashboard' : 'prayer-requests');
            }}
            className="cursor-pointer flex items-center space-x-2.5"
          >
            <ChurchLogo size="sm" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wider text-white">EMF SMART</span>
                <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#C99B2E]/20 text-[#C99B2E] font-semibold border border-[#C99B2E]/40">
                  Sangmelima
                </span>
              </div>
              <p className="text-[11px] text-rose-200/80 hidden sm:block truncate max-w-xs">
                {settings.churchName}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Quick Switch to Public Site / CMS / Web Publish */}
        <div className="hidden lg:flex items-center space-x-2 bg-[#6E1325]/80 px-2 py-1 rounded-lg border border-[#C99B2E]/20">
          <button
            onClick={() => onNavigate('public-home')}
            className={`px-3 py-1 text-xs font-medium rounded transition flex items-center space-x-1.5 cursor-pointer ${
              currentPage === 'public-home'
                ? 'bg-[#C99B2E] text-[#4A0E17] font-semibold'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Site Public</span>
          </button>
          <button
            onClick={() => onNavigate('events-and-news')}
            className={`px-3 py-1 text-xs font-medium rounded transition flex items-center space-x-1.5 cursor-pointer ${
              currentPage === 'events-and-news'
                ? 'bg-[#C99B2E] text-[#4A0E17] font-bold shadow-xs'
                : 'text-amber-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Événements & Actualités</span>
          </button>
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <button
              onClick={() => onNavigate('web-publish')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center space-x-1.5 cursor-pointer ${
                currentPage === 'web-publish'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-600/30'
              }`}
              title="Publication Web Gratuite & Partage"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Publication Web</span>
            </button>
          )}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-3 py-1 text-xs font-medium rounded transition cursor-pointer ${
                currentPage === 'dashboard'
                  ? 'bg-[#C99B2E] text-[#4A0E17] font-semibold'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>Tableau de bord</span>
            </button>
          )}
        </div>

        {/* Right: Authentication / Profile & Notifications */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Bouton d'enregistrement rapide pour l'administrateur (Supabase) */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <button
              onClick={handleAdminSave}
              disabled={isAdminSaving}
              title="Enregistrer et synchroniser immédiatement les paramètres dans Supabase"
              className="px-2.5 sm:px-3 py-1.5 text-xs font-black rounded-xl transition flex items-center space-x-1.5 cursor-pointer bg-gradient-to-r from-amber-400 via-[#C99B2E] to-amber-500 hover:from-amber-300 hover:to-[#C99B2E] text-[#4A0E17] shadow-md border border-amber-200 disabled:opacity-50"
            >
              {isAdminSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4A0E17]" />
              ) : adminSaveFeedback ? (
                <CheckCircle className="w-3.5 h-3.5 text-[#4A0E17]" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#4A0E17]" />
              )}
              <span className="font-extrabold">
                {isAdminSaving ? 'Sauvegarde...' : adminSaveFeedback || 'Enregistrer (Admin)'}
              </span>
            </button>
          )}

          {/* Bouton Mode Sombre / Clair */}
          <ThemeToggle variant="icon" />

          {/* Notifications Bell */}
          <NotificationBell
            onNavigate={onNavigate}
            className="text-rose-100 hover:text-white hover:bg-[#6E1325]"
          />

          {/* User Logged In: Show Profile & Logout Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-[#6E1325] transition border border-transparent hover:border-[#C99B2E]/40 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#6E1325] border border-[#C99B2E] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {currentUser.firstName?.[0] || 'U'}
                  {currentUser.lastName?.[0] || ''}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <div className="font-semibold text-white">
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold flex items-center space-x-1">
                    <Shield className="w-2.5 h-2.5 text-[#C99B2E]" />
                    <span>{currentUser.role}</span>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-rose-200 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#160407] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#4A0E17] text-slate-800 dark:text-rose-100 z-50 p-2 animate-in fade-in">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-[#380C14] bg-slate-50/50 dark:bg-[#22070D] rounded-xl mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentUser.firstName} {currentUser.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-rose-200/70 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#4A0E17] dark:bg-[#6E1325] text-white">
                      Rôle : {currentUser.role}
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {(currentUser.role === 'ADMIN' || currentUser.role === 'PASTEUR') && (
                      <button
                        onClick={() => {
                          handleAdminSave();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#4A0E17] dark:text-amber-300 bg-amber-50 dark:bg-[#2A1015] hover:bg-amber-100 dark:hover:bg-[#38151C] rounded-lg flex items-center space-x-2 transition cursor-pointer border border-amber-200 dark:border-[#C99B2E]/30"
                      >
                        <Save className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>Enregistrer dans Supabase</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-rose-100 hover:bg-slate-100 dark:hover:bg-[#26080F] rounded-lg flex items-center space-x-2 transition cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-rose-300/70" />
                      <span>Mon profil & paramètres</span>
                    </button>

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'PASTEUR') && (
                      <button
                        onClick={() => {
                          onNavigate('audit');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-rose-100 hover:bg-slate-100 dark:hover:bg-[#26080F] rounded-lg flex items-center space-x-2 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-rose-300/70" />
                        <span>Journal d’audit</span>
                      </button>
                    )}

                    {/* Thème clair / sombre */}
                    <div className="pt-2 pb-1 px-1 border-t border-slate-100 dark:border-[#380C14]">
                      <div className="text-[10px] font-bold text-slate-400 dark:text-rose-200/60 uppercase tracking-wider px-2 mb-1">
                        Mode d'affichage
                      </div>
                      <ThemeToggle variant="segmented" className="w-full justify-between" />
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        onNavigate('public-home');
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-[#2B070E] rounded-lg flex items-center space-x-2 mt-1 border-t border-slate-100 dark:border-[#380C14] transition cursor-pointer font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* User NOT Logged In: Show Connexion and Inscription Buttons */
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={() => onOpenAuth && onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-[#C99B2E]/40"
                title="Se connecter avec mot de passe"
              >
                <LogIn className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Se Connecter</span>
              </button>

              <button
                onClick={() => onOpenAuth && onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-black bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
                title="Créer un compte membre ou visiteur"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>S'inscrire</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
