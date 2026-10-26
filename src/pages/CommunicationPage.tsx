import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Mail,
  MessageSquare,
  Smartphone,
  AlertCircle,
  CheckCircle,
  X,
  Trash2,
  Send,
  Users,
  Globe,
  Share2,
  Copy,
  ExternalLink,
  Sparkles,
  BookOpen,
  Calendar,
  Eye,
  Check,
  Image as ImageIcon,
  Tag,
  Clock,
  Printer,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Announcement } from '../types';
import { formatDateDouala } from '../utils/formatters';
import { subscribeToDynamicPosts } from '../services/supabase';

export const CommunicationPage: React.FC = () => {
  const { currentUser, hasPermission, settings } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Form state for creating a free web publication
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Communiqué Officiel',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    isPublicWeb: true,
    targetAudience: 'TOUS' as any,
    publishDate: new Date().toISOString().substring(0, 10),
    authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Bureau Pastoral EMF',
  });

  const webAppUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}`
      : 'https://ais-pre-5uzhutrazsqyadbzfvkmmp-676095959196.europe-west1.run.app';

  useEffect(() => {
    loadAnnouncements();
    const unsub = subscribeToDynamicPosts(() => {
      loadAnnouncements();
    });
    return () => {
      unsub();
    };
  }, []);

  const loadAnnouncements = async () => {
    const list = await apiClient.getAnnouncements();
    setAnnouncements(list);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopyWebLink = () => {
    navigator.clipboard.writeText(webAppUrl);
    setCopiedLink(true);
    showToast('✓ Lien public officiel de l’église copié !');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = (title?: string) => {
    const shareText = title
      ? `*${title}* — Retrouvez cette publication gratuite sur le site officiel de l'Église Missionnaire de la Foi de Sangmelima :\n${webAppUrl}`
      : `Retrouvez toutes les publications, cultes et requêtes de prière de l'Église Missionnaire de la Foi de Sangmelima gratuitement sur notre site web officiel :\n${webAppUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Veuillez renseigner le titre et le contenu de la publication.');
      return;
    }

    await apiClient.createAnnouncement(
      {
        ...formData,
        status: 'PUBLIÉ',
        viewCount: 1,
        shareCount: 0,
      },
      currentUser || undefined
    );

    setShowModal(false);
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: 'Communiqué Officiel',
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      isPublicWeb: true,
      targetAudience: 'TOUS',
      publishDate: new Date().toISOString().substring(0, 10),
      authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Bureau Pastoral EMF',
    });
    showToast('✓ Publication gratuite mise en ligne sur le web avec succès.');
    loadAnnouncements();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Confirmer la suppression de la publication "${title}" ?`)) {
      await apiClient.deleteAnnouncement(id, currentUser || undefined);
      showToast('Publication supprimée.');
      loadAnnouncements();
    }
  };

  const categories = [
    'ALL',
    'Communiqué Officiel',
    'Mission & Évangélisation',
    'Formation Théologique',
    'Culte & Veillée',
    'Exhortation Pastorale',
    'Action Sociale',
  ];

  const filteredAnnouncements = announcements.filter((a) => {
    if (categoryFilter === 'ALL') return true;
    return a.category === categoryFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Hero Header with Free Web Publishing Callout */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] text-xs font-bold uppercase tracking-wider border border-[#C99B2E]/30">
              <Globe className="w-3.5 h-3.5" />
              <span>Diffusion & Publications Officielles sur le Web</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Publications Gratuites sur le Web
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Publiez librement et gratuitement les communiqués, exhortations, actualités et avis pastoraux de l'Église Missionnaire de la Foi de Sangmelima visibles par le monde entier.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasPermission('COMMUNICATION_MANAGE') && (
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 fill-current" />
                <span>Créer une Publication Gratuite</span>
              </button>
            )}

            <button
              onClick={() => handleShareWhatsApp()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Diffuser sur WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Free Web Public Access Bar */}
        <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white/5 p-4 rounded-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <span className="font-bold text-white block">
                Adresse Web Publique & Gratuite de l'Église :
              </span>
              <span className="font-mono text-slate-300 text-[11px] truncate max-w-md block">
                {webAppUrl}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyWebLink}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition flex items-center space-x-1.5 border border-white/10"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C99B2E]" />}
              <span>{copiedLink ? 'Lien copié !' : 'Copier le lien web'}</span>
            </button>

            <a
              href={`${webAppUrl}/#`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#C99B2E] text-[#4A0E17] rounded-xl font-bold transition flex items-center space-x-1.5 hover:bg-amber-400"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ouvrir le Site Public</span>
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                categoryFilter === cat
                  ? 'bg-[#6E1325] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'Toutes les publications' : cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          <strong>{filteredAnnouncements.length}</strong> publication(s) en ligne
        </div>
      </div>

      {/* Publication Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
          >
            <div>
              {/* Publication Banner Image */}
              {item.imageUrl ? (
                <div
                  onClick={() => setSelectedAnnouncement(item)}
                  className="h-44 w-full bg-slate-900 relative cursor-pointer overflow-hidden"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-[#4A0E17]/90 backdrop-blur-xs text-[#C99B2E] text-[10px] font-bold">
                      {item.category || 'Communiqué'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      Web Gratuit
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 pb-0 flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#6E1325] text-[10px] font-bold">
                    {item.category || 'Communiqué'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Web Gratuit
                  </span>
                </div>
              )}

              {/* Text content */}
              <div className="p-5 space-y-2">
                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateDouala(item.publishDate)}</span>
                  <span>•</span>
                  <span>{item.authorName || 'Direction'}</span>
                </div>

                <h3
                  onClick={() => setSelectedAnnouncement(item)}
                  className="text-base font-black text-[#4A0E17] hover:text-[#6E1325] cursor-pointer line-clamp-2 leading-snug"
                >
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.summary || item.content}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedAnnouncement(item)}
                className="text-[#6E1325] font-bold hover:underline flex items-center space-x-1"
              >
                <span>Lire la suite</span>
                <BookOpen className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleShareWhatsApp(item.title)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                  title="Partager sur WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {hasPermission('COMMUNICATION_MANAGE') && (
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Supprimer la publication"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* MODAL: READ FULL PUBLICATION                             */}
      {/* ======================================================== */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Image Header */}
            {selectedAnnouncement.imageUrl && (
              <div className="h-64 w-full bg-slate-900 relative">
                <img
                  src={selectedAnnouncement.imageUrl}
                  alt={selectedAnnouncement.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                  <span className="px-3 py-1 rounded-full bg-[#C99B2E] text-[#4A0E17] font-black text-xs uppercase">
                    {selectedAnnouncement.category || 'Publication Web'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-6 md:p-8 space-y-4">
              {!selectedAnnouncement.imageUrl && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="px-3 py-1 rounded-full bg-[#6E1325] text-white font-bold text-xs uppercase">
                    {selectedAnnouncement.category || 'Publication Web'}
                  </span>
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#4A0E17] leading-snug">
                  {selectedAnnouncement.title}
                </h2>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-2">
                  <span>Publié le {formatDateDouala(selectedAnnouncement.publishDate)}</span>
                  <span>•</span>
                  <span>Par <strong>{selectedAnnouncement.authorName || 'Direction EMF'}</strong></span>
                </div>
              </div>

              {selectedAnnouncement.summary && (
                <div className="p-4 bg-amber-50/70 border-l-4 border-[#C99B2E] rounded-r-xl text-xs font-semibold text-slate-700 italic">
                  {selectedAnnouncement.summary}
                </div>
              )}

              <div className="text-xs md:text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line pt-2">
                {selectedAnnouncement.content}
              </div>

              {/* Share & Print Bar */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 font-medium">
                  Publication web publique officielle de l'EMF Sangmelima
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Imprimer</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(selectedAnnouncement.title)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager sur WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE FREE WEB PUBLICATION                       */}
      {/* ======================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-[#C99B2E]" />
                <h3 className="font-bold text-sm">Créer une Publication Gratuite sur le Web</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePublication} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la Publication *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Communiqué : Célébration Spéciale et Sortie d'Évangélisation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="Communiqué Officiel">Communiqué Officiel</option>
                    <option value="Mission & Évangélisation">Mission & Évangélisation</option>
                    <option value="Formation Théologique">Formation Théologique</option>
                    <option value="Culte & Veillée">Culte & Veillée</option>
                    <option value="Exhortation Pastorale">Exhortation Pastorale</option>
                    <option value="Action Sociale">Action Sociale</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de publication</label>
                  <input
                    type="date"
                    required
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Image de Couverture / Bannière Web (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={formData.imageUrl}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as any).style.display = 'none')}
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chapeau / Bref résumé d'introduction
                </label>
                <input
                  type="text"
                  placeholder="Une ou deux phrases pour résumer l'annonce sur le site web..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Texte Intégral de la Publication *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Rédigez le corps de votre message, les passages bibliques, les informations pratiques pour les fidèles..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Auteur / Signataire</label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center space-x-2 text-emerald-900 text-xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Publication Gratuite :</strong> Cette annonce sera immédiatement visible sur le site web public et accessible à tous les visiteurs sans abonnement.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] hover:from-[#6E1325] hover:to-[#4A0E17] text-white font-bold rounded-xl shadow transition flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#C99B2E]" />
                  <span>Publier Gratuitement en Ligne</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
