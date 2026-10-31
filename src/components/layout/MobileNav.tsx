import React from 'react';
import {
  X,
  LayoutDashboard,
  Users,
  DollarSign,
  Calendar,
  Globe,
  Settings,
  HeartHandshake,
  CheckSquare,
  BookOpen,
  FileText,
  Layers,
  Compass,
  Church,
  Film,
  GraduationCap,
  Share2,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

import { ChurchLogo } from '../common/ChurchLogo';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../common/ThemeToggle';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
}) => {
  const { currentUser } = useAuth();

  const handleNav = (page: string) => {
    onNavigate(page);
    onClose();
  };

  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, pastorOrAdminOnly: true },
    { id: 'prayer-requests', label: 'Requêtes de Prière', icon: HeartHandshake },
    { id: 'finances', label: 'Finances & Offrandes', icon: DollarSign },
    { id: 'parakletos', label: 'Institut Parakletos', icon: GraduationCap },
    { id: 'media', label: 'Galerie Photos & Vidéos', icon: Film },
    { id: 'public-home', label: 'Site Public', icon: Globe },
    { id: 'events-and-news', label: 'Événements & Actualités', icon: Calendar },
    { id: 'web-publish', label: 'Publication Web Gratuite', icon: Share2, pastorOrAdminOnly: true },
    { id: 'ministries', label: 'Ministères & Départements', icon: Layers },
    { id: 'home-cells', label: 'Cellules de Maison', icon: Compass },
    { id: 'associated-churches', label: 'Églises Associées', icon: Church },
    { id: 'members', label: 'Membres', icon: Users, roles: ['ADMIN', 'PASTEUR', 'SECRÉTAIRE', 'RESPONSABLE_MINISTÈRE'] },
    { id: 'attendance', label: 'Présences', icon: CheckSquare, roles: ['ADMIN', 'PASTEUR', 'SECRÉTAIRE', 'RESPONSABLE_MINISTÈRE'] },
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'testimonials', label: 'Témoignages', icon: HeartHandshake },
    { id: 'forum', label: 'Forum Chrétien', icon: MessageSquare },
    { id: 'verses', label: 'Versets du jour', icon: BookOpen },
    { id: 'resources', label: 'Ressources & Prières', icon: FileText },
    { id: 'cms-homepage', label: 'CMS Accueil', icon: Globe, pastorOrAdminOnly: true },
    { id: 'settings', label: 'Paramètres', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-[#4A0E17] text-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[#6E1325] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ChurchLogo size="sm" />
            <div>
              <span className="font-extrabold text-base tracking-wider text-white">EMF SMART</span>
              <p className="text-[11px] text-amber-300">Église de Sangmelima</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white rounded-lg hover:bg-[#6E1325]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Quick Notifications Bar */}
        <div className="px-4 py-2.5 bg-[#6E1325]/70 border-b border-[#6E1325] flex items-center justify-between">
          <span className="text-xs font-bold text-amber-200">Alertes & Thème</span>
          <div className="flex items-center space-x-1.5">
            <ThemeToggle variant="icon" />
            <NotificationBell onNavigate={handleNav} className="text-white hover:bg-[#6E1325]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            if (item.pastorOrAdminOnly && !isPastorOrAdmin) {
              return null;
            }
            if (item.adminOnly && currentUser?.role !== 'ADMIN') {
              return null;
            }
            if (item.roles && (!currentUser || !item.roles.includes(currentUser.role))) {
              return null;
            }
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-[#6E1325] text-white font-bold border-l-4 border-[#C99B2E]'
                    : 'text-rose-100 hover:bg-[#6E1325]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#C99B2E]' : 'text-rose-300/70'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme mode switcher inside drawer */}
        <div className="p-3 border-t border-[#6E1325] bg-[#3B0810]">
          <div className="text-[10px] uppercase font-bold text-rose-200/60 mb-1.5">
            Mode d'affichage
          </div>
          <ThemeToggle variant="segmented" className="w-full justify-between" />
        </div>

        <div className="p-3 border-t border-[#6E1325] text-[11px] text-rose-200/70">
          {currentUser ? (
            <span>
              Connecté : <strong className="text-white font-bold">{currentUser.firstName}</strong> ({currentUser.role})
            </span>
          ) : (
            <span>Non connecté • Mode Invité</span>
          )}
        </div>
      </div>

      {/* Mobile Bottom Quick Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#4A0E17] border-t border-[#6E1325] px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
        {isPastorOrAdmin && (
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center py-1 px-2 rounded text-[10px] cursor-pointer ${
              currentPage === 'dashboard' ? 'text-[#C99B2E] font-bold' : 'text-rose-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Tableau</span>
          </button>
        )}
        <button
          onClick={() => onNavigate('prayer-requests')}
          className={`flex flex-col items-center py-1 px-2 rounded text-[10px] cursor-pointer ${
            currentPage === 'prayer-requests' ? 'text-[#C99B2E] font-bold' : 'text-rose-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4 mb-0.5" />
          <span>Prières</span>
        </button>
        <button
          onClick={() => onNavigate('events')}
          className={`flex flex-col items-center py-1 px-2 rounded text-[10px] cursor-pointer ${
            currentPage === 'events' ? 'text-[#C99B2E] font-bold' : 'text-rose-100'
          }`}
        >
          <Calendar className="w-4 h-4 mb-0.5" />
          <span>Cultes</span>
        </button>
        <button
          onClick={() => onNavigate('public-home')}
          className={`flex flex-col items-center py-1 px-2 rounded text-[10px] cursor-pointer ${
            currentPage === 'public-home' ? 'text-[#C99B2E] font-bold' : 'text-rose-100'
          }`}
        >
          <Globe className="w-4 h-4 mb-0.5" />
          <span>Portail</span>
        </button>
      </div>
    </>
  );
};
