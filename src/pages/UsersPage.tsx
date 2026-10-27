import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Shield,
  Key,
  CheckCircle,
  X,
  Edit2,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Phone,
  Sparkles,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { User, Role } from '../types';
import { formatDateDouala } from '../utils/formatters';

interface UserWithCredentials extends User {
  currentPassword?: string;
}

export const UsersPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<UserWithCredentials[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Password editing modal state
  const [passwordModalUser, setPasswordModalUser] = useState<UserWithCredentials | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'MEMBRE' as Role,
    phone: '+237 6',
    passwordHash: 'ChangeMe2026!',
    status: 'ACTIF' as 'ACTIF' | 'INACTIF' | 'SUSPENDU',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const list = await apiClient.getUsersWithCredentials();
    setUsers(list);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'MEMBRE',
      phone: '+237 6',
      passwordHash: 'ChangeMe2026!',
      status: 'ACTIF',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      passwordHash: '',
      status: u.status,
    });
    setShowModal(true);
  };

  const handleOpenPasswordModal = (u: UserWithCredentials) => {
    setPasswordModalUser(u);
    setNewPasswordInput(u.currentPassword || '');
    setNewEmailInput(u.email);
    setShowPasswordInModal(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordInput.trim()) return;

    const res = await apiClient.updateUserPassword(
      passwordModalUser.id,
      newPasswordInput.trim(),
      newEmailInput.trim() || undefined,
      currentUser || undefined
    );

    if (res.success) {
      showToast(
        `✓ Mots de passe et accès mis à jour pour ${passwordModalUser.firstName} (${passwordModalUser.role}) !`
      );
      setPasswordModalUser(null);
      loadUsers();
    } else {
      alert(res.error || 'Erreur lors de la mise à jour du mot de passe.');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#@';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(pwd + '2026!');
  };

  const toggleRevealPassword = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyCredentials = (u: UserWithCredentials) => {
    const text = `⛪ *Accès Officiels — ${u.role} (${u.firstName} ${u.lastName})*\nEmail : ${u.email}\nMot de passe : ${u.currentPassword || 'Non configuré'}\nLien : ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.firstName) return;

    if (editingUser) {
      await apiClient.updateUser(
        editingUser.id,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          phone: formData.phone,
          status: formData.status,
          ...(formData.passwordHash ? { passwordHash: formData.passwordHash } : {}),
        },
        currentUser || undefined
      );
      showToast('Utilisateur et email de connexion mis à jour avec succès.');
    } else {
      await apiClient.createUser(formData, currentUser || undefined);
      showToast('Nouvel utilisateur créé.');
    }

    setShowModal(false);
    loadUsers();
  };

  // Group key leadership roles for direct access (Admin, Pasteur, Secrétaire, Trésorier)
  const rolePriority: Record<string, number> = {
    ADMIN: 1,
    PASTEUR: 2,
    SECRÉTAIRE: 3,
    TRÉSORIER: 4,
    RESPONSABLE_MINISTÈRE: 5,
  };
  const leadershipUsers = users
    .filter((u) => ['ADMIN', 'PASTEUR', 'SECRÉTAIRE', 'TRÉSORIER', 'RESPONSABLE_MINISTÈRE'].includes(u.role))
    .sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#C99B2E] uppercase tracking-wider mb-1">
            <UserCog className="w-4 h-4 text-[#6E1325]" />
            <span>Sécurité & Rôles Ecclésiastiques • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">
            Gestion des Utilisateurs & Mots de Passe
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Réglez les mots de passe et identifiants de l'Admin, Pasteur, Secrétaire, Trésorier et Responsables de départements.
          </p>
        </div>

        {hasRole('ADMIN') && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Ajouter un Utilisateur</span>
          </button>
        )}
      </div>

      {/* SPECIAL SECTION: Reglage des Mots de Passe des Responsables */}
      <div className="bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 rounded-2xl p-6 border-2 border-[#C99B2E]/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#4A0E17] text-[#C99B2E] flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#4A0E17]">
                Réglage des Mots de Passe de Connexion de l'Équipe
              </h2>
              <p className="text-xs text-slate-500">
                L’administrateur peut modifier, réinitialiser et copier les mots de passe de chaque rôle en 1 clic.
              </p>
            </div>
          </div>
        </div>

        {/* Roles Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {leadershipUsers.map((u) => {
            const isRevealed = revealedPasswords[u.id];
            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#6E1325] transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#6E1325]/10 text-[#6E1325] border border-[#6E1325]/20">
                      {u.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        u.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {u.firstName} {u.lastName}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{u.email}</span>
                    </div>
                  </div>

                  {/* Password Display Box */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        Mot de passe actuel :
                      </span>
                      <span className="font-mono font-bold text-[#4A0E17]">
                        {isRevealed ? u.currentPassword || 'Non défini' : '••••••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword(u.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition"
                      title={isRevealed ? 'Masquer' : 'Afficher en clair'}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Actions: Edit Password & Copy */}
                <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenPasswordModal(u)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3 text-[#C99B2E]" />
                    <span>Régler le mot de passe</span>
                  </button>
                  <button
                    onClick={() => handleCopyCredentials(u)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title="Copier les accès pour WhatsApp / SMS"
                  >
                    {copiedId === u.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#4A0E17]">
            Tous les Comptes Enregistrés ({users.length})
          </h2>
          <span className="text-xs text-slate-400">
            Contrôle d'accès basé sur les rôles (RBAC)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F4F7FB] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rôle Ecclésiastique</th>
                <th className="py-3 px-4">Mot de Passe</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Dernière Connexion</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#6E1325] text-white flex items-center justify-center font-bold text-xs">
                        {u.firstName[0]}
                        {u.lastName[0]}
                      </div>
                      <span className="font-bold text-slate-900">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6E1325]/10 text-[#6E1325] border border-[#6E1325]/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#4A0E17]">
                    {u.currentPassword ? (
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-bold">
                        {u.currentPassword}
                      </span>
                    ) : (
                      <span className="text-slate-400">••••••</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'ACTIF'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {u.lastLoginAt ? formatDateDouala(u.lastLoginAt, true) : 'Jamais'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <button
                        onClick={() => handleOpenPasswordModal(u)}
                        className="p-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition"
                        title="Régler le mot de passe"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 bg-blue-50 text-[#6E1325] hover:bg-blue-100 rounded-lg transition"
                        title="Modifier les coordonnées / rôle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Regler le Mot de Passe */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-[#C99B2E]" />
                <h3 className="font-bold text-sm">
                  Régler le Mot de Passe ({passwordModalUser.role})
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                Modification des identifiants officiels pour <strong>{passwordModalUser.firstName} {passwordModalUser.lastName}</strong> ({passwordModalUser.role}).
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adresse Email de Connexion :
                </label>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] font-mono outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Nouveau Mot de Passe :
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[#6E1325] hover:underline font-bold text-[10px] flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Générer un mot de passe</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordInModal ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Saisissez le nouveau mot de passe..."
                    className="w-full px-3 py-2 pr-9 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] font-mono outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Enregistrer le Mot de Passe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit User Profile */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingUser ? 'Modifier le compte' : 'Créer un utilisateur'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email de connexion (Identifiant officiel) *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] font-mono outline-none"
                  placeholder="nom@emf-sangmelima.org"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rôle Ecclésiastique *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PASTEUR">PASTEUR</option>
                    <option value="SECRÉTAIRE">SECRÉTAIRE</option>
                    <option value="TRÉSORIER">TRÉSORIER</option>
                    <option value="RESPONSABLE_MINISTÈRE">RESPONSABLE MINISTÈRE</option>
                    <option value="MEMBRE">MEMBRE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="INACTIF">INACTIF</option>
                    <option value="SUSPENDU">SUSPENDU</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Numéro Téléphone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mot de Passe Initial *</label>
                  <input
                    type="text"
                    required
                    value={formData.passwordHash}
                    onChange={(e) => setFormData({ ...formData, passwordHash: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] font-mono font-bold"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold rounded-xl shadow"
                >
                  {editingUser ? 'Enregistrer' : 'Créer l’utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
