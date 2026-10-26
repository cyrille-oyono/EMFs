import React, { useState } from 'react';
import {
  Heart,
  X,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  User,
  Sparkles,
  Church,
  Calendar,
  Send,
  MessageSquare,
  Compass,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { ChurchLogo } from '../common/ChurchLogo';

interface JoinCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const JoinCommunityModal: React.FC<JoinCommunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { settings } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    memberNumber: string;
    firstName: string;
    lastName: string;
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    sex: 'M' as 'M' | 'F',
    phone: '',
    whatsapp: '',
    email: '',
    address: 'Quartier Akon, Sangmelima',
    profession: '',
    maritalStatus: 'CELIBATAIRE' as 'CELIBATAIRE' | 'MARIE' | 'VEUF' | 'DIVORCE',
    spiritualStatus: 'Chrétien en recherche d’église locale',
    ministryPreference: 'Chorale & Louange',
    homeCellPreference: 'Cellule Akon',
    wantsPastoralVisit: true,
    observations: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      alert('Veuillez renseigner votre nom, prénom et numéro de téléphone.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiClient.submitCommunityAdhesion(formData);
      if (res.success && res.member) {
        setSuccessData({
          memberNumber: res.member.memberNumber,
          firstName: res.member.firstName,
          lastName: res.member.lastName,
          message: res.message,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Error submitting adhesion request:', err);
      alert('Une erreur est survenue lors de l’envoi. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#4A0E17] text-white px-6 py-5 flex items-center justify-between border-b border-[#C99B2E]/40 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E]">
              <Heart className="w-5 h-5 fill-[#C99B2E]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black uppercase tracking-wide text-white">
                  Rejoindre la Communauté
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C99B2E] text-[#4A0E17] font-black uppercase">
                  Bienvenue
                </span>
              </div>
              <p className="text-xs text-amber-200/90 truncate">
                {settings.churchName} — Sangmelima
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {successData ? (
            /* Success confirmation screen */
            <div className="text-center py-6 px-2 space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#4A0E17]">
                  Gloire à Dieu ! Bienvenue parmi nous, {successData.firstName} !
                </h3>
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full inline-block border border-emerald-200">
                  Numéro d’Adhésion Provisoire : {successData.memberNumber}
                </p>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                  {successData.message}
                </p>
              </div>

              {/* Biblical Verse Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs font-serif italic text-slate-800 max-w-md mx-auto">
                « Voici, oh! qu'il est agréable, qu'il est doux pour des frères de demeurer ensemble! Car c'est là que l'Éternel envoie la bénédiction, la vie, pour l'éternité. »
                <span className="block font-sans not-italic font-bold text-[#4A0E17] mt-1 text-[11px]">
                  — Psaume 133:1-3
                </span>
              </div>

              {/* Next Steps */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
                <div className="font-bold text-[#4A0E17] flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                  <span>Prochains rendez-vous fraternels :</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Grand Culte Dominical : <strong>Dimanche à 09h00</strong> au temple d’Akon</li>
                  <li>Étude biblique & édification : <strong>Mercredi à 17h30</strong></li>
                  <li>L’équipe pastorale prendra contact avec vous par WhatsApp sous 24h.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
                <a
                  href={`https://wa.me/237699001122?text=${encodeURIComponent(
                    `Bonjour Pasteur Samuel Ondoa, je viens d'envoyer mon adhésion à l'Église Missionnaire de la Foi de Sangmelima (Réf: ${successData.memberNumber} - ${successData.firstName} ${successData.lastName}). Que Dieu vous bénisse !`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Saluer le Pasteur sur WhatsApp</span>
                </a>
                <button
                  onClick={resetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition cursor-pointer"
                >
                  Fermer & Continuer la Visite
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start space-x-3">
                <Church className="w-5 h-5 text-[#C99B2E] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  Que vous soyez nouveau dans la ville de Sangmelima, en quête spirituelle ou désireux de vous impliquer activement dans l'œuvre de Dieu, nous vous accueillons à bras ouverts ! Remplissez ces quelques informations pour vous intégrer à notre assemblée.
                </p>
              </div>

              {/* Name & Sex */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Civilité / Sexe *
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'M' | 'F' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  >
                    <option value="M">Frère (Homme)</option>
                    <option value="F">Sœur (Femme)</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom de famille *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Oyono, Mengue, Mvondo..."
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom(s) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cyrille, Paul, Grace..."
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
              </div>

              {/* Contact (Phone & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Numéro de Téléphone / WhatsApp *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: +237 670 00 11 22"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                        whatsapp: formData.whatsapp || e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Adresse Email (Optionnelle)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nom@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
              </div>

              {/* Residence in Sangmelima & Marital status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Quartier de Résidence à Sangmelima *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Akon, Monavebe, Ndou-Libi, Centre..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Situation Matrimoniale
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maritalStatus: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  >
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="VEUF">Veuf / Veuve</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                  </select>
                </div>
              </div>

              {/* Spiritual Situation & Desired Ministry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Situation Spirituelle</span>
                  </label>
                  <select
                    value={formData.spiritualStatus}
                    onChange={(e) => setFormData({ ...formData, spiritualStatus: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  >
                    <option value="Nouveau converti (décision récente)">Nouveau converti (décision récente)</option>
                    <option value="Chrétien baptisé d’eau par immersion">Chrétien baptisé d’eau par immersion</option>
                    <option value="Chrétien en recherche d’église locale">Chrétien en recherche d’église locale</option>
                    <option value="Chrétien en transfert de ville">Chrétien en transfert de ville</option>
                    <option value="Visiteur / Sympathisant régulier">Visiteur / Sympathisant régulier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Layers className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Ministère / Département souhaité</span>
                  </label>
                  <select
                    value={formData.ministryPreference}
                    onChange={(e) => setFormData({ ...formData, ministryPreference: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  >
                    <option value="Chorale & Louange">Chorale & Groupe de Louange</option>
                    <option value="Jeunesse (JEMF)">Jeunesse Missionnaire (JEMF)</option>
                    <option value="Femmes d’Impact">Ministère des Femmes d’Impact</option>
                    <option value="Hommes de Valeur">Ministère des Hommes de Valeur</option>
                    <option value="Intercession & Prière">Intercession & Prière</option>
                    <option value="Protocole & Accueil">Protocole, Ordre & Accueil</option>
                    <option value="Évangélisation & Mission">Évangélisation & Mission</option>
                    <option value="Technique & Médias">Technique, Sonorisation & Médias</option>
                    <option value="Aucun pour le moment">Aucun pour le moment / Découverte</option>
                  </select>
                </div>
              </div>

              {/* Cell & Pastoral Visit Checkbox */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pastoralVisit"
                    checked={formData.wantsPastoralVisit}
                    onChange={(e) => setFormData({ ...formData, wantsPastoralVisit: e.target.checked })}
                    className="w-4 h-4 rounded text-[#4A0E17] focus:ring-[#4A0E17] border-slate-300"
                  />
                  <label htmlFor="pastoralVisit" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Je souhaite un entretien pastoral ou une visite d’accueil avec le Pasteur Samuel Ondoa
                  </label>
                </div>
              </div>

              {/* Personal Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message, témoignage ou sujet de prière (Optionnel) :
                </label>
                <textarea
                  rows={2}
                  placeholder="Partagez un mot ou un sujet pour lequel vous souhaitez que l’église prie avec vous..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#C99B2E]" />
                      <span>Valider mon Inscription à la Communauté</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
