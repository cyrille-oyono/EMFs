import React, { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  User as UserIcon,
  Phone,
  Clock,
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  MessageCircle,
  Flame,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { HomeCell } from '../types';

export const HomeCellsPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const isAdminOrPastor = hasRole(['ADMIN', 'PASTEUR']);

  const [cells, setCells] = useState<HomeCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('TOUS');
  const [selectedDay, setSelectedDay] = useState('TOUS');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<HomeCell | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Join cell interest state
  const [joinedCellToast, setJoinedCellToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    neighborhood: 'Akon',
    address: '',
    leaderName: '',
    leaderPhone: '',
    assistantName: '',
    assistantPhone: '',
    hostFamilyName: '',
    meetingDay: 'Mercredi',
    meetingTime: '18h30 - 20h00',
    memberCount: 15,
    targetAudience: 'Tous les âges & Familles',
    description: '',
    status: 'ACTIVE' as HomeCell['status'],
  });

  useEffect(() => {
    loadCells();
  }, []);

  const loadCells = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getHomeCells();
      setCells(data);
    } catch (err) {
      console.error('Failed to load home cells:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingCell(null);
    setFormData({
      name: '',
      neighborhood: 'Akon',
      address: '',
      leaderName: '',
      leaderPhone: '',
      assistantName: '',
      assistantPhone: '',
      hostFamilyName: '',
      meetingDay: 'Mercredi',
      meetingTime: '18h30 - 20h00',
      memberCount: 10,
      targetAudience: 'Tous les âges & Familles',
      description: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cell: HomeCell) => {
    setEditingCell(cell);
    setFormData({
      name: cell.name,
      neighborhood: cell.neighborhood,
      address: cell.address,
      leaderName: cell.leaderName,
      leaderPhone: cell.leaderPhone,
      assistantName: cell.assistantName || '',
      assistantPhone: cell.assistantPhone || '',
      hostFamilyName: cell.hostFamilyName || '',
      meetingDay: cell.meetingDay,
      meetingTime: cell.meetingTime,
      memberCount: cell.memberCount,
      targetAudience: cell.targetAudience || 'Tous les âges & Familles',
      description: cell.description || '',
      status: cell.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.neighborhood.trim() || !formData.leaderName.trim()) {
      alert('Veuillez renseigner le nom de la cellule, le quartier et le responsable.');
      return;
    }

    try {
      if (editingCell) {
        await apiClient.updateHomeCell(editingCell.id, formData, currentUser || undefined);
        showToast('Cellule de maison mise à jour.');
      } else {
        await apiClient.createHomeCell(formData, currentUser || undefined);
        showToast('Nouvelle cellule de maison créée.');
      }
      setModalOpen(false);
      loadCells();
    } catch (err) {
      console.error('Failed to save home cell:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Confirmer la suppression de la cellule "${name}" ?`)) return;
    try {
      await apiClient.deleteHomeCell(id, currentUser || undefined);
      showToast('Cellule de maison supprimée.');
      loadCells();
    } catch (err) {
      console.error('Failed to delete home cell:', err);
    }
  };

  const handleJoinInterest = (cell: HomeCell) => {
    setJoinedCellToast(`Vos coordonnées ont été transmises au responsable de la ${cell.name} (${cell.leaderName}) !`);
    setTimeout(() => setJoinedCellToast(null), 5000);
  };

  // Filtered cells
  const filteredCells = cells.filter((cell) => {
    if (selectedNeighborhood !== 'TOUS' && cell.neighborhood !== selectedNeighborhood) return false;
    if (selectedDay !== 'TOUS' && cell.meetingDay !== selectedDay) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = cell.name.toLowerCase().includes(term);
      const matchNeigh = cell.neighborhood.toLowerCase().includes(term);
      const matchLeader = cell.leaderName.toLowerCase().includes(term);
      const matchAddr = cell.address.toLowerCase().includes(term);
      return matchName || matchNeigh || matchLeader || matchAddr;
    }
    return true;
  });

  const neighborhoods = Array.from(new Set(cells.map((c) => c.neighborhood))).filter(Boolean);
  const days = Array.from(new Set(cells.map((c) => c.meetingDay))).filter(Boolean);

  // Statistics
  const totalCells = cells.length;
  const activeCells = cells.filter((c) => c.status === 'ACTIVE').length;
  const totalMembersInCells = cells.reduce((acc, c) => acc + (c.memberCount || 0), 0);
  const neighborhoodsCount = neighborhoods.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Join Cell Feedback Toast */}
      {joinedCellToast && (
        <div className="fixed bottom-5 left-5 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-400 flex items-center space-x-2 animate-in slide-in-from-bottom">
          <HeartHandshake className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">{joinedCellToast}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#071f3a] rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 border border-[#C99B2E]/40 text-[#C99B2E] text-xs font-semibold">
              <Home className="w-3.5 h-3.5" />
              <span>Églises de Maison & Vie de Quartier • Sangmelima</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cellules de Maison
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Retrouvez la cellule de prière et d’édification fraternelle la plus proche de votre domicile à Sangmelima. Partage de la Parole, intercession mutuelle et accueil bienveillant chaque semaine.
            </p>
          </div>

          {isAdminOrPastor && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-[#C99B2E] hover:bg-[#b58925] text-[#4A0E17] font-bold text-sm shadow-md transition cursor-pointer self-start md:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Cellule</span>
            </button>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-300 font-medium">Cellules de Prière</p>
            <p className="text-xl sm:text-2xl font-black text-white">{totalCells}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-amber-200 font-medium">Cellules Actives</p>
            <p className="text-xl sm:text-2xl font-black text-[#C99B2E]">{activeCells}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-emerald-200 font-medium">Quartiers Couverts</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">{neighborhoodsCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-blue-200 font-medium">Fidèles Encadrés</p>
            <p className="text-xl sm:text-2xl font-black text-blue-300">{totalMembersInCells}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par quartier (Akon, Monavebe...), nom de cellule ou responsable..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
            {/* Neighborhood Filter */}
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="TOUS">Tous les quartiers</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  Quartier {n}
                </option>
              ))}
            </select>

            {/* Day Filter */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="TOUS">Tous les jours</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cells Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Chargement des cellules de maison...</p>
        </div>
      ) : filteredCells.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <Home className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Aucune cellule de maison trouvée</h3>
          <p className="text-xs text-slate-500">
            Ajustez votre recherche ou vos filtres pour localiser d’autres cellules de Sangmelima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCells.map((cell) => {
            const isActive = cell.status === 'ACTIVE';

            return (
              <div
                key={cell.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#6E1325] border border-blue-200">
                        Quartier {cell.neighborhood}
                      </span>
                      <h3 className="text-base font-extrabold text-[#4A0E17] mt-1.5 leading-snug">
                        {cell.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isActive ? 'Active' : 'En pause'}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start space-x-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">{cell.address}</p>
                      {cell.hostFamilyName && (
                        <p className="text-[11px] text-slate-500">Hôte : {cell.hostFamilyName}</p>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#4A0E17] bg-[#C99B2E]/10 p-2.5 rounded-xl border border-[#C99B2E]/20">
                    <Clock className="w-4 h-4 text-[#C99B2E] flex-shrink-0" />
                    <span>{cell.meetingDay} • {cell.meetingTime}</span>
                  </div>

                  {/* Leader details */}
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/70 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-[#6E1325] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Responsable de cellule</p>
                          <p className="text-xs font-bold text-[#4A0E17]">{cell.leaderName}</p>
                        </div>
                      </div>

                      {cell.leaderPhone && (
                        <a
                          href={`tel:${cell.leaderPhone}`}
                          className="px-2 py-1 rounded-lg bg-[#6E1325]/10 hover:bg-[#6E1325] hover:text-white text-[#6E1325] text-xs font-bold transition flex items-center space-x-1"
                          title="Appeler le responsable"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Appeler</span>
                        </a>
                      )}
                    </div>

                    {cell.assistantName && (
                      <p className="text-[11px] text-slate-500 pl-9">
                        Adjoint(e) : <span className="font-medium text-slate-700">{cell.assistantName}</span>
                      </p>
                    )}
                  </div>

                  {/* Description & Target */}
                  {cell.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cell.description}
                    </p>
                  )}
                </div>

                {/* Footer Bar & Member Interaction */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cell.memberCount} fidèles réguliers</span>
                    </span>

                    {cell.targetAudience && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        {cell.targetAudience}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleJoinInterest(cell)}
                      className="flex-1 py-1.5 px-3 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-[#C99B2E]" />
                      <span>Rejoindre la cellule</span>
                    </button>

                    {isAdminOrPastor && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(cell)}
                          className="p-1.5 text-slate-400 hover:text-[#6E1325] hover:bg-slate-100 rounded-lg transition"
                          title="Modifier la cellule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cell.id, cell.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Supprimer la cellule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Créer / Modifier une cellule de maison */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-[#6E1325]" />
                <h3 className="font-extrabold text-base text-[#4A0E17]">
                  {editingCell ? 'Modifier la Cellule de Maison' : 'Créer une Cellule de Maison'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom de la cellule *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Cellule Béthel"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quartier (Sangmelima) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Akon, Monavebe, Nkol-Ekong..."
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse exacte / Repère *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Derrière le Grand Marché, Concession Ondoa"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Famille Hôte / Accueil</label>
                  <input
                    type="text"
                    placeholder="Ex : Famille Ondoa"
                    value={formData.hostFamilyName}
                    onChange={(e) => setFormData({ ...formData, hostFamilyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Public Cible</label>
                  <input
                    type="text"
                    placeholder="Tous les fidèles, Familles..."
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Leader info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-[#4A0E17]">Responsables de la Cellule</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Responsable Principal *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : Diacre Jean-Marc Mengue"
                      value={formData.leaderName}
                      onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Téléphone Responsable *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+237 6xx xx xx xx"
                      value={formData.leaderPhone}
                      onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Animateur Adjoint</label>
                    <input
                      type="text"
                      placeholder="Ex : Sœur Christine Ngo"
                      value={formData.assistantName}
                      onChange={(e) => setFormData({ ...formData, assistantName: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Téléphone Adjoint</label>
                    <input
                      type="tel"
                      placeholder="+237 6xx xx xx xx"
                      value={formData.assistantPhone}
                      onChange={(e) => setFormData({ ...formData, assistantPhone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule and Members */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jour de réunion *</label>
                  <select
                    value={formData.meetingDay}
                    onChange={(e) => setFormData({ ...formData, meetingDay: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="Mardi">Mardi</option>
                    <option value="Mercredi">Mercredi</option>
                    <option value="Jeudi">Jeudi</option>
                    <option value="Vendredi">Vendredi</option>
                    <option value="Samedi">Samedi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heure de réunion</label>
                  <input
                    type="text"
                    placeholder="18h30 - 20h00"
                    value={formData.meetingTime}
                    onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fidèles réguliers</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.memberCount}
                    onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Vision</label>
                <textarea
                  rows={2}
                  placeholder="Orientation spirituelle de la cellule, enseignements actuels..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
                >
                  <CheckCircle className="w-4 h-4 text-[#C99B2E]" />
                  <span>Enregistrer la Cellule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
