import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Permission, SystemSettings } from '../types';
import { apiClient } from '../services/apiClient';
import { churchSyncService } from '../services/churchSyncService';
import {
  isSupabaseConfigured,
  subscribeToChurchSettings,
  getSupabaseClient,
  setSecureUserSession,
  getSecureUserSession,
  clearSecureUserSession,
  purgeAllLocalStorageAuth,
  saveUserProfileToSupabase,
  getUserProfileFromSupabase,
} from '../services/supabase';

interface AuthContextType {
  currentUser: User | null;
  settings: SystemSettings;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: Role;
  }) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginAs: (role: Role) => Promise<void>;
  logout: () => void;
  hasRole: (role: Role | Role[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSettings>(() => {
    return {
      churchName: 'Église Missionnaire de la Foi de Sangmelima',
      slogan: 'Une église vivante au cœur du Sud, enracinée dans la Parole et tournée vers les nations',
      city: 'Sangmelima',
      country: 'Cameroun',
      address: 'Quartier Akon, Route Principale, Sangmelima',
      phone: '+237 699 00 11 22',
      email: 'contact@emf-sangmelima.org',
      website: 'https://emf-sangmelima.org',
      socials: {
        facebook: 'https://facebook.com/emfsangmelima',
        youtube: 'https://youtube.com/@emfsangmelima',
        whatsapp: '+237699001122',
      },
      timezone: 'Africa/Douala',
      currency: 'FCFA',
      theme: {
        primaryColor: '#6E1325',
        secondaryColor: '#4A0E17',
        goldColor: '#C99B2E',
        backgroundColor: '#FAF0F2',
        whiteColor: '#FFFFFF',
      },
      modules: {
        parakletosEnabled: true,
        forumEnabled: true,
        mediaEnabled: true,
        testimonialsEnabled: true,
        dailyVersesEnabled: true,
        prayerRequestsEnabled: true,
      },
      integrations: {
        emailConfigured: false,
        smsConfigured: false,
        whatsappConfigured: false,
        backupStorageConfigured: true,
      },
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Sécurité de déblocage maximale de l'interface en cas de lenteur réseau
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 2000);

    const init = async () => {
      try {
        // 1. Purge systématique de tout résidu dans localStorage pour respecter la confidentialité stricte
        purgeAllLocalStorageAuth();

        let restoredUser: User | null = null;
        const supabaseClient = getSupabaseClient();

        // 2. Vérification d'une session Supabase Auth active (via Cookies sécurisés, sans localStorage)
        if (supabaseClient?.auth && typeof supabaseClient.auth.getUser === 'function') {
          try {
            const { data: authData, error: authError } = await supabaseClient.auth.getUser();
            if (!authError && authData?.user) {
              const sbUser = authData.user;
              // Récupération du profil complet depuis la table Supabase
              const remoteProfile = await getUserProfileFromSupabase(sbUser.id || sbUser.email || '');
              if (remoteProfile) {
                restoredUser = remoteProfile;
              }
            }
          } catch (e) {
            console.warn('Note vérification Supabase Auth:', e);
          }
        }

        // 3. Si non trouvé via Supabase Auth direct, lecture du Cookie de session sécurisé (survit au F5)
        if (!restoredUser) {
          const cookieSession = getSecureUserSession();
          if (cookieSession && cookieSession.id) {
            // A. Tentative de rafraîchissement depuis Supabase
            const remoteProfile = await getUserProfileFromSupabase(cookieSession.id);
            if (remoteProfile) {
              restoredUser = remoteProfile;
            } else {
              // B. Fallback sur la base paroissiale synchronisée
              try {
                const users = await apiClient.getUsers();
                const matched = users.find(
                  (u) => u.id === cookieSession.id || u.email.toLowerCase() === cookieSession.email.toLowerCase()
                );
                if (matched) {
                  restoredUser = matched;
                } else {
                  restoredUser = {
                    id: cookieSession.id,
                    email: cookieSession.email,
                    firstName: cookieSession.firstName || 'Utilisateur',
                    lastName: cookieSession.lastName || '',
                    role: cookieSession.role || 'MEMBRE',
                    permissions: cookieSession.permissions || [],
                    status: 'ACTIF',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                }
              } catch {
                restoredUser = {
                  id: cookieSession.id,
                  email: cookieSession.email,
                  firstName: cookieSession.firstName || 'Utilisateur',
                  lastName: cookieSession.lastName || '',
                  role: cookieSession.role || 'MEMBRE',
                  permissions: cookieSession.permissions || [],
                  status: 'ACTIF',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
              }
            }
          }
        }

        if (isMounted && restoredUser) {
          setCurrentUser(restoredUser);
          setSecureUserSession(restoredUser);
        }

        // 4. Chargement des paramètres du temple
        const loadedSettings = await apiClient.getCurrentSettings().catch((err) => {
          console.warn('apiClient.getCurrentSettings a échoué, utilisation des paramètres actuels:', err);
          return null;
        });

        if (isMounted && loadedSettings) {
          setSettings(loadedSettings);
        }
      } catch (err) {
        console.error('Erreur initialisation AuthContext (données par défaut actives):', err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient.login(email, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        // Persistance sécurisée par Cookies et dans la table Supabase (zéro localStorage)
        setSecureUserSession(res.user);
        saveUserProfileToSupabase(res.user).catch((e) => console.warn('Sync profile Supabase:', e));
        return { success: true };
      }
      return { success: false, error: res.error || 'Connexion échouée' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erreur lors de la connexion' };
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: Role;
  }) => {
    try {
      const res = await apiClient.register(data);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        // Persistance sécurisée par Cookies et dans Supabase
        setSecureUserSession(res.user);
        saveUserProfileToSupabase(res.user).catch((e) => console.warn('Sync profile Supabase:', e));
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || "Erreur lors de l'inscription" };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erreur lors de l'inscription" };
    }
  };

  const loginAs = async (role: Role) => {
    try {
      const users = await apiClient.getUsers();
      const target = users.find((u) => u.role === role);
      if (target) {
        setCurrentUser(target);
        setSecureUserSession(target);
        saveUserProfileToSupabase(target).catch(() => {});
      }
    } catch (err) {
      console.warn('Erreur loginAs:', err);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    clearSecureUserSession();
    const client = getSupabaseClient();
    if (client?.auth) {
      client.auth.signOut().catch(() => {});
    }
  };

  const hasRole = (role: Role | Role[]): boolean => {
    if (!currentUser) return false;
    if (Array.isArray(role)) {
      return role.includes(currentUser.role);
    }
    return currentUser.role === role;
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return Array.isArray(currentUser.permissions) && currentUser.permissions.includes(permission);
  };

  const refreshSettings = async () => {
    try {
      const loaded = await apiClient.getCurrentSettings();
      if (loaded) setSettings(loaded);
    } catch (err) {
      console.warn('Erreur refreshSettings:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const updated = await apiClient.updateSettings(newSettings, currentUser || undefined);
      setSettings(updated);
      churchSyncService.broadcastSettingsUpdated(updated);
    } catch (err) {
      console.warn('Erreur updateSettings:', err);
    }
  };

  useEffect(() => {
    let unsubSync = () => {};
    let unsubSupabase = () => {};

    try {
      // 1. Abonnement aux notifications locales / BroadcastChannel / WebSocket
      unsubSync = churchSyncService.subscribe((event) => {
        if (event.type === 'church:settings_updated' && event.payload?.settings) {
          setSettings(event.payload.settings);
        }
      });
    } catch (e) {
      console.warn('Erreur souscription churchSyncService:', e);
    }

    try {
      // 2. Abonnement en temps réel à Supabase (PostgreSQL Changes)
      unsubSupabase = subscribeToChurchSettings((newSettings) => {
        if (newSettings) setSettings(newSettings);
      });
    } catch (e) {
      console.warn('Erreur souscription subscribeToChurchSettings:', e);
    }

    return () => {
      try {
        unsubSync();
        unsubSupabase();
      } catch {}
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        settings,
        isLoading,
        login,
        register,
        loginAs,
        logout,
        hasRole,
        hasPermission,
        refreshSettings,
        updateSettings,
        isSupabaseConfigured: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
