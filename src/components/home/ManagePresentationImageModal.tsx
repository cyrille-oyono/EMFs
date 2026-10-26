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
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      const compressed = await compressImageFile(file, 1600, 1200, 0.85);
      setPreviewUrl(compressed.dataUrl);
      const sizeKb = Math.round(compressed.sizeMb * 1024);
      setFileDetails({
        name: file.name,
        size: `${sizeKb} Ko`,
      });
      showToast('Photo prête à être enregistrée !');
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
    setFileDetails({ name: 'Lien Web / Drive', size: 'Distant' });
    showToast('Lien appliqué.');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await apiClient.updatePresentationImage(previewUrl.trim(), currentUser || undefined);
      onImageUpdated(previewUrl.trim());
      showToast('✓ Photo enregistrée et publiée avec succès !');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#C99B2E]">
              <Church className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Photo de Présentation</h3>
              <p className="text-xs text-slate-300">Section « Qui Sommes-Nous ? » (Page d'accueil)</p>
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
              className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'upload'
                  ? 'bg-white text-[#4A0E17] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#C99B2E]" />
              <span>Depuis le Téléphone</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'url'
                  ? 'bg-white text-[#4A0E17] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-[#6E1325]" />
              <span>Lien URL / Drive</span>
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
                  className="p-4 rounded-2xl border-2 border-dashed border-[#C99B2E] bg-amber-50/40 hover:bg-amber-50 text-left transition flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#C99B2E] text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#4A0E17]">Prendre une Photo</span>
                    <span className="text-[11px] text-slate-500">Utiliser l'appareil photo du smartphone</span>
                  </div>
                </button>

                {/* Choose from Gallery */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-4 rounded-2xl border-2 border-dashed border-[#6E1325] bg-blue-50/40 hover:bg-blue-50 text-left transition flex flex-col justify-between group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#6E1325] text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#4A0E17]">Galerie du Téléphone</span>
                    <span className="text-[11px] text-slate-500">Sélectionner une photo existante</span>
                  </div>
                </button>
              </div>

              {isProcessing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#6E1325]" />
                  <span>Optimisation et compression de la photo en cours...</span>
                </div>
              )}
            </div>
          )}

          {/* Mode Direct URL */}
          {mode === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Lien web direct ou Google Drive de l'image :
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://... ou lien partagé Google Drive"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
                />
                <button
                  type="button"
                  onClick={handleApplyDirectUrl}
                  className="px-4 py-2 bg-[#6E1325] text-white text-xs font-bold rounded-xl hover:bg-[#4A0E17] transition cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}

          {/* Image Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Aperçu du Rendu sur la Page :</span>
              {fileDetails && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {fileDetails.name} • {fileDetails.size}
                </span>
              )}
            </div>

            <div className="w-full h-56 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden relative flex items-center justify-center">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Aperçu Présentation Église"
                    className="w-full h-full object-cover object-center block"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-1 rounded-lg">
                    Aperçu actif
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto stroke-1" />
                  <p className="text-xs font-semibold text-slate-500">
                    Aucune photo actuellement définie.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Prenez une photo de votre temple ou choisissez-la dans la galerie pour remplacer l'affichage.
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
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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
              className="px-5 py-2 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-black rounded-xl transition shadow flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistrer & Publier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
