import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Clock3,
  QrCode,
  Save,
  Users,
  Search,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { AttendanceSession, AttendanceRecord, Member, AttendanceType } from '../types';
import { formatDateDouala } from '../utils/formatters';

export const AttendancePage: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // New session form
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    time: '09:00',
    location: 'Grand Temple Akon, Sangmelima',
    title: 'Culte Dominical d’Adoration',
    type: 'culte' as AttendanceType,
    notes: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const [sessList, memList] = await Promise.all([
      apiClient.getAttendanceSessions(),
      apiClient.getMembers(),
    ]);
    setSessions(sessList);
    setMembers(memList);

    if (sessList.length > 0) {
      handleSelectSession(sessList[0]);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectSession = async (sess: AttendanceSession) => {
    setSelectedSession(sess);
    const recs = await apiClient.getAttendanceRecords(sess.id);

    // Ensure all members have a record entry (default ABSENT if not yet marked)
    const existingMap = new Map(recs.map((r) => [r.memberId, r]));
    const fullRecords: AttendanceRecord[] = members.map((m) => {
      const existing = existingMap.get(m.id);
      if (existing) return existing;
      return {
        id: 'rec-' + sess.id + '-' + m.id,
        sessionId: sess.id,
        memberId: m.id,
        status: 'ABSENT',
      };
    });

    setRecords(fullRecords);
  };

  const handleStatusChange = (memberId: string, status: 'PRÉSENT' | 'ABSENT' | 'EXCUSÉ') => {
    setRecords((prev) =>
      prev.map((r) =>
        r.memberId === memberId
          ? {
              ...r,
              status,
              checkInTime:
                status === 'PRÉSENT' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
            }
          : r
      )
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    await apiClient.saveAttendanceRecords(selectedSession.id, records, currentUser || undefined);
    showToast('Pointage des présences enregistré avec succès.');
  };

  // QR Code Simulator / Scanner: Input member number or full QR string
  const handleQrScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    // Check if input matches memberNumber (e.g. EMF-2026-001) or contains it
    const clean = qrInput.trim();
    const targetMember = members.find(
      (m) =>
        m.memberNumber.toLowerCase() === clean.toLowerCase() ||
        clean.toLowerCase().includes(m.memberNumber.toLowerCase())
    );

    if (!targetMember) {
      alert(`Aucun membre correspondant trouvé pour le code "${clean}".`);
      return;
    }

    // Mark as present
    handleStatusChange(targetMember.id, 'PRÉSENT');
    showToast(`✓ Présence validée par scan : ${targetMember.firstName} ${targetMember.lastName} (${targetMember.memberNumber})`);
    setQrInput('');
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await apiClient.createAttendanceSession(sessionForm, currentUser || undefined);
    setShowCreateModal(false);
    showToast('Session de culte/présence créée.');
    const updatedSess = await apiClient.getAttendanceSessions();
    setSessions(updatedSess);
    handleSelectSession(created);
  };

  // Real stats
  const presentCount = records.filter((r) => r.status === 'PRÉSENT').length;
  const excuseCount = records.filter((r) => r.status === 'EXCUSÉ').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalCount = members.length;
  const attendanceRate = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredRecords = records.filter((r) => {
    const mem = members.find((m) => m.id === r.memberId);
    if (!mem) return false;
    return (
      mem.firstName.toLowerCase().includes(searchMember.toLowerCase()) ||
      mem.lastName.toLowerCase().includes(searchMember.toLowerCase()) ||
      mem.memberNumber.toLowerCase().includes(searchMember.toLowerCase())
    );
  });

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
            <CheckSquare className="w-4 h-4 text-[#6E1325]" />
            <span>Assiduité & Cultes • Sangmelima</span>
          </div>
          <h1 className="text-2xl font-black text-[#4A0E17]">Gestion des Présences</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pointage manuel et scan instantané par badge / QR Code
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] text-xs font-bold rounded-xl transition border border-[#C99B2E]/50 flex items-center space-x-1.5 cursor-pointer"
            title="Ouvrir le lecteur de QR Code"
          >
            <QrCode className="w-4 h-4 text-[#C99B2E]" />
            <span>Scanner QR Badge</span>
          </button>

          {hasPermission('ATTENDANCE_CREATE') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#C99B2E]" />
              <span>Nouvelle Session</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider block mb-2">
              Sessions Récentes
            </span>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#6E1325] bg-[#FAF0F2] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{sess.title}</h4>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {sess.type}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#C99B2E]" />
                        <span>{formatDateDouala(sess.date)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{sess.time}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Sheet for Selected Session */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          {selectedSession ? (
            <>
              {/* Session Meta & Real Stats Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-black text-[#4A0E17]">
                    Pointage : {selectedSession.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDateDouala(selectedSession.date)} à {selectedSession.time} • {selectedSession.location}
                  </p>
                </div>

                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Enregistrer le Pointage</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xl font-black text-emerald-700">{presentCount}</div>
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">Présents</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="text-xl font-black text-red-700">{absentCount}</div>
                  <div className="text-[10px] text-red-800 font-bold uppercase">Absents</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-xl font-black text-amber-700">{excuseCount}</div>
                  <div className="text-[10px] text-amber-800 font-bold uppercase">Excusés</div>
                </div>
                <div className="p-3 bg-[#FAF0F2] border border-rose-200 rounded-xl">
                  <div className="text-xl font-black text-[#6E1325]">{attendanceRate}%</div>
                  <div className="text-[10px] text-[#4A0E17] font-bold uppercase">Taux</div>
                </div>
              </div>

              {/* Search Member in Attendance Sheet */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Rechercher un membre dans cette session..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                />
              </div>

              {/* Member Roll Call List */}
              <div className="overflow-x-auto max-h-[450px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAF0F2] text-[#4A0E17] uppercase text-[10px] font-bold tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Membre</th>
                      <th className="py-2.5 px-3">Matricule</th>
                      <th className="py-2.5 px-3 text-center">Statut de Présence</th>
                      <th className="py-2.5 px-3 text-right">Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((r) => {
                      const m = members.find((mem) => mem.id === r.memberId);
                      if (!m) return null;
                      return (
                        <tr key={r.memberId} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {m.firstName} {m.lastName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {m.memberNumber}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 space-x-1">
                              <button
                                onClick={() => handleStatusChange(m.id, 'PRÉSENT')}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  r.status === 'PRÉSENT'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Présent
                              </button>
                              <button
                                onClick={() => handleStatusChange(m.id, 'EXCUSÉ')}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  r.status === 'EXCUSÉ'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Excusé
                              </button>
                              <button
                                onClick={() => handleStatusChange(m.id, 'ABSENT')}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  r.status === 'ABSENT'
                                    ? 'bg-red-500 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                            {r.checkInTime || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Sélectionnez une session à gauche pour voir la feuille d’appel.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Scanner / Simulator Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-[#C99B2E]" />
                <h3 className="font-bold text-sm">Lecteur QR Code / Pointage Rapide</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <p className="font-bold mb-1">Pointage Instantané :</p>
                <p className="text-[11px]">
                  Scannez le badge d’un membre avec la douchette optique ou saisissez directement son numéro matricule (ex : <span className="font-mono font-bold">EMF-2026-001</span>).
                </p>
              </div>

              <form onSubmit={handleQrScanSubmit} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Code QR scanné ou Matricule
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="EMF-2026-001..."
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold rounded-xl transition shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-[#C99B2E]" />
                  <span>Valider la Présence</span>
                </button>
              </form>

              {/* Quick sample chips for instant testing */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block mb-1">
                  Exemples de fidèles à tester :
                </span>
                <div className="flex flex-wrap gap-1">
                  {members.slice(0, 4).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setQrInput(m.memberNumber)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] cursor-pointer"
                    >
                      {m.memberNumber} ({m.firstName})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Programmer une Nouvelle Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de la session *</label>
                <input
                  type="text"
                  required
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  placeholder="Ex: Culte Dominical d’Adoration"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Type de Réunion</label>
                <select
                  value={sessionForm.type}
                  onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                >
                  <option value="culte">Culte</option>
                  <option value="priere">Prière / Intercession</option>
                  <option value="etude_biblique">Étude Biblique</option>
                  <option value="reunion">Réunion / Conseil</option>
                  <option value="formation">Formation</option>
                  <option value="evenement">Événement Spécial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.time}
                    onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lieu à Sangmelima</label>
                <input
                  type="text"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6E1325]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17] transition shadow cursor-pointer"
                >
                  Créer la session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
