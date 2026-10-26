import React, { useState, useEffect } from 'react';
import {
  Church,
  MapPin,
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Building2,
  Compass,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { AssociatedChurch } from '../types';

export const AssociatedChurchesPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const isAdminOrPastor = hasRole(['ADMIN', 'PASTEUR']);

  const [churches, setChurches] = useState<AssociatedChurch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('TOUS');
  const [selectedStatus, setSelectedStatus] = useState('TOUS');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<AssociatedChurch | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    region: 'Sud',
    address: '',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    serviceSchedule: 'Culte : Dimanche 09h00 - 11h30',
    memberCount: 100,
    affiliationYear: 2022,
    imageUrl: '',
    notes: '',
    status: 'ACTIVE' as AssociatedChurch['status'],
  });

  useEffect(() => {
    loadChurches();
  }, []);

  const loadChurches = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAssociatedChurches();
      setChurches(data);
    } catch (err) {
      console.error('Failed to load associated churches:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingChurch(null);
    setFormData({
      name: '',
      city: 'Sangmelima',
      region: 'Sud',
      address: '',
      pastorName: '',
      pastorPhone: '',
      pastorEmail: '',
      serviceSchedule: 'Culte : Dimanche 09h00 - 11h30',
      memberCount: 80,
      affiliationYear: new Date().getFullYear(),
      imageUrl: '',
      notes: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (church: AssociatedChurch) => {
    setEditingChurch(church);
    setFormData({
      name: church.name,
      city: church.city,
      region: church.region,
      address: church.address,
      pastorName: church.pastorName,
      pastorPhone: church.pastorPhone || '',
      pastorEmail: church.pastorEmail || '',
      serviceSchedule: church.serviceSchedule || '',
      memberCount: church.memberCount || 0,
      affiliationYear: church.affiliationYear || new Date().getFullYear(),
      imageUrl: church.imageUrl || '',
      notes: church.notes || '',
      status: church.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim() || !formData.pastorName.trim()) {
      alert('Veuillez renseigner le nom de l’église, la ville et le pasteur responsable.');
      return;
    }

    try {
      if (editingChurch) {
        await apiClient.updateAssociatedChurch(editingChurch.id, formData, currentUser || undefined);
        showToast('Informations de l’église associées mises à jour.');
      } else {
        await apiClient.createAssociatedChurch(formData, currentUser || undefined);
        showToast('Nouvelle église associée ajoutée au réseau.');
      }
      setModalOpen(false);
      loadChurches();
    } catch (err) {
      console.error('Failed to save associated church:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Confirmer le retrait de l'église associée "${name}" du répertoire ?`)) return;
    try {
      await apiClient.deleteAssociatedChurch(id, currentUser || undefined);
      showToast('Église associée retirée.');
      loadChurches();
    } catch (err) {
      console.error('Failed to delete associated church:', err);
    }
  };

  // Filtered churches
  const filteredChurches = churches.filter((c) => {
    if (selectedRegion !== 'TOUS' && c.region !== selectedRegion) return false;
    if (selectedStatus !== 'TOUS' && c.status !== selectedStatus) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchCity = c.city.toLowerCase().includes(term);
      const matchPastor = c.pastorName.toLowerCase().includes(term);
      const matchAddr = c.address.toLowerCase().includes(term);
      return matchName || matchCity || matchPastor || matchAddr;
    }
    return true;
  });

  const regions = Array.from(new Set(churches.map((c) => c.region))).filter(Boolean);

  // Statistics
  const totalChurches = churches.length;
  const activeCount = churches.filter((c) => c.status === 'ACTIVE').length;
  const totalEstimatedMembers = churches.reduce((acc, c) => acc + (c.memberCount || 0), 0);
  const citiesCount = new Set(churches.map((c) => c.city)).size;

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
              <Compass className="w-3.5 h-3.5" />
              <span>Réseau & Communion Fraternelle • Églises Sœurs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Églises Associées
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed">
              Consultez les adresses, pasteurs responsables et horaires de culte de nos assemblées partenaires au Cameroun. Un réseau fraternel uni dans la même doctrine et vision missionnaire.
            </p>
          </div>

          {isAdminOrPastor && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-[#C99B2E] hover:bg-[#b58925] text-[#4A0E17] font-bold text-sm shadow-md transition cursor-pointer self-start md:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une Église</span>
            </button>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-slate-300 font-medium">Églises Associées</p>
            <p className="text-xl sm:text-2xl font-black text-white">{totalChurches}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-amber-200 font-medium">Assemblées Actives</p>
            <p className="text-xl sm:text-2xl font-black text-[#C99B2E]">{activeCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-emerald-200 font-medium">Villes Représentées</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">{citiesCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <p className="text-[11px] text-blue-200 font-medium">Fidèles Estimés</p>
            <p className="text-xl sm:text-2xl font-black text-blue-300">{totalEstimatedMembers.toLocaleString('fr-FR')}</p>
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
              placeholder="Rechercher par nom d'église, ville, pasteur ou adresse..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="TOUS">Toutes les régions</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  Région du {reg}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="ACTIVE">Active</option>
              <option value="EN_IMPLANTATION">En implantation</option>
              <option value="PARTENAIRE">Partenaire</option>
            </select>
          </div>
        </div>
      </div>

      {/* Churches Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Chargement des églises associées...</p>
        </div>
      ) : filteredChurches.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <Church className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">Aucune église associée trouvée</h3>
          <p className="text-xs text-slate-500">
            Ajustez votre recherche ou vos filtres pour voir d’autres églises du réseau.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChurches.map((church) => {
            const isImplantation = church.status === 'EN_IMPLANTATION';
            return (
              <div
                key={church.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Header with image or badge banner */}
                <div className="relative">
                  {church.imageUrl ? (
                    <div className="h-36 w-full overflow-hidden bg-slate-100">
                      <img
                        src={church.imageUrl}
                        alt={church.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-full bg-gradient-to-r from-[#6E1325] to-[#4A0E17] flex items-center px-5 justify-between">
                      <Church className="w-8 h-8 text-[#C99B2E]/60" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded">
                        {church.city}
                      </span>
                    </div>
                  )}

                  <div className="p-5 pb-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#6E1325] border border-blue-200">
                          {church.city} • {church.region}
                        </span>
                        <h3 className="text-base font-extrabold text-[#4A0E17] mt-1.5 leading-snug">
                          {church.name}
                        </h3>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isImplantation
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isImplantation ? 'Implantation' : 'Active'}
                      </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-start space-x-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">{church.address}</p>
                        <p className="text-[11px] text-slate-500">{church.city} ({church.region})</p>
                      </div>
                    </div>

                    {/* Pastor details */}
                    <div className="border border-[#6E1325]/15 rounded-xl p-3 bg-blue-50/40 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-[#6E1325] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Pasteur Responsable</p>
                          <p className="text-xs font-bold text-[#4A0E17]">{church.pastorName}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 pt-1 text-xs text-slate-600">
                        {church.pastorPhone && (
                          <a
                            href={`tel:${church.pastorPhone}`}
                            className="inline-flex items-center space-x-1 hover:text-[#6E1325] font-medium"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#C99B2E]" />
                            <span>{church.pastorPhone}</span>
                          </a>
                        )}
                        {church.pastorEmail && (
                          <a
                            href={`mailto:${church.pastorEmail}`}
                            className="inline-flex items-center space-x-1 hover:text-[#6E1325] font-medium"
                            title={church.pastorEmail}
                          >
                            <Mail className="w-3.5 h-3.5 text-[#6E1325]" />
                            <span className="truncate max-w-[130px]">{church.pastorEmail}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Schedules & Stats */}
                    {church.serviceSchedule && (
                      <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium truncate">{church.serviceSchedule}</span>
                      </div>
                    )}

                    {church.notes && (
                      <p className="text-xs text-slate-500 italic line-clamp-2 pt-1 border-t border-slate-100">
                        « {church.notes} »
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {church.memberCount ? `${church.memberCount} membres` : 'Assemblée soeur'} • Affiliée en {church.affiliationYear || 2022}
                  </span>

                  {isAdminOrPastor && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(church)}
                        className="p-1.5 text-slate-400 hover:text-[#6E1325] hover:bg-white rounded-lg transition"
                        title="Modifier l'église"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(church.id, church.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                        title="Retirer l'église"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Ajouter / Modifier une Église Associée */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Church className="w-5 h-5 text-[#6E1325]" />
                <h3 className="font-extrabold text-base text-[#4A0E17]">
                  {editingChurch ? 'Modifier l’Église Associée' : 'Ajouter une Église Associée'}
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom officiel de l’église *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : EMF Yaoundé — Temple Central Mokolo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Yaoundé, Ebolowa, Kribi..."
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Région *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="Sud">Sud</option>
                    <option value="Centre">Centre</option>
                    <option value="Littoral">Littoral</option>
                    <option value="Ouest">Ouest</option>
                    <option value="Est">Est</option>
                    <option value="Nord">Nord</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse & Quartier *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Quartier Mokolo, En face École Publique"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Pastor Info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-[#4A0E17]">Pasteur Responsable / Titulaire</p>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nom et Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Pasteur Jean-Paul Mbarga"
                    value={formData.pastorName}
                    onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="+237 6xx xx xx xx"
                      value={formData.pastorPhone}
                      onChange={(e) => setFormData({ ...formData, pastorPhone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email</label>
                    <input
                      type="email"
                      placeholder="pastor@emf-cameroun.org"
                      value={formData.pastorEmail}
                      onChange={(e) => setFormData({ ...formData, pastorEmail: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horaires Cultes</label>
                  <input
                    type="text"
                    placeholder="Dimanche 09h00"
                    value={formData.serviceSchedule}
                    onChange={(e) => setFormData({ ...formData, serviceSchedule: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Membres Estimés</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.memberCount}
                    onChange={(e) => setFormData({ ...formData, memberCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AssociatedChurch['status'] })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="EN_IMPLANTATION">En implantation</option>
                    <option value="PARTENAIRE">Partenaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes Fraternelles & Historique</label>
                <textarea
                  rows={2}
                  placeholder="Particularités de l'assemblée, conventions conjointes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  <span>Enregistrer l’Église</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
