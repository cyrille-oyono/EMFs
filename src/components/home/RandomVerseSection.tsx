import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Shuffle,
  Copy,
  Check,
  Share2,
  Sparkles,
  Cloud,
  Plus,
  RefreshCw,
  Quote,
  Flame,
  Heart,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getRandomVerseFromSupabase,
  getVersesFromSupabase,
  subscribeToVersesTable,
  isSupabaseConfigured,
  SupabaseVerse,
  FALLBACK_VERSES,
} from '../../services/supabase';
import { AddVerseModal } from './AddVerseModal';

// Brand Social Media SVGs
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.275-.1-.475-.15-.675.15-.2.3-.775.977-.95 1.176-.175.2-.35.225-.65.075-.301-.15-1.272-.469-2.424-1.496-.896-.799-1.501-1.786-1.676-2.086-.175-.3-.019-.462.131-.612.135-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.585-.492-.505-.675-.515-.175-.01-.375-.01-.575-.01s-.525.075-.8.375c-.275.3-1.05 1.026-1.05 2.501 0 1.475 1.075 2.9 1.225 3.1.15.2 2.115 3.23 5.124 4.53 3.01 1.3 3.01.867 3.56.812.55-.055 1.777-.726 2.027-1.427.25-.701.25-1.302.175-1.427-.075-.125-.275-.2-.575-.35z" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.398A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.156 8.156 0 01-4.32-1.233l-.31-.184-3.21.9 0.9-3.13-.2-.33A8.148 8.148 0 013.818 12c0-4.512 3.67-8.182 8.182-8.182 4.512 0 8.182 3.67 8.182 8.182 0 4.512-3.67 8.182-8.182 8.182z"
    />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TwitterXIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface RandomVerseSectionProps {
  onNavigateToForum?: () => void;
}

