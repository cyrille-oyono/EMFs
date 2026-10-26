import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  Filter,
  DollarSign,
  Smartphone,
  Building2,
  Coins,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Transaction, TransactionCategory } from '../../types';
import { formatFCFA } from '../../utils/formatters';

interface FinancialVisualSummaryProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
  className?: string;
}

interface MonthlyData {
  key: string; // YYYY-MM
  label: string; // e.g. "Jan 2026"
  year: number;
  monthIndex: number;
  recettes: number;
  depenses: number;
  count: number;
  categories: Record<string, number>;
}

interface CategoryBreakdown {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const MONTH_SHORT_FR = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const PALETTE_COLORS = [
  '#6E1325', // Bleu Paroisse
  '#C99B2E', // Or Paroissial
  '#10B981', // Émeraude
  '#F59E0B', // Ambre
  '#6366F1', // Indigo
  '#EC4899', // Rose
  '#14B8A6', // Turquoise
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#64748B', // Ardoise
];

export const FinancialVisualSummary: React.FC<FinancialVisualSummaryProps> = ({
  transactions,
  categories,
  className = '',
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [viewMetric, setViewMetric] = useState<'recettes' | 'comparatif'>('recettes');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Extract distinct years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = tx.date.substring(0, 4);
        if (y) years.add(y);
      }
    });
    const list = Array.from(years).sort().reverse();
    return list.length > 0 ? list : ['2026'];
  }, [transactions]);

  // Filter transactions by selected year (or all)
  const filteredTxs = useMemo(() => {
    if (selectedYear === 'ALL') return transactions;
    return transactions.filter((t) => t.date && t.date.startsWith(selectedYear));
  }, [transactions, selectedYear]);

  // Aggregate monthly data
  const monthlyData = useMemo(() => {
    const map: Record<string, MonthlyData> = {};

    // Initialize months for the selected year if a specific year is selected
    if (selectedYear !== 'ALL') {
      const y = parseInt(selectedYear, 10);
      for (let m = 0; m < 12; m++) {
        const mm = String(m + 1).padStart(2, '0');
        const key = `${y}-${mm}`;
        map[key] = {
          key,
          label: `${MONTH_SHORT_FR[m]}`,
          year: y,
          monthIndex: m,
          recettes: 0,
          depenses: 0,
          count: 0,
          categories: {},
        };
      }
    }

    filteredTxs.forEach((tx) => {
      if (!tx.date) return;
      const key = tx.date.substring(0, 7); // YYYY-MM
      if (!map[key]) {
        const [yStr, mStr] = key.split('-');
        const mIdx = parseInt(mStr, 10) - 1;
        map[key] = {
          key,
          label: `${MONTH_SHORT_FR[mIdx] || mStr} ${yStr}`,
          year: parseInt(yStr, 10),
          monthIndex: mIdx,
          recettes: 0,
          depenses: 0,
          count: 0,
          categories: {},
        };
      }

      if (tx.type === 'RECETTE') {
        map[key].recettes += tx.amount;
        map[key].count += 1;
        const catName = tx.categoryName || 'Offrandes';
        map[key].categories[catName] = (map[key].categories[catName] || 0) + tx.amount;
      } else if (tx.type === 'DÉPENSE') {
        map[key].depenses += tx.amount;
      }
    });

    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredTxs, selectedYear]);

  // Breakdown by Offering Type (Recettes only)
  const categoryBreakdown = useMemo(() => {
    const catMap: Record<string, { name: string; amount: number; count: number }> = {};
    let totalRecettes = 0;

    filteredTxs.forEach((tx) => {
      if (tx.type === 'RECETTE') {
        const catId = tx.categoryId || 'other';
        const catName = tx.categoryName || 'Dîmes & Offrandes';
        if (!catMap[catId]) {
          catMap[catId] = { name: catName, amount: 0, count: 0 };
        }
        catMap[catId].amount += tx.amount;
        catMap[catId].count += 1;
        totalRecettes += tx.amount;
      }
    });

    const items = Object.entries(catMap).map(([id, data], idx) => ({
      id,
      name: data.name,
      amount: data.amount,
      count: data.count,
      percentage: totalRecettes > 0 ? (data.amount / totalRecettes) * 100 : 0,
      color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
    }));

    return items.sort((a, b) => b.amount - a.amount);
  }, [filteredTxs]);

  // Breakdown by Payment Channel
  const paymentChannelBreakdown = useMemo(() => {
    const channelMap: Record<string, { label: string; amount: number; count: number; icon: any; color: string }> = {
      MOBILE_MONEY: {
        label: 'MTN Mobile Money',
        amount: 0,
        count: 0,
        icon: Smartphone,
        color: '#F59E0B',
      },
      ORANGE_MONEY: {
        label: 'Orange Money',
        amount: 0,
        count: 0,
        icon: Smartphone,
        color: '#F97316',
      },
      ESPÈCES: {
        label: 'Espèces au Culte',
        amount: 0,
        count: 0,
        icon: Coins,
        color: '#10B981',
      },
      VIREMENT: {
        label: 'Virement Bancaire',
        amount: 0,
        count: 0,
        icon: Building2,
        color: '#6E1325',
      },
    };

    let totalRecettes = 0;
    filteredTxs.forEach((tx) => {
      if (tx.type === 'RECETTE') {
        totalRecettes += tx.amount;
        const method = tx.paymentMethod || 'ESPÈCES';
        // Check if description hints at Orange Money
        let key = method as string;
        if (
          method === 'MOBILE_MONEY' &&
          (tx.description?.toLowerCase().includes('orange') || tx.counterparty?.toLowerCase().includes('orange'))
        ) {
          key = 'ORANGE_MONEY';
        } else if (!channelMap[key]) {
          key = 'ESPÈCES';
        }

        channelMap[key].amount += tx.amount;
        channelMap[key].count += 1;
      }
    });

    return Object.values(channelMap).map((c) => ({
      ...c,
      percentage: totalRecettes > 0 ? (c.amount / totalRecettes) * 100 : 0,
    }));
  }, [filteredTxs]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalRecettes = filteredTxs
      .filter((t) => t.type === 'RECETTE')
      .reduce((s, t) => s + t.amount, 0);

    const totalDepenses = filteredTxs
      .filter((t) => t.type === 'DÉPENSE')
      .reduce((s, t) => s + t.amount, 0);

    const activeMonths = monthlyData.filter((m) => m.recettes > 0 || m.depenses > 0);
    const avgMonthlyRecette =
      activeMonths.length > 0 ? totalRecettes / activeMonths.length : totalRecettes;

    const highestMonth = [...monthlyData].sort((a, b) => b.recettes - a.recettes)[0];
    const topCategory = categoryBreakdown[0];

    return {
      totalRecettes,
      totalDepenses,
      soldeNet: totalRecettes - totalDepenses,
      avgMonthlyRecette,
      highestMonth: highestMonth && highestMonth.recettes > 0 ? highestMonth : null,
      topCategory: topCategory && topCategory.amount > 0 ? topCategory : null,
      totalCount: filteredTxs.filter((t) => t.type === 'RECETTE').length,
    };
  }, [filteredTxs, monthlyData, categoryBreakdown]);

  // Max value for bar chart scaling
  const maxMonthValue = useMemo(() => {
    const maxRecette = Math.max(...monthlyData.map((m) => m.recettes), 100000);
    const maxDepense = Math.max(...monthlyData.map((m) => m.depenses), 0);
    return viewMetric === 'comparatif' ? Math.max(maxRecette, maxDepense) : maxRecette;
  }, [monthlyData, viewMetric]);

  // Calculate SVG arc path for Donut chart
  const donutPaths = useMemo(() => {
    let currentAngle = -Math.PI / 2;
    const cx = 100;
    const cy = 100;
    const rOuter = 82;
    const rInner = 52;

    return categoryBreakdown.map((item) => {
      const sliceAngle = (item.percentage / 100) * (Math.PI * 2);
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      // Slices that are virtually zero degrees shouldn't create invalid SVGs
      if (item.percentage <= 0.01) return null;

      const x1 = cx + rOuter * Math.cos(startAngle);
      const y1 = cy + rOuter * Math.sin(startAngle);
      const x2 = cx + rOuter * Math.cos(endAngle);
      const y2 = cy + rOuter * Math.sin(endAngle);

      const x3 = cx + rInner * Math.cos(endAngle);
      const y3 = cy + rInner * Math.sin(endAngle);
      const x4 = cx + rInner * Math.cos(startAngle);
      const y4 = cy + rInner * Math.sin(startAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      return {
        id: item.id,
        name: item.name,
        color: item.color,
        amount: item.amount,
        percentage: item.percentage,
        count: item.count,
        pathData,
      };
    }).filter(Boolean);
  }, [categoryBreakdown]);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-5 sm:p-7 ${className}`}>
      {/* Visual Summary Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E] mb-1">
            <BarChart3 className="w-4 h-4 text-[#6E1325]" />
            <span>Tableau de Bord Visuel des Finances Paroissiales</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#4A0E17] tracking-tight">
            Revenus Mensuels & Répartition des Offrandes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyse détaillée des dîmes, dons de bâtisseurs, offrandes ordinaires et canaux d'encaissement à Sangmelima
          </p>
        </div>

        {/* Year & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-[#6E1325] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {yr}
              </button>
            ))}
            <button
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedYear === 'ALL'
                  ? 'bg-[#6E1325] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tout
            </button>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setViewMetric('recettes')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMetric === 'recettes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenus Seuls
            </button>
            <button
              onClick={() => setViewMetric('comparatif')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMetric === 'comparatif'
                  ? 'bg-[#4A0E17] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recettes vs Dépenses
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenues */}
        <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold uppercase tracking-wider">
            <span>Revenus Totaux ({selectedYear})</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
            {formatFCFA(stats.totalRecettes)}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center space-x-1">
            <span>{stats.totalCount} versements enregistrés</span>
          </div>
        </div>

        {/* Monthly Average */}
        <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold uppercase tracking-wider">
            <span>Moyenne Mensuelle</span>
            <div className="w-7 h-7 rounded-lg bg-[#C99B2E] text-[#4A0E17] flex items-center justify-center font-black">
              ~
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#4A0E17] font-mono">
            {formatFCFA(Math.round(stats.avgMonthlyRecette))}
          </div>
          <div className="text-[11px] text-amber-800">
            Régularité financière de la paroisse
          </div>
        </div>

        {/* Peak Month */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl border border-blue-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6E1325] font-bold uppercase tracking-wider">
            <span>Mois Record</span>
            <div className="w-7 h-7 rounded-lg bg-[#6E1325] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#C99B2E]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#4A0E17] font-mono truncate">
            {stats.highestMonth ? formatFCFA(stats.highestMonth.recettes) : '0 FCFA'}
          </div>
          <div className="text-[11px] text-[#6E1325] font-bold">
            {stats.highestMonth ? `${stats.highestMonth.label} (${stats.highestMonth.count} offrandes)` : 'Aucune donnée'}
          </div>
        </div>

        {/* Primary Offering Type */}
        <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-2xl border border-purple-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-800 font-bold uppercase tracking-wider">
            <span>Offrande Dominante</span>
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-950 truncate">
            {stats.topCategory ? stats.topCategory.name : 'Dîmes'}
          </div>
          <div className="text-[11px] text-purple-700 font-bold">
            {stats.topCategory ? `${stats.topCategory.percentage.toFixed(1)}% des revenus (${formatFCFA(stats.topCategory.amount)})` : '0%'}
          </div>
        </div>
      </div>

      {/* Main Grid: Chart 1 (Monthly Revenues) & Chart 2 (Breakdown by Type) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* GRAPH 1: TOTAL MONTHLY REVENUES (BAR & AREA INTERACTIVE CHART)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#6E1325] text-white flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#C99B2E]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#4A0E17]">
                  Évolution des Revenus Mensuels Totaux
                </h3>
                <p className="text-[11px] text-slate-500">
                  {viewMetric === 'comparatif'
                    ? 'Comparatif mensuel Recettes (vert) et Dépenses (rose)'
                    : 'Montants cumulés collectés chaque mois (FCFA)'}
                </p>
              </div>
            </div>

            {hoveredMonth && (
              <div className="text-right animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">
                  {hoveredMonth.label}
                </span>
                <span className="text-xs font-black text-emerald-700 font-mono">
                  {formatFCFA(hoveredMonth.recettes)}
                </span>
              </div>
            )}
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-4 pb-2 relative flex items-end justify-between gap-1.5 sm:gap-2.5 border-b border-slate-200">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[9px] text-slate-400 -mt-2 pr-1">{formatFCFA(maxMonthValue)}</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[9px] text-slate-400 -mt-2 pr-1">{formatFCFA(Math.round(maxMonthValue * 0.66))}</span>
              </div>
              <div className="border-b border-dashed border-slate-300 w-full flex justify-end">
                <span className="text-[9px] text-slate-400 -mt-2 pr-1">{formatFCFA(Math.round(maxMonthValue * 0.33))}</span>
              </div>
              <div className="w-full flex justify-end">
                <span className="text-[9px] text-slate-400 -mt-2 pr-1">0 FCFA</span>
              </div>
            </div>

            {/* Monthly Columns */}
            {monthlyData.map((m) => {
              const recetteHeight = maxMonthValue > 0 ? (m.recettes / maxMonthValue) * 100 : 0;
              const depenseHeight = maxMonthValue > 0 ? (m.depenses / maxMonthValue) * 100 : 0;
              const isHovered = hoveredMonth?.key === m.key;

              return (
                <div
                  key={m.key}
                  onMouseEnter={() => setHoveredMonth(m)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 z-30 bg-[#4A0E17] text-white p-2.5 rounded-xl shadow-xl text-left border border-[#C99B2E] w-44 pointer-events-none animate-in fade-in slide-in-from-bottom-1">
                      <div className="text-[10px] font-bold text-[#C99B2E] uppercase">
                        {m.label}
                      </div>
                      <div className="text-xs font-black text-white mt-0.5 font-mono">
                        {formatFCFA(m.recettes)}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1 flex justify-between">
                        <span>Versements :</span>
                        <span className="font-bold text-white">{m.count}</span>
                      </div>
                      {viewMetric === 'comparatif' && (
                        <div className="text-[10px] text-rose-300 flex justify-between pt-1 border-t border-white/10 mt-1">
                          <span>Dépenses :</span>
                          <span className="font-bold">{formatFCFA(m.depenses)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bars Container */}
                  <div className="w-full flex items-end justify-center space-x-0.5 sm:space-x-1 h-full z-10">
                    {/* Recettes Bar */}
                    <div
                      style={{ height: `${Math.max(recetteHeight, 4)}%` }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                        m.recettes > 0
                          ? isHovered
                            ? 'bg-amber-400 shadow-md ring-2 ring-[#4A0E17]'
                            : 'bg-gradient-to-t from-[#6E1325] to-[#2563EB] hover:from-[#4A0E17] hover:to-amber-500'
                          : 'bg-slate-200'
                      }`}
                    ></div>

                    {/* Dépenses Bar (when comparatif is active) */}
                    {viewMetric === 'comparatif' && (
                      <div
                        style={{ height: `${Math.max(depenseHeight, 4)}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                          m.depenses > 0
                            ? isHovered
                              ? 'bg-rose-400 shadow-md'
                              : 'bg-gradient-to-t from-rose-700 to-rose-400'
                            : 'bg-slate-200'
                        }`}
                      ></div>
                    )}
                  </div>

                  {/* Label Month */}
                  <div className="text-[10px] font-bold text-slate-500 mt-2 truncate w-full text-center group-hover:text-[#4A0E17] group-hover:font-extrabold">
                    {m.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend under chart */}
          <div className="flex flex-wrap items-center justify-between text-xs pt-1 text-slate-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-[#6E1325] to-[#2563EB]"></div>
                <span className="font-semibold text-slate-700">Recettes (Revenus des cultes)</span>
              </div>
              {viewMetric === 'comparatif' && (
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-rose-700 to-rose-400"></div>
                  <span className="font-semibold text-slate-700">Dépenses Paroissiales</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Survolez chaque barre pour le détail
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRAPH 2: BREAKDOWN BY OFFERING TYPE (DONUT & CATEGORY BREAKDOWN)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#C99B2E] text-[#4A0E17] flex items-center justify-center font-black">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#4A0E17]">
                  Répartition par Type d'Offrande
                </h3>
                <p className="text-[11px] text-slate-500">
                  Part relative de chaque contribution chrétienne
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
              {categoryBreakdown.length} catégories
            </span>
          </div>

          {/* Donut Chart and Center Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {donutPaths.map((slice: any) => {
                  const isHighlighted = activeCategory === slice.id;
                  return (
                    <path
                      key={slice.id}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-all duration-300 cursor-pointer hover:opacity-90"
                      style={{
                        transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: '100px 100px',
                      }}
                      onMouseEnter={() => setActiveCategory(slice.id)}
                      onMouseLeave={() => setActiveCategory(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Total
                </span>
                <span className="text-xs sm:text-sm font-black text-[#4A0E17] font-mono leading-tight">
                  {formatFCFA(stats.totalRecettes)}
                </span>
                <span className="text-[9px] text-[#C99B2E] font-extrabold uppercase mt-0.5">
                  100%
                </span>
              </div>
            </div>

            {/* Top 3 Quick Glance */}
            <div className="flex-1 w-full space-y-2">
              {categoryBreakdown.slice(0, 4).map((cat) => {
                const isHighlighted = activeCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    onMouseLeave={() => setActiveCategory(null)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isHighlighted ? 'bg-white shadow-sm ring-1 ring-slate-300' : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        <span className="font-bold text-slate-800 truncate text-[11px]">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono font-black text-[#4A0E17] text-xs shrink-0 ml-2">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Category List Table */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition"
              >
                <div className="flex items-center space-x-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  ></div>
                  <span className="font-semibold text-slate-800 truncate">{cat.name}</span>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="font-mono font-black text-slate-900 block text-xs">
                    {formatFCFA(cat.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cat.count} dons • {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRAPH 3: BREAKDOWN BY PAYMENT CHANNEL (CHANNELS SUMMARY)                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-50/70 rounded-3xl p-5 sm:p-6 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#4A0E17]">
                Canaux d’Encaissement Paroissiaux (Mobile Money, Espèces, Virement)
              </h3>
              <p className="text-[11px] text-slate-500">
                Répartition des montants collectés par moyen de paiement à Sangmelima
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {filteredTxs.filter((t) => t.type === 'RECETTE').length} transactions traitées
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentChannelBreakdown.map((channel) => {
            const IconComponent = channel.icon;
            return (
              <div
                key={channel.label}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 hover:border-[#6E1325]/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: channel.color }}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">{channel.label}</span>
                  </div>
                  <span className="text-xs font-black font-mono" style={{ color: channel.color }}>
                    {channel.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="text-base font-black text-[#4A0E17] font-mono">
                  {formatFCFA(channel.amount)}
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${channel.percentage}%`, backgroundColor: channel.color }}
                  ></div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium text-right">
                  {channel.count} opérations
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
