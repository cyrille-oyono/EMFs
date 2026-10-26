import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Palette,
  Church,
  Globe,
  CheckCircle,
  Users,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SystemSettings } from '../types';
import { AdminLeadershipAndTreasurySettings } from '../components/admin/AdminLeadershipAndTreasurySettings';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, refreshSettings, hasRole, isSupabaseConfigured } = useAuth();
  const [formData, setFormData] = useState<SystemSettings>(JSON.parse(JSON.stringify(settings)));
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Mettre à jour formData si les paramètres changent (ex: via Supabase Realtime)
  useEffect(() => {
    setFormData(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      if (isSupabaseConfigured) {
        showToast('✓ Paramètres enregistrés et synchronisés dans Supabase pour tous les utilisateurs !', 'success');
      } else {
        showToast('Paramètres enregistrés en local. Configurez Supabase pour la synchronisation en ligne.', 'info');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la sauvegarde des paramètres.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshFromCloud = async () => {
    setIsRefreshing(true);
    try {
      await refreshSettings();
      showToast('Paramètres rechargés depuis la base de données !', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du rechargement des paramètres.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const sqlScript = `-- Table des réglages de l'église pour EMF SMART
CREATE TABLE IF NOT EXISTS public.church_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

-- 1. Lecture publique : Tout le monde peut consulter les coordonnées et l'identité
CREATE POLICY "Lecture publique des réglages"
ON public.church_settings
FOR SELECT
TO public
USING (true);

-- 2. Écriture / Mise à jour : Autorisé pour synchroniser les réglages
CREATE POLICY "Mise à jour des réglages"
ON public.church_settings
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 3. Activation de la synchronisation Temps Réel (Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.church_settings;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notification && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center space-x-2 animate-in slide-in-from-bottom ${
            notification.type === 'error'
              ? 'bg-rose-900 text-white border-rose-500'
              : notification.type === 'info'
              ? 'bg-[#4A0E17] text-white border-amber-400'
              : 'bg-[#4A0E17] text-white border-[#C99B2E]'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-[#C99B2E] flex-shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#C99B2E] uppercase tracking-wider mb-1">
            <SettingsIcon className="w-4 h-4 text-[#6E1325]" />
            <span>Configuration Système • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Paramètres de l’Église</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identité officielle, thème de couleurs, fuseau horaire et synchronisation en direct
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isSupabaseConfigured && (
            <button
              onClick={handleRefreshFromCloud}
              disabled={isRefreshing}
              title="Recharger depuis Supabase"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          )}

          {hasRole(['ADMIN', 'PASTEUR']) && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 text-[#C99B2E] animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#C99B2E]" />
              )}
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer dans Supabase'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bannière de Statut Supabase */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isSupabaseConfigured
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200 text-slate-800'
          : 'bg-gradient-to-r from-amber-50 via-orange-50 to-white border-amber-200 text-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              isSupabaseConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {isSupabaseConfigured ? <Cloud className="w-5 h-5" /> : <Database className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {isSupabaseConfigured ? 'Base de Données Supabase Connectée' : 'Stockage Local Temporaire (Supabase Recommandé)'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSupabaseConfigured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isSupabaseConfigured ? '● En Direct / Temps Réel' : '○ Local'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isSupabaseConfigured
                  ? 'Vos modifications sont enregistrées dans la table "church_settings" de Supabase et immédiatement synchronisées pour tous les membres et visiteurs du lien public.'
                  : 'Les modifications de l’administrateur sont actuellement conservées uniquement dans le navigateur local. Pour que le lien public affiche vos mises à jour à tout le monde, connectez Supabase.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-center">
            <button
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center space-x-1 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-[#6E1325]" />
              <span>{showSqlGuide ? 'Masquer le Script SQL' : 'Script SQL Table'}</span>
            </button>
          </div>
        </div>

        {/* Accordéon Guide SQL Supabase */}
        {showSqlGuide && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Instructions : Exécutez ce script dans l’Éditeur SQL de votre tableau de bord Supabase (SQL Editor)
              </span>
              <button
                onClick={copySqlToClipboard}
                className="px-2.5 py-1 text-[11px] font-bold bg-[#6E1325] hover:bg-[#4A0E17] text-white rounded-md transition flex items-center space-x-1 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copié !' : 'Copier le script SQL'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {sqlScript}
            </pre>
            <div className="text-[11px] text-slate-600 space-y-1">
              <p>• <strong>Étape 1 :</strong> Copiez et collez le script ci-dessus dans l'éditeur SQL de votre projet Supabase, puis cliquez sur <strong>RUN</strong>.</p>
              <p>• <strong>Étape 2 :</strong> Récupérez votre <code>Project URL</code> et <code>anon public key</code> dans <em>Project Settings &gt; API</em>.</p>
              <p>• <strong>Étape 3 :</strong> Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans votre fichier <code>.env</code>.</p>
            </div>
          </div>
        )}
      </div>

      {/* Section Officiers Clés (Pasteur, Secrétaire, Trésorier) & Trésorerie */}
      {hasRole('ADMIN') && (
        <div id="direction-tresorerie-section">
          <AdminLeadershipAndTreasurySettings initialTab="officers" allowTreasury={true} />
        </div>
      )}

      {/* Section Paramètres Généraux & Thème Visuel */}
      <div className="pt-2">
        <h2 className="text-sm font-black text-[#4A0E17] uppercase tracking-wider mb-3">
          Identité Institutionnelle & Configuration Globale
        </h2>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Box 1: Identité Institutionnelle */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Church className="w-4 h-4 text-[#6E1325]" />
            <h3 className="font-bold text-sm text-[#4A0E17]">Identité de l’Église</h3>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nom Officiel de l’Église *</label>
            <input
              type="text"
              required
              value={formData.churchName}
              onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Slogan / Devise Pastorale</label>
            <textarea
              rows={2}
              value={formData.slogan}
              onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pays</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Adresse Complète</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Téléphone Principal</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Principal</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Box: Liens Sociaux & Canaux Numériques */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-[#6E1325]" />
            <h3 className="font-bold text-sm text-[#4A0E17]">Réseaux Sociaux & Canaux Numériques</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Page Facebook Officielle</label>
              <input
                type="url"
                value={formData.socials?.facebook || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socials: { ...formData.socials, facebook: e.target.value },
                  })
                }
                placeholder="https://facebook.com/emfsangmelima"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Chaîne YouTube (Cultes & Chants)</label>
              <input
                type="url"
                value={formData.socials?.youtube || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socials: { ...formData.socials, youtube: e.target.value },
                  })
                }
                placeholder="https://youtube.com/@emfsangmelima"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ligne WhatsApp / Canal</label>
                <input
                  type="text"
                  value={formData.socials?.whatsapp || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, whatsapp: e.target.value },
                    })
                  }
                  placeholder="+237699001122 ou lien wa.me"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Compte Instagram</label>
                <input
                  type="url"
                  value={formData.socials?.instagram || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/emfsangmelima"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Canal Telegram</label>
                <input
                  type="url"
                  value={formData.socials?.telegram || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, telegram: e.target.value },
                    })
                  }
                  placeholder="https://t.me/emfsangmelima"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Compte TikTok (Jeunesse)</label>
                <input
                  type="url"
                  value={formData.socials?.tiktok || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, tiktok: e.target.value },
                    })
                  }
                  placeholder="https://tiktok.com/@emfsangmelima"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Thème & Couleurs Institutionnelles */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Palette className="w-4 h-4 text-[#6E1325]" />
            <h3 className="font-bold text-sm text-[#4A0E17]">Thème Visuel & Charte Graphique</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bordeaux Principal</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.theme.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      theme: { ...formData.theme, primaryColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="font-mono text-xs">{formData.theme.primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bordeaux Foncé</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.theme.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      theme: { ...formData.theme, secondaryColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="font-mono text-xs">{formData.theme.secondaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Or / Doré</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.theme.goldColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      theme: { ...formData.theme, goldColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="font-mono text-xs">{formData.theme.goldColor}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Arrière-plan</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.theme.backgroundColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      theme: { ...formData.theme, backgroundColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="font-mono text-xs">{formData.theme.backgroundColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="block font-bold text-slate-700 mb-1">Logo Officiel Actuel</label>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C99B2E] bg-white flex items-center justify-center p-1 shadow-sm">
                <img
                  src={formData.logoUrl || '/logo.png'}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs text-slate-500">
                <p className="font-bold text-slate-800">Emblème Officiel EMF Sangmelima</p>
                <p className="text-[11px] text-slate-400">Colombe de la paix, globe et Sainte Bible</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.logoUrl || ''}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="/logo.png"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Logo officiel appliqué sur l'en-tête, les reçus financiers, les cartes membres et les rapports.
            </p>
          </div>

          {/* Regional Settings */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fuseau Horaire</label>
              <input
                type="text"
                disabled
                value={formData.timezone}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-slate-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Devise Officielle</label>
              <input
                type="text"
                disabled
                value={`${formData.currency} (Franc CFA)`}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Box 3: Modules Activables / Désactivables */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-sm text-[#4A0E17]">Activation des Modules Optionnels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="p-3 border border-slate-200 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.modules.parakletosEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modules: { ...formData.modules, parakletosEnabled: e.target.checked },
                  })
                }
                className="rounded text-[#6E1325]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Institut Biblique Parakletos</span>
                <span className="text-[11px] text-slate-500">Gestion académique et cours</span>
              </div>
            </label>

            <label className="p-3 border border-slate-200 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.modules.forumEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modules: { ...formData.modules, forumEnabled: e.target.checked },
                  })
                }
                className="rounded text-[#6E1325]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Forum Chrétien</span>
                <span className="text-[11px] text-slate-500">Discussions et questions</span>
              </div>
            </label>

            <label className="p-3 border border-slate-200 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.modules.testimonialsEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modules: { ...formData.modules, testimonialsEnabled: e.target.checked },
                  })
                }
                className="rounded text-[#6E1325]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Témoignages & Miracles</span>
                <span className="text-[11px] text-slate-500">Soumission et modération</span>
              </div>
            </label>

            <label className="p-3 border border-slate-200 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.modules.prayerRequestsEnabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modules: { ...formData.modules, prayerRequestsEnabled: e.target.checked },
                  })
                }
                className="rounded text-[#6E1325]"
              />
              <div>
                <span className="font-bold text-slate-900 block">Requêtes de Prière</span>
                <span className="text-[11px] text-slate-500">Sujets anonymes & intercession</span>
              </div>
            </label>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        {hasRole(['ADMIN', 'PASTEUR']) && (
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-slate-600">
              <Cloud className="w-4 h-4 text-[#6E1325]" />
              <span className="text-xs">
                {isSupabaseConfigured
                  ? 'Les modifications seront immédiatement enregistrées dans Supabase et visibles sur le lien public.'
                  : 'Enregistrement en local. Pour publier vers tous les utilisateurs, configurez Supabase.'}
              </span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 text-[#C99B2E] animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#C99B2E]" />
              )}
              <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer les Modifications'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
