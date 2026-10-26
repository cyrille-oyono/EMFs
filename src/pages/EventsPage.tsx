import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  X,
  Edit2,
  Trash2,
  Share2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Event, EventType, EventStatus } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const EventsPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'culte' as EventType,
    startDate: new Date().toISOString().substring(0, 16),
    endDate: new Date().toISOString().substring(0, 16),
    location: 'Grand Temple Akon, Sangmelima',
    description: '',
    bannerUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1200&q=80',
    maxParticipants: 100,
    status: 'PROGRAMMÉ' as EventStatus,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const list = await apiClient.getEvents();
    setEvents(list);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'culte',
      startDate: new Date().toISOString().substring(0, 16),
      endDate: new Date().toISOString().substring(0, 16),
      location: 'Grand Temple Akon, Sangmelima',
      description: '',
      bannerUrl: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1200&q=80',
      maxParticipants: 100,
      status: 'PROGRAMMÉ',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (evt: Event) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      type: evt.type,
      startDate: evt.startDate.substring(0, 16),
      endDate: evt.endDate.substring(0, 16),
      location: evt.location,
      description: evt.description,
      bannerUrl: evt.bannerUrl || '',
      maxParticipants: evt.maxParticipants || 100,
      status: evt.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingEvent) {
      await apiClient.updateEvent(editingEvent.id, formData, currentUser || undefined);
      showToast('Événement mis à jour.');
    } else {
      await apiClient.createEvent(formData, currentUser || undefined);
      showToast('Nouvel événement programmé.');
    }
    setShowModal(false);
    loadEvents();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Confirmer la suppression de "${title}" ?`)) {
      await apiClient.deleteEvent(id, currentUser || undefined);
      showToast('Événement supprimé.');
      loadEvents();
    }
  };

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
            <CalendarIcon className="w-4 h-4 text-[#6E1325]" />
            <span>Calendrier & Rassemblements • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Événements & Cultes Spéciaux</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Conventions, séminaires, veillées de prière, baptêmes et retraites
          </p>
        </div>

        {hasPermission('EVENT_CREATE') && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Créer un Événement</span>
          </button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="h-44 bg-slate-200 relative overflow-hidden">
                <img
                  src={evt.bannerUrl}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-[#4A0E17]/90 backdrop-blur-xs text-[#C99B2E] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  {evt.type}
                </span>
                <span className="absolute top-3 right-3 bg-emerald-600/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                  {evt.status}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <div className="text-[11px] text-[#C99B2E] font-bold mb-1 flex items-center space-x-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{formatDateDouala(evt.startDate)}</span>
                  </div>
                  <h3 className="text-base font-black text-[#4A0E17]">{evt.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3">{evt.description}</p>
                </div>

                <div className="text-xs text-slate-500 space-y-1 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Capacité : {evt.maxParticipants || 'Illimitée'} participants</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Région du Sud</span>
              <div className="flex items-center space-x-1">
                {hasPermission('EVENT_UPDATE') && (
                  <button
                    onClick={() => handleOpenEdit(evt)}
                    className="p-1.5 text-slate-500 hover:text-[#6E1325] rounded"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('EVENT_DELETE') && (
                  <button
                    onClick={() => handleDelete(evt.id, evt.title)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingEvent ? 'Modifier l’événement' : 'Programmer un nouvel événement'}
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
                <label className="block font-bold text-slate-700 mb-1">Titre de l’événement *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Grande Convention de Réveil..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="culte">Culte Spécial</option>
                    <option value="convention">Convention</option>
                    <option value="seminaire">Séminaire</option>
                    <option value="croisade">Croisade</option>
                    <option value="priere">Prière / Veillée</option>
                    <option value="bapteme">Baptême</option>
                    <option value="formation">Formation</option>
                    <option value="jeunesse">Jeunesse</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="PROGRAMMÉ">Programmé</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINÉ">Terminé</option>
                    <option value="ANNULÉ">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date et heure de début</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lieu à Sangmelima</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Thème, orateur, déroulé..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL de l’affiche (Bannière)</label>
                <input
                  type="text"
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
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
                  {editingEvent ? 'Sauvegarder' : 'Programmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
