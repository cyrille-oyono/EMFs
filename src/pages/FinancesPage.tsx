import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Trash2,
  CheckCircle,
  X,
  Search,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Heart,
  ShieldCheck,
  Smartphone,
  Building2,
  Sparkles,
  HelpCircle,
  Coins,
  Receipt,
  Eye,
  Check,
  Send,
  Users,
  BarChart3,
  PieChart,
  FileText,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { Transaction, TransactionCategory, PaymentMethod, TransactionType } from '../types';
import { formatFCFA, formatDateDouala } from '../utils/formatters';
import { FinancialVisualSummary } from '../components/finances/FinancialVisualSummary';
import { FinancialReportView } from '../components/finances/FinancialReportView';
import { generateReceiptPDF } from '../services/pdfGenerator';

interface FinancesPageProps {
  onOpenReceipt: (tx: Transaction) => void;
}

export const FinancesPage: React.FC<FinancesPageProps> = ({ onOpenReceipt }) => {
  const { currentUser, hasPermission, settings } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [summary, setSummary] = useState({
    totalRecettes: 0,
    totalDepenses: 0,
    solde: 0,
    transactionCount: 0,
  });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RECETTE' | 'DÉPENSE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Active Tab
  const isLeadership =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'TRÉSORIER' ||
    currentUser?.role === 'PASTEUR';

  const [activeTab, setActiveTab] = useState<
    'donner' | 'mes-dons' | 'projets' | 'tresorerie' | 'analyse-visuelle' | 'rapports'
  >(isLeadership ? 'tresorerie' : 'donner');

  // Member Giving Form State
  const [givingForm, setGivingForm] = useState({
    categoryType: 'cat-r-1', // Dîmes by default
    amount: 10000,
    customAmount: '',
    paymentChannel: 'MOBILE_MONEY' as 'MOBILE_MONEY' | 'ORANGE_MONEY' | 'ESPECES' | 'VIREMENT',
    donorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    isAnonymous: false,
    phone: currentUser?.phone || '+237 6',
    prayerNote: '',
    projectTarget: '',
  });

  const [givingSuccessTx, setGivingSuccessTx] = useState<Transaction | null>(null);
  const [isSubmittingGiving, setIsSubmittingGiving] = useState(false);

  // Admin/Treasurer Form State
  const [adminFormData, setAdminFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    type: 'RECETTE' as TransactionType,
    categoryId: 'cat-r-1',
    amount: 50000,
    paymentMethod: 'ESPÈCES' as PaymentMethod,
    counterparty: '',
    description: '',
  });

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    const [txs, cats, sum] = await Promise.all([
      apiClient.getTransactions(),
      apiClient.getTransactionCategories(),
      apiClient.getFinancialsSummary(),
    ]);
    setTransactions(txs);
    setCategories(cats);
    setSummary(sum);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Quick Amount presets
  const quickAmounts = [2000, 5000, 10000, 25000, 50000, 100000];

  // Projects list
  const churchProjects = [
    {
      id: 'proj-1',
      title: 'Extension & Vitrage du Grand Temple Akon',
      category: 'Travaux & Bâtiment',
      target: 5000000,
      collected: 3850000,
      description: 'Pose des baies vitrées acoustiques et carrelage de la nef principale.',
    },
    {
      id: 'proj-2',
      title: 'Acquisition Sonorisation & Instruments de Louange',
      category: 'Équipement & Culte',
      target: 2000000,
      collected: 1650000,
      description: 'Console numérique 24 pistes, retours de scène et microphones sans fil.',
    },
    {
      id: 'proj-3',
      title: 'Panier de Solidarité & Entraide Veuves de Sangmelima',
      category: 'Social & Bienfaisance',
      target: 1000000,
      collected: 850000,
      description: 'Distribution de vivres, kits scolaires et soutien médical aux familles démunies.',
    },
  ];

  // Submit Giving Form (by member or visitor)
  const handleSubmitGiving = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = givingForm.customAmount ? Number(givingForm.customAmount) : givingForm.amount;

    if (!finalAmount || finalAmount <= 0) {
      alert('Veuillez spécifier un montant valide pour votre offrande.');
      return;
    }

    const selectedCat = categories.find((c) => c.id === givingForm.categoryType);
    const donor = givingForm.isAnonymous
      ? 'Fidèle Anonyme'
      : givingForm.donorName.trim() || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Fidèle EMF');

    const mappedPaymentMethod: PaymentMethod =
      givingForm.paymentChannel === 'MOBILE_MONEY' || givingForm.paymentChannel === 'ORANGE_MONEY'
        ? 'MOBILE_MONEY'
        : givingForm.paymentChannel === 'VIREMENT'
        ? 'VIREMENT'
        : 'ESPÈCES';

    setIsSubmittingGiving(true);

    try {
      const channelLabel =
        givingForm.paymentChannel === 'MOBILE_MONEY'
          ? 'MTN MoMo'
          : givingForm.paymentChannel === 'ORANGE_MONEY'
          ? 'Orange Money'
          : givingForm.paymentChannel === 'VIREMENT'
          ? 'Virement Bancaire'
          : 'Espèces au Temple';

      const desc = `${selectedCat?.name || 'Offrande'}${givingForm.projectTarget ? ` [${givingForm.projectTarget}]` : ''} via ${channelLabel}${givingForm.prayerNote ? ` • Note: ${givingForm.prayerNote}` : ''}`;

      const newTx = await apiClient.createTransaction(
        {
          date: new Date().toISOString().substring(0, 10),
          type: 'RECETTE',
          categoryId: givingForm.categoryType,
          categoryName: selectedCat?.name || 'Dîmes & Offrandes',
          amount: finalAmount,
          paymentMethod: mappedPaymentMethod,
          counterparty: donor,
          description: desc,
          userId: currentUser?.id || 'usr-guest-giving',
          userName: donor,
          memberId: currentUser?.id,
          isAnonymous: givingForm.isAnonymous,
          phoneNumber: givingForm.phone,
          prayerNote: givingForm.prayerNote,
          projectName: givingForm.projectTarget,
        },
        currentUser || undefined
      );

      setGivingSuccessTx(newTx);
      showToast(`✓ Gloire à Dieu ! Votre offrande de ${formatFCFA(finalAmount)} a été enregistrée.`);
      await loadFinances();
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors de l’enregistrement de votre offrande.');
    } finally {
      setIsSubmittingGiving(false);
    }
  };

  // Admin / Treasurer Transaction submit
  const handleSaveAdminTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.counterparty || adminFormData.amount <= 0) {
      alert('Veuillez renseigner le bénéficiaire/donateur et un montant valide.');
      return;
    }

    const cat = categories.find((c) => c.id === adminFormData.categoryId);

    const newTx = await apiClient.createTransaction(
      {
        ...adminFormData,
        categoryName: cat?.name || 'Général',
        userId: currentUser?.id || 'usr-tresorier-1',
        userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Trésorier',
      },
      currentUser || undefined
    );

    setShowAddModal(false);
    showToast(`✓ Opération ${newTx.number} enregistrée avec succès.`);
    await loadFinances();
    onOpenReceipt(newTx);
  };

  const handleDelete = async (id: string, number: string) => {
    if (confirm(`Êtes-vous sûr de vouloir annuler la transaction ${number} ? Cette action sera tracée dans le journal d'audit.`)) {
      await apiClient.deleteTransaction(id, currentUser || undefined);
      showToast('Transaction annulée.');
      loadFinances();
    }
  };

  // Filtered transactions for bookkeeping
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.number.toLowerCase().includes(search.toLowerCase()) ||
      t.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'ALL' || t.categoryId === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // User's personal contributions
  const myContributions = transactions.filter((t) => {
    if (!currentUser) return false;
    const nameMatches =
      t.counterparty.toLowerCase().includes(currentUser.lastName.toLowerCase()) ||
      t.counterparty.toLowerCase().includes(currentUser.firstName.toLowerCase());
    return t.type === 'RECETTE' && (t.memberId === currentUser.id || t.userId === currentUser.id || nameMatches);
  });

  const myTotalGiven = myContributions.reduce((sum, t) => sum + t.amount, 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Numéro', 'Date', 'Type', 'Catégorie', 'Partie', 'Description', 'Mode', 'Montant FCFA', 'Opérateur'];
    const rows = filteredTransactions.map((t) => [
      t.number,
      t.date,
      t.type,
      `"${t.categoryName || ''}"`,
      `"${t.counterparty}"`,
      `"${t.description}"`,
      t.paymentMethod,
      t.amount,
      `"${t.userName || ''}"`,
    ]);
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `finances_emf_sangmelima_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
  };

  const handleOpenAddAdmin = (type: TransactionType) => {
    const defaultCat = categories.find((c) => c.type === type);
    setAdminFormData({
      date: new Date().toISOString().substring(0, 10),
      type,
      categoryId: defaultCat?.id || (type === 'RECETTE' ? 'cat-r-1' : 'cat-d-1'),
      amount: type === 'RECETTE' ? 25000 : 15000,
      paymentMethod: 'ESPÈCES',
      counterparty: '',
      description: '',
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] text-xs font-bold uppercase tracking-wider border border-[#C99B2E]/30">
              <Coins className="w-3.5 h-3.5" />
              <span>Libéralité & Gestion du Royaume de Dieu</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Finances, Dîmes & Offrandes
            </h1>
            <p className="text-xs md:text-sm text-rose-100/90 leading-relaxed italic">
              « Que chacun donne comme il a résolu en son cœur, sans tristesse ni contrainte ; car Dieu aime celui qui donne avec joie. »
              <span className="font-bold text-[#C99B2E] not-italic block mt-0.5">
                — 2 Corinthiens 9:7
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('donner');
                setGivingSuccessTx(null);
              }}
              className="px-5 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Faire une Offrande</span>
            </button>

            <button
              onClick={() => setActiveTab('rapports')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition border flex items-center space-x-2 cursor-pointer ${
                activeTab === 'rapports'
                  ? 'bg-[#C99B2E] text-[#4A0E17] border-[#C99B2E] shadow-lg font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              <FileText className="w-4 h-4 text-[#C99B2E]" />
              <span>Rapport Mensuel & Annuel</span>
            </button>

            {isLeadership && (
              <button
                onClick={() => setActiveTab('tresorerie')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition border flex items-center space-x-2 cursor-pointer ${
                  activeTab === 'tresorerie'
                    ? 'bg-white text-[#4A0E17] border-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <DollarSign className="w-4 h-4 text-[#C99B2E]" />
                <span>Trésorerie</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('donner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'donner'
                ? 'bg-white text-[#4A0E17] shadow-md'
                : 'text-rose-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Coins className="w-4 h-4 text-[#C99B2E]" />
            <span>Faire une Offrande / Dîme / Don</span>
          </button>

          <button
            onClick={() => setActiveTab('mes-dons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'mes-dons'
                ? 'bg-white text-[#4A0E17] shadow-md'
                : 'text-rose-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#C99B2E]" />
            <span>Mes Contributions & Reçus</span>
            {myContributions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#6E1325] text-white">
                {myContributions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('projets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'projets'
                ? 'bg-white text-[#4A0E17] shadow-md'
                : 'text-rose-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#C99B2E]" />
            <span>Projets & Travaux du Temple</span>
          </button>

          <button
            onClick={() => setActiveTab('analyse-visuelle')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'analyse-visuelle'
                ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md font-black'
                : 'text-rose-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Résumé Visuel & Graphiques</span>
          </button>

          <button
            onClick={() => setActiveTab('rapports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'rapports'
                ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md font-black'
                : 'text-rose-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Rapports Mensuel & Annuel</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#4A0E17] text-white">
              Officiel
            </span>
          </button>

          {isLeadership && (
            <button
              onClick={() => setActiveTab('tresorerie')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeTab === 'tresorerie'
                  ? 'bg-white text-[#4A0E17] shadow-md'
                  : 'text-rose-100/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <DollarSign className="w-4 h-4 text-[#C99B2E]" />
              <span>Comptabilité & Journal Général</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: GIVING PORTAL (Offrande, Dîme, Dons)               */}
      {/* ======================================================== */}
      {activeTab === 'donner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Giving Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E] mb-1">
                <Heart className="w-4 h-4 fill-current text-[#8C182F]" />
                <span>Espace Fidèle • Apportez vos dîmes et offrandes</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#4A0E17]">
                Soutenir l'Œuvre du Seigneur à Sangmelima
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Payez en toute sécurité par MTN Mobile Money, Orange Money, Espèces ou Virement. Un reçu officiel est délivré instantanément.
              </p>
            </div>

            {/* Success Card if just paid */}
            {givingSuccessTx && (
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-3 animate-in zoom-in-95">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950">
                        Votre offrande a été enregistrée avec succès !
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Quittance officielle : <span className="font-mono font-bold">{givingSuccessTx.number}</span> • Montant : <span className="font-bold">{formatFCFA(givingSuccessTx.amount)}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGivingSuccessTx(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-emerald-700 italic">
                    « Que Dieu bénisse abondamment votre fidélité et ouvre sur vous les écluses des cieux (Malachie 3:10) »
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        try {
                          generateReceiptPDF(givingSuccessTx, settings);
                          showToast('✓ Reçu PDF téléchargé avec succès !');
                        } catch (e) {
                          showToast('Erreur génération PDF');
                        }
                      }}
                      className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
                      title="Télécharger le reçu officiel au format PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger Reçu PDF</span>
                    </button>
                    <button
                      onClick={() => onOpenReceipt(givingSuccessTx)}
                      className="px-4 py-2 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer font-black"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer / Voir Reçu</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitGiving} className="space-y-6">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  1. Nature de votre contribution
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {categories
                    .filter((c) => c.type === 'RECETTE')
                    .map((cat) => {
                      const isSelected = givingForm.categoryType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setGivingForm({ ...givingForm, categoryType: cat.id });
                          }}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-[#6E1325] bg-[#FAF0F2] ring-2 ring-[#6E1325]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#4A0E17]' : 'text-slate-800'}`}>
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                            {cat.description || 'Contribution ecclésiastique'}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Amount selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  2. Montant de l'offrande (FCFA)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  {quickAmounts.map((amt) => {
                    const isSelected = !givingForm.customAmount && givingForm.amount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setGivingForm({ ...givingForm, amount: amt, customAmount: '' });
                        }}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border cursor-pointer ${
                          isSelected
                            ? 'bg-[#C99B2E] text-[#4A0E17] border-[#C99B2E] shadow-sm font-black'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {formatFCFA(amt)}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="500"
                    placeholder="Ou saisissez un autre montant personnalisé..."
                    value={givingForm.customAmount}
                    onChange={(e) => {
                      setGivingForm({ ...givingForm, customAmount: e.target.value });
                    }}
                    className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 focus:border-[#6E1325] focus:ring-2 focus:ring-[#6E1325]/20 outline-none text-sm font-bold"
                  />
                  <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">
                    FCFA
                  </span>
                </div>
              </div>

              {/* Payment Channel selector */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  3. Mode de versement
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* MTN MoMo */}
                  <div
                    onClick={() => setGivingForm({ ...givingForm, paymentChannel: 'MOBILE_MONEY' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start space-x-3 ${
                      givingForm.paymentChannel === 'MOBILE_MONEY'
                        ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#4A0E17] font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                      MoMo
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">MTN Mobile Money</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Compte : <span className="font-mono font-bold text-slate-800">{settings?.treasury?.mobileMoney?.accountNumber || '+237 677 33 44 55'}</span>
                      </p>
                      <span className="text-[10px] text-amber-700 block mt-1 font-semibold">
                        {settings?.treasury?.mobileMoney?.merchantCode || 'Code Marchand MoMo Pay : 39210'}
                      </span>
                    </div>
                  </div>

                  {/* Orange Money */}
                  <div
                    onClick={() => setGivingForm({ ...givingForm, paymentChannel: 'ORANGE_MONEY' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start space-x-3 ${
                      givingForm.paymentChannel === 'ORANGE_MONEY'
                        ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                      OM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Orange Money</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Compte : <span className="font-mono font-bold text-slate-800">{settings?.treasury?.orangeMoney?.accountNumber || '+237 699 00 11 22'}</span>
                      </p>
                      <span className="text-[10px] text-orange-700 block mt-1 font-semibold">
                        {settings?.treasury?.orangeMoney?.merchantCode || 'Code Marchand OM : 74892'}
                      </span>
                    </div>
                  </div>

                  {/* Espèces au Temple */}
                  <div
                    onClick={() => setGivingForm({ ...givingForm, paymentChannel: 'ESPECES' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start space-x-3 ${
                      givingForm.paymentChannel === 'ESPECES'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Espèces au Temple / Culte</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dépôt dans le panier du culte ou auprès du diacre de service
                      </p>
                      <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">
                        Émission directe d’une quittance papier et numérique
                      </span>
                    </div>
                  </div>

                  {/* Virement Bancaire */}
                  <div
                    onClick={() => setGivingForm({ ...givingForm, paymentChannel: 'VIREMENT' })}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-start space-x-3 ${
                      givingForm.paymentChannel === 'VIREMENT'
                        ? 'border-[#6E1325] bg-[#FAF0F2] ring-2 ring-[#6E1325]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#6E1325] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Virement Bancaire (RIB)</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Banque : <span className="font-bold text-slate-800">{settings?.treasury?.bankTransfer?.bankName || 'Afriland First Bank Cameroun'}</span>
                      </p>
                      <span className="text-[10px] text-[#6E1325] block mt-1 font-mono font-bold">
                        RIB : {settings?.treasury?.bankTransfer?.accountNumber || '10005 00012 01234567890 45'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donor info & Anonymity */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    4. Informations sur le donateur
                  </span>
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-[#6E1325]">
                    <input
                      type="checkbox"
                      checked={givingForm.isAnonymous}
                      onChange={(e) => setGivingForm({ ...givingForm, isAnonymous: e.target.checked })}
                      className="rounded text-[#6E1325] focus:ring-0 w-4 h-4"
                    />
                    <span>Garder l'offrande anonyme (Matthieu 6:3)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!givingForm.isAnonymous ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Nom complet du donateur
                      </label>
                      <input
                        type="text"
                        required
                        value={givingForm.donorName}
                        onChange={(e) => setGivingForm({ ...givingForm, donorName: e.target.value })}
                        placeholder="Ex: Marie-Claire Bikoula"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                      />
                    </div>
                  ) : (
                    <div className="sm:col-span-1 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <span className="font-bold block">Don Anonyme activé</span>
                      Votre nom n'apparaîtra sur aucun registre public. Seule la mention « Fidèle Anonyme » figurera sur la quittance.
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Numéro Téléphone / WhatsApp (Pour recevoir le reçu)
                    </label>
                    <input
                      type="text"
                      value={givingForm.phone}
                      onChange={(e) => setGivingForm({ ...givingForm, phone: e.target.value })}
                      placeholder="+237 6XX XX XX XX"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Intention de prière ou sujet de reconnaissance (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={givingForm.prayerNote}
                    onChange={(e) => setGivingForm({ ...givingForm, prayerNote: e.target.value })}
                    placeholder="Ex: Action de grâce pour la guérison de mon fils, bénédiction du commerce..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmittingGiving}
                className="w-full py-4 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] hover:from-[#6E1325] hover:to-[#4A0E17] text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Heart className="w-5 h-5 text-[#C99B2E] fill-current" />
                <span>
                  {isSubmittingGiving
                    ? 'Traitement en cours...'
                    : `Confirmer mon offrande de ${formatFCFA(givingForm.customAmount ? Number(givingForm.customAmount) : givingForm.amount)}`}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Why we give & Project Spotlights */}
          <div className="lg:col-span-4 space-y-6">
            {/* Spiritual Encouragement */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#4A0E17]">
                <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                <span>La Grâce de la Libéralité</span>
              </div>
              <h3 className="text-base font-black text-[#4A0E17]">
                Pourquoi donnons-nous nos dîmes et offrandes ?
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Dans la foi chrétienne, l'offrande n'est pas un impôt, mais une marque vivante d'amour, de reconnaissance et d'obéissance envers Dieu qui pourvoit à tous nos besoins.
              </p>
              <div className="space-y-2 pt-2 text-[11px] text-slate-600">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#6E1325] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">✓</div>
                  <span><strong>Entretien du Temple :</strong> Lumière, son, aménagement et accueil des fidèles.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#6E1325] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">✓</div>
                  <span><strong>Soutien Pastoral :</strong> Prendre soin des serviteurs de Dieu à plein temps.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 rounded-full bg-[#6E1325] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">✓</div>
                  <span><strong>Action Sociale :</strong> Secours aux orphelins, veuves et nécessiteux d'Akon et Sangmelima.</span>
                </div>
              </div>
            </div>

            {/* Need Assistance Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sécurité & Transparence</span>
              </div>
              <h4 className="text-sm font-black text-[#4A0E17]">
                Trésorerie Certifiée de Sangmelima
              </h4>
              <p className="text-xs text-slate-500">
                Toutes les transactions sont enregistrées dans le grand livre comptable de l'église, vérifiées par la commission aux comptes et le comité pastoral.
              </p>
              <div className="p-3 bg-[#FAF0F2] rounded-xl border border-rose-200 text-xs text-slate-700 space-y-1">
                <div><strong>Trésorier de paroisse :</strong> Emmanuel Mvondo</div>
                <div><strong>Contact Trésorerie :</strong> +237 694 55 66 77</div>
                <div><strong>Localisation :</strong> Bureau Pastoral, Akon Sangmelima</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY CONTRIBUTIONS & RECEIPTS                       */}
      {/* ======================================================== */}
      {activeTab === 'mes-dons' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <span className="text-xs font-black text-[#C99B2E] uppercase tracking-wider block mb-1">
                  Historique Personnel • {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Fidèle'}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-[#4A0E17]">
                  Mes Offrandes, Dîmes & Quittances
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Retrouvez toutes vos contributions enregistrées et téléchargez ou imprimez vos reçus officiels à tout moment.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl text-right">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Donné cette Année
                </span>
                <div className="text-2xl font-black text-emerald-700">
                  {formatFCFA(myTotalGiven)}
                </div>
              </div>
            </div>

            {myContributions.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Receipt className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-base font-bold text-slate-800">
                    Aucune contribution enregistrée pour ce compte
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Faites votre première offrande ou dîme en ligne, et votre quittance officielle apparaîtra automatiquement ici.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('donner')}
                  className="px-5 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                >
                  Faire une Offrande Maintenant
                </button>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3">Quittance N°</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Catégorie</th>
                      <th className="pb-3">Détails / Projet</th>
                      <th className="pb-3">Mode</th>
                      <th className="pb-3 text-right">Montant</th>
                      <th className="pb-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myContributions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 font-mono font-bold text-[#6E1325]">
                          {t.number}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {formatDateDouala(t.date)}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF0F2] text-[#6E1325] border border-rose-200">
                            {t.categoryName || 'Offrande'}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-700 max-w-xs truncate">
                          {t.description}
                        </td>
                        <td className="py-3.5">
                          <span className="font-bold text-slate-600 text-[11px]">
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-black text-emerald-700 text-sm">
                          {formatFCFA(t.amount)}
                        </td>
                        <td className="py-3.5 text-center space-x-1.5">
                          <button
                            onClick={() => onOpenReceipt(t)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-[#C99B2E]/60 text-xs font-bold rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Afficher la quittance officielle"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#C99B2E]" />
                            <span>Reçu</span>
                          </button>
                          <button
                            onClick={() => {
                              try {
                                generateReceiptPDF(t, settings);
                                showToast(`✓ Reçu PDF ${t.number} téléchargé !`);
                              } catch (e) {
                                showToast('Erreur téléchargement PDF');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Télécharger directement le reçu en format PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-rose-600" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: TEMPLE PROJECTS & BUILDING CAMPAIGNS               */}
      {/* ======================================================== */}
      {activeTab === 'projets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <div>
              <span className="text-xs font-black text-[#C99B2E] uppercase tracking-wider block mb-1">
                Campagnes de Bâtisseurs & Solidarité
              </span>
              <h2 className="text-xl md:text-2xl font-black text-[#4A0E17]">
                Grands Projets & Chantiers de la Paroisse
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Bâtissons ensemble la maison de Dieu et manifestons l'amour du Christ dans notre cité de Sangmelima. Vous pouvez souscrire et contribuer directement en ligne.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {churchProjects.map((proj) => {
                const percent = Math.min(100, Math.round((proj.collected / proj.target) * 100));
                return (
                  <div
                    key={proj.id}
                    className="bg-[#FAF0F2] border border-rose-100 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition space-y-4"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-[#6E1325] inline-block">
                        {proj.category}
                      </span>
                      <h3 className="text-base font-black text-[#4A0E17] leading-snug">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {proj.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-rose-200/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Collecté :</span>
                        <span className="font-black text-emerald-700">{formatFCFA(proj.collected)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Objectif :</span>
                        <span className="font-bold text-slate-800">{formatFCFA(proj.target)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#6E1325] to-[#C99B2E] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-[11px] font-bold text-[#6E1325]">
                        {percent}% atteint
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setGivingForm({
                          ...givingForm,
                          categoryType: 'cat-r-3', // Dons de bâtisseurs
                          projectTarget: proj.title,
                        });
                        setActiveTab('donner');
                      }}
                      className="w-full py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-[#C99B2E] fill-current" />
                      <span>Soutenir ce Projet</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: VISUAL SUMMARY & CHARTS (Revenus & Répartition)     */}
      {/* ======================================================== */}
      {activeTab === 'analyse-visuelle' && (
        <div className="space-y-6 animate-in fade-in">
          <FinancialVisualSummary
            transactions={transactions}
            categories={categories}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: GENERAL BOOKKEEPING (Admin / Trésorier / Pasteur)  */}
      {/* ======================================================== */}
      {activeTab === 'tresorerie' && isLeadership && (
        <div className="space-y-6">
          {/* Quick Official Report Banner for Leadership */}
          <div className="bg-gradient-to-r from-[#4A0E17] to-[#6E1325] rounded-3xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#C99B2E]/30 shadow-md">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C99B2E]/20 text-[#C99B2E] flex items-center justify-center flex-shrink-0 border border-[#C99B2E]/40">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] text-[10px] font-black uppercase tracking-wider mb-0.5">
                  <Award className="w-3 h-3" />
                  <span>États Financiers Certifiés</span>
                </div>
                <h4 className="font-bold text-sm text-white">
                  Rapports Financiers Officiels : Bilan Mensuel & Annuel
                </h4>
                <p className="text-xs text-rose-100/90 mt-0.5">
                  Consultez la synthèse des recettes et dépenses, téléchargez les fiches officielles (PDF/HTML/CSV) et imprimez les quittances certifiées avec signatures.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('rapports')}
              className="px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2 flex-shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Consulter les Rapports</span>
            </button>
          </div>

          {/* Visual Summary Charts Component */}
          <FinancialVisualSummary
            transactions={transactions}
            categories={categories}
          />

          {/* Financial Health Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Recettes Encaissées
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {formatFCFA(summary.totalRecettes)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Dépenses Décaissées
                </span>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {formatFCFA(summary.totalDepenses)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Solde de Caisse Actuel
                </span>
                <div
                  className={`text-2xl font-black mt-1 ${
                    summary.solde >= 0 ? 'text-[#4A0E17]' : 'text-rose-600'
                  }`}
                >
                  {formatFCFA(summary.solde)}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FAF0F2] text-[#6E1325] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#C99B2E]" />
              </div>
            </div>
          </div>

          {/* Bookkeeping Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Recherche quittance, partie, motif..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#6E1325]"
                  />
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setTypeFilter('ALL')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                      typeFilter === 'ALL'
                        ? 'bg-white text-[#4A0E17] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tout ({transactions.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter('RECETTE')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      typeFilter === 'RECETTE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Recettes
                  </button>
                  <button
                    onClick={() => setTypeFilter('DÉPENSE')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      typeFilter === 'DÉPENSE'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-rose-700'
                    }`}
                  >
                    Dépenses
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                {hasPermission('FINANCE_CREATE') && (
                  <>
                    <button
                      onClick={() => handleOpenAddAdmin('RECETTE')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Encaisser Recette</span>
                    </button>
                    <button
                      onClick={() => handleOpenAddAdmin('DÉPENSE')}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Enregistrer Dépense</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Quittance / N°</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Bénéficiaire / Donateur</th>
                    <th className="py-3 px-4">Motif / Description</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => {
                    const isRecette = tx.type === 'RECETTE';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {tx.number}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatDateDouala(tx.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isRecette
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {tx.categoryName || 'Autre'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {tx.counterparty}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-black text-sm ${
                            isRecette ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isRecette ? '+' : '-'} {formatFCFA(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                generateReceiptPDF(tx, settings);
                                showToast(`✓ Reçu PDF ${tx.number} téléchargé !`);
                              } catch (e) {
                                showToast('Erreur téléchargement PDF');
                              }
                            }}
                            title="Télécharger le reçu officiel au format PDF"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenReceipt(tx)}
                            title="Imprimer / Visualiser le reçu"
                            className="p-1.5 text-slate-500 hover:text-[#4A0E17] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {hasPermission('FINANCE_DELETE') && (
                            <button
                              onClick={() => handleDelete(tx.id, tx.number)}
                              title="Annuler l'écriture"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ======================================================== */}
      {/* TAB 5: OFFICIAL FINANCIAL REPORTS (MENSUEL & ANNUEL)      */}
      {/* ======================================================== */}
      {activeTab === 'rapports' && (
        <div className="space-y-6">
          <FinancialReportView
            transactions={transactions}
            categories={categories}
            settings={settings}
            onOpenReceipt={onOpenReceipt}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN TRANSACTION CREATION                         */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div
              className={`p-5 text-white flex items-center justify-between ${
                adminFormData.type === 'RECETTE' ? 'bg-emerald-700' : 'bg-rose-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                {adminFormData.type === 'RECETTE' ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-200" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-200" />
                )}
                <h3 className="font-bold text-sm">
                  {adminFormData.type === 'RECETTE'
                    ? 'Encaisser une Recette / Offrande Administrative'
                    : 'Enregistrer un Décaissement / Dépense'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminTransaction} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date comptable</label>
                  <input
                    type="date"
                    required
                    value={adminFormData.date}
                    onChange={(e) => setAdminFormData({ ...adminFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie budgétaire</label>
                  <select
                    value={adminFormData.categoryId}
                    onChange={(e) => setAdminFormData({ ...adminFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    {categories
                      .filter((c) => c.type === adminFormData.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Montant en Francs CFA (XAF)
                </label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  required
                  value={adminFormData.amount}
                  onChange={(e) => setAdminFormData({ ...adminFormData, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-[#4A0E17]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {adminFormData.type === 'RECETTE' ? 'Donateur / Payeur' : 'Bénéficiaire du paiement'}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminFormData.counterparty}
                    onChange={(e) => setAdminFormData({ ...adminFormData, counterparty: e.target.value })}
                    placeholder="Ex: Ancien David Essomba"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mode de règlement</label>
                  <select
                    value={adminFormData.paymentMethod}
                    onChange={(e) =>
                      setAdminFormData({ ...adminFormData, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="ESPÈCES">Espèces (Caisse)</option>
                    <option value="MOBILE_MONEY">Mobile Money (MTN / OM)</option>
                    <option value="VIREMENT">Virement Bancaire (UBA)</option>
                    <option value="CHÈQUE">Chèque Bancaire</option>
                    <option value="AUTRE">Autre mode</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif / Justification</label>
                <textarea
                  rows={2}
                  required
                  value={adminFormData.description}
                  onChange={(e) => setAdminFormData({ ...adminFormData, description: e.target.value })}
                  placeholder="Précisez le détail de l'opération..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow transition ${
                    adminFormData.type === 'RECETTE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Enregistrer & Générer Quittance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
