import React from 'react';
import {
  LayoutDashboard,
  Users,
  Home,
  CheckSquare,
  DollarSign,
  Calendar,
  Layers,
  Megaphone,
  HeartHandshake,
  MessageSquare,
  BookOpen,
  FileText,
  Film,
  GraduationCap,
  BarChart3,
  Globe,
  UserCog,
  Settings,
  ShieldCheck,
  Database,
  ExternalLink,
  Flame,
  Church,
  Compass,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { currentUser, hasRole, settings } = useAuth();
  const [prayerSectionEnabled, setPrayerSectionEnabled] = React.useState<boolean>(true);

  const isRole = (roles: string[]) => {
    return currentUser ? roles.includes(currentUser.role) : false;
  };

  const navSections = [
    {
      title: 'Principal',
      items: [
        {
          id: 'dashboard',
          label: 'Tableau de bord',
          icon: LayoutDashboard,
          visible: isRole(['ADMIN', 'PASTEUR']),
        },
        { id: 'public-home', label: 'Portail Public (Accueil)', icon: Globe, visible: true },
        {
          id: 'events-and-news',
          label: 'Événements & Actualités',
          icon: Calendar,
          visible: true,
          badge: 'Nouveau',
        },
      ],
    },
    {
      title: 'Assemblée',
      items: [
        {
          id: 'members',
          label: 'Membres',
          icon: Users,
          visible: isRole(['ADMIN', 'PASTEUR', 'SECRÉTAIRE', 'RESPONSABLE_MINISTÈRE']),
        },
        {
          id: 'families',
          label: 'Familles',
          icon: Home,
          visible: isRole(['ADMIN', 'PASTEUR', 'SECRÉTAIRE']),
        },
        {
          id: 'attendance',
          label: 'Présences & Culte',
          icon: CheckSquare,
          visible: isRole(['ADMIN', 'PASTEUR', 'SECRÉTAIRE', 'RESPONSABLE_MINISTÈRE']),
        },
        {
          id: 'ministries',
          label: 'Ministères & Départements',
          icon: Layers,
          visible: true,
        },
        {
          id: 'home-cells',
          label: 'Cellules de Maison',
          icon: Compass,
          visible: true,
        },
        {
          id: 'associated-churches',
          label: 'Églises Associées',
          icon: Church,
          visible: true,
        },
      ],
    },
    {
      title: 'Gestion & Finances',
      items: [
        {
          id: 'finances',
          label: 'Finances & Offrandes',
          icon: DollarSign,
          visible: true,
          badge: isRole(['ADMIN', 'TRÉSORIER', 'PASTEUR']) ? undefined : 'Dîmes & Dons',
        },
        {
          id: 'events',
          label: 'Événements & Cultes',
          icon: Calendar,
          visible: true,
        },
        {
          id: 'communication',
          label: 'Communication',
          icon: Megaphone,
          visible: true,
        },
      ],
    },
    {
      title: 'Vie Spirituelle & Échange',
      items: [
        {
          id: 'prayer-requests',
          label: 'Requêtes de Prière',
          icon: HeartHandshake,
          visible: prayerSectionEnabled && (settings.modules.prayerRequestsEnabled ?? true),
          badge: 'Nouveau',
        },
        {
          id: 'testimonials',
          label: 'Témoignages',
          icon: HeartHandshake,
          visible: settings.modules.testimonialsEnabled,
        },
        {
          id: 'forum',
          label: 'Forum Chrétien',
          icon: MessageSquare,
          visible: settings.modules.forumEnabled ?? true,
          badge: 'Édification',
        },
        {
          id: 'verses',
          label: 'Versets du Jour',
          icon: BookOpen,
          visible: settings.modules.dailyVersesEnabled,
        },
        {
          id: 'resources',
          label: 'Ressources & Prières',
          icon: FileText,
          visible: true,
          badge: 'Documents',
        },
        {
          id: 'media',
          label: 'Galerie Photos & Vidéos',
          icon: Film,
          visible: settings.modules.mediaEnabled,
          badge: 'YouTube',
        },
        {
          id: 'parakletos',
          label: 'Institut Parakletos',
          icon: GraduationCap,
          visible: settings.modules.parakletosEnabled ?? true,
        },
      ],
    },
    {
      title: 'Administration & Système',
      items: [
        {
          id: 'reports',
          label: 'Rapports & Exports',
          icon: BarChart3,
          visible: isRole(['ADMIN', 'PASTEUR', 'TRÉSORIER', 'SECRÉTAIRE']),
        },
        {
          id: 'web-publish',
          label: 'Publication Web Gratuite',
          icon: Share2,
          visible: isRole(['ADMIN', 'PASTEUR']),
          badge: 'En ligne',
        },
        {
          id: 'cms-homepage',
          label: 'CMS Page d’Accueil',
          icon: Globe,
          visible: isRole(['ADMIN', 'PASTEUR']),
          badge: 'CMS',
        },
        {
          id: 'users',
          label: 'Utilisateurs & Droits',
          icon: UserCog,
          visible: hasRole('ADMIN'),
        },
        {
          id: 'settings',
          label: 'Paramètres Église',
          icon: Settings,
          visible: hasRole('ADMIN'),
        },
        {
          id: 'audit',
          label: 'Journal d’Audit',
          icon: ShieldCheck,
          visible: hasRole('ADMIN'),
        },
        {
          id: 'backups',
          label: 'Sauvegardes BD',
          icon: Database,
          visible: hasRole('ADMIN'),
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#4A0E17] dark:bg-[#120306] text-rose-100 flex-shrink-0 flex flex-col border-r border-[#6E1325] dark:border-[#38070F] min-h-[calc(100vh-57px)] select-none transition-colors duration-300">
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {/* Toggle Box: Accès Requêtes de Prière */}
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#6E1325] to-[#3B0810] border border-[#C99B2E]/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#C99B2E]/20 text-[#C99B2E] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">
                  Requêtes de Prière
                </span>
                <span className="text-[10px] text-rose-200/70">
                  {prayerSectionEnabled ? 'Section activée' : 'Section masquée'}
                </span>
              </div>
            </div>

            {/* Interactive Toggle Switch */}
            <button
              type="button"
              onClick={() => {
                const nextState = !prayerSectionEnabled;
                setPrayerSectionEnabled(nextState);
                if (nextState) {
                  onNavigate('prayer-requests');
                }
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prayerSectionEnabled ? 'bg-[#C99B2E]' : 'bg-rose-950'
              }`}
              role="switch"
              aria-checked={prayerSectionEnabled}
              title={prayerSectionEnabled ? 'Désactiver la section Prières' : 'Activer la section Prières'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  prayerSectionEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Quick Access button to open the section directly */}
          {prayerSectionEnabled && (
            <button
              onClick={() => onNavigate('prayer-requests')}
              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                currentPage === 'prayer-requests'
                  ? 'bg-[#C99B2E] text-[#4A0E17] shadow-xs'
                  : 'bg-white/10 text-rose-100 hover:bg-white/20'
              }`}
            >
              <span>Accéder aux requêtes</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#4A0E17]/30 font-bold">
                Ouvrir
              </span>
            </button>
          )}
        </div>

        {navSections.map((sec, idx) => {
          const visibleItems = sec.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-rose-200/60">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group cursor-pointer ${
                        isActive
                          ? 'bg-[#6E1325] text-white font-semibold shadow-inner border-l-4 border-[#C99B2E]'
                          : 'text-rose-100/90 hover:bg-[#6E1325]/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 transition ${
                            isActive
                              ? 'text-[#C99B2E]'
                              : 'text-rose-200/70 group-hover:text-[#C99B2E]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 font-bold rounded bg-[#C99B2E] text-[#4A0E17]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-[#6E1325] bg-[#33050B] text-[11px] text-rose-200/70">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-rose-100">EMF SMART v1.0</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="text-[10px] text-rose-200/50 mt-0.5">
          Sangmelima — Africa/Douala (FCFA)
        </div>
      </div>
    </aside>
  );
};
