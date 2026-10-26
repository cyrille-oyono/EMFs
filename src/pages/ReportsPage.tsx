import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  Filter,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileText,
  Layers,
  Heart,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { formatFCFA, formatDateDouala } from '../utils/formatters';
import {
  Member,
  Family,
  Transaction,
  AttendanceSession,
  AttendanceRecord,
  Event,
} from '../types';
import { ChurchLogo } from '../components/common/ChurchLogo';

type ReportTab = 'FINANCES' | 'ATTENDANCE' | 'CONSOLIDATED';
type PeriodFilter = 'ALL' | 'THIS_MONTH' | 'THIS_QUARTER' | 'YEAR_2026';

export const ReportsPage: React.FC = () => {
  const { settings, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('FINANCES');
  const [period, setPeriod] = useState<PeriodFilter>('YEAR_2026');
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [m, f, t, s, attRecs, e] = await Promise.all([
          apiClient.getMembers(),
          apiClient.getFamilies(),
          apiClient.getTransactions(),
          apiClient.getAttendanceSessions(),
          apiClient.getAllAttendanceRecords(),
          apiClient.getEvents(),
        ]);
        setMembers(m);
        setFamilies(f);
        setTransactions(t);
        setSessions(s);
        setAttendanceRecords(attRecs);
        setEvents(e);
      } catch (err) {
        console.error('Error loading reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter Transactions by Period
  const filteredTransactions = transactions.filter((t) => {
    if (period === 'ALL') return true;
    const txDate = new Date(t.date);
    const now = new Date();
    if (period === 'THIS_MONTH') {
      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const txQuarter = Math.floor(txDate.getMonth() / 3);
      return txQuarter === currentQuarter && txDate.getFullYear() === now.getFullYear();
    }
    if (period === 'YEAR_2026') {
      return txDate.getFullYear() === 2026;
    }
    return true;
  });

  // Filter Attendance Sessions by Period
  const filteredSessions = sessions.filter((s) => {
    if (period === 'ALL') return true;
    const sDate = new Date(s.date);
    const now = new Date();
    if (period === 'THIS_MONTH') {
      return (
        sDate.getMonth() === now.getMonth() &&
        sDate.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const sQuarter = Math.floor(sDate.getMonth() / 3);
      return sQuarter === currentQuarter && sDate.getFullYear() === now.getFullYear();
    }
    if (period === 'YEAR_2026') {
      return sDate.getFullYear() === 2026;
    }
    return true;
  });

  // Financial Calculations
  const totalRecettes = filteredTransactions
    .filter((t) => t.type === 'RECETTE')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDepenses = filteredTransactions
    .filter((t) => t.type === 'DÉPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const soldeNet = totalRecettes - totalDepenses;

  // Breakdown of receipts by category
  const receiptsByCategory = filteredTransactions
    .filter((t) => t.type === 'RECETTE')
    .reduce((acc, t) => {
      const cat = t.categoryName || 'Autres Recettes';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Breakdown of expenses by category
  const expensesByCategory = filteredTransactions
    .filter((t) => t.type === 'DÉPENSE')
    .reduce((acc, t) => {
      const cat = t.categoryName || 'Autres Dépenses';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Attendance Calculations
  const totalAttendanceCheckins = attendanceRecords.filter((r) => r.status === 'PRÉSENT').length;
  const averageAttendancePerSession =
    filteredSessions.length > 0
      ? Math.round(totalAttendanceCheckins / filteredSessions.length)
      : 0;

  const handlePrint = () => {
    window.print();
  };

  const periodLabel = {
    ALL: 'Historique complet',
    THIS_MONTH: 'Mois en cours',
    THIS_QUARTER: 'Trimestre en cours (T1 2026)',
    YEAR_2026: 'Année 2026',
  }[period];

  const handleDownloadStandaloneHTML = () => {
    const reportTitle =
      activeTab === 'FINANCES'
        ? 'Rapport Financier & Bilan de Trésorerie'
        : activeTab === 'ATTENDANCE'
        ? 'Rapport de Présences & Assiduité aux Cultes'
        : 'Rapport Consolidé Général Paroissial';

    const element = document.getElementById('printable-report-canvas');
    if (!element) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - ${settings.churchName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 9pt; }
    .header-box { border-bottom: 3px solid #6E1325; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .text-emerald { color: #047857; }
    .text-red { color: #b91c1c; }
    .text-blue { color: #4A0E17; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
    .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; page-break-inside: avoid; }
    .sign-box { border-top: 1px solid #94a3b8; padding-top: 5px; margin-top: 50px; font-size: 9pt; color: #64748b; }
  </style>
</head>
<body>
  ${element.innerHTML}
  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${activeTab.toLowerCase()}_emf_sangmelima_${new Date().toISOString().substring(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    const dateStr = new Date().toISOString().substring(0, 10);

    if (activeTab === 'FINANCES') {
      csvContent += `RAPPORT FINANCIER OFFICIEL - ${settings.churchName}\n`;
      csvContent += `Période : ${periodLabel} | Date d'édition : ${dateStr}\n\n`;
      csvContent += `RÉSUMÉ TRÉSORERIE\n`;
      csvContent += `Total Recettes Encaissées (FCFA),${totalRecettes}\n`;
      csvContent += `Total Dépenses Engagées (FCFA),${totalDepenses}\n`;
      csvContent += `Solde Net en Caisse (FCFA),${soldeNet}\n\n`;
      csvContent += `JOURNAL DES OPÉRATIONS\n`;
      csvContent += `N° Reçu,Date,Type,Tiers / Fidèle,Catégorie,Moyen de paiement,Montant (FCFA)\n`;
      filteredTransactions.forEach((t) => {
        csvContent += `"${t.number}","${t.date}","${t.type}","${t.counterparty}","${t.categoryName}","${t.paymentMethod}",${t.amount}\n`;
      });
    } else if (activeTab === 'ATTENDANCE') {
      csvContent += `RAPPORT DE PRÉSENCES AUX CULTES - ${settings.churchName}\n`;
      csvContent += `Période : ${periodLabel} | Date d'édition : ${dateStr}\n\n`;
      csvContent += `RÉSUMÉ DES CULTES\n`;
      csvContent += `Nombre de Cultes & Séances,${filteredSessions.length}\n`;
      csvContent += `Total Pointages Présents,${totalAttendanceCheckins}\n`;
      csvContent += `Moyenne par séance,${averageAttendancePerSession}\n\n`;
      csvContent += `DÉTAIL DES SÉANCES\n`;
      csvContent += `Date,Heure,Culte / Séance,Type,Lieu,Présents\n`;
      filteredSessions.forEach((s) => {
        const count = attendanceRecords.filter(
          (r) => r.sessionId === s.id && r.status === 'PRÉSENT'
        ).length;
        csvContent += `"${s.date}","${s.time}","${s.title}","${s.type}","${s.location}",${count}\n`;
      });
    } else {
      csvContent += `BILAN GÉNÉRAL CONSOLIDÉ - ${settings.churchName}\n`;
      csvContent += `Période : ${periodLabel} | Date d'édition : ${dateStr}\n\n`;
      csvContent += `Total Membres,${members.length}\n`;
      csvContent += `Membres Actifs,${members.filter((m) => m.status === 'ACTIF').length}\n`;
      csvContent += `Foyers Familles,${families.length}\n`;
      csvContent += `Total Recettes (FCFA),${totalRecettes}\n`;
      csvContent += `Total Dépenses (FCFA),${totalDepenses}\n`;
      csvContent += `Solde Net (FCFA),${soldeNet}\n`;
      csvContent += `Séances de culte,${filteredSessions.length}\n`;
    }

    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `rapport_${activeTab.toLowerCase()}_sangmelima_${dateStr}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Génération des états financiers et statistiques de Sangmelima...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Navigation (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-[#C99B2E] uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-[#6E1325]" />
            <span>États Officiels & Certifiés • Sangmelima (Sud-Cameroun)</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">
            Rapports de Gestion & Impression PDF
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exportez et imprimez proprement les rapports financiers, les feuilles de présence et le bilan paroissial au format A4.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            title="Exporter les données brutes sous format tableur CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter en CSV</span>
          </button>
          <button
            onClick={handleDownloadStandaloneHTML}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-amber-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            title="Télécharger une page HTML/PDF autonome avec mise en page A4"
          >
            <FileText className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Télécharger Document HTML/PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer print-include"
          >
            <Printer className="w-4 h-4 text-[#C99B2E]" />
            <span>Imprimer / Exporter en PDF</span>
          </button>
        </div>
      </div>

      {/* Control Tabs & Filter Bar (Hidden in Print) */}
      <div className="no-print bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Report Type Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('FINANCES')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'FINANCES'
                ? 'bg-[#4A0E17] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>1. Rapport Financier</span>
          </button>

          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'ATTENDANCE'
                ? 'bg-[#4A0E17] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>2. Rapport de Présences</span>
          </button>

          <button
            onClick={() => setActiveTab('CONSOLIDATED')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'CONSOLIDATED'
                ? 'bg-[#4A0E17] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>3. Bilan Consolidé</span>
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">Période :</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#6E1325] outline-none"
          >
            <option value="YEAR_2026">Année 2026 (Complète)</option>
            <option value="THIS_QUARTER">Trimestre en cours (T1 2026)</option>
            <option value="THIS_MONTH">Mois en cours</option>
            <option value="ALL">Tout l'historique</option>
          </select>
        </div>
      </div>

      {/* Helpful Print Tip Note */}
      <div className="no-print p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-[#C99B2E] flex-shrink-0" />
        <span>
          <strong>Astuce pour l’export PDF propre :</strong> Cliquez sur <strong>« Imprimer / Exporter en PDF »</strong>, puis dans la boîte de dialogue d'impression de votre navigateur, sélectionnez la destination <strong>« Enregistrer au format PDF »</strong>.
        </span>
      </div>

      {/* PRINTABLE REPORT CANVAS (Styled for Screen and Pristine A4 Print) */}
      <div
        id="printable-report-canvas"
        className="printable-document bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6"
      >
        {/* Official Church Letterhead Header */}
        <div className="border-b-2 border-[#6E1325] pb-5 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <ChurchLogo size="lg" />
            <div>
              <div className="text-[10px] font-bold text-[#C99B2E] uppercase tracking-wider">
                République du Cameroun • Région du Sud • Département du Dja-et-Lobo
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[#4A0E17] uppercase tracking-wide leading-tight">
                {settings.churchName}
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Paroisse Principale d’Akon — Ville de Sangmelima
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Contact : {settings.phone} • {settings.email}
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="font-mono font-bold text-[#6E1325] text-sm uppercase block">
              {activeTab === 'FINANCES' && 'RAP-FIN-2026'}
              {activeTab === 'ATTENDANCE' && 'RAP-PRES-2026'}
              {activeTab === 'CONSOLIDATED' && 'RAP-GEN-2026'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Période : <strong>{periodLabel}</strong>
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Édité le : {formatDateDouala(new Date().toISOString(), true)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Par : {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.role})
            </span>
          </div>
        </div>

        {/* ----------------- TAB 1: RAPPORT FINANCIER ----------------- */}
        {activeTab === 'FINANCES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-[#C99B2E]" />
                <span>Bilan de Trésorerie & Grand Livre des Comptes</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Devise : Francs CFA (XAF)
              </span>
            </div>

            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
                  <span>Total Recettes Encaissées</span>
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-2">
                  {formatFCFA(totalRecettes)}
                </div>
                <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
                  Dîmes, offrandes et dons comptabilisés
                </div>
              </div>

              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200">
                <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
                  <span>Total Dépenses Engagées</span>
                  <ArrowDownRight className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-700 mt-2">
                  {formatFCFA(totalDepenses)}
                </div>
                <div className="text-[10px] text-rose-600 mt-1 font-semibold">
                  Charges de fonctionnement & entraide
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between text-xs text-[#4A0E17] font-bold">
                  <span>Solde Net Disponible en Caisse</span>
                  <ShieldCheck className="w-4 h-4 text-[#6E1325]" />
                </div>
                <div className="text-2xl font-black text-[#6E1325] mt-2">
                  {formatFCFA(soldeNet)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-semibold">
                  Position nette de trésorerie
                </div>
              </div>
            </div>

            {/* Analytical Category Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recettes Categories */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide">
                  Ventilation des Recettes
                </h3>
                <div className="divide-y divide-slate-200 text-xs">
                  {Object.entries(receiptsByCategory).length === 0 ? (
                    <div className="py-2 text-slate-400 text-center">Aucune recette sur la période.</div>
                  ) : (
                    Object.entries(receiptsByCategory).map(([cat, amount]) => (
                      <div key={cat} className="py-2 flex items-center justify-between">
                        <span className="text-slate-700">{cat}</span>
                        <span className="font-bold text-emerald-700">{formatFCFA(amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dépenses Categories */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide">
                  Ventilation des Dépenses
                </h3>
                <div className="divide-y divide-slate-200 text-xs">
                  {Object.entries(expensesByCategory).length === 0 ? (
                    <div className="py-2 text-slate-400 text-center">Aucune dépense sur la période.</div>
                  ) : (
                    Object.entries(expensesByCategory).map(([cat, amount]) => (
                      <div key={cat} className="py-2 flex items-center justify-between">
                        <span className="text-slate-700">{cat}</span>
                        <span className="font-bold text-rose-700">{formatFCFA(amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Transaction Journal Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide">
                Journal Détaillé des Opérations ({filteredTransactions.length} enregistrements)
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F4F7FB] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Réf Reçu</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Nature</th>
                      <th className="py-2.5 px-3">Donateur / Bénéficiaire</th>
                      <th className="py-2.5 px-3">Catégorie</th>
                      <th className="py-2.5 px-3">Moyen</th>
                      <th className="py-2.5 px-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{tx.number}</td>
                        <td className="py-2 px-3 text-slate-600">{formatDateDouala(tx.date)}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === 'RECETTE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{tx.counterparty}</td>
                        <td className="py-2 px-3 text-slate-600">{tx.categoryName}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{tx.paymentMethod}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            tx.type === 'RECETTE' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatFCFA(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: RAPPORT DE PRÉSENCES ----------------- */}
        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#C99B2E]" />
                <span>Rapport de Fréquentation & Assiduité aux Cultes</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Temple Akon & Cellules
              </span>
            </div>

            {/* Attendance KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Cultes & Séances Tenus</span>
                <div className="text-2xl font-black text-[#4A0E17] mt-1">
                  {filteredSessions.length}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Sur la période</span>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                <span className="text-[11px] text-[#4A0E17] block font-bold">Total des Présences</span>
                <div className="text-2xl font-black text-[#6E1325] mt-1">
                  {totalAttendanceCheckins}
                </div>
                <span className="text-[10px] text-blue-600 mt-1 block">Pointages validés</span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 block font-bold">Moyenne / Culte</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {averageAttendancePerSession}
                </div>
                <span className="text-[10px] text-emerald-600 mt-1 block">Fidèles par séance</span>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
                <span className="text-[11px] text-amber-800 block font-bold">Total Membres Inscrits</span>
                <div className="text-2xl font-black text-[#C99B2E] mt-1">
                  {members.length}
                </div>
                <span className="text-[10px] text-amber-700 mt-1 block">
                  {members.filter((m) => m.status === 'ACTIF').length} membres actifs
                </span>
              </div>
            </div>

            {/* Detailed Sessions Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide">
                Relevé des Séances de Culte & Taux de Présence
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F4F7FB] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Heure</th>
                      <th className="py-2.5 px-3">Culte / Réunion</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Lieu</th>
                      <th className="py-2.5 px-3 text-right">Présents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.map((s) => {
                      const count = attendanceRecords.filter(
                        (r) => r.sessionId === s.id && r.status === 'PRÉSENT'
                      ).length;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{formatDateDouala(s.date)}</td>
                          <td className="py-2 px-3 text-slate-500 font-mono">{s.time}</td>
                          <td className="py-2 px-3 font-bold text-[#4A0E17]">{s.title}</td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-500">
                            {s.type}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{s.location}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                              {count}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: BILAN CONSOLIDÉ ----------------- */}
        {activeTab === 'CONSOLIDATED' && (
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#C99B2E]" />
              <span>Bilan Général Consolidé de l'Assemblée</span>
            </h2>

            {/* 1. Demography */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>1. Démographie & Familles Paroissiales</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-xl font-black text-[#4A0E17]">{members.length}</div>
                  <div className="text-[11px] text-slate-500">Total Membres</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-xl font-black text-emerald-700">
                    {members.filter((m) => m.status === 'ACTIF').length}
                  </div>
                  <div className="text-[11px] text-slate-500">Membres Actifs</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-xl font-black text-[#C99B2E]">{families.length}</div>
                  <div className="text-[11px] text-slate-500">Foyers Familles</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-xl font-black text-amber-700">
                    {members.filter((m) => m.status === 'VISITEUR').length}
                  </div>
                  <div className="text-[11px] text-slate-500">Nouveaux Visiteurs</div>
                </div>
              </div>
            </div>

            {/* 2. Finances Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide flex items-center space-x-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>2. Synthèse Financière</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-lg font-black text-emerald-700">{formatFCFA(totalRecettes)}</div>
                  <div className="text-[11px] text-emerald-800">Recettes Encaissées</div>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-lg font-black text-rose-700">{formatFCFA(totalDepenses)}</div>
                  <div className="text-[11px] text-rose-800">Dépenses Réalisées</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-lg font-black text-[#6E1325]">{formatFCFA(soldeNet)}</div>
                  <div className="text-[11px] text-[#4A0E17]">Solde Net Restant</div>
                </div>
              </div>
            </div>

            {/* 3. Next Events */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#4A0E17] uppercase tracking-wide flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C99B2E]" />
                <span>3. Programmes & Grands Événements Paroissiaux</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F4F7FB] text-slate-700 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Événement</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Lieu</th>
                      <th className="py-2.5 px-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((evt) => (
                      <tr key={evt.id}>
                        <td className="py-2 px-3 font-bold text-slate-800">{evt.title}</td>
                        <td className="py-2 px-3 uppercase text-[10px] text-slate-500">{evt.type}</td>
                        <td className="py-2 px-3 text-slate-600">{formatDateDouala(evt.startDate)}</td>
                        <td className="py-2 px-3 text-slate-600">{evt.location}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-700">{evt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Official Certifications & Signatures Section (Always visible in Print) */}
        <div className="page-break-avoid grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-200 text-xs">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wide">
              {activeTab === 'FINANCES' ? 'Le Trésorier Général :' : 'Le Secrétariat de Paroisse :'}
            </p>
            <p className="text-[11px] text-slate-500">
              {activeTab === 'FINANCES' ? 'Frère Emmanuel Mvondo' : 'Sœur Chantal Mengue'}
            </p>
            <div className="border-t border-slate-300 w-48 mt-12 pt-1 text-slate-400 text-[10px]">
              Visa, Signature & Date
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-700 uppercase tracking-wide">
              Le Pasteur Principal :
            </p>
            <p className="text-[11px] text-slate-500">
              Pasteur Samuel Ondoa
            </p>
            <div className="border-t border-slate-300 w-48 ml-auto mt-12 pt-1 text-slate-400 text-[10px]">
              Cachet officiel & Signature pastorale
            </div>
          </div>
        </div>

        {/* Footer info for print */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>{settings.churchName} — Sangmelima (Cameroun)</span>
          <span>Plateforme EMF SMART v1.0 • Document officiel certifié</span>
        </div>
      </div>
    </div>
  );
};
