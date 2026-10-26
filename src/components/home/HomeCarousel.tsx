import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
} from 'lucide-react';
import { HomepageCarouselSlide } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { INITIAL_CAROUSEL_SLIDES } from '../../server/initialData';

interface HomeCarouselProps {
  slides: HomepageCarouselSlide[];
  onNavigateToSection?: (sectionId: string) => void;
  onNavigateToPage?: (page: string) => void;
  onRefreshSlides?: () => void;
  onOpenManageModal?: (startInCreateMode?: boolean) => void;
}

export const HomeCarousel: React.FC<HomeCarouselProps> = ({
  slides,
  onNavigateToSection,
  onNavigateToPage,
  onOpenManageModal,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const safeSlides = Array.isArray(slides) && slides.length > 0 ? slides : INITIAL_CAROUSEL_SLIDES;
  const activeSlides = (safeSlides || []).filter((s) => s && s.isActive);
  const displaySlides = activeSlides.length > 0 ? activeSlides : safeSlides;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && !isHovered && displaySlides.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
      }, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isHovered, displaySlides.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? displaySlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
  };

  const handleButtonClick = (link?: string) => {
    if (!link) return;

    // Handle in-page anchors e.g. #services, #events, #dernier-culte
    if (link.startsWith('#')) {
      const sectionId = link.replace('#', '');
      const element = document.getElementById(sectionId) || document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (onNavigateToSection) {
        onNavigateToSection(sectionId);
        return;
      }
      if (onNavigateToPage) {
        onNavigateToPage(sectionId);
        return;
      }
    }

    // Handle internal app routes e.g. /parakletos#adhesion, /home-cells, /resources, /prayer-requests
    if (link.startsWith('/')) {
      const cleanPath = link.replace(/^\//, '');
      const [pageRoute, hashPart] = cleanPath.split('#');

      if (hashPart && typeof window !== 'undefined') {
        window.location.hash = hashPart;
      }

      if (onNavigateToPage && pageRoute) {
        onNavigateToPage(pageRoute);
        return;
      }

      // Fallback SPA hash navigation
      if (typeof window !== 'undefined') {
        window.location.href = `#${cleanPath}`;
      }
      return;
    }

    // External link
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  if (!displaySlides || displaySlides.length === 0) {
    return null;
  }

  const currentSlide = displaySlides[currentIndex] || displaySlides[0] || INITIAL_CAROUSEL_SLIDES[0];
  if (!currentSlide) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-950 text-white select-none group min-h-[500px] sm:min-h-[560px] lg:min-h-[640px] flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Carrousel d’images de l’Église"
    >
      {/* Background Images with Cross-fade */}
      {(displaySlides || []).map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={slide?.id || `slide-${idx}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 pointer-events-none scale-105'
            }`}
            style={{ transitionProperty: 'opacity, transform', transitionDuration: '1000ms' }}
          >
            <img
              src={slide?.imageUrl || ''}
              alt={slide?.title || 'Diapositive EMF'}
              className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.08]"
            />
            {/* Multi-layered Gradients for Deep Contrast & Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071d37] via-[#4A0E17]/60 to-black/35" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A0E17]/90 via-[#4A0E17]/50 to-transparent" />
          </div>
        );
      })}

      {/* Admin Floating Shortcut */}
      {isAdmin && onOpenManageModal && (
        <div className="absolute top-4 right-4 z-30 flex items-center space-x-2">
          <button
            onClick={() => onOpenManageModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-black transition shadow-lg border border-amber-400/50 cursor-pointer"
            title="Ajouter un nouvel élément au carrousel"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ajouter une Diapositive</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
          <button
            onClick={() => onOpenManageModal(false)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-amber-300 text-xs font-bold transition shadow-lg border border-amber-300/40 cursor-pointer"
            title="Gérer les diapositives du carrousel"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gérer ({displaySlides.length})</span>
          </button>
        </div>
      )}

      {/* Main Slide Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="max-w-3xl space-y-4 sm:space-y-6">
          {/* Badge */}
          {currentSlide?.badge && (
            <div className="inline-flex items-center space-x-2 bg-[#C99B2E] text-[#4A0E17] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md animate-in fade-in slide-in-from-top-2 duration-500">
              <Sparkles className="w-3.5 h-3.5 text-[#4A0E17]" />
              <span>{currentSlide.badge}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-md animate-in fade-in slide-in-from-bottom-3 duration-700">
            {currentSlide?.title || 'Église Missionnaire de la Foi'}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-100 font-light leading-relaxed max-w-2xl drop-shadow animate-in fade-in slide-in-from-bottom-4 duration-700">
            {currentSlide?.subtitle || 'Bienvenue dans notre assemblée à Sangmelima'}
          </p>

          {/* Description (if present) */}
          {currentSlide?.description && (
            <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-xl hidden sm:block italic border-l-2 border-[#C99B2E] pl-3 py-0.5">
              « {currentSlide.description} »
            </p>
          )}

          {/* Action CTAs */}
          <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3">
            {currentSlide?.primaryButtonText && (
              <button
                onClick={() => handleButtonClick(currentSlide.primaryButtonLink)}
                className="px-6 py-3.5 rounded-xl bg-[#C99B2E] text-[#4A0E17] font-black text-xs sm:text-sm hover:bg-amber-400 transition shadow-xl flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>{currentSlide.primaryButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentSlide?.secondaryButtonText && (
              <button
                onClick={() => handleButtonClick(currentSlide.secondaryButtonLink)}
                className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm transition border border-white/30 backdrop-blur-md cursor-pointer transform hover:-translate-y-0.5"
              >
                {currentSlide.secondaryButtonText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {displaySlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-[#C99B2E] text-white hover:text-[#4A0E17] backdrop-blur-md border border-white/20 transition-all flex items-center justify-center cursor-pointer shadow-lg opacity-80 group-hover:opacity-100 focus:outline-none"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-[#C99B2E] text-white hover:text-[#4A0E17] backdrop-blur-md border border-white/20 transition-all flex items-center justify-center cursor-pointer shadow-lg opacity-80 group-hover:opacity-100 focus:outline-none"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Controls Bar (Counter, Dots, Play/Pause, Quick Tabs) */}
      <div className="absolute bottom-4 sm:bottom-6 inset-x-0 z-30 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Quick Topics Preview Pills */}
        <div className="hidden lg:flex items-center space-x-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
          {displaySlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{slide.badge || `Slide ${idx + 1}`}</span>
              </button>
            );
          })}
        </div>

        {/* Dots, Slide Counter and Play/Pause */}
        <div className="flex items-center space-x-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 mx-auto sm:mx-0">
          {/* Slide Indicator Dots */}
          <div className="flex items-center space-x-2">
            {displaySlides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    isActive ? 'w-7 bg-[#C99B2E]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Aller à la diapositive ${idx + 1}`}
                />
              );
            })}
          </div>

          <span className="text-white/40 text-xs">|</span>

          {/* Slide Numbers */}
          <div className="text-xs font-mono text-slate-300">
            <span className="font-bold text-amber-300">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-slate-400"> / {String(displaySlides.length).padStart(2, '0')}</span>
          </div>

          <span className="text-white/40 text-xs">|</span>

          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-slate-300 hover:text-amber-300 transition cursor-pointer"
            aria-label={isPlaying ? 'Mettre en pause le carrousel' : 'Reprendre la lecture'}
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
