import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, FileText } from 'lucide-react';
import { Transaction } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatFCFA, formatDateDouala, numberToFrenchWords } from '../../utils/formatters';
import { ChurchLogo } from './ChurchLogo';
import { generateReceiptPDF } from '../../services/pdfGenerator';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { settings } = useAuth();
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      setIsExportingPDF(true);
      generateReceiptPDF(transaction, settings);
    } catch (err) {
      console.error('Erreur génération PDF du reçu:', err);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 800);
    }
  };

  const isRecette = transaction.type === 'RECETTE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="no-print bg-[#4A0E17] px-6 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#C99B2E]" />
            <span className="font-bold text-sm">
              Reçu Financier Officiel — {transaction.number}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="Télécharger le reçu officiel au format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'Exportation...' : 'Télécharger PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#C99B2E] text-[#4A0E17] text-xs font-bold rounded-lg hover:bg-amber-400 transition flex items-center space-x-1.5 shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-rose-200 hover:text-white rounded-lg hover:bg-[#6E1325] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-8 text-slate-800 bg-white">
          {/* Header of Receipt */}
          <div className="border-b-2 border-[#6E1325] pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <ChurchLogo size="md" />
                  <div>
                    <h1 className="text-base font-extrabold text-[#4A0E17] uppercase tracking-wide leading-tight">
                      {settings.churchName}
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                      Paroisse de Sangmelima — Région du Sud, Cameroun
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5 mt-2">
                  <p>{settings.address}</p>
                  <p>Tél : {settings.phone} | Email : {settings.email}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded bg-[#6E1325] text-[#C99B2E] font-bold text-xs uppercase tracking-wider mb-2">
                  {isRecette ? 'REÇU DE CAISSE' : 'BON DE DÉCAISSEMENT'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-700">
                  N° : {transaction.number}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Date : {formatDateDouala(transaction.date)}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-[#FAF0F2] border border-[#6E1325]/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Montant total
              </span>
              <div className="text-2xl font-black text-[#4A0E17]">
                {formatFCFA(transaction.amount)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Mode de paiement
              </span>
              <div className="text-sm font-bold text-slate-800">
                {transaction.paymentMethod.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Amount in French Words */}
          <div className="border border-slate-200 rounded-lg p-3 mb-6 bg-slate-50">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
              Somme arrêtée en toutes lettres :
            </span>
            <p className="text-sm font-serif italic text-slate-900 font-semibold">
              « {numberToFrenchWords(transaction.amount)} »
            </p>
          </div>

          {/* Transaction Meta Details */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-8">
            <div className="p-3 border border-slate-100 rounded-lg bg-white">
              <span className="text-slate-400 font-medium block mb-1">
                {isRecette ? 'Reçu de (Donateur / Membre) :' : 'Versé à (Bénéficiaire) :'}
              </span>
              <p className="font-bold text-slate-900 text-sm">{transaction.counterparty}</p>
            </div>
            <div className="p-3 border border-slate-100 rounded-lg bg-white">
              <span className="text-slate-400 font-medium block mb-1">Motif / Catégorie :</span>
              <p className="font-bold text-slate-900 text-sm">
                {transaction.categoryName || 'Contribution'}
              </p>
            </div>
            <div className="col-span-2 p-3 border border-slate-100 rounded-lg bg-white">
              <span className="text-slate-400 font-medium block mb-1">Description détaillée :</span>
              <p className="text-slate-700">{transaction.description}</p>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-slate-300 text-xs">
            <div>
              <p className="text-slate-500 font-semibold mb-10">Pour la Partie Versante :</p>
              <div className="border-t border-slate-300 w-36 pt-1 text-slate-400 text-[10px]">
                Signature du donateur
              </div>
            </div>

            <div className="text-right">
              <p className="text-slate-500 font-semibold mb-2">Pour la Trésorerie EMF Sangmelima :</p>
              <div className="inline-block border-2 border-emerald-600 rounded-lg px-3 py-1 text-emerald-700 text-[11px] font-bold uppercase rotate-[-2deg] my-2">
                ✓ Encaissé & Validé
              </div>
              <p className="text-slate-700 font-medium text-xs mt-1">
                Opérateur : {transaction.userName || 'Trésorier de service'}
              </p>
              <div className="border-t border-slate-300 w-44 ml-auto pt-1 text-slate-400 text-[10px]">
                Cachet & Signature
              </div>
            </div>
          </div>

          {/* Footer of Receipt */}
          <div className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100">
            Reçu généré par EMF SMART • Église Missionnaire de la Foi de Sangmelima • Document certifié conforme
          </div>
        </div>
      </div>
    </div>
  );
};
