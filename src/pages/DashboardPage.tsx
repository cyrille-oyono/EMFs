import React, { useState, useEffect } from 'react';
import {
  Users,
  Home,
  CheckSquare,
  DollarSign,
  Calendar,
  HeartHandshake,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Film,
  Plus,
  ShieldAlert,
  Clock,
  Sparkles,
  Award,
  Globe,
  Sliders,
  Edit3,
  Bell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { formatFCFA, formatDateDouala } from '../utils/formatters';
import { DashboardHomepageEditorModal } from '../components/home/DashboardHomepageEditorModal';
import { BroadcastNotificationModal } from '../components/notifications/BroadcastNotificationModal';
import { Devotionals } from '../components/devotionals/Devotionals';
import { AdminLeadershipAndTreasurySettings } from '../components/admin/AdminLeadershipAndTreasurySettings';
import {
  Member,
  Family,
  Transaction,
  Event,
  AttendanceSession,
  Testimonial,
  DailyBibleVerse,
} from '../types';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onOpenReceipt: (tx: Transaction) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate, onOpenReceipt }) => {
  const { currentUser, settings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isHomepageEditorOpen, setIsHomepageEditorOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financesSummary, setFinancesSummary] = useState({
    totalRecettes: 0,
    totalDepenses: 0,
    solde: 0,
    transactionCount: 0,
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [todayVerse, setTodayVerse] = useState<DailyBibleVerse | undefined>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [m, f, t, fs, evts, sess, tst, vrs] = await Promise.all([
          apiClient.getMembers(),
          apiClient.getFamilies(),
          apiClient.getTransactions(),
          apiClient.getFinancialsSummary(),
          apiClient.getEvents(),
          apiClient.getAttendanceSessions(),
          apiClient.getTestimonials(),
          apiClient.getTodayVerse(),
        ]);
        setMembers(m);
        setFamilies(f);
        setTransactions(t);
        setFinancesSummary(fs);
        setEvents(evts);
        setSessions(sess);
        setTestimonials(tst);
        setTodayVerse(vrs);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-[#6E1325] border-t-[#C99B2E] rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Chargement des données de Sangmelima...</p>
      </div>
    );
  }

  if (currentUser && currentUser.role !== 'ADMIN' && currentUser.role !== 'PASTEUR') {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-sm max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-[#C99B2E] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#4A0E17]">Accès Réservé à la Direction</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Le tableau de bord global de l'assemblée est réservé exclusivement au Pasteur et à l'Administration de l'Église Missionnaire de la Foi de Sangmelima.
        </p>
        <button
          onClick={() => onNavigate('prayer-requests')}
          className="px-4 py-2 rounded-xl bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          Accéder aux Requêtes de Prière
        </button>
      </div>
    );
  }

  // Calculated Real Stats
  const activeMembers = members.filter((m) => m.status === 'ACTIF').length;
  const inactiveMembers = members.filter((m) => m.status === 'INACTIF').length;
  const visitors = members.filter((m) => m.status === 'VISITEUR').length;
  const menCount = members.filter((m) => m.sex === 'M').length;
  const womenCount = members.filter((m) => m.sex === 'F').length;
  const pendingTestimonials = testimonials.filter((t) => t.status === 'EN_ATTENTE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] rounded-2xl p-6 text-white shadow-xl border border-[#C99B2E]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#C99B2E]/20 text-[#C99B2E] px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-[#C99B2E]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tableau de bord officiel • Sangmelima (Sud-Cameroun)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Bienvenue dans EMF Smart, {currentUser?.firstName} !
          </h1>
          <p className="text-xs text-rose-100/90 mt-1 max-w-xl">
            Système de gestion intégrée de l’{settings.churchName}. Toutes les métriques sont calculées en temps réel à partir de la base de données.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsHomepageEditorOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#C99B2E] text-[#4A0E17] text-xs font-black hover:bg-amber-400 transition shadow flex items-center space-x-1.5 cursor-pointer"
              title="Modifier directement les éléments de la page d'accueil"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Modifier la Page d’Accueil</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('members')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Membre</span>
          </button>
          <button
            onClick={() => onNavigate('finances')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Encaisser Dîme</span>
          </button>
          <button
            onClick={() => onNavigate('resources')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
            title="Gérer les enseignements et prières"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#C99B2E]" />
            <span>Ressources</span>
          </button>
          <button
            onClick={() => onNavigate('media-gallery')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
            title="Gérer la médiathèque photos et vidéos"
          >
            <Film className="w-3.5 h-3.5 text-rose-300" />
            <span>Médiathèque</span>
          </button>
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <button
              onClick={() => {
                const el = document.getElementById('admin-treasury-leadership-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#4A0E17] text-xs font-black transition shadow flex items-center space-x-1.5 cursor-pointer"
              title="Configurer les comptes du Pasteur, Secrétaire, Trésorier et la Trésorerie"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Direction & Trésorerie</span>
            </button>
          )}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
              title="Diffuser une notification ou alerte à toute l'assemblée"
            >
              <Bell className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Diffuser Alerte</span>
            </button>
          )}
        </div>
      </div>

      {/* Devotionals Component: Daily Bible Verse, Reflection & Prayer */}
      <Devotionals
        initialVerse={todayVerse}
        onNavigate={onNavigate}
      />

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members KPI */}
        <div
          onClick={() => onNavigate('members')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Membres Inscrits
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF0F2] text-[#6E1325] flex items-center justify-center group-hover:bg-[#6E1325] group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#4A0E17] mt-2">{members.length}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span className="text-emerald-600 font-semibold">{activeMembers} Actifs</span>
            <span>{visitors} Visiteurs</span>
          </div>
        </div>

        {/* Families KPI */}
        <div
          onClick={() => onNavigate('families')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Foyers & Familles
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C99B2E] flex items-center justify-center group-hover:bg-[#C99B2E] group-hover:text-white transition">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#4A0E17] mt-2">{families.length}</div>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Moyenne : ~{families.length ? (members.length / families.length).toFixed(1) : 0} pers. / foyer
          </div>
        </div>

        {/* Finances Recettes KPI */}
        <div
          onClick={() => onNavigate('finances')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Recettes (Mois)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {formatFCFA(financesSummary.totalRecettes)}
          </div>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>Dépenses : {formatFCFA(financesSummary.totalDepenses)}</span>
          </div>
        </div>

        {/* Solde Net Caisse KPI */}
        <div
          onClick={() => onNavigate('finances')}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Solde Net en Caisse
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF0F2] text-[#6E1325] flex items-center justify-center group-hover:bg-[#4A0E17] group-hover:text-white transition">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-2 ${financesSummary.solde >= 0 ? 'text-[#4A0E17]' : 'text-red-600'}`}>
            {formatFCFA(financesSummary.solde)}
          </div>
          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-emerald-600">Trésorerie Équilibrée</span>
            <span>{financesSummary.transactionCount} opérations</span>
          </div>
        </div>
      </div>

      {/* Real Statistics Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assembly Demographic & Gender Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-[#4A0E17] uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Répartition Démographique</span>
            <Users className="w-4 h-4 text-slate-400" />
          </h2>

          <div className="space-y-4">
            {/* Gender bar */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Hommes ({menCount})</span>
                <span>Femmes ({womenCount})</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${members.length ? (menCount / members.length) * 100 : 50}%` }}
                  className="bg-[#6E1325] transition-all"
                  title="Hommes"
                />
                <div
                  style={{ width: `${members.length ? (womenCount / members.length) * 100 : 50}%` }}
                  className="bg-[#C99B2E] transition-all"
                  title="Femmes"
                />
              </div>
            </div>

            {/* Member Status breakdown */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Membres Actifs</span>
                </span>
                <span className="font-bold text-slate-900">{activeMembers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Nouveaux Visiteurs</span>
                </span>
                <span className="font-bold text-slate-900">{visitors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-600">Inactifs / En déplacement</span>
                </span>
                <span className="font-bold text-slate-900">{inactiveMembers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#4A0E17] uppercase tracking-wider">
              Prochains Événements
            </h2>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs text-[#6E1325] font-bold hover:underline"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition flex items-start space-x-3"
              >
                <div className="w-10 h-10 rounded-lg bg-[#6E1325] text-[#C99B2E] flex flex-col items-center justify-center font-bold text-xs flex-shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{evt.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{evt.location}</p>
                  <p className="text-[10px] text-[#C99B2E] font-semibold mt-1">
                    {formatDateDouala(evt.startDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Alerts & Moderation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-[#4A0E17] uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Points d’Attention</span>
            <ShieldAlert className="w-4 h-4 text-[#C99B2E]" />
          </h2>

          <div className="space-y-3">
            <div
              onClick={() => onNavigate('testimonials')}
              className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Témoignages à Modérer</span>
                <span className="w-5 h-5 rounded-full bg-[#C99B2E] text-white flex items-center justify-center text-[10px] font-bold">
                  {pendingTestimonials}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1">
                Soumissions de fidèles nécessitant validation pastorale avant affichage public.
              </p>
            </div>

            <div
              onClick={() => onNavigate('attendance')}
              className="p-3 rounded-xl bg-[#FAF0F2]/70 border border-rose-200 cursor-pointer hover:bg-[#FAF0F2] transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4A0E17]">Dernier Culte Enregistré</span>
                <span className="text-[11px] text-[#6E1325] font-bold">
                  {sessions[0]?.date || 'N/A'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {sessions[0]?.title || 'Aucun culte récent'}
              </p>
            </div>

            <div
              onClick={() => onNavigate('cms-homepage')}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">CMS Page d’Accueil</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                  En Ligne
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                10 sections configurables (Hero, Témoignages, Horaires des cultes...)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Financial Transactions with Instant Receipt Generation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#4A0E17] uppercase tracking-wider">
              Dernières Opérations Financières
            </h2>
            <p className="text-xs text-slate-500">
              Générez et imprimez un reçu certifié pour chaque contribution
            </p>
          </div>
          <button
            onClick={() => onNavigate('finances')}
            className="text-xs text-[#6E1325] font-bold hover:underline"
          >
            Module Finances Complet →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF0F2] text-[#4A0E17] uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Réf.</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Partie / Donateur</th>
                <th className="py-2.5 px-3">Motif</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Montant</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{tx.number}</td>
                  <td className="py-3 px-3 text-slate-500">{formatDateDouala(tx.date)}</td>
                  <td className="py-3 px-3">
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
                  <td className="py-3 px-3 font-semibold text-slate-900">{tx.counterparty}</td>
                  <td className="py-3 px-3 text-slate-600">{tx.categoryName}</td>
                  <td className="py-3 px-3 text-slate-500">{tx.paymentMethod}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    {formatFCFA(tx.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onOpenReceipt(tx)}
                      className="px-2.5 py-1 rounded bg-[#6E1325] text-white hover:bg-[#4A0E17] transition text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      Reçu PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Leadership & Treasury Settings Section */}
      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR') && (
        <div id="admin-treasury-leadership-section">
          <AdminLeadershipAndTreasurySettings />
        </div>
      )}

      {/* Admin Homepage Management Showcase Card */}
      {currentUser?.role === 'ADMIN' && (
        <div className="bg-gradient-to-r from-white via-amber-50/20 to-white rounded-2xl p-6 border-2 border-[#C99B2E]/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4A0E17] text-[#C99B2E] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-[#4A0E17]">
                  Gestion Directe de la Page d’Accueil Publique
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Visible aux visiteurs
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Modifiez facilement depuis ce tableau de bord le titre d’accueil, le mot de bienvenue pastoral, les coordonnées de l’église et l’ordre des modules affichés.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setIsHomepageEditorOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Modifier les Éléments</span>
            </button>
            <button
              onClick={() => onNavigate('public-home')}
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-amber-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#C99B2E]" />
              <span>Voir le Portail Public</span>
            </button>
          </div>
        </div>
      )}

      {/* Homepage Fast Editor Modal */}
      <DashboardHomepageEditorModal
        isOpen={isHomepageEditorOpen}
        onClose={() => setIsHomepageEditorOpen(false)}
        onPreviewPublic={() => onNavigate('public-home')}
      />

      {/* Broadcast Notification Modal */}
      <BroadcastNotificationModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
