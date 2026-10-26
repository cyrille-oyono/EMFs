import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertTriangle,
  Shield,
  Phone,
  Mail,
  User as UserIcon,
  Sparkles,
  HelpCircle,
  Hash,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { User, TreasurySettings, Role } from '../../types';

interface KeyOfficerData {
  id: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
  currentPassword?: string;
  status: 'ACTIF' | 'INACTIF';
}

interface OfficerFieldErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
}

export interface AdminLeadershipAndTreasurySettingsProps {
  initialTab?: 'officers' | 'treasury';
  allowTreasury?: boolean;
  className?: string;
  showHeader?: boolean;
}

export const AdminLeadershipAndTreasurySettings: React.FC<AdminLeadershipAndTreasurySettingsProps> = ({
  initialTab = 'officers',
  allowTreasury = true,
  className = '',
  showHeader = true,
}) => {
  const { currentUser, settings, updateSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'officers' | 'treasury'>(initialTab);
  const [loading, setLoading] = useState(true);
  const [savingOfficerId, setSavingOfficerId] = useState<string | null>(null);
  const [savingTreasury, setSavingTreasury] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Officers State & Validation Errors
  const [officers, setOfficers] = useState<KeyOfficerData[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, OfficerFieldErrors>>({});
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Treasury State
  const [treasury, setTreasury] = useState<TreasurySettings>({
    orangeMoney: {
      accountNumber: '+237 699 00 11 22',
      merchantCode: '#150*47*74892# (Code Marchand : 74892)',
      accountName: 'Église Missionnaire de la Foi (Paroisse Sangmelima)',
      isActive: true,
    },
    mobileMoney: {
      accountNumber: '+237 677 33 44 55',
      merchantCode: '*126*4*39210# (Code Marchand MoMo Pay : 39210)',
      accountName: 'EMF Sangmelima Trésorerie Paroissiale',
      isActive: true,
    },
    bankTransfer: {
      bankName: 'Afriland First Bank Cameroun',
      agency: 'Agence de Sangmelima (Sud Cameroun)',
      accountName: 'PAROISSE ÉGLISE MISSIONNAIRE DE LA FOI SANGMELIMA',
      accountNumber: '10005 00012 01234567890 45',
      ibanOrRib: 'CM21 1000 5000 1201 2345 6789 045',
      swiftBic: 'AFRICMCX',
      instructions:
        'Veuillez préciser en motif de virement : [Nom du Donateur] + [Dîme / Offrande / Don Travaux Temple]',
      isActive: true,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [officersList, treasuryData] = await Promise.all([
        apiClient.getKeyOfficers(),
        apiClient.getTreasurySettings(),
      ]);

      setOfficers(
        officersList.map((u) => ({
          id: u.id,
          role: u.role,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          email: u.email || '',
          password: '',
          currentPassword: u.currentPassword || '',
          status: u.status === 'ACTIF' ? 'ACTIF' : 'INACTIF',
        }))
      );

      if (treasuryData) {
        setTreasury(treasuryData);
      }
    } catch (e) {
      console.error('Failed to load settings data:', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleOfficerChange = (id: string, field: keyof KeyOfficerData, value: string) => {
    setOfficers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );

    // Clear validation error on change
    if (fieldErrors[id] && fieldErrors[id][field as keyof OfficerFieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: undefined,
        },
      }));
    }
  };

  // Comprehensive Field Validation
  const validateOfficer = (officer: KeyOfficerData): { isValid: boolean; errors: OfficerFieldErrors } => {
    const errors: OfficerFieldErrors = {};

    // First Name
    if (!officer.firstName.trim() || officer.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom est requis (au moins 2 caractères).';
    }

    // Last Name
    if (!officer.lastName.trim() || officer.lastName.trim().length < 2) {
      errors.lastName = 'Le nom de famille est requis (au moins 2 caractères).';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!officer.email.trim()) {
      errors.email = 'L’adresse email de connexion est obligatoire.';
    } else if (!emailRegex.test(officer.email.trim())) {
      errors.email = 'Format d’adresse email invalide (ex: pasteur@emf-sangmelima.org).';
    }

    // Phone
    const digitsOnly = officer.phone.replace(/[^0-9]/g, '');
    if (!officer.phone.trim()) {
      errors.phone = 'Le numéro de téléphone est requis.';
    } else if (digitsOnly.length < 8) {
      errors.phone = 'Numéro incomplet (minimum 9 chiffres, ex: +237 699 00 11 22).';
    }

    // Password (if filled)
    if (officer.password && officer.password.trim().length > 0 && officer.password.trim().length < 6) {
      errors.password = 'Le mot de passe doit comporter au moins 6 caractères.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  const handleSaveOfficer = async (officer: KeyOfficerData) => {
    const { isValid, errors } = validateOfficer(officer);

    if (!isValid) {
      setFieldErrors((prev) => ({ ...prev, [officer.id]: errors }));
      showNotification('error', 'Veuillez corriger les erreurs de saisie signalées en rouge.');
      return;
    }

    try {
      setSavingOfficerId(officer.id);
      const res = await apiClient.updateKeyOfficer(
        officer.id,
        {
          firstName: officer.firstName,
          lastName: officer.lastName,
          phone: officer.phone,
          email: officer.email,
          password: officer.password && officer.password.trim() ? officer.password.trim() : undefined,
          status: officer.status,
        },
        currentUser || undefined
      );

      if (!res.success) {
        showNotification('error', res.error || 'Erreur lors de la mise à jour.');
        return;
      }

      showNotification(
        'success',
        `Compte de l’officier ${officer.role} (${officer.firstName} ${officer.lastName}) mis à jour avec succès !`
      );

      // Reset password input and refresh current password display
      setOfficers((prev) =>
        prev.map((o) =>
          o.id === officer.id
            ? {
                ...o,
                password: '',
                currentPassword: res.user?.currentPassword || o.currentPassword,
              }
            : o
        )
      );

      // Clear any errors
      setFieldErrors((prev) => ({
        ...prev,
        [officer.id]: {},
      }));
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setSavingOfficerId(null);
    }
  };

  const handleSaveTreasury = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingTreasury(true);
      const updated = await apiClient.updateTreasurySettings(treasury, currentUser || undefined);
      setTreasury(updated);
      updateSettings({ treasury: updated });
      showNotification(
        'success',
        'Coordonnées de trésorerie (Orange Money, MoMo et Virement) enregistrées avec succès !'
      );
    } catch (err) {
      console.error(err);
      showNotification('error', 'Erreur lors de la sauvegarde des coordonnées bancaires.');
    } finally {
      setSavingTreasury(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getOfficerBadge = (role: Role) => {
    switch (role) {
      case 'PASTEUR':
        return {
          title: 'Pasteur de la Paroisse',
          desc: 'Direction spirituelle, sacrements et enseignement pastoral',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'SECRÉTAIRE':
        return {
          title: 'Secrétariat Général Paroissial',
          desc: 'Registres des membres, correspondances, actes et convocations',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'TRÉSORIER':
        return {
          title: 'Trésorerie & Gestion Financière',
          desc: 'Encaissements dîmes/offrandes, tenue du livre de caisse et banques',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      default:
        return {
          title: 'Responsable Clé',
          desc: 'Gestion des activités paroissiales',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-[#4A0E17] text-white p-6 border-b border-[#C99B2E]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E] shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Réglages de Direction & Trésorerie
                </h2>
                <span className="text-[10px] bg-[#C99B2E] text-[#4A0E17] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Direction
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Informations & accès du Pasteur, Secrétaire, Trésorier • Comptes Orange Money, Mobile Money & Virement
              </p>
            </div>
          </div>

          {/* Tab Toggle Buttons */}
          {allowTreasury && (
            <div className="flex items-center p-1 bg-white/10 rounded-2xl border border-white/20 text-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('officers')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'officers'
                    ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Officiers Clés</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('treasury')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'treasury'
                    ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Trésorerie & Comptes</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Feedback Notification */}
      {feedback && (
        <div
          className={`p-4 border-b flex items-center space-x-2 text-xs font-bold transition ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Chargement des informations de direction et de trésorerie...
        </div>
      ) : activeTab === 'officers' || !allowTreasury ? (
        /* ========================================================================= */
        /* TAB 1: KEY OFFICERS (Pasteur, Secrétaire, Trésorier)                     */
        /* ========================================================================= */
        <div className="p-6 space-y-6">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-[#C99B2E] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Gestion des responsables principaux de Sangmelima :</span>
              <p className="mt-0.5 text-[11px] text-amber-800">
                Vous pouvez modifier ici les noms, coordonnées téléphoniques, adresses email et mots de passe
                de connexion pour le <strong>Pasteur</strong>, le <strong>Secrétaire</strong> et le <strong>Trésorier</strong>.
                Chaque champ dispose d’une validation stricte et les modifications sont répercutées en temps réel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {officers.map((officer) => {
              const badge = getOfficerBadge(officer.role);
              const isSaving = savingOfficerId === officer.id;
              const isPassVisible = !!showPasswordMap[officer.id];
              const errors = fieldErrors[officer.id] || {};

              return (
                <div
                  key={officer.id}
                  className="bg-slate-50/70 rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs hover:border-[#4A0E17]/30 transition flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Officer Header Card */}
                    <div className="border-b border-slate-200 pb-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${badge.badgeColor}`}
                        >
                          {badge.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            officer.status === 'ACTIF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {officer.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-[#4A0E17] mt-2">
                        {officer.firstName || 'Responsable'} {officer.lastName || ''}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {badge.desc}
                      </p>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-3 text-xs">
                      {/* First & Last Name */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            value={officer.firstName}
                            onChange={(e) => handleOfficerChange(officer.id, 'firstName', e.target.value)}
                            className={`w-full px-3 py-2 bg-white rounded-xl border outline-none text-xs font-semibold ${
                              errors.firstName
                                ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/30'
                                : 'border-slate-300 focus:ring-2 focus:ring-[#6E1325]'
                            }`}
                            placeholder="Prénom"
                          />
                          {errors.firstName && (
                            <span className="text-[10px] text-red-600 font-bold block mt-1">
                              {errors.firstName}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nom de famille *
                          </label>
                          <input
                            type="text"
                            value={officer.lastName}
                            onChange={(e) => handleOfficerChange(officer.id, 'lastName', e.target.value)}
                            className={`w-full px-3 py-2 bg-white rounded-xl border outline-none text-xs font-semibold ${
                              errors.lastName
                                ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/30'
                                : 'border-slate-300 focus:ring-2 focus:ring-[#6E1325]'
                            }`}
                            placeholder="Nom"
                          />
                          {errors.lastName && (
                            <span className="text-[10px] text-red-600 font-bold block mt-1">
                              {errors.lastName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-[#C99B2E]" />
                          <span>Téléphone mobile (Cameroun) *</span>
                        </label>
                        <input
                          type="text"
                          value={officer.phone}
                          onChange={(e) => handleOfficerChange(officer.id, 'phone', e.target.value)}
                          className={`w-full px-3 py-2 bg-white rounded-xl border outline-none text-xs font-mono font-bold ${
                            errors.phone
                              ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/30'
                              : 'border-slate-300 focus:ring-2 focus:ring-[#6E1325]'
                          }`}
                          placeholder="+237 6XX XX XX XX"
                        />
                        {errors.phone && (
                          <span className="text-[10px] text-red-600 font-bold block mt-1">
                            {errors.phone}
                          </span>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-[#6E1325]" />
                          <span>Adresse Email (Identifiant de connexion) *</span>
                        </label>
                        <input
                          type="email"
                          value={officer.email}
                          onChange={(e) => handleOfficerChange(officer.id, 'email', e.target.value)}
                          className={`w-full px-3 py-2 bg-white rounded-xl border outline-none text-xs font-medium ${
                            errors.email
                              ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/30'
                              : 'border-slate-300 focus:ring-2 focus:ring-[#6E1325]'
                          }`}
                          placeholder="email@emf-sangmelima.org"
                        />
                        {errors.email && (
                          <span className="text-[10px] text-red-600 font-bold block mt-1">
                            {errors.email}
                          </span>
                        )}
                      </div>

                      {/* Current Password Display & New Password Input */}
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600 flex items-center space-x-1">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Mot de passe actuel :</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(officer.id)}
                            className="text-[#6E1325] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isPassVisible ? 'Masquer' : 'Afficher'}</span>
                          </button>
                        </div>

                        <div className="font-mono text-xs px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-800 tracking-wider">
                          {isPassVisible ? (
                            officer.currentPassword || 'Non défini'
                          ) : (
                            '••••••••••••'
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Définir un nouveau mot de passe (optionnel) :
                          </label>
                          <input
                            type={isPassVisible ? 'text' : 'password'}
                            value={officer.password}
                            onChange={(e) => handleOfficerChange(officer.id, 'password', e.target.value)}
                            className={`w-full px-3 py-1.5 bg-slate-50 rounded-xl border outline-none text-xs font-mono ${
                              errors.password
                                ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/30'
                                : 'border-slate-300 focus:ring-2 focus:ring-[#6E1325]'
                            }`}
                            placeholder="Au moins 6 caractères"
                          />
                          {errors.password && (
                            <span className="text-[10px] text-red-600 font-bold block mt-1">
                              {errors.password}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Statut du compte :
                        </label>
                        <select
                          value={officer.status}
                          onChange={(e) =>
                            handleOfficerChange(officer.id, 'status', e.target.value as any)
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none text-xs font-bold"
                        >
                          <option value="ACTIF">Compte Actif (Accès autorisé)</option>
                          <option value="INACTIF">Compte Inactif (Accès restreint)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveOfficer(officer)}
                    className="w-full py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    <Save className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>{isSaving ? 'Enregistrement...' : `Enregistrer ${officer.role}`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: TREASURY (Orange Money, Mobile Money, Banque & Virement)           */
        /* ========================================================================= */
        <form onSubmit={handleSaveTreasury} className="p-6 space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-950">
            <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Comptes Officiels de la Paroisse EMF Sangmelima :</span>
              <p className="mt-0.5 text-[11px] text-emerald-800">
                Ces coordonnées sont directement présentées aux membres lorsqu’ils effectuent leurs
                dîmes, offrandes et souscriptions de bâtisseurs en ligne (Mobile Money, Orange Money ou Virement bancaire).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Orange Money (OM) Card */}
            <div className="bg-orange-50/40 rounded-3xl border border-orange-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-orange-200/70 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-xs shadow-sm">
                    OM
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-orange-950">
                      Compte Orange Money Cameroun
                    </h3>
                    <p className="text-[11px] text-orange-700">
                      Encaissement direct et code marchand USSD
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-orange-900">
                  <input
                    type="checkbox"
                    checked={treasury.orangeMoney.isActive}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        orangeMoney: { ...treasury.orangeMoney, isActive: e.target.checked },
                      })
                    }
                    className="rounded text-orange-500 focus:ring-orange-400"
                  />
                  <span>Actif</span>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numéro de compte / Téléphone Orange Money *
                  </label>
                  <input
                    type="text"
                    required
                    value={treasury.orangeMoney.accountNumber}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        orangeMoney: { ...treasury.orangeMoney, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none font-mono font-bold"
                    placeholder="+237 699 XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Code Marchand Orange Money (ou syntaxe USSD #150#) *
                  </label>
                  <input
                    type="text"
                    required
                    value={treasury.orangeMoney.merchantCode}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        orangeMoney: { ...treasury.orangeMoney, merchantCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
                    placeholder="Ex: #150*47*74892# ou Code Marchand : 74892"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom du Titulaire / Intitulé du compte OM *
                  </label>
                  <input
                    type="text"
                    required
                    value={treasury.orangeMoney.accountName}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        orangeMoney: { ...treasury.orangeMoney, accountName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none font-semibold"
                    placeholder="Ex: Église Missionnaire de la Foi (Paroisse Sangmelima)"
                  />
                </div>
              </div>
            </div>

            {/* 2. MTN Mobile Money (MoMo) Card */}
            <div className="bg-amber-50/50 rounded-3xl border border-amber-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/70 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#4A0E17] font-black flex items-center justify-center text-xs shadow-sm">
                    MoMo
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-950">
                      Compte MTN Mobile Money (MoMo)
                    </h3>
                    <p className="text-[11px] text-amber-700">
                      Encaissement MoMo Pay et invite USSD *126#
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={treasury.mobileMoney.isActive}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        mobileMoney: { ...treasury.mobileMoney, isActive: e.target.checked },
                      })
                    }
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>Actif</span>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Numéro de compte / Téléphone MTN MoMo *
                  </label>
                  <input
                    type="text"
                    required
                    value={treasury.mobileMoney.accountNumber}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        mobileMoney: { ...treasury.mobileMoney, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-mono font-bold"
                    placeholder="+237 677 XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Code Marchand MoMo Pay (ou invite USSD *126#) *
                  </label>
                  <input
                    type="text"
                    required
                    value={treasury.mobileMoney.merchantCode}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        mobileMoney: { ...treasury.mobileMoney, merchantCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-800"
                    placeholder="Ex: *126*4*39210# ou Code Marchand MoMo Pay : 39210"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom du Titulaire / Intitulé du compte MoMo *
                  </label>
                  <input
                    type="text"
                    required
                    value={treasury.mobileMoney.accountName}
                    onChange={(e) =>
                      setTreasury({
                        ...treasury,
                        mobileMoney: { ...treasury.mobileMoney, accountName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                    placeholder="Ex: EMF Sangmelima Trésorerie Paroissiale"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Banque de Virement & Coordonnées Bancaires (RIB/IBAN) Card */}
          <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#4A0E17] text-[#C99B2E] flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#4A0E17]">
                    Banque de Virement & Relevé d'Identité Bancaire (RIB)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pour les virements bancaires locaux et internationaux (diaspora & entreprises)
                  </p>
                </div>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={treasury.bankTransfer.isActive}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, isActive: e.target.checked },
                    })
                  }
                  className="rounded text-[#4A0E17] focus:ring-[#6E1325]"
                />
                <span>Actif</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nom de la Banque de Virement *
                </label>
                <input
                  type="text"
                  required
                  value={treasury.bankTransfer.bankName}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-bold text-slate-800"
                  placeholder="Ex: Afriland First Bank Cameroun"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Agence Bancaire *
                </label>
                <input
                  type="text"
                  required
                  value={treasury.bankTransfer.agency}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, agency: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none"
                  placeholder="Ex: Agence de Sangmelima (Sud Cameroun)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Titulaire du Compte Bancaire *
                </label>
                <input
                  type="text"
                  required
                  value={treasury.bankTransfer.accountName}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, accountName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-bold"
                  placeholder="Ex: PAROISSE ÉGLISE MISSIONNAIRE DE LA FOI SANGMELIMA"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Numéro de Compte Bancaire *
                </label>
                <input
                  type="text"
                  required
                  value={treasury.bankTransfer.accountNumber}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-mono font-bold"
                  placeholder="Ex: 10005 00012 01234567890 45"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Clé RIB / IBAN International *
                </label>
                <input
                  type="text"
                  required
                  value={treasury.bankTransfer.ibanOrRib}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, ibanOrRib: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-mono font-bold"
                  placeholder="Ex: CM21 1000 5000 1201 2345 6789 045"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Code SWIFT / BIC (Virements internationaux) *
                </label>
                <input
                  type="text"
                  required
                  value={treasury.bankTransfer.swiftBic}
                  onChange={(e) =>
                    setTreasury({
                      ...treasury,
                      bankTransfer: { ...treasury.bankTransfer, swiftBic: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none font-mono font-bold uppercase"
                  placeholder="Ex: AFRICMCX"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Instructions de virement pour les fidèles et bienfaiteurs :
              </label>
              <textarea
                rows={2}
                value={treasury.bankTransfer.instructions}
                onChange={(e) =>
                  setTreasury({
                    ...treasury,
                    bankTransfer: { ...treasury.bankTransfer, instructions: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] outline-none text-xs leading-relaxed"
                placeholder="Ex: Veuillez préciser en motif de virement : [Nom du Donateur] + [Dîme / Offrande / Don Travaux Temple]"
              />
            </div>
          </div>

          {/* Submit Treasury Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingTreasury}
              className="px-6 py-3 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#C99B2E]" />
              <span>
                {savingTreasury
                  ? 'Enregistrement des coordonnées...'
                  : 'Enregistrer les Coordonnées de Trésorerie'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
