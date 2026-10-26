import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Permission, SystemSettings } from '../types';
import { apiClient } from '../services/apiClient';
import { churchSyncService } from '../services/churchSyncService';
import { isSupabaseConfigured, subscribeToChurchSettings } from '../services/supabase';

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

    // Sécurité absolue : garantir que l'interface s'affiche en moins de 1.2s même en cas de panne réseau
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1200);

    const init = async () => {
      try {
        // Lecture sécurisée du compte utilisateur local
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const savedUser = window.localStorage.getItem('EMF_AUTH_USER');
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              if (parsed && typeof parsed === 'object') {
                setCurrentUser(parsed);
              }
            }
          }
        } catch (localErr) {
          console.warn('Erreur lecture session locale:', localErr);
        }

        // Récupération des paramètres avec fallback immédiat
        const loadedSettings = await apiClient.getCurrentSettings().catch((err) => {
          console.warn('apiClient.getCurrentSettings a échoué, utilisation des paramètres par défaut:', err);
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

  const safeSetItem = (key: string, val: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
      }
    } catch {}
  };

  const safeRemoveItem = (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient.login(email, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        safeSetItem('EMF_AUTH_USER', JSON.stringify(res.user));
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
        safeSetItem('EMF_AUTH_USER', JSON.stringify(res.user));
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
        safeSetItem('EMF_AUTH_USER', JSON.stringify(target));
      }
    } catch (err) {
      console.warn('Erreur loginAs:', err);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    safeRemoveItem('EMF_AUTH_USER');
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
