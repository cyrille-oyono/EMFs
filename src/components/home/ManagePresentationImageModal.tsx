import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Smartphone,
  UploadCloud,
  Trash2,
  Check,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Image as ImageIcon,
  Church,
  Maximize2,
  ZoomIn,
  Sliders,
} from 'lucide-react';
import { compressImageFile } from '../../utils/mediaUpload';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

interface ManagePresentationImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl?: string;
  onImageUpdated: (newUrl: string) => void;
}

export const ManagePresentationImageModal: React.FC<ManagePresentationImageModalProps> = ({
  isOpen,
  onClose,
  currentImageUrl = '',
  onImageUpdated,
}) => {
  const { currentUser } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const [directUrl, setDirectUrl] = useState<string>('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    dimensions?: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewFit, setPreviewFit] = useState<'cover' | 'contain'>('cover');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide.');
      return;
    }
    try {
      setIsProcessing(true);
      // Dimensions augmentées à 2560x1920 (Haute Définition / 2K) pour un affichage éclatant en grand format
      const compressed = await compressImageFile(file, 2560, 1920, 0.88);
      setPreviewUrl(compressed.dataUrl);
      const sizeKb = Math.round(compressed.sizeMb * 1024);
      setFileDetails({
        name: file.name,
        size: sizeKb > 1024 ? `${compressed.sizeMb.toFixed(1)} Mo` : `${sizeKb} Ko`,
        dimensions: `${compressed.width} × ${compressed.height} px (HD)`,
      });
      showToast('✓ Photo haute résolution prête à être enregistrée !');
    } catch (err) {
      console.error('Erreur compression image:', err);
      showToast('Impossible de traiter la photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
    e.target.value = '';
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
    e.target.value = '';
  };

  const handleApplyDirectUrl = () => {
    if (!directUrl.trim()) {
      showToast('Veuillez entrer une adresse URL valide.');
      return;
    }
    setPreviewUrl(directUrl.trim());
    setFileDetails({ name: 'Lien Web / Drive', size: 'Distant', dimensions: 'Format d’origine' });
    showToast('Lien appliqué.');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.updatePresentationImage(previewUrl.trim(), currentUser || undefined);
      onImageUpdated(previewUrl.trim());
      showToast('✓ Grande photo enregistrée et publiée avec succès !');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Erreur enregistrement image présentation:', err);
      showToast('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsSaving(true);
      await apiClient.updatePresentationImage('', currentUser || undefined);
      setPreviewUrl('');
      setFileDetails(null);
      onImageUpdated('');
      showToast('Photo retirée.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Erreur retrait image:', err);
      showToast('Erreur lors du retrait de la photo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white flex items-center justify-between border-b border-[#C99B2E]/30">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-[#C99B2E] shadow-sm">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight">Photo de Présentation de l'Église</h3>
                <span className="text-[10px] uppercase font-black tracking-wider bg-[#C99B2E] text-[#4A0E17] px-2 py-0.5 rounded-md">
                  Grand Format HD
                </span>
              </div>
              <p className="text-xs text-slate-300">Section « Qui Sommes-Nous ? » (Page d'accueil publique)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-between animate-in fade-in">
              <span>{toastMessage}</span>
              <Sparkles className="w-4 h-4 text-[#C99B2E]" />
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGalleryChange}
          />

          {/* Action Choice Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'upload'
                  ? 'bg-white text-[#4A0E17] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#C99B2E]" />
              <span>Depuis Téléphone / Ordinateur</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`py-2.5 text-xs font-black rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'url'
                  ? 'bg-white text-[#4A0E17] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-[#6E1325]" />
              <span>Lien URL / Google Drive</span>
            </button>
          </div>

          {/* Mode Upload Mobile */}
          {mode === 'upload' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Take Photo */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-4 rounded-2xl border-2 border-dashed border-[#C99B2E] bg-amber-50/50 hover:bg-amber-50 text-left transition flex items-center space-x-4 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#C99B2E] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#4A0E17]">Prendre une Photo (Appareil)</span>
                    <span className="text-[11px] text-slate-500">Prise de vue directe du temple en grand angle</span>
                  </div>
                </button>

                {/* Choose from Gallery */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-4 rounded-2xl border-2 border-dashed border-[#6E1325] bg-rose-50/40 hover:bg-rose-50 text-left transition flex items-center space-x-4 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#6E1325] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6 text-[#C99B2E]" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#4A0E17]">Galerie / Fichiers</span>
                    <span className="text-[11px] text-slate-500">Choisir une photo haute résolution existante</span>
                  </div>
                </button>
              </div>

              {isProcessing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center space-x-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#6E1325]" />
                  <span>Optimisation haute résolution et agrandissement de l'image en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* Mode Direct URL */}
          {mode === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Lien web direct ou lien partagé Google Drive de l'image haute définition :
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://images.example.com/eglise-grand-temple.jpg"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
                <button
                  type="button"
                  onClick={handleApplyDirectUrl}
                  className="px-5 py-2 bg-[#6E1325] text-white text-xs font-bold rounded-xl hover:bg-[#4A0E17] transition cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}

          {/* Image Preview Box with Enlarged Dimensions */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-black text-[#4A0E17]">Aperçu Grand Format du Rendu :</span>
                {fileDetails?.dimensions && (
                  <span className="text-[10px] font-black text-[#C99B2E] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {fileDetails.dimensions}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {fileDetails && (
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {fileDetails.name} • {fileDetails.size}
                  </span>
                )}
                {previewUrl && (
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewFit('cover')}
                      className={`px-2 py-0.5 rounded ${
                        previewFit === 'cover' ? 'bg-[#4A0E17] text-white' : 'text-slate-600'
                      }`}
                    >
                      Remplissage plein
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFit('contain')}
                      className={`px-2 py-0.5 rounded ${
                        previewFit === 'contain' ? 'bg-[#4A0E17] text-white' : 'text-slate-600'
                      }`}
                    >
                      Image entière
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Enormous, generous preview container (up to 440px height) */}
            <div className="w-full h-72 sm:h-96 md:h-[440px] rounded-3xl border-2 border-slate-200 bg-slate-950 overflow-hidden relative flex items-center justify-center shadow-inner group">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Aperçu Présentation Église"
                    className={`w-full h-full ${
                      previewFit === 'cover' ? 'object-cover' : 'object-contain'
                    } object-center block transition-transform duration-300`}
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-[#C99B2E] text-[11px] font-black px-3 py-1 rounded-xl border border-[#C99B2E]/40 flex items-center space-x-1.5 shadow-md">
                    <Church className="w-3.5 h-3.5" />
                    <span>Vue Accueil Grand Format (580px)</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-xl border border-white/20">
                    Haute Résolution Active
                  </div>
                </>
              ) : (
                <div className="text-center p-8 space-y-3 text-slate-400 max-w-md">
                  <div className="w-16 h-16 rounded-3xl bg-white/10 text-[#C99B2E] border border-white/10 flex items-center justify-center mx-auto shadow-md">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    Aucune photo personnalisée actuellement définie
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Prenez une photo de la façade ou de l'intérieur du Grand Temple d’Akon, ou choisissez une image depuis votre galerie pour sublimer l'accueil en grand format.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {previewUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isSaving}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Retirer la Photo</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isProcessing}
              className="px-6 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-black rounded-xl transition shadow-lg flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistrer & Publier en Grand Format</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

