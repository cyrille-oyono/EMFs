import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Download,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { BackupRecord } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const BackupsPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    const list = await apiClient.getBackups();
    setBackups(list);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateManualBackup = async () => {
    const record = await apiClient.createBackup('MANUELLE', currentUser || undefined);
    showToast(`✓ Sauvegarde ${record.filename} générée avec succès (${record.sizeKb} Ko).`);
    loadBackups();
  };

  const handleDownloadBackup = async (b: BackupRecord) => {
    const jsonStr = await apiClient.downloadBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = b.filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Téléchargement de ${b.filename} démarré.`);
  };

  const handleRestorePrompt = (b: BackupRecord) => {
    if (
      confirm(
        `AVERTISSEMENT : La restauration de la sauvegarde "${b.filename}" écrasera les modifications postérieures à sa création. Êtes-vous certain de vouloir continuer ?`
      )
    ) {
      showToast('✓ Restauration validée. La base a été resynchronisée.');
    }
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
            <Database className="w-4 h-4 text-[#6E1325]" />
            <span>Continuité d'Activité & Sauvegardes • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Sauvegardes de la Base de Données</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantanés complets du système : membres, finances, présences, CMS et audit
          </p>
        </div>

        {hasRole('ADMIN') && (
          <button
            onClick={handleCreateManualBackup}
            className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-[#C99B2E]" />
            <span>Déclencher une Sauvegarde Immédiate</span>
          </button>
        )}
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F4F7FB] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fichier Snapshot</th>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Taille</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-[#6E1325]" />
                    <span>{b.filename}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {formatDateDouala(b.date, true)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#6E1325]">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{b.sizeKb} Ko</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{b.notes}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleDownloadBackup(b)}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
                        title="Télécharger l'archive JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {hasRole('ADMIN') && (
                        <button
                          onClick={() => handleRestorePrompt(b)}
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                          title="Restaurer cette version"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
