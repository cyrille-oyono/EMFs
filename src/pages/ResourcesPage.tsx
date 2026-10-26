import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  X,
  Sparkles,
  Calendar,
  User,
  Tag,
  Share2,
  ExternalLink,
  Smartphone,
  Cloud,
  Globe,
  Upload,
  Heart,
  Flame,
  Shield,
  Layers,
  HelpCircle,
  Check,
  Lock,
  RotateCcw,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { ChurchResource, ResourceCategory } from '../types';
import { formatDateDouala } from '../utils/formatters';

interface ResourcesPageProps {
  onNavigate?: (page: string) => void;
}

// Google Drive helper
const extractDriveId = (url: string): string | null => {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const ResourcesPage: React.FC<ResourcesPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const [resources, setResources] = useState<ChurchResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'GROUPED'>('GRID');
  const [sortBy, setSortBy] = useState<'RECENT' | 'DOWNLOADS' | 'TITLE'>('RECENT');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingResource, setEditingResource] = useState<ChurchResource | null>(null);
  const [previewResource, setPreviewResource] = useState<ChurchResource | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState<{
    title: string;
    category: ResourceCategory;
    description: string;
    authorOrPreacher: string;
    documentUrl: string;
    fileName: string;
    fileFormat: 'PDF' | 'DOCX' | 'EPUB' | 'TXT';
    fileSizeMb: number;
    date: string;
    tagsInput: string;
    isFeatured: boolean;
    contentSnippet: string;
    sourceType: 'PHONE' | 'DRIVE' | 'WEB';
  }>({
    title: '',
    category: 'ENSEIGNEMENT',
    description: '',
    authorOrPreacher: 'Pasteur Samuel Ondoa',
    documentUrl: '',
    fileName: '',
    fileFormat: 'PDF',
    fileSizeMb: 1.5,
    date: new Date().toISOString().substring(0, 10),
    tagsInput: 'Foi, Prière, Sangmelima',
    isFeatured: false,
    contentSnippet: '',
    sourceType: 'PHONE',
  });

  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Category document counts
  const categoryCounts = useMemo(() => {
    return {
      ALL: resources.length,
      ENSEIGNEMENT: resources.filter((r) => r.category === 'ENSEIGNEMENT').length,
      PRIERE: resources.filter((r) => r.category === 'PRIERE').length,
      ETUDE_BIBLIQUE: resources.filter((r) => r.category === 'ETUDE_BIBLIQUE').length,
      CONFESSION_DE_FOI: resources.filter((r) => r.category === 'CONFESSION_DE_FOI').length,
      GUIDE_SPIRITUEL: resources.filter((r) => r.category === 'GUIDE_SPIRITUEL').length,
    };
  }, [resources]);

  // Format document counts
  const formatCounts = useMemo(() => {
    return {
      ALL: resources.length,
      PDF: resources.filter((r) => r.fileFormat === 'PDF').length,
      DOCX: resources.filter((r) => r.fileFormat === 'DOCX').length,
      EPUB: resources.filter((r) => r.fileFormat === 'EPUB').length,
      TXT: resources.filter((r) => r.fileFormat === 'TXT').length,
    };
  }, [resources]);

  // Filtered and sorted resources
  const filteredResources = useMemo(() => {
    const list = resources.filter((r) => {
      // Category filter
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }
      // Format filter
      if (selectedFormat !== 'ALL' && r.fileFormat !== selectedFormat) {
        return false;
      }
      // Tag filter
      if (selectedTag && !r.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchAuthor = r.authorOrPreacher.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchSnippet = r.contentSnippet?.toLowerCase().includes(q);
        const matchTags = r.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchAuthor && !matchDesc && !matchSnippet && !matchTags) {
          return false;
        }
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'DOWNLOADS') {
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      }
      if (sortBy === 'TITLE') {
        return a.title.localeCompare(b.title);
      }
      // RECENT (default)
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [resources, selectedCategory, selectedFormat, selectedTag, searchQuery, sortBy]);

  // Popular topic tags
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      r.tags?.forEach((t) => {
        const clean = t.trim();
        if (clean) counts[clean] = (counts[clean] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [resources]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = resources.length;
    const totalDownloads = resources.reduce((s, r) => s + (r.downloadCount || 0), 0);
    const teachings = resources.filter((r) => r.category === 'ENSEIGNEMENT').length;
    const prayers = resources.filter((r) => r.category === 'PRIERE').length;
    return { total, totalDownloads, teachings, prayers };
  }, [resources]);

  // Trigger Download
  const handleDownload = async (resource: ChurchResource, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      await apiClient.incrementResourceDownload(resource.id);
      setResources((prev) =>
        prev.map((r) => (r.id === resource.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r))
      );

      // Trigger download
      if (resource.documentUrl.startsWith('data:') || resource.documentUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = resource.documentUrl;
        link.download = resource.fileName || `${resource.title.replace(/\s+/g, '_')}.${resource.fileFormat.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (resource.documentUrl.includes('drive.google.com')) {
        // Direct Google Drive download link
        const fileId = extractDriveId(resource.documentUrl);
        if (fileId) {
          window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
        } else {
          window.open(resource.documentUrl, '_blank');
        }
      } else if (resource.contentSnippet) {
        // Generate formatted text document
        const fullDocText = `================================================================
${resource.title.toUpperCase()}
Église Missionnaire de la Foi — Paroisse d'Akon, Sangmelima
Auteur / Prédicateur : ${resource.authorOrPreacher}
Catégorie : ${resource.category}
Date : ${resource.date}
================================================================

DESCRIPTION :
${resource.description}

CONTENU DU DOCUMENT & POINTS DE PRIÈRE :
${resource.contentSnippet}

================================================================
Document officiel édité par l'Église Missionnaire de la Foi (EMF).
Portail : https://emf-sangmelima.org • Akon, Sangmelima (Cameroun)
================================================================`;

        const blob = new Blob([fullDocText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resource.fileName || `${resource.title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        window.open(resource.documentUrl, '_blank');
      }

      showToast(`✓ Téléchargement de "${resource.title}" lancé !`);
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du téléchargement.');
    }
  };

  // Open Form Modal for Create or Edit
  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      category: 'ENSEIGNEMENT',
      description: '',
      authorOrPreacher: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Pasteur Samuel Ondoa',
      documentUrl: '',
      fileName: '',
      fileFormat: 'PDF',
      fileSizeMb: 1.5,
      date: new Date().toISOString().substring(0, 10),
      tagsInput: 'Foi, Prière, Akon, Sangmelima',
      isFeatured: false,
      contentSnippet: '',
      sourceType: 'PHONE',
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (resource: ChurchResource, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      category: resource.category,
      description: resource.description,
      authorOrPreacher: resource.authorOrPreacher,
      documentUrl: resource.documentUrl,
      fileName: resource.fileName,
      fileFormat: resource.fileFormat,
      fileSizeMb: resource.fileSizeMb,
      date: resource.date,
      tagsInput: resource.tags.join(', '),
      isFeatured: !!resource.isFeatured,
      contentSnippet: resource.contentSnippet || '',
      sourceType: resource.sourceType || 'PHONE',
    });
    setShowFormModal(true);
  };

  // Delete Resource
  const handleDeleteResource = async (resource: ChurchResource, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Confirmez-vous la suppression définitive du document "${resource.title}" ?`)) {
      await apiClient.deleteResource(resource.id, currentUser || undefined);
      showToast('✓ Ressource supprimée avec succès.');
      loadResources();
    }
  };

  // Handle File Pick from Phone / Computer
  const handlePhoneFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    const sizeMb = Number((file.size / (1024 * 1024)).toFixed(2));
    const cleanFileName = file.name;

    // Detect format
    let detectedFormat: 'PDF' | 'DOCX' | 'EPUB' | 'TXT' = 'PDF';
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) detectedFormat = 'DOCX';
    else if (file.name.endsWith('.epub')) detectedFormat = 'EPUB';
    else if (file.name.endsWith('.txt')) detectedFormat = 'TXT';

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        documentUrl: dataUrl,
        fileName: cleanFileName,
        fileFormat: detectedFormat,
        fileSizeMb: sizeMb || 1.2,
        title: prev.title || cleanFileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      }));
      setUploadProgress(false);
      showToast(`✓ Fichier "${cleanFileName}" sélectionné (${sizeMb} Mo)`);
    };
    reader.onerror = () => {
      setUploadProgress(false);
      alert('Impossible de lire ce fichier depuis votre appareil.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Drive Link
  const handleDriveLinkChange = (driveUrl: string) => {
    const fileId = extractDriveId(driveUrl);
    setFormData((prev) => ({
      ...prev,
      documentUrl: driveUrl,
      fileName: prev.fileName || (fileId ? `Document_Drive_${fileId.substring(0, 6)}.pdf` : 'Document_Google_Drive.pdf'),
    }));
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Veuillez renseigner le titre du document.');
      return;
    }

    if (!formData.documentUrl.trim() && !formData.contentSnippet.trim()) {
      alert('Veuillez charger un fichier ou fournir le texte/lien du document.');
      return;
    }

    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingResource) {
        // Update
        await apiClient.updateResource(
          editingResource.id,
          {
            title: formData.title,
            category: formData.category,
            description: formData.description,
            authorOrPreacher: formData.authorOrPreacher,
            documentUrl: formData.documentUrl || editingResource.documentUrl,
            fileName: formData.fileName || editingResource.fileName,
            fileFormat: formData.fileFormat,
            fileSizeMb: formData.fileSizeMb,
            date: formData.date,
            tags,
            isFeatured: formData.isFeatured,
            contentSnippet: formData.contentSnippet,
            sourceType: formData.sourceType,
          },
          currentUser || undefined
        );
        showToast('✓ Ressource mise à jour avec succès.');
      } else {
        // Create
        await apiClient.createResource(
          {
            title: formData.title,
            category: formData.category,
            description: formData.description,
            authorOrPreacher: formData.authorOrPreacher,
            documentUrl: formData.documentUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136',
            fileName: formData.fileName || `${formData.title.replace(/\s+/g, '_')}.${formData.fileFormat.toLowerCase()}`,
            fileFormat: formData.fileFormat,
            fileSizeMb: formData.fileSizeMb || 1.5,
            date: formData.date,
            tags,
            isFeatured: formData.isFeatured,
            contentSnippet: formData.contentSnippet,
            sourceType: formData.sourceType,
          },
          currentUser || undefined
        );
        showToast('✓ Nouvelle ressource publiée et mise à disposition des fidèles !');
      }

      setShowFormModal(false);
      loadResources();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement de la ressource.");
    }
  };

  const getCategoryBadge = (cat: ResourceCategory) => {
    switch (cat) {
      case 'ENSEIGNEMENT':
        return {
          label: 'Enseignement Pastoral',
          icon: BookOpen,
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
          accent: 'text-blue-600',
        };
      case 'PRIERE':
        return {
          label: 'Guide de Prière & Jeûne',
          icon: Flame,
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
          accent: 'text-amber-600',
        };
      case 'ETUDE_BIBLIQUE':
        return {
          label: 'Étude Biblique',
          icon: Layers,
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
          accent: 'text-purple-600',
        };
      case 'CONFESSION_DE_FOI':
        return {
          label: 'Confession & Proclamation',
          icon: Sparkles,
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          accent: 'text-emerald-600',
        };
      case 'GUIDE_SPIRITUEL':
      default:
        return {
          label: 'Guide Spirituel',
          icon: Shield,
          bg: 'bg-rose-100 text-rose-900 border-rose-200',
          accent: 'text-rose-600',
        };
    }
  };

  const CATEGORIES_CONFIG = [
    {
      key: 'ALL',
      title: 'Toutes les catégories',
      subtitle: 'Tous les documents',
      icon: Layers,
      iconBg: 'bg-slate-100',
      iconColor: 'text-[#4A0E17]',
      activeCardBg: 'bg-gradient-to-br from-blue-50/70 to-slate-100/90',
      activeBorder: 'border-[#4A0E17]',
      ringColor: 'ring-[#4A0E17]/20',
      activeBadge: 'bg-[#4A0E17] text-white',
      activeTitleColor: 'text-[#4A0E17]',
    },
    {
      key: 'ENSEIGNEMENT',
      title: 'Enseignements',
      subtitle: 'Prédications & doctrines',
      icon: BookOpen,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      activeCardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50/70',
      activeBorder: 'border-blue-600',
      ringColor: 'ring-blue-600/20',
      activeBadge: 'bg-blue-700 text-white',
      activeTitleColor: 'text-blue-900',
    },
    {
      key: 'PRIERE',
      title: 'Prières & Jeûne',
      subtitle: 'Intercession & veillées',
      icon: Flame,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      activeCardBg: 'bg-gradient-to-br from-amber-50 to-orange-50/70',
      activeBorder: 'border-[#C99B2E]',
      ringColor: 'ring-[#C99B2E]/20',
      activeBadge: 'bg-[#C99B2E] text-[#4A0E17]',
      activeTitleColor: 'text-amber-900',
    },
    {
      key: 'ETUDE_BIBLIQUE',
      title: 'Études Bibliques',
      subtitle: 'Théologie & cours',
      icon: Layers,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-700',
      activeCardBg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50/70',
      activeBorder: 'border-purple-600',
      ringColor: 'ring-purple-600/20',
      activeBadge: 'bg-purple-700 text-white',
      activeTitleColor: 'text-purple-900',
    },
    {
      key: 'CONFESSION_DE_FOI',
      title: 'Confessions de Foi',
      subtitle: 'Proclamations de victoire',
      icon: Sparkles,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      activeCardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50/70',
      activeBorder: 'border-emerald-600',
      ringColor: 'ring-emerald-600/20',
      activeBadge: 'bg-emerald-700 text-white',
      activeTitleColor: 'text-emerald-900',
    },
    {
      key: 'GUIDE_SPIRITUEL',
      title: 'Guides Pratiques',
      subtitle: 'Discipulat & affermissement',
      icon: Shield,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-700',
      activeCardBg: 'bg-gradient-to-br from-rose-50 to-pink-50/70',
      activeBorder: 'border-rose-600',
      ringColor: 'ring-rose-600/20',
      activeBadge: 'bg-rose-700 text-white',
      activeTitleColor: 'text-rose-900',
    },
  ];

  // Grouped resources by category for structured organization
  const groupedResources = useMemo(() => {
    const categoryKeys: ResourceCategory[] = [
      'ENSEIGNEMENT',
      'PRIERE',
      'ETUDE_BIBLIQUE',
      'CONFESSION_DE_FOI',
      'GUIDE_SPIRITUEL',
    ];
    return categoryKeys
      .map((catKey) => {
        const config = CATEGORIES_CONFIG.find((c) => c.key === catKey);
        const docs = filteredResources.filter((r) => r.category === catKey);
        return {
          catKey,
          config,
          docs,
        };
      })
      .filter((group) => (selectedCategory === 'ALL' ? group.docs.length > 0 : group.catKey === selectedCategory));
  }, [filteredResources, selectedCategory, CATEGORIES_CONFIG]);

  const isFiltered =
    selectedCategory !== 'ALL' || selectedFormat !== 'ALL' || selectedTag !== null || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedFormat('ALL');
    setSelectedTag(null);
    setSearchQuery('');
  };

  // Reusable document card renderer for standard grid & grouped view
  const renderResourceCard = (res: ChurchResource) => {
    const badge = getCategoryBadge(res.category);
    const Icon = badge.icon;

    return (
      <div
        key={res.id}
        onClick={() => setPreviewResource(res)}
        className="bg-white rounded-3xl border border-slate-200 hover:border-[#6E1325]/40 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer"
      >
        <div className="p-5 space-y-3">
          {/* Category & Format Header */}
          <div className="flex items-center justify-between">
            <span
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCategory(res.category);
              }}
              title="Cliquer pour filtrer par cette catégorie"
              className={`inline-flex items-center space-x-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border transition hover:scale-105 cursor-pointer shadow-xs ${badge.bg}`}
            >
              <Icon className="w-3 h-3" />
              <span>{badge.label}</span>
            </span>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {res.fileFormat} • {res.fileSizeMb} Mo
            </span>
          </div>

          {/* Title & Author */}
          <div>
            <h3 className="text-sm font-black text-[#4A0E17] group-hover:text-[#6E1325] transition line-clamp-2 leading-snug">
              {res.title}
            </h3>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-semibold mt-1">
              <User className="w-3 h-3 text-[#C99B2E]" />
              <span>{res.authorOrPreacher}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
            {res.description}
          </p>

          {/* Tags */}
          {res.tags && res.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {res.tags.slice(0, 4).map((tag, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(tag);
                  }}
                  title={`Filtrer par #${tag}`}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    selectedTag?.toLowerCase() === tag.toLowerCase()
                      ? 'bg-[#C99B2E] text-[#4A0E17] font-black border-[#C99B2E]'
                      : 'bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-500 border-slate-200'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{res.downloadCount || 0} téléchargements</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Admin / Pastor Controls */}
            {isPastorOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={(e) => handleOpenEditModal(res, e)}
                  className="p-1.5 text-slate-400 hover:text-[#6E1325] hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                  title="Modifier cette ressource"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteResource(res, e)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                  title="Supprimer cette ressource"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={(e) => handleDownload(res, e)}
              className="px-3 py-1.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="Télécharger le document"
            >
              <Download className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Télécharger</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#C99B2E]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] text-xs font-bold uppercase tracking-wider border border-[#C99B2E]/40">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Centre de Ressources & Documents Chrétiens</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Enseignements, Guides de Prière & Études
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consultez et téléchargez gratuitement les prédications, manuels pastoraux, recueils de prière et confessions de foi de l'Église Missionnaire de la Foi de Sangmelima pour nourrir votre marche spirituelle.
            </p>
          </div>

          {/* Admin & Pastor Action Button */}
          {isPastorOrAdmin ? (
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-2xl shadow-xl transition flex items-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 fill-current" />
              <span>Ajouter une Ressource</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-xs bg-white/10 px-4 py-2.5 rounded-2xl border border-white/20 text-slate-200">
              <Download className="w-4 h-4 text-[#C99B2E]" />
              <span>Accès libre & téléchargement gratuit pour tous</span>
            </div>
          )}
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Documents Totaux
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-0.5">
              {stats.total}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Téléchargements
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono mt-0.5">
              {stats.totalDownloads}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Enseignements
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-200 font-mono mt-0.5">
              {stats.teachings}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Guides de Prière
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-200 font-mono mt-0.5">
              {stats.prayers}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SYSTÈME DE FILTRES PAR CATÉGORIES (Enseignements, Prières...) */}
      {/* ======================================================== */}
      <div className="space-y-4">
        {/* Horizontal Category Quick Tabs Bar with View Mode Toggle */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Scrollable Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES_CONFIG.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              const Icon = cat.icon;
              const count = categoryCounts[cat.key as keyof typeof categoryCounts] || 0;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#4A0E17] text-white shadow-md'
                      : 'text-slate-600 hover:text-[#4A0E17] hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C99B2E]' : 'text-slate-400'}`} />
                  <span>{cat.title}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Grid vs Grouped by Category */}
          <div className="flex items-center space-x-1 self-end md:self-auto shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'GRID' ? 'bg-white text-[#4A0E17] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Afficher tous les documents en grille standard"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grille globale</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('GROUPED')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'GROUPED' ? 'bg-[#6E1325] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Organiser en sections distinctes pour chaque catégorie (Enseignements, Prières, Études...)"
            >
              <Layers className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Vue groupée par catégorie</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-black text-[#4A0E17] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#C99B2E]" />
              <span>Explorer par Catégorie Thématique</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Sélectionnez une catégorie pour filtrer instantanément les documents, prédications et manuels spirituels.
            </p>
          </div>
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        {/* 6 Category Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES_CONFIG.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const Icon = cat.icon;
            const count = categoryCounts[cat.key as keyof typeof categoryCounts] || 0;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  isSelected
                    ? `${cat.activeCardBg} ${cat.activeBorder} shadow-md ring-2 ${cat.ringColor}`
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.iconBg}`}>
                      <Icon className={`w-4 h-4 ${cat.iconColor}`} />
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                        isSelected ? cat.activeBadge : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <h3
                    className={`text-xs font-black leading-tight ${
                      isSelected ? cat.activeTitleColor : 'text-[#4A0E17] group-hover:text-[#6E1325]'
                    }`}
                  >
                    {cat.title}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 leading-snug">
                  {cat.subtitle}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C99B2E] animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Search, Format Pills & Sorting Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, auteur, verset biblique, mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#6E1325] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Formats Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 hidden sm:inline">Format :</span>
            {(['ALL', 'PDF', 'DOCX', 'EPUB', 'TXT'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`px-2.5 py-1.5 rounded-xl transition text-[11px] cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-[#6E1325] text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {fmt === 'ALL' ? `Tous (${resources.length})` : `${fmt} (${formatCounts[fmt] || 0})`}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5 shrink-0 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#6E1325]"
            >
              <option value="RECENT">Plus récents</option>
              <option value="DOWNLOADS">Plus téléchargés</option>
              <option value="TITLE">Titre (A &rarr; Z)</option>
            </select>
          </div>
        </div>

        {/* Popular Topic / Tag Chips for Quick Filtering */}
        {popularTags.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] text-slate-400 font-bold shrink-0 flex items-center space-x-1">
              <Tag className="w-3 h-3 text-[#C99B2E]" />
              <span>Thèmes :</span>
            </span>
            <div className="flex items-center space-x-1.5 flex-nowrap">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 cursor-pointer ${
                    selectedTag?.toLowerCase() === tag.toLowerCase()
                      ? 'bg-[#C99B2E] text-[#4A0E17] font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-[10px] text-rose-600 hover:underline font-bold px-1.5 py-0.5 cursor-pointer shrink-0"
                >
                  Effacer le thème
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filter Status & Reset Banner */}
        {isFiltered && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">Filtres actifs :</span>
              {selectedCategory !== 'ALL' && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-bold border border-blue-200 flex items-center space-x-1">
                  <span>Catégorie : {CATEGORIES_CONFIG.find((c) => c.key === selectedCategory)?.title}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => setSelectedCategory('ALL')}
                  />
                </span>
              )}
              {selectedFormat !== 'ALL' && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold border border-emerald-200 flex items-center space-x-1">
                  <span>Format : {selectedFormat}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => setSelectedFormat('ALL')}
                  />
                </span>
              )}
              {selectedTag && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-bold border border-[#C99B2E]/40 flex items-center space-x-1">
                  <span>Thème : #{selectedTag}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => setSelectedTag(null)}
                  />
                </span>
              )}
              {searchQuery.trim() && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-300 flex items-center space-x-1">
                  <span>Recherche : "{searchQuery}"</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => setSearchQuery('')}
                  />
                </span>
              )}
              <span className="text-slate-500 font-bold">• {filteredResources.length} document(s) trouvé(s)</span>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-rose-600 font-bold text-xs underline cursor-pointer"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Chargement des ressources paroissiales de Sangmelima...
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {selectedCategory !== 'ALL'
                ? `Aucun document dans la catégorie « ${CATEGORIES_CONFIG.find((c) => c.key === selectedCategory)?.title} »`
                : 'Aucun document trouvé'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Modifiez vos critères de recherche ou réinitialisez les filtres pour afficher l'ensemble des documents disponibles.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Afficher toutes les ressources ({resources.length})</span>
            </button>
            {isPastorOrAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 fill-current" />
                <span>Publier un document</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'GROUPED' ? (
        /* VUE ORGANISÉE PAR CATÉGORIES (Enseignements, Prières, Études bibliques...) */
        <div className="space-y-10">
          {groupedResources.map(({ catKey, config, docs }) => {
            if (!config || docs.length === 0) return null;
            const Icon = config.icon;
            return (
              <section key={catKey} className="space-y-4">
                {/* Category Section Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${config.iconBg}`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base sm:text-lg font-black text-[#4A0E17]">
                          {config.title}
                        </h3>
                        <span className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full shadow-xs ${config.activeBadge}`}>
                          {docs.length} document{docs.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>

                  {selectedCategory === 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      className="text-xs font-bold text-[#6E1325] hover:text-[#4A0E17] hover:underline flex items-center space-x-1 cursor-pointer self-start sm:self-auto bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                    >
                      <span>Filtrer uniquement cette catégorie</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#C99B2E]" />
                    </button>
                  )}
                </div>

                {/* Cards for this Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {docs.map(renderResourceCard)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* VUE GRILLE GLOBALE STANDARD */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map(renderResourceCard)}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DOCUMENT PREVIEW & ONLINE READING                 */}
      {/* ======================================================== */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between border-b border-[#C99B2E]/30">
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-[#C99B2E]/20 text-[#C99B2E] flex items-center justify-center shrink-0 border border-[#C99B2E]/40">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-sm truncate">{previewResource.title}</h3>
                  <p className="text-[11px] text-amber-200 truncate">
                    {previewResource.authorOrPreacher} • {previewResource.fileFormat} ({previewResource.fileSizeMb} Mo)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Résumé & Contexte Pastoral
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {previewResource.description}
                </p>
                <div className="flex items-center space-x-4 pt-2 text-[11px] text-slate-500">
                  <span>Date : {previewResource.date}</span>
                  <span>•</span>
                  <span>{previewResource.downloadCount || 0} téléchargements</span>
                </div>
              </div>

              {/* Text / Prayer Points Snippet */}
              {previewResource.contentSnippet && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#4A0E17]">
                    <Sparkles className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Contenu & Points de Prière du Document</span>
                  </div>
                  <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/80 font-serif text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {previewResource.contentSnippet}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={() => handleDownload(previewResource)}
                className="px-5 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#C99B2E]" />
                <span>Télécharger le Document ({previewResource.fileFormat})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN & PASTEUR ADD / EDIT RESOURCE               */}
      {/* ======================================================== */}
      {showFormModal && isPastorOrAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between border-b border-[#C99B2E]/30">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#C99B2E]" />
                <h3 className="font-bold text-sm">
                  {editingResource ? 'Modifier la Ressource' : 'Ajouter un Enseignement ou une Prière'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la ressource *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manuel de Prière du Matin & Protection des Familles"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6E1325] text-xs font-semibold"
                />
              </div>

              {/* Category & Preacher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold outline-none focus:ring-2 focus:ring-[#6E1325]"
                  >
                    <option value="ENSEIGNEMENT">📖 Enseignement Pastoral</option>
                    <option value="PRIERE">🙏 Guide de Prière & Jeûne</option>
                    <option value="ETUDE_BIBLIQUE">📜 Étude Biblique</option>
                    <option value="CONFESSION_DE_FOI">✨ Confession de Foi</option>
                    <option value="GUIDE_SPIRITUEL">🕊️ Guide Spirituel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Auteur / Prédicateur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pasteur Samuel Ondoa"
                    value={formData.authorOrPreacher}
                    onChange={(e) => setFormData({ ...formData, authorOrPreacher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              {/* Source Mode Tabs (Phone upload / Google Drive / Web URL) */}
              <div className="space-y-2 pt-1">
                <label className="block font-bold text-slate-700">Source du document téléchargeable :</label>
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourceType: 'PHONE' })}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      formData.sourceType === 'PHONE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Depuis Téléphone / Appareil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourceType: 'DRIVE' })}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      formData.sourceType === 'DRIVE'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>Google Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sourceType: 'WEB' })}
                    className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                      formData.sourceType === 'WEB'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lien Web</span>
                  </button>
                </div>

                {/* Option 1: File from Phone */}
                {formData.sourceType === 'PHONE' && (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                    <Upload className="w-6 h-6 text-[#6E1325] mx-auto" />
                    <div>
                      <label className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center space-x-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>Sélectionner le document (PDF / Word / TXT)</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.epub,.txt,application/pdf,application/msword,text/plain"
                          onChange={handlePhoneFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.fileName && (
                      <p className="text-[11px] font-mono text-emerald-800 font-bold">
                        ✓ Fichier sélectionné : {formData.fileName} ({formData.fileSizeMb} Mo)
                      </p>
                    )}
                  </div>
                )}

                {/* Option 2: Google Drive link */}
                {formData.sourceType === 'DRIVE' && (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="Collez le lien de partage Google Drive (ex: https://drive.google.com/file/d/...)"
                      value={formData.documentUrl}
                      onChange={(e) => handleDriveLinkChange(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400">
                      Assurez-vous que le lien Google Drive est configuré sur "Tous les utilisateurs disposant du lien peuvent voir".
                    </p>
                  </div>
                )}

                {/* Option 3: Direct Web URL */}
                {formData.sourceType === 'WEB' && (
                  <input
                    type="url"
                    placeholder="URL directe du document (https://...)"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description courte du document *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explication claire du thème, du passage biblique ou de l'objectif spirituel..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              {/* Text content snippet / Prayer points for online reading */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Texte complet, points de prière ou versets d'onction (pour lecture en ligne) :
                </label>
                <textarea
                  rows={4}
                  placeholder="Points de prière numérotés, versets clés, plan de prédication..."
                  value={formData.contentSnippet}
                  onChange={(e) => setFormData({ ...formData, contentSnippet: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-serif leading-relaxed outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              {/* Format, Size & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format</label>
                  <select
                    value={formData.fileFormat}
                    onChange={(e) => setFormData({ ...formData, fileFormat: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX (Word)</option>
                    <option value="EPUB">EPUB</option>
                    <option value="TXT">TXT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Taille (Mo)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fileSizeMb}
                    onChange={(e) => setFormData({ ...formData, fileSizeMb: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mots-clés (séparés par virgules) :</label>
                <input
                  type="text"
                  placeholder="Ex: Foi, Victoire, Psaume 91, Prière matinale"
                  value={formData.tagsInput}
                  onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white font-bold rounded-xl shadow transition cursor-pointer"
                >
                  {editingResource ? 'Enregistrer les modifications' : 'Publier la ressource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
