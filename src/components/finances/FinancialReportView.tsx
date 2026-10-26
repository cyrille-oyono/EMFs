import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  CheckCircle,
  Coins,
  ShieldCheck,
  CreditCard,
  Layers,
  TrendingUp,
  Search,
  Eye,
  Award,
  Sparkles,
} from 'lucide-react';
import { Transaction, TransactionCategory, SystemSettings } from '../../types';
import { formatFCFA, formatDateDouala, numberToFrenchWords } from '../../utils/formatters';
import { ChurchLogo } from '../common/ChurchLogo';
import { generateFinancialReportPDF, generateReceiptPDF } from '../../services/pdfGenerator';

interface FinancialReportViewProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
  settings: SystemSettings;
  onOpenReceipt?: (tx: Transaction) => void;
}

const MONTHS_FR = [
  { value: '01', name: 'Janvier', short: 'Jan' },
  { value: '02', name: 'Février', short: 'Fév' },
  { value: '03', name: 'Mars', short: 'Mar' },
  { value: '04', name: 'Avril', short: 'Avr' },
  { value: '05', name: 'Mai', short: 'Mai' },
  { value: '06', name: 'Juin', short: 'Juin' },
  { value: '07', name: 'Juillet', short: 'Juil' },
  { value: '08', name: 'Août', short: 'Aoû' },
  { value: '09', name: 'Septembre', short: 'Sep' },
  { value: '10', name: 'Octobre', short: 'Oct' },
  { value: '11', name: 'Novembre', short: 'Nov' },
  { value: '12', name: 'Décembre', short: 'Déc' },
];