export const RandomVerseSection: React.FC<RandomVerseSectionProps> = () => {
  const { currentUser } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const [currentVerse, setCurrentVerse] = useState<SupabaseVerse>(FALLBACK_VERSES[0]);
  const [totalVersesCount, setTotalVersesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const loadRandomVerse = async (animate = false) => {
    if (animate) setIsDrawing(true);
    try {
      const [randomVerse, allVerses] = await Promise.all([
        getRandomVerseFromSupabase().catch(() => FALLBACK_VERSES[0]),
        getVersesFromSupabase().catch(() => FALLBACK_VERSES),
      ]);
      setCurrentVerse(randomVerse || FALLBACK_VERSES[0]);
      setTotalVersesCount(Array.isArray(allVerses) && allVerses.length > 0 ? allVerses.length : FALLBACK_VERSES.length);
    } catch (err) {
      console.warn('Erreur chargement verset aléatoire:', err);
      setCurrentVerse(FALLBACK_VERSES[0]);
      setTotalVersesCount(FALLBACK_VERSES.length);
    } finally {
      setIsLoading(false);
      if (animate) {
        setTimeout(() => setIsDrawing(false), 300);
      }
    }
  };

  useEffect(() => {
    loadRandomVerse();

    // Abonnement temps réel aux changements de la table 'verses' de Supabase
    const unsubscribe = subscribeToVersesTable(() => {
      loadRandomVerse();
      showNotification('Table Supabase "verses" mise à jour en direct !');
    });

    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  const activeVerse = currentVerse || FALLBACK_VERSES[0];

  const getFullShareText = () => {
    return (
      `📖 *Verset du Jour — Église Missionnaire de la Foi (Sangmelima)*\n\n` +
      `« ${activeVerse.text} »\n\n` +
      `— *${activeVerse.reference}* (${activeVerse.translation || 'Louis Segond 1910'})\n\n` +
      (activeVerse.meditation ? `_Méditation :_ ${activeVerse.meditation}\n\n` : '') +
      (activeVerse.prayer ? `_Prière :_ « ${activeVerse.prayer} »\n\n` : '') +
      `🌿 Que le Seigneur bénisse richement votre journée !`
    );
  };

  const handleCopyVerse = async () => {
    try {
      await navigator.clipboard.writeText(getFullShareText());
      setIsCopied(true);
      showNotification('✓ Verset complet copié dans le presse-papier !');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      showNotification('Impossible de copier automatiquement.');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getFullShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFacebook = () => {
    const quote = `« ${activeVerse.text} » — ${activeVerse.reference} (Église Missionnaire de la Foi Sangmelima)`;
    const url = typeof window !== 'undefined' ? window.location.href : 'https://emf-sangmelima.org';
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
    window.open(fbUrl, '_blank', 'width=620,height=520,noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const text = `« ${activeVerse.text} » — ${activeVerse.reference} #VersetDuJour #Bible #EMFSangmelima`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twUrl, '_blank', 'width=620,height=520,noopener,noreferrer');
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: `Verset du Jour — ${activeVerse.reference}`,
          text: getFullShareText(),
          url: window.location.href,
        });
      } catch (err) {
        // Annulation ou rejet
      }
    } else {
      handleCopyVerse();
    }
  };

  return (
    <section id="verset-du-jour" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{feedback}</span>
          <Sparkles className="w-4 h-4 text-[#C99B2E]" />
        </div>
      )}

      {/* Main Verse Spotlight Card */}
      <div className="bg-gradient-to-br from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white rounded-3xl p-6 sm:p-12 shadow-2xl border-2 border-[#C99B2E] relative overflow-hidden">
        {/* Ambient Decorative Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-[#C99B2E]/20 text-[#C99B2E] rounded-xl border border-[#C99B2E]/30">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#C99B2E]">
                  Verset du Jour • Nourriture Spirituelle
                </h3>
                <span className="text-[11px] text-rose-200">
                  Tiré de la table Supabase <code className="text-amber-300 font-mono">verses</code> ({totalVersesCount} versets)
                </span>
              </div>
            </div>

            {/* Supabase Status Pill */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full border border-white/15 text-[11px] self-start sm:self-auto">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-200">
                {activeVerse.isFromSupabase ? 'Connecté à Supabase' : 'Table Supabase verses'}
              </span>
              {activeVerse.theme && (
                <span className="text-[#C99B2E] font-bold border-l border-white/20 pl-2">
                  {activeVerse.theme}
                </span>
              )}
            </div>
          </div>

          {/* Quotation & Scripture Body */}
          <div className="relative text-center py-4 sm:py-6 px-2">
            <Quote className="w-10 h-10 text-[#C99B2E]/25 mx-auto mb-2 rotate-180" />

            <div
              className={`font-serif italic text-xl sm:text-3xl text-amber-100 font-medium max-w-3xl mx-auto leading-relaxed transition-opacity duration-300 ${
                isDrawing ? 'opacity-30 scale-98' : 'opacity-100 scale-100'
              }`}
            >
              « {activeVerse.text} »
            </div>

            <div className="mt-4 inline-flex items-center space-x-2 text-sm sm:text-base font-bold text-[#C99B2E] tracking-wider">
              <span>— {activeVerse.reference}</span>
              {activeVerse.translation && (
                <span className="text-xs text-rose-200 font-normal">
                  ({activeVerse.translation})
                </span>
              )}
            </div>
          </div>

          {/* Pastoral Meditation */}
          {activeVerse.meditation && (
            <div className="bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto text-xs text-rose-100 leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
                <Flame className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>Méditation Pastorale</span>
              </div>
              <p>{activeVerse.meditation}</p>
            </div>
          )}

          {/* Pastoral Prayer */}
          {activeVerse.prayer && (
            <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-400/20 max-w-2xl mx-auto text-xs italic text-amber-100/90 leading-relaxed text-center">
              <strong className="text-amber-300 not-italic mr-1.5">Prière :</strong>
              « {activeVerse.prayer} »
            </div>
          )}

          {/* Card Action Controls Bar */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            {/* Draw Another Random Verse Button */}
            <button
              onClick={() => loadRandomVerse(true)}
              disabled={isDrawing}
              className="px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              title="Tirer un nouveau verset aléatoire de la table Supabase"
            >
              <Shuffle className={`w-4 h-4 ${isDrawing ? 'animate-spin' : ''}`} />
              <span>Autre Verset Aléatoire</span>
            </button>

            {/* Admin Quick Add */}
            {isPastorOrAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-[#C99B2E] font-bold text-xs rounded-xl border border-[#C99B2E]/50 transition flex items-center space-x-1.5 cursor-pointer ml-auto"
                title="Ajouter un verset dans la table Supabase verses"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter (Supabase)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Social Sharing Bar Directly Under the Verse Component */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center sm:text-left w-full sm:w-auto">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-[#C99B2E] flex items-center justify-center shrink-0 shadow-xs">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#4A0E17] uppercase tracking-wider">
              Partager la Parole de Dieu
            </h4>
            <p className="text-[11px] text-slate-500">
              Transmettez ce verset à vos proches, contacts et réseaux en un clic
            </p>
          </div>
        </div>

        {/* Dedicated Social Action Buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          {/* WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer active:scale-95"
            title="Partager sur WhatsApp (Discussion ou Statut)"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Facebook Button */}
          <button
            onClick={handleShareFacebook}
            className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#0d65d9] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer active:scale-95"
            title="Partager sur Facebook"
          >
            <FacebookIcon className="w-4 h-4" />
            <span>Facebook</span>
          </button>

          {/* Twitter / X Button */}
          <button
            onClick={handleShareTwitter}
            className="px-4 py-2.5 bg-[#0f1419] hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer active:scale-95"
            title="Partager sur X (Twitter)"
          >
            <TwitterXIcon className="w-4 h-4" />
            <span>Twitter (X)</span>
          </button>

          {/* Native Smartphone Share (if available) */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Partager via Telegram, SMS, etc."
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-600" />
              <span>Plus d’options</span>
            </button>
          )}

          {/* Copy Formatted Verse Button */}
          <button
            onClick={handleCopyVerse}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            title="Copier le verset formaté pour vos réseaux"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Verse Modal */}
      <AddVerseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVerseAdded={(newV) => {
          setCurrentVerse(newV);
          setTotalVersesCount((prev) => prev + 1);
          showNotification('✓ Nouveau verset enregistré dans Supabase !');
        }}
      />
    </section>
  );
};
