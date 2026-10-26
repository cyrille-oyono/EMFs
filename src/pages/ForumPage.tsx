import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Pin,
  Lock,
  Flag,
  ArrowLeft,
  Send,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { ForumCategory, ForumTopic, ForumPost } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const ForumPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadCategoriesAndTopics();
  }, []);

  const loadCategoriesAndTopics = async () => {
    const [cats, tops] = await Promise.all([
      apiClient.getForumCategories(),
      apiClient.getForumTopics(),
    ]);
    setCategories(cats);
    setTopics(tops);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectTopic = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    const pList = await apiClient.getForumPosts(topic.id);
    setPosts(pList);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newTopicTitle || !newTopicContent || !currentUser) return;

    const res = await apiClient.createForumTopic(
      selectedCategory.id,
      newTopicTitle,
      newTopicContent,
      currentUser
    );

    setShowNewTopicModal(false);
    setNewTopicTitle('');
    setNewTopicContent('');
    showToast('Nouveau sujet de discussion créé !');

    const updatedTopics = await apiClient.getForumTopics(selectedCategory.id);
    setTopics(updatedTopics);
    handleSelectTopic(res.topic);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !replyContent.trim() || !currentUser) return;

    await apiClient.createForumPost(selectedTopic.id, replyContent.trim(), currentUser);
    setReplyContent('');
    showToast('Votre réponse a été publiée.');

    const pList = await apiClient.getForumPosts(selectedTopic.id);
    setPosts(pList);
  };

  const handleReportPost = async (postId: string) => {
    if (!currentUser || !reportReason) return;
    await apiClient.reportForumPost(postId, reportReason, currentUser);
    setReportingPostId(null);
    setReportReason('');
    showToast('Signalement transmis à la modération pastorale.');
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
            <MessageSquare className="w-4 h-4 text-[#6E1325]" />
            <span>Échanges & Édification Fraternelle • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Forum Chrétien</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Partage biblique, questions doctrinales, prières et vie de l'église
          </p>
        </div>

        {selectedCategory && !selectedTopic && (
          <button
            onClick={() => setShowNewTopicModal(true)}
            className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Nouveau Sujet</span>
          </button>
        )}
      </div>

      {/* View 1: Topic Discussion Thread */}
      {selectedTopic ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <button
            onClick={() => setSelectedTopic(null)}
            className="text-xs text-[#6E1325] hover:underline flex items-center space-x-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des sujets</span>
          </button>

          <div className="pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2 mb-1">
              {selectedTopic.isPinned && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                  <Pin className="w-3 h-3" />
                  <span>Épinglé</span>
                </span>
              )}
              <span className="text-xs text-slate-400">
                Créé le {formatDateDouala(selectedTopic.createdAt, true)}
              </span>
            </div>
            <h2 className="text-xl font-black text-[#4A0E17]">{selectedTopic.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Initié par <strong className="text-slate-800">{selectedTopic.authorName}</strong> ({selectedTopic.authorRole}) • {selectedTopic.viewCount} vues
            </p>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {posts.map((post, idx) => (
              <div
                key={post.id}
                className={`p-5 rounded-2xl border transition ${
                  idx === 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-[#6E1325] text-white flex items-center justify-center font-bold text-[10px]">
                      {post.authorName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{post.authorName}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({post.authorRole})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">
                      {formatDateDouala(post.createdAt, true)}
                    </span>
                    <button
                      onClick={() => setReportingPostId(post.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded"
                      title="Signaler un contenu abusif"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {post.content}
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700">Votre contribution fraternelle :</label>
            <textarea
              rows={3}
              required
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Écrivez votre réponse ici dans le respect et l'amour chrétien..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publier ma réponse</span>
              </button>
            </div>
          </form>
        </div>
      ) : selectedCategory ? (
        /* View 2: Topics in selected Category */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-[#6E1325] hover:underline flex items-center space-x-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Toutes les catégories</span>
          </button>

          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-lg font-black text-[#4A0E17]">{selectedCategory.title}</h2>
            <p className="text-xs text-slate-500">{selectedCategory.description}</p>
          </div>

          <div className="space-y-2">
            {topics
              .filter((t) => t.categoryId === selectedCategory.id)
              .map((top) => (
                <div
                  key={top.id}
                  onClick={() => handleSelectTopic(top)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#6E1325] hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {top.isPinned && <Pin className="w-3.5 h-3.5 text-amber-600" />}
                      <h4 className="text-sm font-bold text-slate-900">{top.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Par {top.authorName} ({top.authorRole}) • Dernier échange : {formatDateDouala(top.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>{top.replyCount || 0} rép.</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{top.viewCount}</span>
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* View 3: Categories Overview */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => {
            const count = topics.filter((t) => t.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#6E1325] transition cursor-pointer flex items-start space-x-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#6E1325] flex items-center justify-center font-bold flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-[#4A0E17]">{cat.title}</h3>
                    <span className="text-xs font-bold text-[#C99B2E] bg-amber-50 px-2 py-0.5 rounded">
                      {count} sujet(s)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{cat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal New Topic */}
      {showNewTopicModal && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Nouveau Sujet dans « {selectedCategory.title} »
              </h3>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la discussion *</label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Ex: Conseils pour la lecture quotidienne de la Bible..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Premier message explicatif *</label>
                <textarea
                  rows={5}
                  required
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Développez votre question, réflexion ou sujet de prière..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] shadow"
                >
                  Lancer la discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-red-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Signaler ce message aux pasteurs</h3>
              <button onClick={() => setReportingPostId(null)} className="p-1 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Pourquoi souhaitez-vous signaler cette publication ?
              </p>
              <textarea
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex: Propos déplacés, prosélytisme sectaire, non respect des règles chrétiennes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setReportingPostId(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReportPost(reportingPostId)}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
                >
                  Envoyer le signalement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
