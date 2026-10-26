import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Heart,
  Share2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { DailyBibleVerse } from '../../types';
import { apiClient } from '../../services/apiClient';
import { formatDateDouala } from '../../utils/formatters';

interface DevotionalsProps {
  initialVerse?: DailyBibleVerse;
  onNavigate?: (page: string) => void;
  className?: string;
}

export const Devotionals: React.FC<DevotionalsProps> = ({
  initialVerse,
  onNavigate,
  className = '',
}) => {
  const [verse, setVerse] = useState<DailyBibleVerse | undefined>(initialVerse);
  const [allVerses, setAllVerses] = useState<DailyBibleVerse[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasAmened, setHasAmened] = useState(false);
  const [amenCount, setAmenCount] = useState(48);

  useEffect(() => {
    if (initialVerse) {
      setVerse(initialVerse);
    }
    loadVerses();
  }, [initialVerse]);

  const loadVerses = async () => {
    try {
      const list = await apiClient.getDailyVerses();
      const published = list.filter((v) => v.status === 'PUBLIÉ');
      setAllVerses(published);

      if (!initialVerse) {
        const today = await apiClient.getTodayVerse();
        if (today) {
          setVerse(today);
          const idx = published.findIndex((v) => v.id === today.id);
          if (idx !== -1) setCurrentIndex(idx);
        } else if (published.length > 0) {
          setVerse(published[0]);
          setCurrentIndex(0);
        }
      } else {
        const idx = published.findIndex((v) => v.id === initialVerse.id);
        if (idx !== -1) setCurrentIndex(idx);
      }
    } catch (e) {
      console.error('Failed to load verses:', e);
    }
  };

  const handleNext = () => {
    if (allVerses.length === 0) return;
    const nextIdx = (currentIndex + 1) % allVerses.length;
    setCurrentIndex(nextIdx);
    setVerse(allVerses[nextIdx]);
    stopSpeech();
    setHasAmened(false);
  };

  const handlePrev = () => {
    if (allVerses.length === 0) return;
    const prevIdx = (currentIndex - 1 + allVerses.length) % allVerses.length;
    setCurrentIndex(prevIdx);
    setVerse(allVerses[prevIdx]);
    stopSpeech();
    setHasAmened(false);
  };

  const getShareText = () => {
    if (!verse) return '';
    return `📖 *Dévotion Quotidienne — ${verse.reference} (${verse.translation})*\n\n« ${verse.text} »\n\n💡 *Méditation :*\n${verse.meditation}\n\n🙏 *Prière :*\n${verse.prayer}\n\n⛪ _Église Missionnaire de la Foi de Sangmelima (EMF SMART)_\n${window.location.origin}`;
  };

  // Copy to clipboard fallback with visual feedback
  const handleCopy = async () => {
    if (!verse) return;
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShareFeedback('Verset et méditation copiés dans le presse-papier !');
      setTimeout(() => {
        setCopied(false);
        setShareFeedback(null);
      }, 3500);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  };

  // Native share dialog or fallback to clipboard copy
  const handleShare = async () => {
    if (!verse) return;
    const shareText = getShareText();

    // Check if Web Share API is available (native share dialog on mobile/tablets/desktop)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Dévotion Quotidienne : ${verse.reference}`,
          text: shareText,
          url: window.location.href,
        });
        setShareFeedback('Dévotion partagée avec succès !');
        setTimeout(() => setShareFeedback(null), 3000);
        return;
      } catch (err: any) {
        // If user explicitly dismissed or cancelled the share dialog, do not error
        if (err.name === 'AbortError') return;
      }
    }

    // Graceful fallback to clipboard copy if Web Share API is not supported or failed
    await handleCopy();
  };

  const handleShareWhatsApp = () => {
    if (!verse) return;
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window) || !verse) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${verse.reference}. ${verse.text}. Méditation : ${verse.meditation}. Prière : ${verse.prayer}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleAmen = () => {
    if (!hasAmened) {
      setHasAmened(true);
      setAmenCount((prev) => prev + 1);
    }
  };

  if (!verse) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm animate-pulse text-center text-xs text-slate-400">
        Chargement de la dévotion du jour...
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-3xl border border-amber-200/90 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 relative ${className}`}
    >
      {/* Toast Notification Alert for Copy / Share Feedback */}
      {shareFeedback && (
        <div className="absolute top-14 right-4 z-30 bg-[#4A0E17] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#C99B2E] flex-shrink-0" />
          <span className="font-bold">{shareFeedback}</span>
        </div>
      )}

      {/* Top Banner Ribbon */}
      <div className="bg-[#4A0E17] text-white px-5 py-3 flex items-center justify-between border-b border-[#C99B2E]/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C99B2E]/20 border border-[#C99B2E]/40 flex items-center justify-center text-[#C99B2E]">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Dévotion Quotidienne
              </span>
              <span className="text-[10px] bg-[#C99B2E] text-[#4A0E17] px-1.5 py-0.2 rounded font-black uppercase tracking-widest">
                Pain de Vie
              </span>
            </div>
            <p className="text-[10px] text-amber-200/80">
              Heure locale : Sangmelima (Cameroun) • {formatDateDouala(verse.date)}
            </p>
          </div>
        </div>

        {/* Top Actions: Day Navigation, Audio & Share Button */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {allVerses.length > 1 && (
            <div className="flex items-center space-x-0.5 bg-white/10 rounded-lg p-0.5 border border-white/20">
              <button
                onClick={handlePrev}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Dévotion précédente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
                title="Dévotion suivante"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {'speechSynthesis' in window && (
            <button
              onClick={toggleSpeech}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isSpeaking
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/10 text-slate-200 hover:text-white hover:bg-white/20'
              }`}
              title={isSpeaking ? 'Arrêter la lecture' : 'Écouter la dévotion (Audio)'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Copy Icon Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 transition cursor-pointer"
            title="Copier le verset et la méditation"
            aria-label="Copier le verset"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Native Share Icon Button */}
          <button
            onClick={handleShare}
            className="px-2.5 py-1.5 rounded-lg bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black transition cursor-pointer shadow-xs flex items-center space-x-1"
            title="Partager le verset (Boîte de dialogue native ou copier)"
            aria-label="Partager le verset"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#4A0E17]" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-[#4A0E17]" />
            )}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Copié !' : 'Partager'}</span>
          </button>

          {/* WhatsApp Direct Share */}
          <button
            onClick={handleShareWhatsApp}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
            title="Partager directement sur WhatsApp"
            aria-label="Partager sur WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-7 space-y-5">
        {/* Verse Reference & Text Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-[#4A0E17] tracking-tight">
                {verse.reference}
              </span>
              <button
                onClick={handleShare}
                className="p-1 rounded-lg text-slate-400 hover:text-[#4A0E17] hover:bg-amber-100 transition cursor-pointer"
                title="Partager ou copier ce verset"
                aria-label="Partager ou copier ce verset"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              {verse.translation}
            </span>
          </div>

          <blockquote className="font-serif italic text-base sm:text-lg text-slate-900 leading-relaxed pl-4 border-l-4 border-[#C99B2E] py-1 bg-amber-50/50 rounded-r-2xl pr-3">
            « {verse.text} »
          </blockquote>
        </div>

        {/* Reflection / Meditation Box */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-black uppercase tracking-wider text-[#6E1325]">
              <BookOpen className="w-4 h-4 text-[#C99B2E]" />
              <span>Méditation Pastorale & Réflexion du Jour</span>
            </div>
            <button
              onClick={handleShare}
              className="text-[11px] text-slate-500 hover:text-[#4A0E17] flex items-center space-x-1 cursor-pointer font-bold"
              title="Partager la méditation"
            >
              <Share2 className="w-3 h-3 text-[#C99B2E]" />
              <span className="hidden sm:inline">Partager</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {verse.meditation}
          </p>
        </div>

        {/* Pastoral Prayer Box */}
        {verse.prayer && (
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prière du Cœur pour Aujourd'hui</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 italic leading-relaxed">
              « {verse.prayer} »
            </p>
          </div>
        )}

        {/* Interaction & Community Seal Footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            {/* Amen Proclamation Button */}
            <button
              onClick={handleAmen}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                hasAmened
                  ? 'bg-amber-100 text-[#4A0E17] border border-amber-300'
                  : 'bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasAmened ? 'fill-[#4A0E17]' : ''}`} />
              <span>{hasAmened ? 'Amen proclamé !' : 'Dire Amen !'}</span>
              <span className="text-[10px] bg-white/40 px-1 rounded-full font-bold">
                {amenCount}
              </span>
            </button>

            {/* Prominent Share Icon Button */}
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#4A0E17] font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs border border-amber-300/60"
              title="Partager le verset (Boîte de dialogue native ou copier)"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-[#4A0E17]" />
              )}
              <span>{copied ? 'Copié dans le presse-papier !' : 'Partager le Verset'}</span>
            </button>

            {/* Prayer Request Button */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('prayer-requests')}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
                title="Déposer un sujet de prière"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#6E1325]" />
                <span className="hidden sm:inline">Déposer une Prière</span>
              </button>
            )}
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('verses')}
              className="text-xs font-bold text-[#6E1325] hover:text-[#4A0E17] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Toutes les Dévotions Paroissiales</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C99B2E]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
