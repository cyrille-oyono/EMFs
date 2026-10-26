import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Phone,
  Mail,
  Home,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Member, Family, Ministry } from '../types';
import { formatDateDouala } from '../utils/formatters';

interface MembersPageProps {
  onOpenBadge: (member: Member) => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({ onOpenBadge }) => {
  const { currentUser, hasPermission } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSex, setSelectedSex] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedMinistry, setSelectedMinistry] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    sex: 'M' as 'M' | 'F',
    birthDate: '1995-01-01',
    birthPlace: 'Sangmelima',
    phone: '+237 6',
    whatsapp: '+237 6',
    email: '',
    address: 'Quartier Akon, Sangmelima',
    profession: 'Commerçant(e)',
    maritalStatus: 'MARIE' as 'CELIBATAIRE' | 'MARIE' | 'VEUF' | 'DIVORCE',
    joinDate: new Date().toISOString().substring(0, 10),
    familyId: '',
    ministryIds: [] as string[],
    department: '',
    status: 'ACTIF' as 'ACTIF' | 'INACTIF' | 'VISITEUR' | 'EN_TRANSFERT',
    observations: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [m, f, min] = await Promise.all([
      apiClient.getMembers(),
      apiClient.getFamilies(),
      apiClient.getMinistries(),
    ]);
    setMembers(m);
    setFamilies(f);
    setMinistries(min);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.lastName.toLowerCase().includes(search.toLowerCase()) ||
      m.firstName.toLowerCase().includes(search.toLowerCase()) ||
      m.memberNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.email.toLowerCase().includes(search.toLowerCase());

    const matchesSex = selectedSex === 'ALL' || m.sex === selectedSex;
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    const matchesFamily = selectedFamily === 'ALL' || m.familyId === selectedFamily;
    const matchesMinistry =
      selectedMinistry === 'ALL' || m.ministryIds.includes(selectedMinistry);

    return matchesSearch && matchesSex && matchesStatus && matchesFamily && matchesMinistry;
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      firstName: '',
      lastName: '',
      sex: 'M',
      birthDate: '1995-01-01',
      birthPlace: 'Sangmelima',
      phone: '+237 6',
      whatsapp: '+237 6',
      email: '',
      address: 'Quartier Akon, Sangmelima',
      profession: '',
      maritalStatus: 'CELIBATAIRE',
      joinDate: new Date().toISOString().substring(0, 10),
      familyId: '',
      ministryIds: [],
      department: '',
      status: 'ACTIF',
      observations: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormData({
      firstName: m.firstName,
      lastName: m.lastName,
      sex: m.sex,
      birthDate: m.birthDate,
      birthPlace: m.birthPlace,
      phone: m.phone,
      whatsapp: m.whatsapp,
      email: m.email,
      address: m.address,
      profession: m.profession,
      maritalStatus: m.maritalStatus,
      joinDate: m.joinDate,
      familyId: m.familyId || '',
      ministryIds: m.ministryIds || [],
      department: m.department || '',
      status: m.status,
      observations: m.observations || '',
    });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      alert('Veuillez renseigner le nom et le prénom.');
      return;
    }

    // Duplicate check on phone or email
    const duplicate = members.find(
      (m) =>
        (!editingMember || m.id !== editingMember.id) &&
        ((m.phone && m.phone === formData.phone) ||
          (formData.email && m.email.toLowerCase() === formData.email.toLowerCase()))
    );

    if (duplicate) {
      if (!confirm(`Attention : Un membre (${duplicate.firstName} ${duplicate.lastName}, ${duplicate.memberNumber}) possède déjà ce numéro de téléphone ou cet email. Souhaitez-vous continuer ?`)) {
        return;
      }
    }

    if (editingMember) {
      await apiClient.updateMember(editingMember.id, formData, currentUser || undefined);
      showToast('Membre mis à jour avec succès.');
    } else {
      await apiClient.createMember(formData, currentUser || undefined);
      showToast('Nouveau membre enregistré avec succès.');
    }

    setShowAddModal(false);
    loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le membre "${name}" ? Cette action sera tracée dans le journal d'audit.`)) {
      await apiClient.deleteMember(id, currentUser || undefined);
      showToast('Membre supprimé avec succès.');
      loadData();
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Sexe', 'Téléphone', 'Email', 'Adresse', 'Statut', 'Département'];
    const rows = filteredMembers.map((m) => [
      m.memberNumber,
      `"${m.lastName}"`,
      `"${m.firstName}"`,
      m.sex,
      m.phone,
      m.email,
      `"${m.address}"`,
      m.status,
      `"${m.department || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `membres_emf_sangmelima_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
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
            <Users className="w-4 h-4 text-[#6E1325]" />
            <span>Gestion de l’Assemblée de Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Répertoire des Membres</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredMembers.length} membre(s) affiché(s) sur {members.length} enregistrés
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            title="Exporter en CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {hasPermission('MEMBER_CREATE') && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C99B2E]" />
              <span>Nouveau Membre</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, matricule, téléphone, email..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] bg-white"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="VISITEUR">Visiteur</option>
              <option value="EN_TRANSFERT">En Transfert</option>
            </select>

            <select
              value={selectedSex}
              onChange={(e) => setSelectedSex(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] bg-white"
            >
              <option value="ALL">Tous les sexes</option>
              <option value="M">Hommes</option>
              <option value="F">Femmes</option>
            </select>

            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] bg-white"
            >
              <option value="ALL">Toutes les familles</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              value={selectedMinistry}
              onChange={(e) => setSelectedMinistry(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] bg-white"
            >
              <option value="ALL">Tous les ministères</option>
              {ministries.map((min) => (
                <option key={min.id} value={min.id}>
                  {min.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF0F2] text-[#4A0E17] uppercase text-[10px] font-bold tracking-wider border-b border-rose-100">
              <tr>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Membre</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Famille</th>
                <th className="py-3 px-4">Département</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Badge / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucun membre trouvé pour ces critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const fam = families.find((f) => f.id === m.familyId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {m.memberNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {m.firstName} {m.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.sex === 'M' ? 'Homme' : 'Femme'} • {m.maritalStatus.toLowerCase()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{m.phone}</span>
                        </div>
                        {m.email && (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{m.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {fam ? (
                          <span className="font-semibold text-[#6E1325]">{fam.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Non rattaché</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {m.department || 'Assemblée'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'ACTIF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'VISITEUR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenBadge(m)}
                            className="p-1.5 bg-amber-50 text-[#C99B2E] hover:bg-amber-100 rounded-lg transition cursor-pointer"
                            title="Imprimer la carte / badge membre QR Code"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          {hasPermission('MEMBER_UPDATE') && (
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 bg-[#FAF0F2] text-[#6E1325] hover:bg-rose-100 rounded-lg transition cursor-pointer"
                              title="Modifier les informations"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('MEMBER_DELETE') && (
                            <button
                              onClick={() => handleDelete(m.id, `${m.firstName} ${m.lastName}`)}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                              title="Archiver / Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingMember ? 'Modifier les informations du membre' : 'Inscrire un nouveau membre à Sangmelima'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Ex: Samuel"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Ex: Ondoa"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sexe</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Situation Matrimoniale</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="VEUF">Veuf / Veuve</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone Principal *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="+237 6..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="+237 6..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profession</label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Ex: Enseignant, Commerçant..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse à Sangmelima</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Ex: Quartier Akon"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rattachement Famille</label>
                  <select
                    value={formData.familyId}
                    onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="">Aucune famille associée</option>
                    {families.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut du Membre</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="VISITEUR">Visiteur</option>
                    <option value="EN_TRANSFERT">En Transfert</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Département d’activité</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    placeholder="Ex: Louange, Diaconat, Jeunesse..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observations pastorales</label>
                <textarea
                  rows={2}
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  placeholder="Notes spirituelles ou administratives..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] transition shadow cursor-pointer"
                >
                  {editingMember ? 'Sauvegarder' : 'Enregistrer le membre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
