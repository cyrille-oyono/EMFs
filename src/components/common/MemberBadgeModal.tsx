import React from 'react';
import { X, Printer, Shield, Church, QrCode } from 'lucide-react';
import { Member } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateDouala } from '../../utils/formatters';

import { ChurchLogo } from './ChurchLogo';

interface MemberBadgeModalProps {
  member: Member | null;
  onClose: () => void;
}

export const MemberBadgeModal: React.FC<MemberBadgeModalProps> = ({ member, onClose }) => {
  const { settings } = useAuth();

  if (!member) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate SVG QR code mock vector with valid encoded data
  const qrData = encodeURIComponent(`EMF-MEMBER:${member.memberNumber}:${member.lastName}:${member.firstName}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Actions bar */}
        <div className="no-print bg-[#4A0E17] px-5 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#C99B2E]" />
            <span className="font-bold text-xs">Carte Officielle de Membre</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#C99B2E] text-[#4A0E17] text-xs font-bold rounded-lg hover:bg-amber-400 transition flex items-center space-x-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le badge</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-rose-200 hover:text-white rounded-lg hover:bg-[#6E1325] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badge Card Container (Standard ISO ID-1 proportions) */}
        <div className="p-6 bg-slate-100 flex items-center justify-center">
          <div
            id="printable-badge"
            className="w-80 rounded-2xl bg-white shadow-xl overflow-hidden border border-slate-300 relative text-slate-800"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white p-4 text-center border-b-2 border-[#C99B2E]">
              <ChurchLogo size="md" className="mx-auto mb-1.5" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">
                {settings.churchName}
              </h2>
              <p className="text-[10px] text-amber-300 font-medium">Sangmelima — Cameroun</p>
              <div className="text-[9px] uppercase tracking-widest text-rose-100 mt-1 font-bold">
                CARTE DE MEMBRE
              </div>
            </div>

            {/* Body */}
            <div className="p-4 text-center">
              {/* Photo & Member status */}
              <div className="relative inline-block mb-3">
                <div className="w-20 h-20 rounded-full border-3 border-[#6E1325] bg-slate-200 overflow-hidden mx-auto flex items-center justify-center shadow">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.lastName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black text-[#6E1325]">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-0 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white shadow-xs">
                  {member.status}
                </span>
              </div>

              {/* Name & Title */}
              <h3 className="text-base font-extrabold text-[#4A0E17]">
                {member.firstName} {member.lastName}
              </h3>
              <p className="text-xs font-mono font-bold text-[#C99B2E] mb-2">
                {member.memberNumber}
              </p>

              <div className="text-xs text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Département :</span>
                  <span className="font-semibold text-slate-800">{member.department || 'Fidèle'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Téléphone :</span>
                  <span className="font-semibold text-slate-800">{member.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Adhésion :</span>
                  <span className="font-semibold text-slate-800">{member.joinDate}</span>
                </div>
              </div>

              {/* QR Code Container for Pointage Présence */}
              <div className="flex items-center justify-center space-x-3 bg-white p-2 rounded-lg border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded border border-slate-300">
                  <QrCode className="w-12 h-12 text-[#6E1325]" />
                </div>
                <div className="text-left text-[10px] text-slate-500">
                  <p className="font-bold text-slate-800">Scan Pointage Rapide</p>
                  <p>Valable pour tous les cultes et événements à Sangmelima.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#4A0E17] text-slate-300 px-3 py-2 text-center text-[9px] border-t border-[#C99B2E]/40">
              « Je suis dans la joie quand on me dit : Allons à la maison de l'Éternel ! »
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
