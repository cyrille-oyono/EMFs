import React, { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Users,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Family, Member } from '../types';

export const FamiliesPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<Family | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: 'Quartier Akon, Sangmelima',
    phone: '+237 6',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [f, m] = await Promise.all([apiClient.getFamilies(), apiClient.getMembers()]);
    setFamilies(f);
    setMembers(m);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingFamily(null);
    setFormData({
      name: '',
      address: 'Quartier Akon, Sangmelima',
      phone: '+237 6',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (f: Family) => {
    setEditingFamily(f);
    setFormData({
      name: f.name,
      address: f.address,
      phone: f.phone,
      notes: f.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingFamily) {
      await apiClient.updateFamily(editingFamily.id, formData, currentUser || undefined);
      showToast('Famille mise à jour avec succès.');
    } else {
      await apiClient.createFamily(formData, currentUser || undefined);
      showToast('Nouvelle famille enregistrée.');
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la "${name}" ? Les membres associés seront détachés.`)) {
      await apiClient.deleteFamily(id, currentUser || undefined);
      showToast('Famille supprimée avec succès.');
      loadData();
    }
  };

  const filteredFamilies = families.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.address.toLowerCase().includes(search.toLowerCase()) ||
      f.phone.includes(search)
  );

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
            <Home className="w-4 h-4 text-[#6E1325]" />
            <span>Foyers Chrétiens de Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Gestion des Familles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {families.length} foyer(s) répertorié(s) dans la communauté
          </p>
        </div>

        {hasPermission('FAMILY_CREATE') && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Créer une Famille</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une famille par nom, quartier ou téléphone..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
          />
        </div>
      </div>

      {/* Families Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFamilies.map((fam) => {
          const associatedMembers = members.filter((m) => m.familyId === fam.id);
          return (
            <div
              key={fam.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C99B2E] flex items-center justify-center font-bold">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#4A0E17]">{fam.name}</h3>
                      <span className="text-[11px] text-slate-400">
                        {associatedMembers.length} membre(s) rattaché(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {hasPermission('FAMILY_UPDATE') && (
                      <button
                        onClick={() => handleOpenEdit(fam)}
                        className="p-1 text-slate-400 hover:text-[#6E1325] rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {hasPermission('FAMILY_DELETE') && (
                      <button
                        onClick={() => handleDelete(fam.id, fam.name)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fam.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fam.phone}</span>
                  </div>
                  {fam.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                      « {fam.notes} »
                    </p>
                  )}
                </div>

                {/* Associated Members preview */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
                    Membres du foyer :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {associatedMembers.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Aucun membre rattaché</span>
                    ) : (
                      associatedMembers.map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-[#6E1325] font-medium border border-blue-100"
                        >
                          {m.firstName} {m.lastName}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingFamily ? 'Modifier la famille' : 'Enregistrer une nouvelle famille'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de la famille *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  placeholder="Ex: Famille Ondoa"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse à Sangmelima</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  placeholder="Ex: Quartier Akon, Sangmelima"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone de contact</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  placeholder="+237 6..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Observations</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  placeholder="Notes sur la famille..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] transition shadow"
                >
                  {editingFamily ? 'Sauvegarder' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
