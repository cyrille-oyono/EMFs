import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Award,
  Printer,
  CheckCircle,
  X,
  Search,
  UserCheck,
  Key,
  LogIn,
  LogOut,
  Send,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  Copy,
  Check,
  Layers,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import {
  ParakletosYear,
  ParakletosClass,
  ParakletosSubject,
  ParakletosStudent,
  ParakletosGrade,
  ParakletosInstituteInfo,
  ParakletosTeacher,
  ParakletosAdmissionRequest,
} from '../types';

export const ParakletosPage: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const isLeadership = hasRole(['ADMIN', 'PASTEUR']);

  // Main institute state
  const [data, setData] = useState<{
    years: ParakletosYear[];
    classes: ParakletosClass[];
    subjects: ParakletosSubject[];
    students: ParakletosStudent[];
    grades: ParakletosGrade[];
    info: ParakletosInstituteInfo | null;
    teachers: ParakletosTeacher[];
    admissions: ParakletosAdmissionRequest[];
  }>({
    years: [],
    classes: [],
    subjects: [],
    students: [],
    grades: [],
    info: null,
    teachers: [],
    admissions: [],
  });

  // Active top tab
  const [activeTab, setActiveTab] = useState<'presentation' | 'adhesion' | 'code-access' | 'dashboard'>('presentation');

  // Admin dashboard sub-tab
  const [adminSubTab, setAdminSubTab] = useState<'renseignements' | 'filieres' | 'cours' | 'enseignants' | 'candidatures' | 'etudiants'>(
    'candidatures'
  );

  // Selected student for bulletin / grade review
  const [selectedStudent, setSelectedStudent] = useState<ParakletosStudent | null>(null);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Code Access Authentication State
  const [inputAccessCode, setInputAccessCode] = useState('');
  const [codeAuthError, setCodeAuthError] = useState<string | null>(null);
  const [codeSession, setCodeSession] = useState<{
    type: 'ETUDIANT' | 'ENSEIGNANT';
    student?: ParakletosStudent;
    teacher?: ParakletosTeacher;
    class?: ParakletosClass;
    grades?: ParakletosGrade[];
    subjects?: ParakletosSubject[];
    students?: ParakletosStudent[];
    classes?: ParakletosClass[];
  } | null>(null);

  // Admission Form State
  const [admissionForm, setAdmissionForm] = useState({
    applicantName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '+237 6',
    classId: '',
    profession: '',
    baptismDate: '',
    testimony: '',
    motivation: '',
    availability: 'Cours du soir (Mardi/Jeudi 18h-20h30) et Samedi matin (9h-13h)',
  });
  const [admissionSubmitted, setAdmissionSubmitted] = useState(false);

  // Teacher Grade Entry (when teacher is logged in or admin)
  const [teacherGradeInput, setTeacherGradeInput] = useState<{
    studentId: string;
    subjectId: string;
    grade: number;
    term: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
    comments: string;
  }>({
    studentId: '',
    subjectId: '',
    grade: 15,
    term: 'Trimestre 1',
    comments: '',
  });

  // Admin Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    name: '',
    level: 'Certificat',
    description: '',
    yearId: 'year-2025-2026',
    durationMonths: 9,
    objective: '',
  });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    name: '',
    classId: '',
    coefficient: 2,
    teacherName: '',
    teacherId: '',
    description: '',
  });

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    title: 'Enseignant Théologique',
    specialty: 'Théologie & Exégèse',
    phone: '+237 6',
    email: '',
    accessCode: '',
    status: 'ACTIF' as const,
  });

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    phone: '+237 6',
    email: '',
    classId: '',
    yearId: 'year-2025-2026',
    accessCode: '',
    enrollmentDate: new Date().toISOString().substring(0, 10),
    status: 'ACTIF' as const,
  });

  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    subjectId: '',
    grade: 15,
    term: 'Trimestre 1' as const,
    comments: '',
  });

  // Validation Success Popup for Admission
  const [validatedAdmissionData, setValidatedAdmissionData] = useState<{
    applicantName: string;
    accessCode: string;
    className: string;
    phone: string;
  } | null>(null);

  // Edit Institute Info Form
  const [infoForm, setInfoForm] = useState<Partial<ParakletosInstituteInfo>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await apiClient.getParakletosState();
    setData(res as any);

    if (res.classes && res.classes.length > 0 && !admissionForm.classId) {
      setAdmissionForm((prev) => ({ ...prev, classId: res.classes[0].id }));
    }
    if (res.classes && res.classes.length > 0 && !newSubjectForm.classId) {
      setNewSubjectForm((prev) => ({ ...prev, classId: res.classes[0].id }));
    }
    if (res.classes && res.classes.length > 0 && !studentForm.classId) {
      setStudentForm((prev) => ({ ...prev, classId: res.classes[0].id }));
    }
    if (res.students && res.students.length > 0 && !selectedStudent) {
      setSelectedStudent(res.students[0]);
    }
    if (res.info) {
      setInfoForm(res.info);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showToast(`✓ ${label} copié dans le presse-papier.`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Handle Verify Access Code
  const handleVerifyAccessCode = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const code = (overrideCode || inputAccessCode).trim();
    if (!code) {
      setCodeAuthError('Veuillez saisir votre code d’accès.');
      return;
    }

    setCodeAuthError(null);
    const result = await apiClient.verifyParakletosAccessCode(code);

    if (result.success) {
      setCodeSession(result as any);
      setInputAccessCode('');
      showToast(`✓ Connexion réussie en tant que ${result.type === 'ETUDIANT' ? 'Étudiant' : 'Enseignant'} !`);
      if (result.type === 'ETUDIANT' && result.student) {
        setSelectedStudent(result.student);
      }
    } else {
      setCodeAuthError(result.message || 'Code d’accès invalide ou non reconnu.');
    }
  };

  // Submit Admission Request
  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionForm.applicantName || !admissionForm.classId) {
      alert('Veuillez renseigner votre nom complet et la filière souhaitée.');
      return;
    }

    const targetClass = data.classes.find((c) => c.id === admissionForm.classId);

    await apiClient.createParakletosAdmission(
      {
        applicantName: admissionForm.applicantName.trim(),
        email: admissionForm.email.trim(),
        phone: admissionForm.phone.trim(),
        memberId: currentUser?.id,
        classId: admissionForm.classId,
        className: targetClass?.name || 'Formation Théologique',
        profession: admissionForm.profession.trim(),
        baptismDate: admissionForm.baptismDate,
        testimony: admissionForm.testimony.trim(),
        motivation: admissionForm.motivation.trim(),
        availability: admissionForm.availability,
      },
      currentUser || undefined
    );

    setAdmissionSubmitted(true);
    showToast('✓ Votre demande d’inscription a été soumise avec succès.');
    loadData();
  };

  // Admin Validates Admission -> Automatically Generates Code & Student
  const handleValidateAdmission = async (admissionId: string) => {
    const adm = data.admissions.find((a) => a.id === admissionId);
    if (!adm) return;

    const res = await apiClient.updateParakletosAdmissionStatus(
      admissionId,
      'VALIDEE',
      'Candidature approuvée par la direction des études.',
      currentUser || undefined
    );

    if (res.admission && res.generatedStudent) {
      setValidatedAdmissionData({
        applicantName: adm.applicantName,
        accessCode: res.generatedStudent.accessCode,
        className: adm.className,
        phone: adm.phone,
      });
      showToast(`✓ Candidature validée ! Code étudiant généré : ${res.generatedStudent.accessCode}`);
      loadData();
    }
  };

  const handleRejectAdmission = async (admissionId: string) => {
    if (confirm('Voulez-vous rejeter cette candidature ?')) {
      await apiClient.updateParakletosAdmissionStatus(
        admissionId,
        'REJETEE',
        'Dossier non retenu pour cette session.',
        currentUser || undefined
      );
      showToast('Candidature rejetée.');
      loadData();
    }
  };

  // Teacher records grade directly from Code Session
  const handleTeacherRecordGrade = async (studentId: string, subjectId: string, gradeValue: number, comments?: string) => {
    await apiClient.recordParakletosGrade(
      {
        studentId,
        subjectId,
        grade: gradeValue,
        term: 'Trimestre 1',
        comments: comments || 'Évaluation en cours',
      },
      currentUser || undefined
    );

    showToast('✓ Note enregistrée.');
    await loadData();

    // refresh session if student
    if (codeSession && codeSession.type === 'ETUDIANT') {
      const res = await apiClient.verifyParakletosAccessCode(codeSession.student?.accessCode || '');
      if (res.success) setCodeSession(res as any);
    }
  };

  // General Record Grade
  const handleRecordGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeForm.studentId || !gradeForm.subjectId) return;

    await apiClient.recordParakletosGrade(gradeForm, currentUser || undefined);
    setShowAddGradeModal(false);
    showToast('✓ Note enregistrée avec succès.');
    loadData();
  };

  // Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.firstName || !studentForm.lastName) return;

    const newStd = await apiClient.createParakletosStudent(studentForm, currentUser || undefined);
    setShowAddStudentModal(false);
    showToast(`✓ Nouvel étudiant inscrit. Code d'accès : ${newStd.accessCode}`);
    loadData();
  };

  // Create Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.name) return;

    await apiClient.createParakletosClass(newClassForm, currentUser || undefined);
    setShowAddClassModal(false);
    setNewClassForm({
      name: '',
      level: 'Certificat',
      description: '',
      yearId: 'year-2025-2026',
      durationMonths: 9,
      objective: '',
    });
    showToast('✓ Nouvelle filière ajoutée.');
    loadData();
  };

  // Create Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectForm.name || !newSubjectForm.classId) return;

    await apiClient.createParakletosSubject(newSubjectForm, currentUser || undefined);
    setShowAddSubjectModal(false);
    setNewSubjectForm({
      name: '',
      classId: data.classes[0]?.id || '',
      coefficient: 2,
      teacherName: '',
      teacherId: '',
      description: '',
    });
    showToast('✓ Nouveau cours ajouté.');
    loadData();
  };

  // Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherForm.name) return;

    const teacher = await apiClient.createParakletosTeacher(newTeacherForm, currentUser || undefined);
    setShowAddTeacherModal(false);
    setNewTeacherForm({
      name: '',
      title: 'Enseignant Théologique',
      specialty: 'Théologie & Exégèse',
      phone: '+237 6',
      email: '',
      accessCode: '',
      status: 'ACTIF',
    });
    showToast(`✓ Enseignant créé avec le code d'accès : ${teacher.accessCode}`);
    loadData();
  };

  // Update Institute Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiClient.updateParakletosInfo(infoForm, currentUser || undefined);
    showToast('✓ Renseignements de l’institut enregistrés.');
    loadData();
  };

  // Calculate Average for active student
  const studentGrades = selectedStudent
    ? data.grades.filter((g) => g.studentId === selectedStudent.id)
    : [];

  const calculateAverage = () => {
    if (studentGrades.length === 0) return 0;
    let totalScore = 0;
    let totalCoef = 0;
    studentGrades.forEach((g) => {
      const subj = data.subjects.find((s) => s.id === g.subjectId);
      const coef = subj ? subj.coefficient : 1;
      totalScore += g.grade * coef;
      totalCoef += coef;
    });
    return totalCoef > 0 ? (totalScore / totalCoef).toFixed(2) : 0;
  };

  const pendingAdmissionsCount = data.admissions.filter((a) => a.status === 'EN_ATTENTE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#C99B2E] flex items-center space-x-2 animate-in slide-in-from-bottom">
          <CheckCircle className="w-5 h-5 text-[#C99B2E]" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#C99B2E]/20 text-[#C99B2E] text-xs font-bold uppercase tracking-wider border border-[#C99B2E]/30">
              <GraduationCap className="w-4 h-4" />
              <span>École Théologique & Pastorale EMF Sangmelima</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {data.info?.name || 'Institut Biblique Parakletos'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">
              « {data.info?.slogan || 'Former des ouvriers qualifiés, enracinés dans la Parole et remplis de l’Esprit'} »
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('adhesion')}
              className="px-4 py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 fill-current" />
              <span>Demander l'Adhésion</span>
            </button>

            <button
              onClick={() => setActiveTab('code-access')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/20 flex items-center space-x-2"
            >
              <Key className="w-4 h-4 text-[#C99B2E]" />
              <span>Espace Code (Étudiant / Enseignant)</span>
            </button>

            {isLeadership && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2.5 bg-white text-[#4A0E17] font-black text-xs rounded-xl shadow transition flex items-center space-x-2"
              >
                <Layers className="w-4 h-4 text-[#6E1325]" />
                <span>Tableau de Bord Admin</span>
                {pendingAdmissionsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                    {pendingAdmissionsCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'presentation'
                ? 'bg-white text-[#4A0E17] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#C99B2E]" />
            <span>Présentation & Renseignements</span>
          </button>

          <button
            onClick={() => setActiveTab('adhesion')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'adhesion'
                ? 'bg-white text-[#4A0E17] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 text-[#C99B2E]" />
            <span>Demande d'Adhésion / Inscription</span>
          </button>

          <button
            onClick={() => setActiveTab('code-access')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'code-access'
                ? 'bg-white text-[#4A0E17] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Key className="w-4 h-4 text-[#C99B2E]" />
            <span>Connexion par Code {codeSession ? `(${codeSession.type})` : ''}</span>
            {codeSession && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            )}
          </button>

          {isLeadership && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-[#4A0E17] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#C99B2E]" />
              <span>Gestion Direction & Doyenné</span>
              {pendingAdmissionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {pendingAdmissionsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PRESENTATION & RENSEIGNEMENTS                    */}
      {/* ======================================================== */}
      {activeTab === 'presentation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Overview, Vision, Curriculums */}
            <div className="lg:col-span-8 space-y-6">
              {/* Vision Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E]">
                  <Sparkles className="w-4 h-4" />
                  <span>Présentation Générale de l'École Biblique</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#4A0E17]">
                  L'Institut Biblique Parakletos au service de l'Église
                </h2>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {data.info?.presentation ||
                    'L’Institut Biblique Parakletos est l’école théologique et pastorale de l’Église Missionnaire de la Foi de Sangmelima. Fondé pour répondre au besoin d’enracinement doctrinal, d’éthique ministérielle et d’affirmation du leadership chrétien, l’institut offre des parcours certifiants et diplômants adaptés aux laïcs engagés, aux responsables de cellules, aux diacres et aux futurs serviteurs.'}
                </p>

                {/* Requirements */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Conditions d'Admission :
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    {(data.info?.requirements || [
                      'Être membre engagé et baptisé par immersion',
                      'Avoir la recommandation d’un pasteur ou responsable de cellule',
                      'Faire preuve d’un témoignage chrétien authentique et d’une soif de la Parole',
                      'S’engager à suivre avec assiduité les cours et les travaux dirigés',
                    ]).map((req, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filières & Formations Proposées */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-[#4A0E17]">
                      Filières & Niveaux d'Étude ({data.classes.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Parcours académiques dispensés par des pasteurs et théologiens expérimentés
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('adhesion')}
                    className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition"
                  >
                    Postuler à une Filière
                  </button>
                </div>

                <div className="space-y-4">
                  {data.classes.map((cls) => {
                    const classSubjects = data.subjects.filter((s) => s.classId === cls.id);
                    return (
                      <div
                        key={cls.id}
                        className="bg-[#F4F7FB] border border-slate-200 rounded-2xl p-5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#6E1325] inline-block mb-1">
                              Diplôme : {cls.level}
                            </span>
                            <h4 className="text-base font-black text-slate-900">
                              {cls.name}
                            </h4>
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {classSubjects.length} matières au programme
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          {cls.description}
                        </p>

                        {/* Subjects list */}
                        <div className="pt-2 border-t border-slate-200/80">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                            Matières enseignées :
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {classSubjects.map((sbj) => (
                              <div
                                key={sbj.id}
                                className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-bold text-slate-900 text-xs block">
                                    {sbj.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Prof : {sbj.teacherName}
                                  </span>
                                </div>
                                <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  Coef {sbj.coefficient}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Practical Info & Teachers */}
            <div className="lg:col-span-4 space-y-6">
              {/* Practical Info Card */}
              <div className="bg-gradient-to-br from-[#4A0E17] to-[#6E1325] text-white rounded-3xl p-6 shadow-md space-y-4">
                <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E]">
                  <Clock className="w-4 h-4" />
                  <span>Renseignements Pratiques</span>
                </div>
                <h3 className="text-base font-black text-white">
                  Horaires & Modalités
                </h3>

                <div className="space-y-3 text-xs text-slate-200">
                  <div className="flex items-start space-x-2.5">
                    <Clock className="w-4 h-4 text-[#C99B2E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Horaires des cours :</strong>
                      <span>{data.info?.scheduleInfo || 'Mardi & Jeudi (18h-20h30) • Samedi (9h-13h)'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Award className="w-4 h-4 text-[#C99B2E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Scolarité :</strong>
                      <span>{data.info?.annualTuition || 'Subventionnée par l’église (25 000 FCFA/an support)'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-[#C99B2E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Lieu des cours :</strong>
                      <span>{data.info?.address || 'Grand Temple Akon, Sangmelima'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Phone className="w-4 h-4 text-[#C99B2E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Téléphone / WhatsApp :</strong>
                      <span>{data.info?.phone || '+237 699 00 11 22'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Mail className="w-4 h-4 text-[#C99B2E] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Email Institut :</strong>
                      <span>{data.info?.email || 'institut.parakletos@emf-sangmelima.org'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="text-[11px] text-slate-300">
                    <span className="block font-bold text-white">Doyen Académique :</span>
                    {data.info?.deanName || 'Pasteur Samuel Ondoa'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    <span className="block font-bold text-white">Secrétaire Général :</span>
                    {data.info?.academicSecretary || 'Ancien David Essomba'}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('adhesion')}
                  className="w-full py-2.5 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-black text-xs rounded-xl shadow transition"
                >
                  Faire une Demande d'Adhésion
                </button>
              </div>

              {/* Corps Enseignant */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-[#6E1325]" />
                  <span>Corps Enseignant</span>
                </div>
                <h4 className="text-sm font-black text-[#4A0E17]">
                  Nos Formateurs & Enseignants
                </h4>

                <div className="space-y-3">
                  {data.teachers.map((tch) => (
                    <div
                      key={tch.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{tch.name}</div>
                        <div className="text-[11px] text-[#6E1325] font-medium">{tch.title}</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{tch.specialty}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {tch.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DEMANDE D'ADHÉSION / INSCRIPTION POUR MEMBRES      */}
      {/* ======================================================== */}
      {activeTab === 'adhesion' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E] mb-1">
              <FileText className="w-4 h-4 fill-current text-[#6E1325]" />
              <span>Candidature & Inscription • Institut Biblique Parakletos</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#4A0E17]">
              Demande d'Adhésion aux Cours Bibliques
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Remplissez ce formulaire pour soumettre votre dossier. Après validation par le Doyen, votre code d'accès personnel d'étudiant vous sera communiqué par WhatsApp et par Email.
            </p>
          </div>

          {admissionSubmitted ? (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl space-y-4 animate-in zoom-in-95">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-950">
                    Candidature Enregistrée avec Succès !
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Votre dossier a été transmis au Doyenné de l'Institut Biblique Parakletos.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/80 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-2">
                <p>
                  <strong>Prochaine étape :</strong> L'administration examinera votre demande sous 48h. Dès validation :
                </p>
                <div className="space-y-1 pl-3 text-[11px] text-slate-600">
                  <div>1. Vous recevrez un <strong>Code d'Accès Étudiant unique</strong> (ex: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">PARAK-ETU-XXXX</code>).</div>
                  <div>2. Vous pourrez vous connecter sur cette page via l'onglet <strong>« Connexion par Code »</strong> pour suivre vos cours et vos notes.</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setAdmissionSubmitted(false)}
                  className="px-4 py-2 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl hover:bg-emerald-100"
                >
                  Soumettre une autre demande
                </button>
                <button
                  onClick={() => setActiveTab('code-access')}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow hover:bg-emerald-700"
                >
                  Aller à l'Espace Code d'Accès
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitAdmission} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom complet du candidat *</label>
                  <input
                    type="text"
                    required
                    value={admissionForm.applicantName}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, applicantName: e.target.value })}
                    placeholder="Ex: Patrick Meka"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#6E1325] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Filière / Niveau souhaité *</label>
                  <select
                    value={admissionForm.classId}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, classId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#6E1325] outline-none font-medium"
                  >
                    {data.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Numéro Téléphone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={admissionForm.phone}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                    placeholder="+237 6XX XX XX XX"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={admissionForm.email}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
                    placeholder="votre.email@domaine.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Profession ou Occupation</label>
                  <input
                    type="text"
                    value={admissionForm.profession}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, profession: e.target.value })}
                    placeholder="Ex: Enseignant, Commerçant, Étudiant..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date approximative de baptême par immersion</label>
                  <input
                    type="date"
                    value={admissionForm.baptismDate}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, baptismDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Témoignage de conversion et engagement à l'église *</label>
                <textarea
                  rows={3}
                  required
                  value={admissionForm.testimony}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, testimony: e.target.value })}
                  placeholder="Décrivez brièvement comment vous avez accepté Christ et vos ministères actuels à l'église..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivations pour suivre cette formation biblique *</label>
                <textarea
                  rows={2}
                  required
                  value={admissionForm.motivation}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, motivation: e.target.value })}
                  placeholder="Qu'attendez-vous de cette formation pour votre foi et votre service chrétien ?"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disponibilités pour les cours</label>
                <input
                  type="text"
                  value={admissionForm.availability}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, availability: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Votre dossier sera examiné en toute confidentialité par l'équipe pastorale.
                </span>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center space-x-2"
                >
                  <Send className="w-4 h-4 text-[#C99B2E]" />
                  <span>Envoyer ma Candidature</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ESPACE CONNEXION PAR CODE D'ACCÈS                */}
      {/* ======================================================== */}
      {activeTab === 'code-access' && (
        <div className="space-y-6">
          {!codeSession ? (
            /* Login Box with Access Code */
            <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[#4A0E17] text-[#C99B2E] flex items-center justify-center mx-auto shadow-md">
                  <Key className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-[#4A0E17]">
                  Espace Étudiants & Enseignants
                </h2>
                <p className="text-xs text-slate-500">
                  Saisissez le code d'accès personnel qui vous a été envoyé par l'administration après validation de votre inscription.
                </p>
              </div>

              <form onSubmit={handleVerifyAccessCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Votre Code d'Accès
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PARAK-ETU-2026 ou PARAK-ENS-2026"
                    value={inputAccessCode}
                    onChange={(e) => {
                      setInputAccessCode(e.target.value.toUpperCase());
                      setCodeAuthError(null);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono font-bold text-center text-base tracking-widest uppercase focus:border-[#6E1325] focus:ring-2 focus:ring-[#6E1325]/20 outline-none"
                  />
                  {codeAuthError && (
                    <div className="mt-2 text-xs text-rose-600 font-bold flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{codeAuthError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <LogIn className="w-4 h-4 text-[#C99B2E]" />
                  <span>Accéder à mon Espace</span>
                </button>
              </form>

              {/* Demo test helper codes */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block text-center uppercase tracking-wider">
                  Codes de démonstration (Cliquer pour tester) :
                </span>
                <div className="flex flex-col gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleVerifyAccessCode(undefined, 'PARAK-ETU-2026')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Paul Nnomo</span>
                      <span className="text-[10px] text-slate-500 block">Étudiant Niveau 1</span>
                    </div>
                    <code className="text-[11px] font-mono font-bold text-[#6E1325] bg-blue-50 px-2 py-0.5 rounded">
                      PARAK-ETU-2026
                    </code>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerifyAccessCode(undefined, 'PARAK-ENS-2026')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">Pasteur Samuel Ondoa</span>
                      <span className="text-[10px] text-slate-500 block">Enseignant & Doyen</span>
                    </div>
                    <code className="text-[11px] font-mono font-bold text-[#C99B2E] bg-amber-50 px-2 py-0.5 rounded">
                      PARAK-ENS-2026
                    </code>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Code Session View */
            <div className="space-y-6">
              {/* Session Top Bar */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#4A0E17] text-[#C99B2E] flex items-center justify-center font-bold">
                    {codeSession.type === 'ETUDIANT' ? <GraduationCap className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#6E1325] text-white">
                        {codeSession.type === 'ETUDIANT' ? 'Espace Étudiant' : 'Espace Enseignant'}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        Code: {codeSession.type === 'ETUDIANT' ? codeSession.student?.accessCode : codeSession.teacher?.accessCode}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-[#4A0E17]">
                      {codeSession.type === 'ETUDIANT'
                        ? `${codeSession.student?.firstName} ${codeSession.student?.lastName}`
                        : codeSession.teacher?.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {codeSession.type === 'ETUDIANT'
                        ? `Matricule : ${codeSession.student?.matricule} • ${codeSession.class?.name || 'Niveau 1'}`
                        : `${codeSession.teacher?.title} • Spécialité : ${codeSession.teacher?.specialty}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {codeSession.type === 'ETUDIANT' && (
                    <button
                      onClick={() => setShowBulletinModal(true)}
                      className="px-4 py-2 bg-[#C99B2E] hover:bg-amber-400 text-[#4A0E17] font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer mon Bulletin</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setCodeSession(null);
                      showToast('Déconnexion effectuée.');
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                  >
                    <LogOut className="w-4 h-4 text-slate-500" />
                    <span>Quitter la session</span>
                  </button>
                </div>
              </div>

              {/* ---------------- STUDENT SESSION VIEW ---------------- */}
              {codeSession.type === 'ETUDIANT' && codeSession.student && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Grades and courses */}
                  <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-base font-black text-[#4A0E17]">
                        Mes Notes & Évaluations (Année 2025-2026)
                      </h3>
                      <span className="text-xs font-bold text-slate-500">
                        Trimestre 1 en cours
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                            <th className="pb-3">Matière</th>
                            <th className="pb-3">Enseignant</th>
                            <th className="pb-3 text-center">Coef</th>
                            <th className="pb-3 text-right">Note / 20</th>
                            <th className="pb-3">Appréciation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(codeSession.subjects || []).map((sbj) => {
                            const gradeRecord = (codeSession.grades || []).find((g) => g.subjectId === sbj.id);
                            return (
                              <tr key={sbj.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 font-bold text-slate-900">
                                  {sbj.name}
                                </td>
                                <td className="py-3 text-slate-600">
                                  {sbj.teacherName}
                                </td>
                                <td className="py-3 text-center font-bold">
                                  {sbj.coefficient}
                                </td>
                                <td className="py-3 text-right">
                                  {gradeRecord ? (
                                    <span
                                      className={`font-black text-sm ${
                                        gradeRecord.grade >= 14
                                          ? 'text-emerald-700'
                                          : gradeRecord.grade >= 10
                                          ? 'text-blue-700'
                                          : 'text-amber-700'
                                      }`}
                                    >
                                      {gradeRecord.grade.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">En attente</span>
                                  )}
                                </td>
                                <td className="py-3 text-slate-500 italic max-w-xs truncate">
                                  {gradeRecord?.comments || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Academic Average & Info */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#F4F7FB] border border-slate-200 rounded-3xl p-6 text-center space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Moyenne Générale Pondérée
                      </span>
                      <div className="text-4xl font-black text-[#6E1325]">
                        {calculateAverage()} <span className="text-lg font-bold text-slate-400">/ 20</span>
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {Number(calculateAverage()) >= 12 ? 'Admis avec Félicitations' : 'En bonne progression'}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs text-slate-600">
                      <h4 className="font-black text-slate-900 text-sm">
                        Consignes de l'Institut
                      </h4>
                      <p>
                        • Les cours ont lieu le mardi et jeudi de 18h00 à 20h30 et le samedi matin de 9h00 à 13h00.
                      </p>
                      <p>
                        • En cas d'absence justifiée, contactez le secrétariat académique au <strong>+237 677 88 11 22</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- TEACHER SESSION VIEW ---------------- */}
              {codeSession.type === 'ENSEIGNANT' && codeSession.teacher && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <span className="text-xs font-black text-[#C99B2E] uppercase tracking-wider block mb-1">
                        Espace Pédagogique
                      </span>
                      <h3 className="text-xl font-black text-[#4A0E17]">
                        Saisie des Notes & Évaluations des Étudiants
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Saisissez ou mettez à jour les notes de vos étudiants pour vos matières assignées.
                      </p>
                    </div>

                    {/* Table of students and their grades */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                            <th className="pb-3">Étudiant</th>
                            <th className="pb-3">Matricule</th>
                            <th className="pb-3">Matière</th>
                            <th className="pb-3 text-center">Note Actuelle / 20</th>
                            <th className="pb-3 text-center">Modifier la Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.students.map((std) => {
                            return data.subjects.map((sbj) => {
                              const existingGrade = data.grades.find(
                                (g) => g.studentId === std.id && g.subjectId === sbj.id
                              );
                              return (
                                <tr key={`${std.id}-${sbj.id}`} className="hover:bg-slate-50 transition">
                                  <td className="py-3 font-bold text-slate-900">
                                    {std.firstName} {std.lastName}
                                  </td>
                                  <td className="py-3 font-mono text-slate-500">
                                    {std.matricule}
                                  </td>
                                  <td className="py-3 text-slate-700">
                                    {sbj.name} (Coef {sbj.coefficient})
                                  </td>
                                  <td className="py-3 text-center font-black text-sm">
                                    {existingGrade ? (
                                      <span className="text-emerald-700">{existingGrade.grade.toFixed(1)}</span>
                                    ) : (
                                      <span className="text-slate-400 font-normal italic">Non noté</span>
                                    )}
                                  </td>
                                  <td className="py-3 text-center">
                                    <button
                                      onClick={() => {
                                        const promptVal = prompt(
                                          `Saisir la note sur 20 pour ${std.firstName} ${std.lastName} (${sbj.name}) :`,
                                          existingGrade ? String(existingGrade.grade) : '15'
                                        );
                                        if (promptVal !== null) {
                                          const val = parseFloat(promptVal);
                                          if (!isNaN(val) && val >= 0 && val <= 20) {
                                            handleTeacherRecordGrade(std.id, sbj.id, val);
                                          } else {
                                            alert('Note invalide. Saisir une valeur entre 0 et 20.');
                                          }
                                        }
                                      }}
                                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-[#C99B2E]/60 text-xs font-bold rounded-lg transition"
                                    >
                                      {existingGrade ? 'Modifier' : 'Noter'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ADMIN DASHBOARD (ADMIN & PASTEUR)                  */}
      {/* ======================================================== */}
      {activeTab === 'dashboard' && isLeadership && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-wrap gap-2">
            <button
              onClick={() => setAdminSubTab('candidatures')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                adminSubTab === 'candidatures'
                  ? 'bg-[#6E1325] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Demandes d'Adhésion</span>
              {pendingAdmissionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {pendingAdmissionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setAdminSubTab('renseignements')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                adminSubTab === 'renseignements'
                  ? 'bg-[#6E1325] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Renseignements Généraux</span>
            </button>

            <button
              onClick={() => setAdminSubTab('filieres')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                adminSubTab === 'filieres'
                  ? 'bg-[#6E1325] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Filières ({data.classes.length})</span>
            </button>

            <button
              onClick={() => setAdminSubTab('cours')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                adminSubTab === 'cours'
                  ? 'bg-[#6E1325] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Cours & Matières ({data.subjects.length})</span>
            </button>

            <button
              onClick={() => setAdminSubTab('enseignants')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                adminSubTab === 'enseignants'
                  ? 'bg-[#6E1325] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Enseignants & Codes ({data.teachers.length})</span>
            </button>

            <button
              onClick={() => setAdminSubTab('etudiants')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                adminSubTab === 'etudiants'
                  ? 'bg-[#6E1325] text-white shadow'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Étudiants & Bulletins ({data.students.length})</span>
            </button>
          </div>

          {/* Validation Alert Popup */}
          {validatedAdmissionData && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-xl space-y-4 animate-in slide-in-from-top">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">
                      Candidature Validée ! Code d'Accès Généré :
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Étudiant : <strong>{validatedAdmissionData.applicantName}</strong> ({validatedAdmissionData.className})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setValidatedAdmissionData(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Code d'accès étudiant personnel à envoyer :
                  </span>
                  <div className="font-mono text-2xl font-black text-[#6E1325] tracking-widest mt-0.5">
                    {validatedAdmissionData.accessCode}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        validatedAdmissionData.accessCode,
                        "Code d'accès étudiant"
                      )
                    }
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le Code</span>
                  </button>

                  <button
                    onClick={() => {
                      const msg = `Paix du Christ ${validatedAdmissionData.applicantName} ! Votre inscription à l'Institut Biblique Parakletos (${validatedAdmissionData.className}) est validée. Votre code d'accès personnel pour consulter vos cours et notes est : ${validatedAdmissionData.accessCode}. Rendez-vous sur https://emf-sangmelima.org`;
                      copyToClipboard(msg, 'Message WhatsApp');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Copier Message WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. DEMANDES D'ADHÉSION */}
          {adminSubTab === 'candidatures' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#4A0E17]">
                    Demandes d'Adhésion & Inscriptions Reçues ({data.admissions.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validez les candidatures des fidèles pour générer automatiquement leur code d'accès étudiant
                  </p>
                </div>
              </div>

              {data.admissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Aucune candidature d'adhésion en attente.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.admissions.map((adm) => {
                    const isPending = adm.status === 'EN_ATTENTE';
                    const isValidated = adm.status === 'VALIDEE';
                    return (
                      <div
                        key={adm.id}
                        className={`p-5 rounded-2xl border transition space-y-3 ${
                          isPending
                            ? 'bg-amber-50/50 border-amber-200'
                            : isValidated
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-slate-900">{adm.applicantName}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : isValidated
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {adm.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#6E1325] font-bold mt-0.5">{adm.className}</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleValidateAdmission(adm.id)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Valider & Générer Code</span>
                                </button>
                                <button
                                  onClick={() => handleRejectAdmission(adm.id)}
                                  className="px-3 py-2 bg-slate-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
                                >
                                  Rejeter
                                </button>
                              </>
                            )}

                            {isValidated && adm.generatedAccessCode && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                                  Code : {adm.generatedAccessCode}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(adm.generatedAccessCode || '', 'Code Étudiant')}
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                                  title="Copier le code"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/60">
                          <div><strong>Téléphone :</strong> {adm.phone}</div>
                          <div><strong>Email :</strong> {adm.email || '—'}</div>
                          <div><strong>Profession :</strong> {adm.profession || '—'}</div>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1">
                          <p><strong>Témoignage :</strong> {adm.testimony}</p>
                          <p><strong>Motivations :</strong> {adm.motivation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. RENSEIGNEMENTS GÉNÉRAUX */}
          {adminSubTab === 'renseignements' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#4A0E17]">
                  Paramètres des Renseignements de l'Institut
                </h3>
                <p className="text-xs text-slate-500">
                  Modifiez les informations officielles visibles par les membres et visiteurs
                </p>
              </div>

              <form onSubmit={handleSaveInfo} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom de l'Institut</label>
                    <input
                      type="text"
                      value={infoForm.name || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Devise / Slogan</label>
                    <input
                      type="text"
                      value={infoForm.slogan || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, slogan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Doyen Académique</label>
                    <input
                      type="text"
                      value={infoForm.deanName || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, deanName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Secrétaire Académique</label>
                    <input
                      type="text"
                      value={infoForm.academicSecretary || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, academicSecretary: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone de contact</label>
                    <input
                      type="text"
                      value={infoForm.phone || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email officiel</label>
                    <input
                      type="text"
                      value={infoForm.email || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Adresse / Localisation</label>
                    <input
                      type="text"
                      value={infoForm.address || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Scolarité / Tarification</label>
                    <input
                      type="text"
                      value={infoForm.annualTuition || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, annualTuition: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Horaires des cours</label>
                    <input
                      type="text"
                      value={infoForm.scheduleInfo || ''}
                      onChange={(e) => setInfoForm({ ...infoForm, scheduleInfo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Texte de Présentation</label>
                  <textarea
                    rows={4}
                    value={infoForm.presentation || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, presentation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl resize-none"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#6E1325] hover:bg-[#4A0E17] text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Enregistrer les Renseignements
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. FILIÈRES & NIVEAUX */}
          {adminSubTab === 'filieres' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#4A0E17]">
                    Paramétrage des Filières ({data.classes.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Définissez les parcours et niveaux de formation théologique
                  </p>
                </div>

                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow"
                >
                  <Plus className="w-4 h-4 text-[#C99B2E]" />
                  <span>Ajouter une Filière</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.classes.map((cls) => {
                  const subjs = data.subjects.filter((s) => s.classId === cls.id);
                  const stCount = data.students.filter((s) => s.classId === cls.id).length;
                  return (
                    <div
                      key={cls.id}
                      className="p-5 rounded-2xl bg-[#F4F7FB] border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-[#6E1325]">
                          {cls.level}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {stCount} étudiants inscrits
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900">{cls.name}</h4>
                      <p className="text-xs text-slate-600">{cls.description}</p>
                      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                        {subjs.length} matières enseignées au programme
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. COURS & MATIÈRES */}
          {adminSubTab === 'cours' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#4A0E17]">
                    Paramétrage des Cours & Matières ({data.subjects.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gérez les cours, coefficients et assignation aux enseignants
                  </p>
                </div>

                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow"
                >
                  <Plus className="w-4 h-4 text-[#C99B2E]" />
                  <span>Ajouter un Cours</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3">Intitulé du Cours</th>
                      <th className="pb-3">Filière / Niveau</th>
                      <th className="pb-3">Enseignant Assigné</th>
                      <th className="pb-3 text-center">Coefficient</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.subjects.map((sbj) => {
                      const cls = data.classes.find((c) => c.id === sbj.classId);
                      return (
                        <tr key={sbj.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-bold text-slate-900">{sbj.name}</td>
                          <td className="py-3 text-slate-600">{cls?.name || 'Filière'}</td>
                          <td className="py-3 font-medium text-slate-700">{sbj.teacherName}</td>
                          <td className="py-3 text-center font-black">{sbj.coefficient}</td>
                          <td className="py-3 text-center">
                            <button
                              onClick={async () => {
                                if (confirm(`Supprimer le cours ${sbj.name} ?`)) {
                                  await apiClient.deleteParakletosSubject(sbj.id, currentUser || undefined);
                                  showToast('Cours supprimé.');
                                  loadData();
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. ENSEIGNANTS & CODES */}
          {adminSubTab === 'enseignants' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-[#4A0E17]">
                    Corps Enseignant & Codes d'Accès ({data.teachers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Codes d'accès envoyés par l'admin permettant aux enseignants de se connecter
                  </p>
                </div>

                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow"
                >
                  <Plus className="w-4 h-4 text-[#C99B2E]" />
                  <span>Ajouter un Enseignant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.teachers.map((tch) => (
                  <div
                    key={tch.id}
                    className="p-5 rounded-2xl bg-[#F4F7FB] border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black text-slate-900">{tch.name}</h4>
                        <span className="text-xs text-[#6E1325] font-bold block">{tch.title}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{tch.specialty}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {tch.status}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Code d'Accès Enseignant :
                        </span>
                        <span className="font-mono text-sm font-black text-[#4A0E17]">
                          {tch.accessCode}
                        </span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(tch.accessCode, "Code d'accès enseignant")}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] border border-[#C99B2E]/60 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#C99B2E]" />
                        <span>Copier Code</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Tél : {tch.phone}</span>
                      <span>Email : {tch.email || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ÉTUDIANTS & BULLETINS */}
          {adminSubTab === 'etudiants' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-black text-[#4A0E17]">
                    Registre des Étudiants & Relevés ({data.students.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Codes d'accès étudiants, notes réelles et édition des bulletins officiels
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (selectedStudent) {
                        setGradeForm({ ...gradeForm, studentId: selectedStudent.id, subjectId: data.subjects[0]?.id || '' });
                        setShowAddGradeModal(true);
                      }
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-[#4A0E17] text-xs font-bold rounded-xl transition border border-[#C99B2E]/50 flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-[#C99B2E]" />
                    <span>Saisir une Note</span>
                  </button>

                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-4 py-2 bg-[#6E1325] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition shadow flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-[#C99B2E]" />
                    <span>Inscrire Étudiant Direct</span>
                  </button>
                </div>
              </div>

              {/* Grid: Student List & Detailed Record */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Students List */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider block pb-2 border-b border-slate-100">
                    Étudiants Inscrits ({data.students.length})
                  </span>

                  <div className="space-y-2">
                    {data.students.map((std) => {
                      const isSelected = selectedStudent?.id === std.id;
                      const cls = data.classes.find((c) => c.id === std.classId);
                      return (
                        <div
                          key={std.id}
                          onClick={() => setSelectedStudent(std)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-[#6E1325] bg-blue-50/70 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {std.firstName} {std.lastName}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {std.matricule}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {cls ? cls.name : 'Niveau 1'}
                            </p>
                            <span className="font-mono text-[10px] text-[#6E1325] font-bold">
                              Code: {std.accessCode}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {std.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Student Grades & Bulletin Preview */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                  {selectedStudent ? (
                    <>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                        <div>
                          <h3 className="text-base font-black text-[#4A0E17]">
                            Relevé : {selectedStudent.firstName} {selectedStudent.lastName}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Matricule : <span className="font-mono font-bold">{selectedStudent.matricule}</span> • Code :{' '}
                            <span className="font-mono font-bold text-[#6E1325]">{selectedStudent.accessCode}</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowBulletinModal(true)}
                            className="px-3 py-1.5 bg-[#C99B2E] text-[#4A0E17] font-bold text-xs rounded-xl hover:bg-amber-400 transition shadow flex items-center space-x-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Générer Bulletin Officiel</span>
                          </button>
                        </div>
                      </div>

                      {/* Calculated Average KPI Card */}
                      <div className="bg-[#F4F7FB] p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Moyenne Générale Pondérée
                          </span>
                          <div className="text-3xl font-black text-[#6E1325] mt-0.5">
                            {calculateAverage()} / 20
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {Number(calculateAverage()) >= 12 ? 'Admis avec Mention' : 'En progression'}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Calcul automatique basé sur les coefficients
                          </p>
                        </div>
                      </div>

                      {/* Grades Table */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#4A0E17] uppercase tracking-wider">
                          Notes Enregistrées ({studentGrades.length})
                        </span>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-2">Matière</th>
                                <th className="pb-2">Trimestre</th>
                                <th className="pb-2 text-center">Coef</th>
                                <th className="pb-2 text-right">Note / 20</th>
                                <th className="pb-2">Appréciation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {studentGrades.map((g) => {
                                const subj = data.subjects.find((s) => s.id === g.subjectId);
                                return (
                                  <tr key={g.id} className="hover:bg-slate-50 transition">
                                    <td className="py-2.5 font-bold text-slate-900">{subj ? subj.name : 'Matière'}</td>
                                    <td className="py-2.5 text-slate-500">{g.term}</td>
                                    <td className="py-2.5 text-center font-bold">{subj ? subj.coefficient : 1}</td>
                                    <td className="py-2.5 text-right font-black text-sm text-[#6E1325]">
                                      {g.grade.toFixed(1)}
                                    </td>
                                    <td className="py-2.5 text-slate-600 italic max-w-xs truncate">{g.comments || '—'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Sélectionnez un étudiant dans la liste pour voir son relevé.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: OFFICIAL BULLETIN PRINTABLE MODAL                  */}
      {/* ======================================================== */}
      {showBulletinModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="no-print bg-[#4A0E17] px-6 py-3 text-white flex items-center justify-between">
              <span className="font-bold text-xs">Bulletin Académique Officiel</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#C99B2E] text-[#4A0E17] text-xs font-bold rounded-lg hover:bg-amber-400 transition flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setShowBulletinModal(false)}
                  className="p-1 text-slate-300 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-bulletin" className="p-8 text-slate-800 bg-white space-y-6">
              <div className="text-center border-b-2 border-[#6E1325] pb-4">
                <h1 className="text-lg font-black text-[#4A0E17] uppercase tracking-wider">
                  INSTITUT BIBLIQUE PARAKLETOS
                </h1>
                <p className="text-xs text-slate-600 font-semibold">
                  Église Missionnaire de la Foi — Sangmelima, Cameroun
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded bg-[#6E1325] text-[#C99B2E] font-bold text-xs uppercase tracking-widest">
                  BULLETIN DE NOTES ACADÉMIQUE
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400">Nom de l’Étudiant :</span>
                  <p className="font-black text-slate-900 text-sm">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-slate-500 font-mono mt-0.5">Matricule : {selectedStudent.matricule}</p>
                </div>
                <div>
                  <span className="text-slate-400">Année Académique :</span>
                  <p className="font-bold text-slate-900">2025-2026</p>
                  <p className="text-slate-500 mt-0.5">Niveau : Certificat Théologique Fondamental</p>
                </div>
              </div>

              {/* Table of Grades */}
              <table className="w-full text-xs text-left border border-slate-200">
                <thead className="bg-[#6E1325] text-white uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Matière</th>
                    <th className="py-2 px-3">Enseignant</th>
                    <th className="py-2 px-3 text-center">Coef</th>
                    <th className="py-2 px-3 text-right">Note / 20</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {studentGrades.map((g) => {
                    const subj = data.subjects.find((s) => s.id === g.subjectId);
                    return (
                      <tr key={g.id}>
                        <td className="py-2 px-3 font-bold">{subj ? subj.name : 'Matière'}</td>
                        <td className="py-2 px-3 text-slate-600">{subj?.teacherName}</td>
                        <td className="py-2 px-3 text-center">{subj?.coefficient}</td>
                        <td className="py-2 px-3 text-right font-black text-sm">{g.grade.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-xs uppercase text-slate-700">Moyenne Finale :</span>
                <span className="font-black text-xl text-[#4A0E17]">{calculateAverage()} / 20</span>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 text-xs border-t border-dashed border-slate-300">
                <div>
                  <p className="text-slate-500 font-semibold mb-10">Le Directeur des Études :</p>
                  <div className="border-t border-slate-300 w-36 pt-1 text-slate-400 text-[10px]">
                    Signature
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-semibold mb-10">Le Doyen / Pasteur Principal :</p>
                  <div className="border-t border-slate-300 w-44 ml-auto pt-1 text-slate-400 text-[10px]">
                    Cachet officiel & Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD STUDENT DIRECTLY                              */}
      {/* ======================================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Inscription Directe Étudiant</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={studentForm.firstName}
                  onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={studentForm.lastName}
                  onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filière</label>
                <select
                  value={studentForm.classId}
                  onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                <input
                  type="text"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl hover:bg-[#4A0E17]"
                >
                  Inscrire l'étudiant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD CLASS / FILIÈRE                               */}
      {/* ======================================================== */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Ajouter une Filière</h3>
              <button onClick={() => setShowAddClassModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Intitulé de la Filière *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Niveau 3 : Mission, Évangélisation & Implantation"
                  value={newClassForm.name}
                  onChange={(e) => setNewClassForm({ ...newClassForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Niveau / Titre délivré</label>
                <input
                  type="text"
                  placeholder="Ex: Diplôme d'Études Théologiques"
                  value={newClassForm.level}
                  onChange={(e) => setNewClassForm({ ...newClassForm, level: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Objectifs</label>
                <textarea
                  rows={3}
                  value={newClassForm.description}
                  onChange={(e) => setNewClassForm({ ...newClassForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl">
                  Créer la filière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD SUBJECT / COURS                                */}
      {/* ======================================================== */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Ajouter un Cours</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom du cours *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pneumatologie & Dons Spirituels"
                  value={newSubjectForm.name}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Filière / Classe</label>
                <select
                  value={newSubjectForm.classId}
                  onChange={(e) => setNewSubjectForm({ ...newSubjectForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enseignant</label>
                  <input
                    type="text"
                    placeholder="Ex: Pasteur Samuel Ondoa"
                    value={newSubjectForm.teacherName}
                    onChange={(e) => setNewSubjectForm({ ...newSubjectForm, teacherName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSubjectForm.coefficient}
                    onChange={(e) => setNewSubjectForm({ ...newSubjectForm, coefficient: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl">
                  Créer le cours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD TEACHER                                       */}
      {/* ======================================================== */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Ajouter un Enseignant</h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeacher} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ancien Paul Nnomo"
                  value={newTeacherForm.name}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Titre</label>
                  <input
                    type="text"
                    value={newTeacherForm.title}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spécialité</label>
                  <input
                    type="text"
                    value={newTeacherForm.specialty}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Téléphone / WhatsApp</label>
                <input
                  type="text"
                  value={newTeacherForm.phone}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Code d'accès enseignant personnalisé (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Laisser vide pour générer automatiquement PARAK-ENS-XXXX"
                  value={newTeacherForm.accessCode}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, accessCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl">
                  Créer l'enseignant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD GRADE                                         */}
      {/* ======================================================== */}
      {showAddGradeModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#4A0E17] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                Saisir Note : {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button onClick={() => setShowAddGradeModal(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordGradeSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Matière</label>
                <select
                  value={gradeForm.subjectId}
                  onChange={(e) => setGradeForm({ ...gradeForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  {data.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Coef {s.coefficient}) - {s.teacherName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Note sur 20 *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  required
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Appréciation pédagogique</label>
                <input
                  type="text"
                  value={gradeForm.comments}
                  onChange={(e) => setGradeForm({ ...gradeForm, comments: e.target.value })}
                  placeholder="Ex: Très bon travail, persévérez"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddGradeModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6E1325] text-white font-bold rounded-xl">
                  Enregistrer la note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