export const FinancialReportView: React.FC<FinancialReportViewProps> = ({
  transactions,
  categories,
  settings,
  onOpenReceipt,
}) => {
  // Mode: 'MENSUEL' ou 'ANNUEL'
  const [reportType, setReportType] = useState<'MENSUEL' | 'ANNUEL'>('MENSUEL');

  // Available distinct years from transactions
  const availableYears = useMemo(() => {
    const setY = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = tx.date.substring(0, 4);
        if (y) setY.add(y);
      }
    });
    setY.add('2026');
    const list = Array.from(setY).sort().reverse();
    return list.length > 0 ? list : ['2026', '2025'];
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return availableYears.includes('2026') ? '2026' : availableYears[0] || '2026';
  });

  // Calculate transaction counts per month for the selected year
  const monthCountsForYear = useMemo(() => {
    const counts: Record<string, number> = {};
    MONTHS_FR.forEach((m) => {
      counts[m.value] = 0;
    });
    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(selectedYear)) {
        const m = tx.date.substring(5, 7);
        if (counts[m] !== undefined) {
          counts[m] += 1;
        }
      }
    });
    return counts;
  }, [transactions, selectedYear]);

  // Default month: pick the month with highest transactions or latest non-zero
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const txMonths = transactions
      .filter((t) => t.date && t.date.startsWith('2026'))
      .map((t) => t.date.substring(5, 7));
    if (txMonths.length > 0) {
      const mCounts: Record<string, number> = {};
      txMonths.forEach((m) => (mCounts[m] = (mCounts[m] || 0) + 1));
      const sorted = Object.entries(mCounts).sort((a, b) => b[1] - a[1]);
      return sorted[0][0];
    }
    return '02'; // Février par défaut (riche en transactions)
  });

  // Transaction Search & Filter within report
  const [journalSearch, setJournalSearch] = useState('');
  const [journalTypeFilter, setJournalTypeFilter] = useState<'ALL' | 'RECETTE' | 'DÉPENSE'>('ALL');

  // Filtered transactions for the chosen report period
  const reportTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;
      if (reportType === 'ANNUEL') {
        return tx.date.startsWith(selectedYear);
      } else {
        const prefix = `${selectedYear}-${selectedMonth}`;
        return tx.date.startsWith(prefix);
      }
    });
  }, [transactions, reportType, selectedYear, selectedMonth]);

  // Aggregate totals
  const totalRecettes = useMemo(() => {
    return reportTransactions
      .filter((t) => t.type === 'RECETTE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [reportTransactions]);

  const totalDepenses = useMemo(() => {
    return reportTransactions
      .filter((t) => t.type === 'DÉPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [reportTransactions]);

  const soldeNet = totalRecettes - totalDepenses;

  // Breakdown by Category for Recettes
  const recettesByCategory = useMemo(() => {
    const map: Record<string, { categoryId: string; name: string; amount: number; count: number }> = {};
    reportTransactions
      .filter((t) => t.type === 'RECETTE')
      .forEach((t) => {
        const catKey = t.categoryId || 'autre';
        const catObj = categories.find((c) => c.id === catKey);
        const name = catObj?.name || t.categoryName || 'Autres Offrandes';
        if (!map[name]) {
          map[name] = { categoryId: catKey, name, amount: 0, count: 0 };
        }
        map[name].amount += t.amount;
        map[name].count += 1;
      });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [reportTransactions, categories]);

  // Breakdown by Category for Dépenses
  const depensesByCategory = useMemo(() => {
    const map: Record<string, { categoryId: string; name: string; amount: number; count: number }> = {};
    reportTransactions
      .filter((t) => t.type === 'DÉPENSE')
      .forEach((t) => {
        const catKey = t.categoryId || 'autre';
        const catObj = categories.find((c) => c.id === catKey);
        const name = catObj?.name || t.categoryName || 'Autres Charges';
        if (!map[name]) {
          map[name] = { categoryId: catKey, name, amount: 0, count: 0 };
        }
        map[name].amount += t.amount;
        map[name].count += 1;
      });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [reportTransactions, categories]);

  // Breakdown by Payment Method
  const paymentMethodBreakdown = useMemo(() => {
    const map: Record<string, { method: string; count: number; amount: number }> = {};
    reportTransactions
      .filter((t) => t.type === 'RECETTE')
      .forEach((t) => {
        const m = t.paymentMethod || 'ESPÈCES';
        if (!map[m]) map[m] = { method: m, count: 0, amount: 0 };
        map[m].count += 1;
        map[m].amount += t.amount;
      });
    return Object.values(map);
  }, [reportTransactions]);

  // Monthly timeline (when reportType is ANNUEL)
  const annualMonthlyBreakdown = useMemo(() => {
    if (reportType !== 'ANNUEL') return [];
    return MONTHS_FR.map((mObj) => {
      const prefix = `${selectedYear}-${mObj.value}`;
      const mTx = transactions.filter((t) => t.date && t.date.startsWith(prefix));
      const rec = mTx.filter((t) => t.type === 'RECETTE').reduce((acc, t) => acc + t.amount, 0);
      const dep = mTx.filter((t) => t.type === 'DÉPENSE').reduce((acc, t) => acc + t.amount, 0);
      return {
        monthCode: mObj.value,
        monthName: mObj.name,
        short: mObj.short,
        recettes: rec,
        depenses: dep,
        solde: rec - dep,
        count: mTx.length,
      };
    });
  }, [transactions, reportType, selectedYear]);

  // Weekly breakdown for monthly report
  const weeklyBreakdown = useMemo(() => {
    if (reportType !== 'MENSUEL') return [];
    const weeks = [
      { id: 'w1', name: 'Semaine 1 (1 - 7)', start: 1, end: 7, rec: 0, dep: 0, count: 0 },
      { id: 'w2', name: 'Semaine 2 (8 - 14)', start: 8, end: 14, rec: 0, dep: 0, count: 0 },
      { id: 'w3', name: 'Semaine 3 (15 - 21)', start: 15, end: 21, rec: 0, dep: 0, count: 0 },
      { id: 'w4', name: 'Semaine 4 (22 - 28)', start: 22, end: 28, rec: 0, dep: 0, count: 0 },
      { id: 'w5', name: 'Semaine 5 (29 - 31)', start: 29, end: 31, rec: 0, dep: 0, count: 0 },
    ];

    reportTransactions.forEach((tx) => {
      if (!tx.date) return;
      const day = parseInt(tx.date.substring(8, 10), 10);
      const w = weeks.find((wk) => day >= wk.start && day <= wk.end);
      if (w) {
        if (tx.type === 'RECETTE') w.rec += tx.amount;
        else if (tx.type === 'DÉPENSE') w.dep += tx.amount;
        w.count += 1;
      }
    });

    return weeks;
  }, [reportTransactions, reportType]);

  // Max monthly amount for chart scaling
  const maxAnnualMonthlyAmount = useMemo(() => {
    let m = 1;
    annualMonthlyBreakdown.forEach((item) => {
      if (item.recettes > m) m = item.recettes;
      if (item.depenses > m) m = item.depenses;
    });
    return m;
  }, [annualMonthlyBreakdown]);

  // Selected period textual label
  const periodLabel = useMemo(() => {
    if (reportType === 'ANNUEL') {
      return `Année ${selectedYear}`;
    }
    const mName = MONTHS_FR.find((m) => m.value === selectedMonth)?.name || selectedMonth;
    return `${mName} ${selectedYear}`;
  }, [reportType, selectedYear, selectedMonth]);

  // Journal transactions filtered by search
  const filteredJournalTransactions = useMemo(() => {
    return reportTransactions.filter((tx) => {
      const matchType = journalTypeFilter === 'ALL' || tx.type === journalTypeFilter;
      const q = journalSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.number.toLowerCase().includes(q) ||
        tx.counterparty.toLowerCase().includes(q) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.categoryName && tx.categoryName.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [reportTransactions, journalTypeFilter, journalSearch]);

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // PDF Export Handler
  const handleExportPDF = () => {
    try {
      setIsExportingPDF(true);
      const rCats = recettesByCategory.map((r) => ({
        name: r.name,
        count: r.count,
        amount: r.amount,
        percentage: totalRecettes > 0 ? (r.amount / totalRecettes) * 100 : 0,
      }));

      const dCats = depensesByCategory.map((d) => ({
        name: d.name,
        count: d.count,
        amount: d.amount,
        percentage: totalDepenses > 0 ? (d.amount / totalDepenses) * 100 : 0,
      }));

      generateFinancialReportPDF({
        settings,
        reportType,
        periodLabel,
        selectedYear,
        selectedMonth: reportType === 'MENSUEL' ? selectedMonth : undefined,
        totalRecettes,
        totalDepenses,
        soldeNet,
        recettesByCategory: rCats,
        depensesByCategory: dCats,
        transactions: reportTransactions,
        operatorName: 'Trésorerie Paroissiale EMF',
      });
    } catch (err) {
      console.error('Erreur génération rapport PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 800);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,\uFEFF';
    csv += `RAPPORT FINANCIER OFFICIEL - ${settings.churchName}\n`;
    csv += `Type de Rapport,${reportType === 'ANNUEL' ? 'ANNUEL' : 'MENSUEL'}\n`;
    csv += `Période,${periodLabel}\n`;
    csv += `Date d'extraction,${new Date().toLocaleDateString('fr-FR')}\n\n`;

    csv += `RÉSUMÉ CONSOLIDÉ\n`;
    csv += `Total Recettes (FCFA),${totalRecettes}\n`;
    csv += `Total Dépenses (FCFA),${totalDepenses}\n`;
    csv += `Solde Net de Caisse (FCFA),${soldeNet}\n`;
    csv += `Nombre total de transactions,${reportTransactions.length}\n\n`;

    csv += `RÉPARTITION DES RECETTES PAR POSTE\n`;
    csv += `Catégorie,Nombre de Dons,Total Encaissé (FCFA),Part (%)\n`;
    recettesByCategory.forEach((r) => {
      const pct = totalRecettes > 0 ? ((r.amount / totalRecettes) * 100).toFixed(1) : '0';
      csv += `"${r.name}",${r.count},${r.amount},${pct}%\n`;
    });

    csv += `\nRÉPARTITION DES DÉPENSES PAR POSTE\n`;
    csv += `Catégorie,Nombre d'Opérations,Total Décaissé (FCFA),Part (%)\n`;
    depensesByCategory.forEach((d) => {
      const pct = totalDepenses > 0 ? ((d.amount / totalDepenses) * 100).toFixed(1) : '0';
      csv += `"${d.name}",${d.count},${d.amount},${pct}%\n`;
    });

    if (reportType === 'ANNUEL') {
      csv += `\nÉVOLUTION MENSUELLE SUR L'EXERCICE ${selectedYear}\n`;
      csv += `Mois,Recettes (FCFA),Dépenses (FCFA),Solde Mensuel (FCFA),Transactions\n`;
      annualMonthlyBreakdown.forEach((m) => {
        csv += `"${m.monthName}",${m.recettes},${m.depenses},${m.solde},${m.count}\n`;
      });
    }

    csv += `\nJOURNAL DES TRANSACTIONS DÉTAILLÉES\n`;
    csv += `N° Quittance,Date,Type,Poste Budgétaire,Donateur/Bénéficiaire,Règlement,Montant (FCFA),Description\n`;
    reportTransactions.forEach((t) => {
      csv += `"${t.number}","${t.date}","${t.type}","${t.categoryName || ''}","${t.counterparty}","${t.paymentMethod}",${t.amount},"${(t.description || '').replace(/"/g, '""')}"\n`;
    });

    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `rapport_financier_${reportType.toLowerCase()}_${selectedYear}_${selectedMonth}.csv`;
    link.click();
  };

  // Export HTML standalone printable document
  const handleDownloadStandaloneHTML = () => {
    const element = document.getElementById('printable-financial-report');
    if (!element) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Financier ${reportType === 'ANNUEL' ? 'Annuel' : 'Mensuel'} - ${periodLabel} - ${settings.churchName}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 10pt; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 9px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; color: #4A0E17; }
    .header-box { border-bottom: 3px solid #6E1325; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .text-emerald { color: #047857; }
    .text-rose { color: #be123c; }
    .text-blue { color: #4A0E17; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; text-align: center; }
    .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; page-break-inside: avoid; }
    .sign-box { border-top: 1px solid #94a3b8; padding-top: 6px; margin-top: 45px; font-size: 8.5pt; color: #64748b; text-align: center; }
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
    a.download = `rapport_financier_${reportType.toLowerCase()}_${selectedYear}_${selectedMonth}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Interactive Control Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Type Toggle & Period Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Report Type: Mensuel vs Annuel */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setReportType('MENSUEL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                reportType === 'MENSUEL'
                  ? 'bg-[#4A0E17] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Rapport Mensuel</span>
            </button>

            <button
              onClick={() => setReportType('ANNUEL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                reportType === 'ANNUEL'
                  ? 'bg-[#4A0E17] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Rapport Annuel (Bilan)</span>
            </button>
          </div>

          {/* Year selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
            <span className="text-slate-400 font-medium">Année :</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-black text-[#4A0E17] focus:outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month selector (if MENSUEL) */}
          {reportType === 'MENSUEL' && (
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
              <span className="text-slate-400 font-medium">Mois :</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-black text-[#4A0E17] focus:outline-none cursor-pointer"
              >
                {MONTHS_FR.map((m) => {
                  const cnt = monthCountsForYear[m.value] || 0;
                  return (
                    <option key={m.value} value={m.value}>
                      {m.name} {cnt > 0 ? `(${cnt} ops)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons: Exporter PDF, Imprimer, HTML, CSV */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="Exporter le rapport officiel complet en PDF haute fidélité"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingPDF ? 'Exportation...' : 'Exporter PDF'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-200 shadow-2xs"
            title="Exporter le rapport comptable au format CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={handleDownloadStandaloneHTML}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#6E1325] text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-blue-200 shadow-2xs"
            title="Télécharger la fiche officielle HTML"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Fiche HTML</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
            title="Imprimer directement le rapport"
          >
            <Printer className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Quick Month Selector Bar (when in Monthly mode) */}
      {reportType === 'MENSUEL' && (
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider flex items-center space-x-1 flex-shrink-0">
            <Calendar className="w-3 h-3 text-[#C99B2E]" />
            <span>Mois {selectedYear} :</span>
          </span>
          {MONTHS_FR.map((m) => {
            const isSelected = selectedMonth === m.value;
            const count = monthCountsForYear[m.value] || 0;
            return (
              <button
                key={m.value}
                onClick={() => setSelectedMonth(m.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#4A0E17] text-white shadow-xs'
                    : count > 0
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>{m.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-[#C99B2E] text-[#4A0E17] font-black' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Printable Report Canvas */}
      <div
        id="printable-financial-report"
        className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Official Header */}
        <div className="border-b-2 border-[#6E1325] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center space-x-4">
            <ChurchLogo size="lg" />
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#C99B2E] block">
                {settings.churchName || 'Église Missionnaire de la Foi'} • Sangmelima
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#4A0E17] tracking-tight">
                {reportType === 'ANNUEL'
                  ? `RAPPORT FINANCIER & BILAN ANNUEL — EXERCICE ${selectedYear}`
                  : `RAPPORT FINANCIER MENSUEL — ${periodLabel.toUpperCase()}`}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Paroisse du Grand Temple d'Akon • Dja-et-Lobo, Région du Sud, Cameroun
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200 sm:bg-transparent sm:p-0 sm:border-none">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#4A0E17] text-white inline-block shadow-2xs">
              {reportType === 'ANNUEL' ? 'BILAN CONSOLIDÉ ANNUEL' : 'POINT MENSUEL DE TRÉSORERIE'}
            </span>
            <p className="text-slate-600 font-medium pt-1">
              Période : <strong className="text-slate-900">{periodLabel}</strong>
            </p>
            <p className="text-slate-400 text-[11px]">
              Généré le {formatDateDouala(new Date().toISOString(), true)}
            </p>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center justify-center space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Recettes Encaissées</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {formatFCFA(totalRecettes)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block">
              {reportTransactions.filter((t) => t.type === 'RECETTE').length} offrandes, dîmes & dons
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider flex items-center justify-center space-x-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Total Dépenses Décaissées</span>
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-700">
              {formatFCFA(totalDepenses)}
            </div>
            <span className="text-[10px] text-rose-600 font-semibold block">
              {reportTransactions.filter((t) => t.type === 'DÉPENSE').length} charges & déblocages
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#4A0E17] tracking-wider flex items-center justify-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Solde Net de Caisse</span>
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black ${
                soldeNet >= 0 ? 'text-[#6E1325]' : 'text-rose-600'
              }`}
            >
              {formatFCFA(soldeNet)}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              {soldeNet >= 0 ? '✓ Excédent budgétaire en trésorerie' : '⚠ Déficit sur la période'}
            </span>
          </div>
        </div>

        {/* Narrative & Legal Certification Paragraph */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700 space-y-2">
          <div className="flex items-center space-x-2 text-[#4A0E17] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#C99B2E]" />
            <span>Synthèse & Certification Comptable — {periodLabel}</span>
          </div>
          <p>
            Pour la période sous revue, la communauté a réuni un volume total de recettes de{' '}
            <strong className="text-emerald-800">{formatFCFA(totalRecettes)}</strong> contre un ensemble de dépenses
            opérationnelles, pastorales et d'investissement de{' '}
            <strong className="text-rose-800">{formatFCFA(totalDepenses)}</strong>. Le résultat financier dégage un
            solde net en caisse de{' '}
            <strong className={soldeNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              {formatFCFA(soldeNet)}
            </strong>
            .
          </p>
          <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 italic">
            « Arrêté le présent état financier à la somme nette de :{' '}
            <strong className="not-italic text-[#4A0E17] font-bold">
              {numberToFrenchWords(Math.abs(soldeNet))} Francs CFA
            </strong>{' '}
            ({soldeNet >= 0 ? 'Excédent' : 'Déficit'}) »
          </div>
        </div>

        {/* If ANNUAL mode: Visual Chart of 12 Months */}
        {reportType === 'ANNUEL' && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#C99B2E]" />
                <span>Comparatif Visuel Recettes vs Dépenses par Mois ({selectedYear})</span>
              </h3>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span>
                  <span className="text-slate-600 font-semibold">Recettes</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
                  <span className="text-slate-600 font-semibold">Dépenses</span>
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="grid grid-cols-12 gap-1.5 sm:gap-2 h-44 items-end pb-2 pt-4">
                {annualMonthlyBreakdown.map((m) => {
                  const recPct = maxAnnualMonthlyAmount > 0 ? (m.recettes / maxAnnualMonthlyAmount) * 100 : 0;
                  const depPct = maxAnnualMonthlyAmount > 0 ? (m.depenses / maxAnnualMonthlyAmount) * 100 : 0;
                  return (
                    <div key={m.monthCode} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-[#4A0E17] text-white text-[9px] py-1 px-2 rounded shadow-md z-10 whitespace-nowrap">
                        {m.monthName}: Rec: {formatFCFA(m.recettes)} | Dép: {formatFCFA(m.depenses)}
                      </div>

                      <div className="w-full flex items-end justify-center space-x-0.5 sm:space-x-1 h-32">
                        {/* Recette bar */}
                        <div
                          className="w-1/2 bg-emerald-600 rounded-t-sm transition-all duration-300 min-h-[2px]"
                          style={{ height: `${Math.max(2, recPct)}%` }}
                          title={`Recettes ${m.monthName}: ${formatFCFA(m.recettes)}`}
                        />
                        {/* Depense bar */}
                        <div
                          className="w-1/2 bg-rose-500 rounded-t-sm transition-all duration-300 min-h-[2px]"
                          style={{ height: `${Math.max(2, depPct)}%` }}
                          title={`Dépenses ${m.monthName}: ${formatFCFA(m.depenses)}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-2 block truncate">
                        {m.short}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* If MONTHLY mode: Weekly Breakdown */}
        {reportType === 'MENSUEL' && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#C99B2E]" />
              <span>Répartition Hebdomadaire & Cultes du Mois</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {weeklyBreakdown.map((w) => (
                <div key={w.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block truncate uppercase">
                    {w.name}
                  </span>
                  <div className="text-xs font-black text-emerald-700">
                    +{formatFCFA(w.rec)}
                  </div>
                  <div className="text-[11px] font-medium text-rose-600">
                    -{formatFCFA(w.dep)}
                  </div>
                  <span className="text-[9px] text-slate-400 block pt-0.5">
                    {w.count} opération(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Postes Budgétaires : Recettes & Dépenses Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Section Recettes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-800 font-black text-xs uppercase tracking-wider">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>1. Détail des Recettes par Catégorie</span>
              </div>
              <span className="text-xs font-bold text-emerald-700">{formatFCFA(totalRecettes)}</span>
            </div>

            {recettesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucune recette enregistrée pour cette période.
              </p>
            ) : (
              <div className="space-y-2">
                {recettesByCategory.map((cat) => {
                  const percent = totalRecettes > 0 ? (cat.amount / totalRecettes) * 100 : 0;
                  return (
                    <div
                      key={cat.name}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="truncate">{cat.name}</span>
                        <span className="text-emerald-700 font-black">{formatFCFA(cat.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{cat.count} versement(s)</span>
                        <span className="font-semibold text-slate-600">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section Dépenses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <div className="flex items-center space-x-2 text-rose-800 font-black text-xs uppercase tracking-wider">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <span>2. Détail des Dépenses par Catégorie</span>
              </div>
              <span className="text-xs font-bold text-rose-700">{formatFCFA(totalDepenses)}</span>
            </div>

            {depensesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Aucune dépense enregistrée pour cette période.
              </p>
            ) : (
              <div className="space-y-2">
                {depensesByCategory.map((cat) => {
                  const percent = totalDepenses > 0 ? (cat.amount / totalDepenses) * 100 : 0;
                  return (
                    <div
                      key={cat.name}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span className="truncate">{cat.name}</span>
                        <span className="text-rose-700 font-black">{formatFCFA(cat.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{cat.count} engagement(s)</span>
                        <span className="font-semibold text-slate-600">{percent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-rose-600 h-1.5 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Section Annuelle : Tableau d'Évolution Mensuelle sur les 12 Mois */}
        {reportType === 'ANNUEL' && (
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#C99B2E]" />
                <span>3. Tableau d'Évolution Mensuelle — Exercice {selectedYear}</span>
              </h3>
              <span className="text-[11px] text-slate-400">12 mois comptables</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#4A0E17] text-white">
                  <tr>
                    <th className="py-2.5 px-3">Mois</th>
                    <th className="py-2.5 px-3 text-right">Recettes (FCFA)</th>
                    <th className="py-2.5 px-3 text-right">Dépenses (FCFA)</th>
                    <th className="py-2.5 px-3 text-right">Solde Mensuel (FCFA)</th>
                    <th className="py-2.5 px-3 text-center">Opérations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {annualMonthlyBreakdown.map((m) => (
                    <tr
                      key={m.monthCode}
                      className={m.recettes > 0 || m.depenses > 0 ? 'hover:bg-slate-50' : 'text-slate-400'}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-800">{m.monthName}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                        {formatFCFA(m.recettes)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-rose-700">
                        {formatFCFA(m.depenses)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-black ${
                          m.solde >= 0 ? 'text-[#6E1325]' : 'text-rose-600'
                        }`}
                      >
                        {formatFCFA(m.solde)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {m.count}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-3 uppercase">Total Annuel {selectedYear}</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-black">
                      {formatFCFA(totalRecettes)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-700 font-black">
                      {formatFCFA(totalDepenses)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-black ${
                        soldeNet >= 0 ? 'text-[#4A0E17]' : 'text-rose-600'
                      }`}
                    >
                      {formatFCFA(soldeNet)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      {reportTransactions.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Moyens de Paiement Utilisés */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-[#C99B2E]" />
            <span>4. Canaux d'Encaissement & Moyens de Paiement</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentMethodBreakdown.map((p) => {
              const pct = totalRecettes > 0 ? (p.amount / totalRecettes) * 100 : 0;
              return (
                <div key={p.method} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
                    {p.method}
                  </span>
                  <div className="text-sm font-black text-[#4A0E17] mt-0.5">
                    {formatFCFA(p.amount)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {p.count} reçu(s) • {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Transactions Journal Table */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#4A0E17] flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#C99B2E]" />
              <span>5. Journal des Transactions ({reportTransactions.length})</span>
            </h3>

            {/* Quick search & filter toolbar (hidden when printing) */}
            <div className="flex items-center space-x-2 print:hidden">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6E1325] w-36 sm:w-44"
                />
              </div>

              <select
                value={journalTypeFilter}
                onChange={(e) => setJournalTypeFilter(e.target.value as any)}
                className="py-1 px-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tous</option>
                <option value="RECETTE">Recettes</option>
                <option value="DÉPENSE">Dépenses</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">N° Quittance</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Poste Budgétaire</th>
                  <th className="py-2.5 px-3">Donateur / Bénéficiaire</th>
                  <th className="py-2.5 px-3">Règlement</th>
                  <th className="py-2.5 px-3 text-right">Montant</th>
                  <th className="py-2.5 px-3 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredJournalTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      Aucune transaction répertoriée pour cette sélection.
                    </td>
                  </tr>
                ) : (
                  filteredJournalTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => onOpenReceipt && onOpenReceipt(tx)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                      title="Cliquer pour afficher la quittance officielle"
                    >
                      <td className="py-2 px-3 font-mono font-bold text-[#6E1325]">
                        {tx.number}
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            tx.type === 'RECETTE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-800">
                        {tx.categoryName || 'Général'}
                      </td>
                      <td className="py-2 px-3 text-slate-700 max-w-[150px] truncate">
                        {tx.counterparty}
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {tx.paymentMethod}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-black whitespace-nowrap ${
                          tx.type === 'RECETTE' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.type === 'RECETTE' ? '+' : '-'} {formatFCFA(tx.amount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateReceiptPDF(tx, settings);
                          }}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50 transition cursor-pointer inline-flex items-center"
                          title="Télécharger directement la quittance PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-rose-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Signatures Grid */}
        <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs page-break-inside-avoid">
          <div className="space-y-1">
            <span className="font-bold text-slate-700 block">Le Trésorier Paroissial</span>
            <p className="text-[10px] text-slate-400 italic">Pour certification des comptes</p>
            <div className="h-16 border-b border-dashed border-slate-300"></div>
            <span className="text-[11px] font-bold text-slate-800 block pt-1">
              Frère Zacharie Mbida
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-700 block">La Commission des Finances</span>
            <p className="text-[10px] text-slate-400 italic">Conseil Diaconal & Contrôle</p>
            <div className="h-16 border-b border-dashed border-slate-300"></div>
            <span className="text-[11px] font-bold text-slate-800 block pt-1">
              Diaconat & Auditeurs
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-slate-700 block">Le Pasteur Principal</span>
            <p className="text-[10px] text-slate-400 italic">Approbation pastorale</p>
            <div className="h-16 border-b border-dashed border-slate-300"></div>
            <span className="text-[11px] font-bold text-[#4A0E17] block pt-1">
              Pasteur Samuel Ondoa
            </span>
          </div>
        </div>

        {/* Footer legal & biblical verse */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
          <span>
            {settings.churchName || 'Église Missionnaire de la Foi'} • {settings.address || 'Sangmelima, Cameroun'}
          </span>
          <span className="italic">
            « Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes » — Colossiens 3:23
          </span>
        </div>
      </div>
    </div>
  );
};
