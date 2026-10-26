import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Search,
  Download,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  CheckCircle,
  X,
  Trash2,
  Calendar,
  Sparkles,
  Smartphone,
  Camera,
  RefreshCw,
  Cloud,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { MediaItem, LatestServiceMedia } from '../types';
import { formatDateDouala } from '../utils/formatters';
import {
  compressImageFile,
  extractVideoMetadataAndThumbnail,
  readFileAsDataUrl,
} from '../utils/mediaUpload';
import { LatestServiceMediaSection } from '../components/media/LatestServiceMediaSection';

export const MediaPage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'dernier-culte' | 'archives'>('dernier-culte');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [latestServiceMedia, setLatestServiceMedia] = useState<LatestServiceMedia | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'predications' as any,
    url: '',
    fileSizeMb: 12.5,
    mimeType: 'audio/mpeg',
    description: '',
    preacherOrAuthor: 'Pasteur Samuel Ondoa',
    date: new Date().toISOString().substring(0, 10),
    category: 'Culte Dominical',
  });

  const [uploadSourceMode, setUploadSourceMode] = useState<'phone' | 'url'>('phone');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  const handlePhonePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingMsg('Compression et optimisation de la photo en cours...');
    try {
      const res = await compressImageFile(file);
      setFormData((prev) => ({
        ...prev,
        type: 'photos',
        url: res.dataUrl,
        fileSizeMb: res.sizeMb,
        mimeType: 'image/jpeg',
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      showToast(`✓ Photo chargée depuis le téléphone (${res.sizeMb} Mo)`);
    } catch (err) {
      showToast("Erreur lors du traitement de l'image");
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  const handlePhoneVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingMsg('Extraction des métadonnées de la vidéo...');
    try {
      const meta = await extractVideoMetadataAndThumbnail(file);
      setFormData((prev) => ({
        ...prev,
        type: 'videos',
        url: meta.videoUrl,
        fileSizeMb: meta.sizeMb,
        mimeType: file.type || 'video/mp4',
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        description: prev.description || `Enregistrement vidéo (${meta.durationText})`,
      }));
      showToast(`✓ Vidéo mobile chargée (${meta.sizeMb} Mo, ${meta.durationText})`);
    } catch (err) {
      showToast('Erreur lors du traitement du fichier vidéo');
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  const handlePhoneGenericUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingMsg('Chargement du fichier...');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
      const isAudio = file.type.startsWith('audio');
      setFormData((prev) => ({
        ...prev,
        type: isAudio ? 'predications' : 'documents',
        url: dataUrl,
        fileSizeMb: sizeMb,
        mimeType: file.type || 'application/octet-stream',
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      showToast(`✓ Fichier chargé (${sizeMb} Mo)`);
    } catch (err) {
      showToast('Erreur lors de la lecture du fichier');
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    const [list, lastMedia] = await Promise.all([
      apiClient.getMediaItems(),
      apiClient.getLatestServiceMedia(),
    ]);
    setMedia(list);
    setLatestServiceMedia(lastMedia);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    await apiClient.createMediaItem(formData, currentUser || undefined);
    setShowModal(false);
    showToast('Fichier multimédia indexé dans la médiathèque.');
    loadMedia();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Confirmer la suppression de "${title}" ?`)) {
      await apiClient.deleteMediaItem(id, currentUser || undefined);
      showToast('Média retiré.');
      loadMedia();
    }
  };

  const filtered = media.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      (m.preacherOrAuthor && m.preacherOrAuthor.toLowerCase().includes(search.toLowerCase()));

    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'predications':
      case 'audios':
        return <Music className="w-5 h-5 text-amber-500" />;
      case 'videos':
        return <Video className="w-5 h-5 text-red-500" />;
      case 'photos':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
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
            <Film className="w-4 h-4 text-[#6E1325]" />
            <span>Ressources Spirituelles • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Médiathèque de l'Église</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Photos et vidéos du dernier culte, prédications audio, enseignements et cantiques
          </p>
        </div>

        {activeTab === 'archives' && hasPermission('MEDIA_MANAGE') && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Ajouter une Ressource</span>
          </button>
        )}
      </div>

      {/* Main Section Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('dernier-culte')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'dernier-culte'
              ? 'bg-[#4A0E17] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#C99B2E]" />
          <span>Photos & Vidéos du Dernier Culte</span>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
        </button>

        <button
          onClick={() => setActiveTab('archives')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'archives'
              ? 'bg-[#4A0E17] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-[#C99B2E]" />
          <span>Archives Spirituelles & Prédications ({media.length})</span>
        </button>
      </div>

      {/* TAB 1: DERNIER CULTE */}
      {activeTab === 'dernier-culte' && latestServiceMedia && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm">
          <LatestServiceMediaSection
            data={latestServiceMedia}
            onRefresh={loadMedia}
            isStandalonePage={true}
          />
        </div>
      )}

      {/* TAB 2: ARCHIVES */}
      {activeTab === 'archives' && (
        <div className="space-y-6">
          {/* Filters and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une prédication, un document ou un thème..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['ALL', 'predications', 'documents', 'brochures', 'photos'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    filterType === t
                      ? 'bg-[#6E1325] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL' ? 'Tous' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#6E1325]">
                  {item.type}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#4A0E17] line-clamp-2">{item.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Auteur / Orateur :</span>
                  <span className="font-semibold text-slate-800">{item.preacherOrAuthor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date :</span>
                  <span>{formatDateDouala(item.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taille :</span>
                  <span>{item.fileSizeMb} Mo</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#6E1325] text-white hover:bg-[#4A0E17] transition text-xs font-bold rounded-lg flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Télécharger</span>
              </a>

              {hasPermission('MEDIA_MANAGE') && (
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
          </div>
        </div>
      )}

      {/* Modal Add Media */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Ajouter une Ressource Multimédia</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la ressource *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Prédication : La fidélité de Dieu..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type de Média</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="predications">Prédication Audio</option>
                    <option value="documents">Document PDF / Cours</option>
                    <option value="brochures">Brochure / Cantiques</option>
                    <option value="photos">Photo d'événement</option>
                    <option value="videos">Vidéo de Culte</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prédicateur / Auteur</label>
                  <input
                    type="text"
                    value={formData.preacherOrAuthor}
                    onChange={(e) => setFormData({ ...formData, preacherOrAuthor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              {/* Source Mode Selector: Téléphone vs URL externe */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Origine du fichier multimédia :
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('phone')}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                      uploadSourceMode === 'phone'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#C99B2E]" />
                    <span>Depuis mon Téléphone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('url')}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                      uploadSourceMode === 'url'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-[#6E1325]" />
                    <span>Lien Web / Drive</span>
                  </button>
                </div>

                {uploadSourceMode === 'phone' ? (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
                    <p className="font-bold text-xs text-[#4A0E17]">
                      Prendre ou sélectionner un média depuis votre appareil :
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <label className="p-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-1 text-[11px] font-bold shadow-xs">
                        <Camera className="w-4 h-4 text-[#C99B2E]" />
                        <span>Prendre Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handlePhonePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="p-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-1 text-[11px] font-black shadow-xs">
                        <ImageIcon className="w-4 h-4 text-[#4A0E17]" />
                        <span>Photo Galerie</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhonePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer flex flex-col items-center justify-center space-y-1 text-[11px] font-bold shadow-xs">
                        <Video className="w-4 h-4 text-white" />
                        <span>Vidéo Téléphone</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handlePhoneVideoUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="col-span-2 sm:col-span-3 p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl cursor-pointer flex items-center justify-center space-x-2 text-[11px] font-bold">
                        <Upload className="w-3.5 h-3.5 text-[#6E1325]" />
                        <span>Charger un Fichier Audio (MP3/WAV) ou Document (PDF)</span>
                        <input
                          type="file"
                          accept="audio/*,.pdf,.doc,.docx"
                          onChange={handlePhoneGenericUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {isProcessing && (
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center space-x-2 text-[11px] font-bold animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>{processingMsg}</span>
                      </div>
                    )}

                    {formData.url && !isProcessing && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Fichier prêt ({formData.fileSizeMb} Mo, {formData.mimeType})</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL de Téléchargement Direct *</label>
                    <input
                      type="url"
                      required
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Résumé du message ou contenu du document..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] shadow"
                >
                  Indexé dans la médiathèque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
