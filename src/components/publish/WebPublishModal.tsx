import React from 'react';
import { X } from 'lucide-react';
import { WebPublishPage } from '../../pages/WebPublishPage';

interface WebPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPublicHome?: () => void;
  onNavigateToPage?: (page: string) => void;
}

export const WebPublishModal: React.FC<WebPublishModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPublicHome,
  onNavigateToPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-5xl bg-[#F4F7FB] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-[#4A0E17] text-white px-6 py-4 flex items-center justify-between border-b border-[#C99B2E]/30 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-black tracking-wide uppercase text-amber-300">
              Publication Web Gratuite & Partage
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <WebPublishPage
            onNavigateToPublicHome={() => {
              onClose();
              if (onNavigateToPublicHome) onNavigateToPublicHome();
            }}
            onNavigateToPage={(p) => {
              onClose();
              if (onNavigateToPage) onNavigateToPage(p);
            }}
          />
        </div>
      </div>
    </div>
  );
};
