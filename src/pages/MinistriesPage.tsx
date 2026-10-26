import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Users,
  Calendar,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  HeartHandshake,
  Clock,
  Sparkles,
  Search,
  Filter,
  UserCheck,
  UserX,
  Send,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Ministry, Department, MinistryAdhesionRequest, Member } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const MinistriesPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const isAdminOrPastor = hasRole(['ADMIN', 'PASTEUR']);

  const [activeTab, setActiveTab] = useState<'ministries' | 'adhesions'>('ministries');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [adhesions, setAdhesions] = useState<MinistryAdhesionRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Ministry State
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [editingMin, setEditingMin] = useState<Ministry | null>(null);
  const [ministryFormData, setMinistryFormData] = useState({
    name: '',
    category: 'Général',
    description: '',
    leaderName: '',
    meetingSchedule: 'Chaque samedi à 16h00',
  });

  // Modal Department State
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({
    ministryId: '',
    name: '',
    description: '',
    leaderName: '',
    leaderPhone: '',
    meetingSchedule: 'Samedi 15h00',
  });

  // Modal Adhesion Request State (For Members)
  const [showAdhesionModal, setShowAdhesionModal] = useState(false);
  const [selectedMinistryForAdhesion, setSelectedMinistryForAdhesion] = useState<Ministry | null>(null);
  const [adhesionFormData, setAdhesionFormData] = useState({
    departmentName: '',
    memberName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    memberEmail: currentUser?.email || '',
    memberPhone: currentUser?.phone || '',
    motivation: '',
    spiritualGifts: '',
    availability: '',
  });

  // Adhesion Review Modal (For Admin)
  const [reviewModalAdhesion, setReviewModalAdhesion] = useState<MinistryAdhesionRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mins, depts, mems, adhs] = await Promise.all([
        apiClient.getMinistries(),
        apiClient.getDepartments(),
        apiClient.getMembers(),
        apiClient.getMinistryAdhesions(),
      ]);
      setMinistries(mins);
      setDepartments(depts);
      setMembers(mems);
      setAdhesions(adhs);
    } catch (err) {
      console.error('Failed to load ministries data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Ministry Handlers
  const handleOpenAddMinistry = () => {
    setEditingMin(null);
    setMinistryFormData({
      name: '',
      category: 'Général',
      description: '',
      leaderName: '',
      meetingSchedule: 'Chaque samedi à 16h00',
    });
    setShowMinistryModal(true);
  };

  const handleOpenEditMinistry = (min: Ministry) => {
    setEditingMin(min);
    setMinistryFormData({
      name: min.name,
      category: min.category,
      description: min.description,
      leaderName: min.leaderName || '',
      meetingSchedule: min.meetingSchedule || '',
    });
    setShowMinistryModal(true);
  };

  const handleSaveMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ministryFormData.name.trim()) return;

    if (editingMin) {
      await apiClient.updateMinistry(editingMin.id, ministryFormData, currentUser || undefined);
      showToast('Ministère mis à jour avec succès.');
    } else {
      await apiClient.createMinistry(ministryFormData, currentUser || undefined);
      showToast('Nouveau ministère créé avec succès.');
    }
    setShowMinistryModal(false);
    loadData();
  };

  const handleDeleteMinistry = async (id: string, name: string) => {
    if (confirm(`Confirmer la suppression du ministère "${name}" ?`)) {
      await apiClient.deleteMinistry(id, currentUser || undefined);
      showToast('Ministère supprimé.');
      loadData();
    }
  };

  // Department Handlers
  const handleOpenAddDept = (minId: string) => {
    setEditingDept(null);
    setDeptFormData({
      ministryId: minId,
      name: '',
      description: '',
      leaderName: '',
      leaderPhone: '',
      meetingSchedule: 'Hebdomadaire',
    });
    setShowDeptModal(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptFormData({
      ministryId: dept.ministryId,
      name: dept.name,
      description: dept.description,
      leaderName: dept.leaderName || '',
      leaderPhone: dept.leaderPhone || '',
      meetingSchedule: dept.meetingSchedule || '',
    });
    setShowDeptModal(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.name.trim() || !deptFormData.ministryId) return;

    if (editingDept) {
      await apiClient.updateDepartment(editingDept.id, deptFormData, currentUser || undefined);
      showToast('Département mis à jour.');
    } else {
      await apiClient.createDepartment(deptFormData, currentUser || undefined);
      showToast('Nouveau département rattaché au ministère.');
    }
    setShowDeptModal(false);
    loadData();
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (confirm(`Confirmer la suppression du département "${name}" ?`)) {
      await apiClient.deleteDepartment(id, currentUser || undefined);
      showToast('Département supprimé.');
      loadData();
    }
  };

  // Adhesion Handlers
  const handleOpenAdhesionModal = (min: Ministry) => {
    setSelectedMinistryForAdhesion(min);
    setAdhesionFormData({
      departmentName: '',
      memberName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      memberEmail: currentUser?.email || '',
      memberPhone: currentUser?.phone || '',
      motivation: '',
      spiritualGifts: '',
      availability: '',
    });
    setShowAdhesionModal(true);
  };

  const handleSubmitAdhesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinistryForAdhesion || !adhesionFormData.memberName.trim() || !adhesionFormData.motivation.trim()) {
      alert('Veuillez renseigner votre nom et votre motivation pour rejoindre ce ministère.');
      return;
    }

    try {
      await apiClient.createMinistryAdhesion(
        {
          ministryId: selectedMinistryForAdhesion.id,
          ministryName: selectedMinistryForAdhesion.name,
          departmentName: adhesionFormData.departmentName || undefined,
          memberId: currentUser?.memberId || currentUser?.id,
          memberName: adhesionFormData.memberName,
          memberEmail: adhesionFormData.memberEmail,
          memberPhone: adhesionFormData.memberPhone,
          motivation: adhesionFormData.motivation,
          spiritualGifts: adhesionFormData.spiritualGifts,
          availability: adhesionFormData.availability,
        },
        currentUser || undefined
      );

      setShowAdhesionModal(false);
      showToast('Votre demande d’adhésion a été transmise au responsable du ministère !');
      loadData();
    } catch (err) {
      console.error('Failed to submit adhesion request:', err);
    }
  };

  const handleUpdateAdhesionStatus = async (
    id: string,
    status: MinistryAdhesionRequest['status'],
    notes?: string
  ) => {
    try {
      await apiClient.updateMinistryAdhesionStatus(id, status, notes, currentUser || undefined);
      showToast(status === 'APPROUVEE' ? 'Demande approuvée avec succès !' : 'Statut de la demande mis à jour.');
      setReviewModalAdhesion(null);
      loadData();
    } catch (err) {
      console.error('Failed to update adhesion status:', err);
    }
  };

  const handleDeleteAdhesion = async (id: string) => {
    if (!confirm('Supprimer cette demande d’adhésion ?')) return;
    try {
      await apiClient.deleteMinistryAdhesion(id, currentUser || undefined);
      showToast('Demande supprimée.');
      loadData();
    } catch (err) {
      console.error('Failed to delete adhesion:', err);
    }
  };

  const pendingAdhesionsCount = adhesions.filter((a) => a.status === 'EN_ATTENTE').length;

  const filteredMinistries = ministries.filter((min) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = min.name.toLowerCase().includes(term);
      const matchCat = min.category.toLowerCase().includes(term);
      const matchLeader = (min.leaderName || '').toLowerCase().includes(term);
      return matchName || matchCat || matchLeader;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#071f3a] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 border border-[#C99B2E]/40 text-[#C99B2E] text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Pôles d’Impact & Service • Sangmelima</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ministères & Départements
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Découvrez les ministères et départements de l'église, faites vos demandes d'adhésion pour mettre vos talents au service du Seigneur, et entrez en contact avec les responsables.
            </p>
          </div>

          {isAdminOrPastor && (
            <button
              onClick={handleOpenAddMinistry}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-[#C99B2E] hover:bg-[#b58925] text-[#4A0E17] font-bold text-sm shadow-md transition cursor-pointer self-start md:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Ministère</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-3 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={() => setActiveTab('ministries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'ministries'
                ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tous les Ministères ({ministries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('adhesions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 relative ${
              activeTab === 'adhesions'
                ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Demandes d’Adhésion ({adhesions.length})</span>
            {pendingAdhesionsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingAdhesionsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar for Ministries */}
      {activeTab === 'ministries' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un ministère par nom, catégorie ou responsable..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {filteredMinistries.length} ministère(s)
          </span>
        </div>
      )}

      {/* Tab 1: Ministries & Sub-Departments */}
      {activeTab === 'ministries' && (
        <>
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Chargement des ministères...</p>
            </div>
          ) : filteredMinistries.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Aucun ministère trouvé</h3>
              <p className="text-xs text-slate-500">Essayez un autre mot-clé dans la recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMinistries.map((min) => {
                const membersInMin = members.filter((m) => m.ministryIds && m.ministryIds.includes(min.id));
                const minDepts = departments.filter((d) => d.ministryId === min.id);

                return (
                  <div
                    key={min.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between p-6 space-y-4"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#6E1325] border border-blue-200">
                          {min.category}
                        </span>

                        {isAdminOrPastor && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleOpenEditMinistry(min)}
                              className="p-1 text-slate-400 hover:text-[#6E1325] rounded"
                              title="Modifier le ministère"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMinistry(min.id, min.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Supprimer le ministère"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-extrabold text-[#4A0E17] leading-snug">
                          {min.name}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {min.description}
                        </p>
                      </div>

                      {/* Leadership & Schedule Info */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Responsable :</span>
                          <span className="font-bold text-[#4A0E17]">
                            {min.leaderName || 'Non désigné'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Rencontres :</span>
                          <span className="font-semibold text-slate-700">
                            {min.meetingSchedule || 'Hebdomadaire'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Membres rattachés :</span>
                          <span className="font-bold text-emerald-700">
                            {membersInMin.length} membre{membersInMin.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Sub-Departments Section */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Départements ({minDepts.length})
                          </span>
                          {isAdminOrPastor && (
                            <button
                              onClick={() => handleOpenAddDept(min.id)}
                              className="text-[10px] text-[#6E1325] hover:underline font-bold flex items-center space-x-0.5"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Ajouter</span>
                            </button>
                          )}
                        </div>

                        {minDepts.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            Aucun sous-département spécifique.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {minDepts.map((d) => (
                              <div
                                key={d.id}
                                className="p-2 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <p className="font-bold text-slate-800 text-[11px]">{d.name}</p>
                                  {d.leaderName && (
                                    <p className="text-[10px] text-slate-500">Resp : {d.leaderName}</p>
                                  )}
                                </div>
                                {isAdminOrPastor && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleOpenEditDept(d)}
                                      className="p-1 text-slate-400 hover:text-[#6E1325]"
                                      title="Modifier département"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDept(d.id, d.name)}
                                      className="p-1 text-slate-400 hover:text-rose-600"
                                      title="Supprimer département"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Adhesion Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenAdhesionModal(min)}
                        className="w-full py-2 px-3 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <HeartHandshake className="w-4 h-4 text-[#C99B2E]" />
                        <span>Faire une demande d’adhésion</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Member Adhesion Requests (Viewed by members & managed by Admin) */}
      {activeTab === 'adhesions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#4A0E17]">
                Demandes d'Adhésion aux Ministères
              </h2>
              <p className="text-xs text-slate-500">
                {isAdminOrPastor
                  ? 'Examinez et validez les candidatures des membres pour chaque ministère ou département.'
                  : 'Suivez le statut de vos demandes pour servir dans les ministères de l’église.'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
              {adhesions.length} demande(s) au total
            </span>
          </div>

          {adhesions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">Aucune demande d’adhésion en cours</h3>
              <p className="text-xs text-slate-500">
                Les membres peuvent postuler à tout moment en cliquant sur « Faire une demande d’adhésion » sur la fiche d’un ministère.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adhesions.map((adh) => {
                const isPending = adh.status === 'EN_ATTENTE';
                const isApproved = adh.status === 'APPROUVEE';
                const isRejected = adh.status === 'REJETEE';

                return (
                  <div
                    key={adh.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Bar with Ministry & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#6E1325] border border-blue-200">
                            {adh.ministryName}
                          </span>
                          {adh.departmentName && (
                            <span className="text-[10px] ml-1 font-semibold text-slate-500">
                              • {adh.departmentName}
                            </span>
                          )}
                          <h3 className="text-base font-extrabold text-[#4A0E17] mt-1">
                            {adh.memberName}
                          </h3>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex-shrink-0 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isApproved ? 'Approuvée' : isRejected ? 'Non retenue' : 'En attente'}
                        </span>
                      </div>

                      {/* Contact Details */}
                      <div className="flex items-center space-x-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {adh.memberPhone && (
                          <a
                            href={`tel:${adh.memberPhone}`}
                            className="inline-flex items-center space-x-1 hover:text-[#6E1325] font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#C99B2E]" />
                            <span>{adh.memberPhone}</span>
                          </a>
                        )}
                        {adh.memberEmail && (
                          <a
                            href={`mailto:${adh.memberEmail}`}
                            className="inline-flex items-center space-x-1 hover:text-[#6E1325] font-medium"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#6E1325]" />
                            <span className="truncate max-w-[150px]">{adh.memberEmail}</span>
                          </a>
                        )}
                      </div>

                      {/* Motivation */}
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Motivation :
                        </p>
                        <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                          « {adh.motivation} »
                        </p>
                      </div>

                      {/* Talents and Availability */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                        {adh.spiritualGifts && (
                          <div>
                            <span className="font-bold text-slate-700 block">Dons & Talents :</span>
                            <span>{adh.spiritualGifts}</span>
                          </div>
                        )}
                        {adh.availability && (
                          <div>
                            <span className="font-bold text-slate-700 block">Disponibilités :</span>
                            <span>{adh.availability}</span>
                          </div>
                        )}
                      </div>

                      {/* Review feedback if any */}
                      {adh.reviewNotes && (
                        <div className="p-2.5 rounded-xl bg-slate-50 text-xs border border-slate-200">
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Avis Pastoral ({adh.reviewedBy || 'Direction'}) :
                          </p>
                          <p className="text-slate-700">{adh.reviewNotes}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 pt-1">
                        Soumise le {formatDateDouala(adh.createdAt)}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdminOrPastor && (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {isPending ? (
                          <div className="flex items-center space-x-2 w-full">
                            <button
                              onClick={() => handleUpdateAdhesionStatus(adh.id, 'APPROUVEE', 'Profil et talents validés')}
                              className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approuver & Intégrer</span>
                            </button>
                            <button
                              onClick={() => {
                                setReviewModalAdhesion(adh);
                                setReviewNotes('');
                              }}
                              className="py-1.5 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition"
                            >
                              Décider...
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full text-xs">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Décision enregistrée
                            </span>
                            <button
                              onClick={() => handleDeleteAdhesion(adh.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="Supprimer la demande"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Faire une demande d'adhésion (Membre) */}
      {showAdhesionModal && selectedMinistryForAdhesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-[#C99B2E]" />
                <div>
                  <h3 className="font-extrabold text-base text-[#4A0E17]">
                    Demande d’Adhésion
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ministère : <strong className="text-slate-800">{selectedMinistryForAdhesion.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdhesionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdhesion} className="space-y-4">
              {/* If ministry has sub-departments, let member pick one optionally */}
              {departments.filter((d) => d.ministryId === selectedMinistryForAdhesion.id).length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Département spécifique souhaité (Optionnel)
                  </label>
                  <select
                    value={adhesionFormData.departmentName}
                    onChange={(e) => setAdhesionFormData({ ...adhesionFormData, departmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="">Tous les départements / Non spécifié</option>
                    {departments
                      .filter((d) => d.ministryId === selectedMinistryForAdhesion.id)
                      .map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} (Resp : {d.leaderName || 'Non désigné'})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Votre Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Frère Patrick Meka"
                    value={adhesionFormData.memberName}
                    onChange={(e) => setAdhesionFormData({ ...adhesionFormData, memberName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+237 6xx xx xx xx"
                    value={adhesionFormData.memberPhone}
                    onChange={(e) => setAdhesionFormData({ ...adhesionFormData, memberPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="votre.email@domaine.com"
                  value={adhesionFormData.memberEmail}
                  onChange={(e) => setAdhesionFormData({ ...adhesionFormData, memberEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pourquoi désirez-vous rejoindre ce ministère ? (Motivation) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Expliquez ce qui vous pousse à vous engager dans ce service..."
                  value={adhesionFormData.motivation}
                  onChange={(e) => setAdhesionFormData({ ...adhesionFormData, motivation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dons spirituels & Talents</label>
                  <input
                    type="text"
                    placeholder="Ex : Chant, Piano, Accueil, Enseignement..."
                    value={adhesionFormData.spiritualGifts}
                    onChange={(e) => setAdhesionFormData({ ...adhesionFormData, spiritualGifts: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Disponibilités</label>
                  <input
                    type="text"
                    placeholder="Ex : Samedis après-midi, Dimanche matin..."
                    value={adhesionFormData.availability}
                    onChange={(e) => setAdhesionFormData({ ...adhesionFormData, availability: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdhesionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Envoyer ma candidature</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Décider d'une demande d'adhésion (Admin) */}
      {reviewModalAdhesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#4A0E17]">
                Décision sur la candidature
              </h3>
              <button
                onClick={() => setReviewModalAdhesion(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>
                <strong>Candidat(e) :</strong> {reviewModalAdhesion.memberName}
              </p>
              <p>
                <strong>Ministère :</strong> {reviewModalAdhesion.ministryName}
              </p>
              <p className="italic text-slate-600 mt-1">« {reviewModalAdhesion.motivation} »</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Note ou encouragement pastoral :
              </label>
              <textarea
                rows={2}
                placeholder="Ex : Bienvenue dans l'équipe, intégration validée pour le mois prochain..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => handleUpdateAdhesionStatus(reviewModalAdhesion.id, 'REJETEE', reviewNotes)}
                className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold"
              >
                Rejeter
              </button>
              <button
                onClick={() => handleUpdateAdhesionStatus(reviewModalAdhesion.id, 'APPROUVEE', reviewNotes)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Approuver & Intégrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajouter / Modifier un Ministère (Admin) */}
      {showMinistryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#4A0E17]">
                {editingMin ? 'Modifier le Ministère' : 'Créer un Nouveau Ministère'}
              </h3>
              <button
                onClick={() => setShowMinistryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMinistry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Ministère *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Jeunesse EMF (JEMF)"
                  value={ministryFormData.name}
                  onChange={(e) => setMinistryFormData({ ...ministryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                <input
                  type="text"
                  placeholder="Ex : Jeunesse, Femmes, Louange..."
                  value={ministryFormData.category}
                  onChange={(e) => setMinistryFormData({ ...ministryFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsable Désigné</label>
                <input
                  type="text"
                  placeholder="Ex : Frère Paul Nnomo"
                  value={ministryFormData.leaderName}
                  onChange={(e) => setMinistryFormData({ ...ministryFormData, leaderName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horaire des Rencontres</label>
                <input
                  type="text"
                  placeholder="Ex : Chaque samedi à 16h00"
                  value={ministryFormData.meetingSchedule}
                  onChange={(e) => setMinistryFormData({ ...ministryFormData, meetingSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Vision</label>
                <textarea
                  rows={3}
                  placeholder="Objectifs et mission..."
                  value={ministryFormData.description}
                  onChange={(e) => setMinistryFormData({ ...ministryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMinistryModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white rounded-xl text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajouter / Modifier un Département (Admin) */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-[#4A0E17]">
                {editingDept ? 'Modifier le Département' : 'Ajouter un Département'}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Département *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Chantres & Chœurs Polyphoniques"
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsable</label>
                <input
                  type="text"
                  placeholder="Ex : Sœur Marie-Claire Bikoula"
                  value={deptFormData.leaderName}
                  onChange={(e) => setDeptFormData({ ...deptFormData, leaderName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone Responsable</label>
                <input
                  type="tel"
                  placeholder="+237 6xx xx xx xx"
                  value={deptFormData.leaderPhone}
                  onChange={(e) => setDeptFormData({ ...deptFormData, leaderPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horaire</label>
                <input
                  type="text"
                  placeholder="Mercredi 17h00"
                  value={deptFormData.meetingSchedule}
                  onChange={(e) => setDeptFormData({ ...deptFormData, meetingSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Rôle et tâches du département..."
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white rounded-xl text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
