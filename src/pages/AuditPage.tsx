import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, Download } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { AuditLog } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const list = await apiClient.getAuditLogs();
    setLogs(list);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase());

    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const modulesList = Array.from(new Set(logs.map((l) => l.module)));

  const handleExportCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Rôle', 'Action', 'Module', 'Objet', 'Détails'];
    const rows = filteredLogs.map((l) => [
      l.createdAt,
      `"${l.userName}"`,
      l.userRole,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.objectType}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `journal_audit_emf_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#C99B2E] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#6E1325]" />
            <span>Sécurité & Traçabilité Complète • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Journal d’Audit Système</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique infalsifiable de toutes les connexions, modifications et transactions financières
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Exporter Journal CSV</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par utilisateur, action, détail..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
          />
        </div>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#6E1325]"
        >
          <option value="ALL">Tous les modules</option>
          {modulesList.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F4F7FB] text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Détails de l’opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {formatDateDouala(log.createdAt, true)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400">{log.userRole}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-[11px] font-bold text-[#6E1325] bg-blue-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">{log.module}</td>
                  <td className="py-3 px-4 text-slate-700 leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
