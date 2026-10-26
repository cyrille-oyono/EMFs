import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Heart,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ChurchLogo } from '../common/ChurchLogo';
import { Role } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  titleNotice?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  titleNotice,
  onSuccess,
}) => {
  const { login, register, settings } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+237 6');
  const [regRole, setRegRole] = useState<'MEMBRE' | 'VISITEUR'>('MEMBRE');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync tab if initialTab changes
  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Veuillez saisir votre adresse email et votre mot de passe.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(loginEmail.trim(), loginPassword);
      if (res.success) {
        setSuccessMsg('Connexion réussie ! Heureux de vous revoir.');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Identifiants invalides. Vérifiez votre mot de passe.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regFirstName.trim() || !regLastName.trim()) {
      setErrorMsg('Veuillez renseigner votre prénom et votre nom.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse email valide.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim(),
        role: regRole,
      });

      if (res.success) {
        setSuccessMsg(`✓ Bienvenue ${regFirstName} ! Votre compte a été créé avec succès.`);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 800);
      } else {
        setErrorMsg(res.error || "Erreur lors de l'enregistrement du compte.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition z-10 cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-br from-[#4A0E17] to-[#6E1325] text-white p-6 pt-7 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#C99B2E]/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-center mb-2">
            <ChurchLogo size="md" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#C99B2E] block">
            {settings.churchName || 'Église Missionnaire de la Foi'}
          </span>
          <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
            {tab === 'login' ? 'Connexion Sécurisée' : 'Créer un Compte'}
          </h3>
          <p className="text-xs text-rose-200/80 mt-1 max-w-xs mx-auto">
            {titleNotice ||
              (tab === 'login'
                ? 'Accédez à votre espace paroissial avec votre adresse email et mot de passe.'
                : 'Rejoignez la communauté de Sangmelima (Paroisse Grand Temple Akon).')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer ${
              tab === 'login'
                ? 'bg-white text-[#4A0E17] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Se Connecter</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer ${
              tab === 'register'
                ? 'bg-white text-[#4A0E17] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>S'inscrire (Nouveau)</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        <div className="p-6 pb-0">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* TAB 1: LOGIN */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse Email (Identifiant)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ex: votre.email@exemple.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Mot de Passe
                </label>
                <span className="text-[11px] text-slate-400">Sensible à la casse</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Votre mot de passe"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-[#C99B2E] rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#C99B2E]" />
                  <span>Se Connecter</span>
                </>
              )}
            </button>

            {/* Inscription pour les membres & nouveaux fidèles */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-center text-xs text-slate-500">
                Vous n'avez pas encore de compte personnel ?
              </div>

              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg(null);
                }}
                className="w-full py-2.5 px-3 bg-[#4A0E17]/5 hover:bg-[#4A0E17]/10 text-[#4A0E17] text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-[#4A0E17]/15"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Créer mon Compte (Inscription)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Prénom"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  placeholder="Nom de famille"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Email *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="votre.email@exemple.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone (WhatsApp)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+237 6..."
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Votre Profil *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'MEMBRE' | 'VISITEUR')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#4A0E17] focus:bg-white focus:outline-none"
                >
                  <option value="MEMBRE">Membre de l'église</option>
                  <option value="VISITEUR">Visiteur / Nouveau</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de Passe (min. 6 caractères) *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Choisissez un mot de passe sécurisé"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-8 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmer le Mot de Passe *
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Répétez le mot de passe"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-[#C99B2E] rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#C99B2E]" />
                  <span>Créer mon Compte & Se Connecter</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-xs text-[#6E1325] hover:underline font-bold"
              >
                Déjà inscrit ? Se connecter avec son mot de passe
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
