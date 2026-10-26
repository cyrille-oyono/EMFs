import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  CheckCircle,
  Church,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { WeeklyProgram, Event, SystemSettings } from '../../types';
import { formatDateDouala } from '../../utils/formatters';

interface FooterChurchEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyPrograms: WeeklyProgram[];
  events: Event[];
  onOpenProgramsManager: () => void;
  onNavigateToEvents?: () => void;
  onRefreshData?: () => void;
}

export const FooterChurchEditorModal: React.FC<FooterChurchEditorModalProps> = ({
  isOpen,
  onClose,
  weeklyPrograms,
  events,
  onOpenProgramsManager,
  onNavigateToEvents,
  onRefreshData,
}) => {
  const { settings, updateSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'programs' | 'preview'>('info');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<SystemSettings>(JSON.parse(JSON.stringify(settings)));

  useEffect(() => {
    if (isOpen) {
      setFormData(JSON.parse(JSON.stringify(settings)));
      setSuccessMsg(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(formData);
      if (onRefreshData) onRefreshData();
      setSuccessMsg('Informations paroissiales et coordonnées du pied de page enregistrées et synchronisées en direct !');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error saving footer settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E]">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Éditeur & Synchronisation du Pied de Page
                </h3>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Direct Admin</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mise à jour synchronisée des coordonnées, cultes et agenda paroissial de l'accueil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 text-xs font-bold gap-3">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'info'
                ? 'border-[#4A0E17] text-[#4A0E17]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Coordonnées & Identité</span>
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'programs'
                ? 'border-[#4A0E17] text-[#4A0E17]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Agenda & Cultes ({weeklyPrograms.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-[#4A0E17] text-[#4A0E17]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Aperçu Rendu Footer</span>
          </button>
        </div>

        {/* Notification Toast */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-xs text-slate-700">
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Adresse Physique Complète *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Quartier Akon, Route Principale, Sangmelima"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ville & Pays</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-1/2 px-2.5 py-2 border border-slate-300 rounded-xl"
                      placeholder="Ville"
                    />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-1/2 px-2.5 py-2 border border-slate-300 rounded-xl"
                      placeholder="Pays"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Téléphone Principal / Secrétariat *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="+237 699 00 11 22"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Email Officiel *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="contact@emf-sangmelima.org"
                  />
                </div>
              </div>

              {/* Réseaux Sociaux */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-[#4A0E17] font-black">
                  <Globe className="w-4 h-4 text-[#C99B2E]" />
                  <span>Liens des Réseaux Sociaux Affichés au Pied de Page</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Page Facebook</label>
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
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Chaîne YouTube</label>
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
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">WhatsApp / Contact</label>
                    <input
                      type="text"
                      value={formData.socials?.whatsapp || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socials: { ...formData.socials, whatsapp: e.target.value },
                        })
                      }
                      placeholder="+237699001122"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#C99B2E]" />
                  <span>{saving ? 'Enregistrement en direct...' : 'Enregistrer & Synchroniser le Footer'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'programs' && (
            <div className="space-y-6">
              {/* Weekly Programs Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#C99B2E]" />
                    <h4 className="font-black text-[#4A0E17] text-sm">
                      Cultes & Rendez-vous Hebdomadaires ({weeklyPrograms.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProgramsManager();
                    }}
                    className="px-3 py-1.5 bg-[#C99B2E] text-[#4A0E17] hover:bg-amber-400 font-black rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Gérer les Cultes Hebdomadaires</span>
                  </button>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Ces rendez-vous sont automatiquement répercutés dans la colonne <strong>« Horaires des Cultes »</strong> du pied de page d’accueil dès qu'ils sont modifiés ou ajoutés.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {weeklyPrograms.map((prog) => (
                    <div
                      key={prog.id}
                      className={`p-3 rounded-xl border transition flex items-start justify-between ${
                        prog.isActive
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-[#4A0E17] uppercase tracking-wider text-[11px]">
                            {prog.dayOfWeek}
                          </span>
                          <span className="text-[10px] text-[#C99B2E] font-bold">
                            {prog.time}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs">{prog.title}</p>
                        {prog.location && (
                          <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{prog.location}</span>
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          prog.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {prog.isActive ? 'Actif' : 'Masqué'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Church Agenda / Upcoming Events */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#6E1325]" />
                    <h4 className="font-black text-[#4A0E17] text-sm">
                      Agenda & Événements à Venir ({events.length})
                    </h4>
                  </div>
                  {onNavigateToEvents && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToEvents();
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#4A0E17] font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#C99B2E]" />
                      <span>Ouvrir l’Agenda Complet</span>
                    </button>
                  )}
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Le pied de page affiche les 3 prochains rassemblements de l'agenda avec leur date et lieu officiel.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {events.slice(0, 4).map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-start justify-between shadow-2xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#C99B2E] block">
                          {formatDateDouala(evt.startDate)}
                        </span>
                        <p className="font-bold text-slate-800 text-xs">{evt.title}</p>
                        <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{evt.location || 'Sangmelima'}</span>
                        </p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {evt.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <span>
                  Cet aperçu reflète exactement l'apparence dynamique du pied de page sur la page d'accueil pour tous les fidèles et visiteurs.
                </span>
                <span className="font-black text-amber-700 shrink-0 ml-2">100% Réactif</span>
              </div>

              {/* Mini Footer Render */}
              <div className="p-6 bg-[#071d37] text-slate-300 rounded-2xl border border-[#6E1325] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Col 1 */}
                  <div className="space-y-2">
                    <span className="font-extrabold text-white text-sm block">{formData.churchName}</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{formData.slogan}</p>
                    <p className="text-slate-500 text-[10px]">{formData.address}</p>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-2">
                    <span className="font-bold uppercase tracking-wider text-[#C99B2E] text-[11px] block">
                      Cultes Réguliers ({weeklyPrograms.filter((p) => p.isActive).length})
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {weeklyPrograms
                        .filter((p) => p.isActive)
                        .slice(0, 4)
                        .map((p) => (
                          <li key={p.id} className="flex items-center space-x-1.5 truncate">
                            <span className="font-black text-[#C99B2E]">{p.dayOfWeek} :</span>
                            <span className="text-slate-400">{p.time}</span>
                            <span className="truncate">({p.title})</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-2">
                    <span className="font-bold uppercase tracking-wider text-[#C99B2E] text-[11px] block">
                      Contact & Coordonnées
                    </span>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      <li className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>{formData.phone}</span>
                      </li>
                      <li className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>{formData.email}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                  <span>© 2026 {formData.churchName}. Tous droits réservés.</span>
                  <span>Fuseau : {formData.timezone} • Devise : {formData.currency}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">Synchronisation automatique active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
