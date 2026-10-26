import {
  User,
  Permission,
  Member,
  Family,
  Ministry,
  Department,
  AttendanceSession,
  AttendanceRecord,
  Transaction,
  TransactionCategory,
  Event,
  EventParticipant,
  Announcement,
  Testimonial,
  ForumCategory,
  ForumTopic,
  ForumPost,
  ForumReport,
  DailyBibleVerse,
  MediaItem,
  ParakletosYear,
  ParakletosClass,
  ParakletosSubject,
  ParakletosStudent,
  ParakletosGrade,
  AuditLog,
  BackupRecord,
  SystemSettings,
  HomepageSection,
  HomepageCMSState,
  HomepageRevision,
  Role,
  PrayerRequest,
  AssociatedChurch,
  HomeCell,
  MinistryAdhesionRequest,
  HomepageCarouselSlide,
  LatestServiceMedia,
  ServiceMediaPhoto,
  ServiceMediaVideo,
  ParakletosInstituteInfo,
  ParakletosTeacher,
  ParakletosAdmissionRequest,
  AppNotification,
  TreasurySettings,
  ChurchResource,
  WeeklyProgram,
} from '../types';

import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_FAMILIES,
  INITIAL_MINISTRIES,
  INITIAL_MEMBERS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_SESSIONS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TESTIMONIALS,
  INITIAL_BIBLE_VERSES,
  INITIAL_FORUM_CATEGORIES,
  INITIAL_FORUM_TOPICS,
  INITIAL_FORUM_POSTS,
  INITIAL_MEDIA,
  INITIAL_PARAKLETOS_YEARS,
  INITIAL_PARAKLETOS_CLASSES,
  INITIAL_PARAKLETOS_SUBJECTS,
  INITIAL_PARAKLETOS_STUDENTS,
  INITIAL_PARAKLETOS_GRADES,
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_CMS_STATE,
  INITIAL_AUDIT_LOGS,
  INITIAL_BACKUPS,
  INITIAL_PRAYER_REQUESTS,
  INITIAL_DEPARTMENTS,
  INITIAL_ASSOCIATED_CHURCHES,
  INITIAL_HOME_CELLS,
  INITIAL_MINISTRY_ADHESIONS,
  INITIAL_CAROUSEL_SLIDES,
  INITIAL_LATEST_SERVICE_MEDIA,
  INITIAL_PARAKLETOS_INFO,
  INITIAL_PARAKLETOS_TEACHERS,
  INITIAL_PARAKLETOS_ADMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RESOURCES,
  INITIAL_WEEKLY_PROGRAMS,
} from './initialData';

const STORAGE_KEY = 'EMF_SMART_DB_V1';

export interface DatabaseState {
  settings: SystemSettings;
  users: User[];
  members: Member[];
  families: Family[];
  ministries: Ministry[];
  departments: Department[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  transactions: Transaction[];
  transactionCategories: TransactionCategory[];
  events: Event[];
  eventParticipants: EventParticipant[];
  announcements: Announcement[];
  testimonials: Testimonial[];
  forumCategories: ForumCategory[];
  forumTopics: ForumTopic[];
  forumPosts: ForumPost[];
  forumReports: ForumReport[];
  bibleVerses: DailyBibleVerse[];
  media: MediaItem[];
  parakletosYears: ParakletosYear[];
  parakletosClasses: ParakletosClass[];
  parakletosSubjects: ParakletosSubject[];
  parakletosStudents: ParakletosStudent[];
  parakletosGrades: ParakletosGrade[];
  parakletosInfo: ParakletosInstituteInfo;
  parakletosTeachers: ParakletosTeacher[];
  parakletosAdmissions: ParakletosAdmissionRequest[];
  cmsState: HomepageCMSState;
  auditLogs: AuditLog[];
  backups: BackupRecord[];
  prayerRequests: PrayerRequest[];
  associatedChurches: AssociatedChurch[];
  homeCells: HomeCell[];
  ministryAdhesions: MinistryAdhesionRequest[];
  carouselSlides: HomepageCarouselSlide[];
  latestServiceMedia: LatestServiceMedia;
  notifications: AppNotification[];
  resources: ChurchResource[];
  weeklyPrograms: WeeklyProgram[];
}

function loadInitialDatabase(): DatabaseState {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const settings = parsed.settings || INITIAL_SETTINGS;
        if (!settings.treasury) {
          settings.treasury = INITIAL_SETTINGS.treasury;
        }
        return {
          settings,
          users: (() => {
            const list = parsed.users || INITIAL_USERS;
            const admin = list.find((u: any) => u.id === 'usr-admin-1' || u.role === 'ADMIN');
            if (admin) {
              admin.email = 'cyrilleoyono6@gmail.com';
              admin.firstName = 'Cyrille';
              admin.lastName = 'Oyono';
              admin.passwordHash = 'AdminEMF2026!';
            }
            return list;
          })(),
          members: parsed.members || INITIAL_MEMBERS,
          families: parsed.families || INITIAL_FAMILIES,
          ministries: parsed.ministries || INITIAL_MINISTRIES,
          departments: parsed.departments && parsed.departments.length > 0 ? parsed.departments : INITIAL_DEPARTMENTS,
          attendanceSessions: parsed.attendanceSessions || INITIAL_SESSIONS,
          attendanceRecords: parsed.attendanceRecords || INITIAL_ATTENDANCE_RECORDS,
          transactions: parsed.transactions || INITIAL_TRANSACTIONS,
          transactionCategories: parsed.transactionCategories || INITIAL_CATEGORIES,
          events: (() => {
            if (!parsed.events || parsed.events.length === 0) return INITIAL_EVENTS;
            const existingIds = new Set(parsed.events.map((e: any) => e.id));
            const missing = INITIAL_EVENTS.filter((e) => !existingIds.has(e.id));
            return [...parsed.events, ...missing];
          })(),
          eventParticipants: parsed.eventParticipants || [],
          announcements: parsed.announcements || INITIAL_ANNOUNCEMENTS,
          testimonials: parsed.testimonials || INITIAL_TESTIMONIALS,
          forumCategories: parsed.forumCategories || INITIAL_FORUM_CATEGORIES,
          forumTopics: parsed.forumTopics || INITIAL_FORUM_TOPICS,
          forumPosts: parsed.forumPosts || INITIAL_FORUM_POSTS,
          forumReports: parsed.forumReports || [],
          bibleVerses: parsed.bibleVerses || INITIAL_BIBLE_VERSES,
          media: parsed.media || INITIAL_MEDIA,
          parakletosYears: parsed.parakletosYears || INITIAL_PARAKLETOS_YEARS,
          parakletosClasses: parsed.parakletosClasses || INITIAL_PARAKLETOS_CLASSES,
          parakletosSubjects: parsed.parakletosSubjects || INITIAL_PARAKLETOS_SUBJECTS,
          parakletosStudents: parsed.parakletosStudents || INITIAL_PARAKLETOS_STUDENTS,
          parakletosGrades: parsed.parakletosGrades || INITIAL_PARAKLETOS_GRADES,
          parakletosInfo: parsed.parakletosInfo || INITIAL_PARAKLETOS_INFO,
          parakletosTeachers: parsed.parakletosTeachers || INITIAL_PARAKLETOS_TEACHERS,
          parakletosAdmissions: parsed.parakletosAdmissions || INITIAL_PARAKLETOS_ADMISSIONS,
          cmsState: (() => {
            const cms = parsed.cmsState || INITIAL_CMS_STATE;
            if (cms?.publishedSections) {
              const pres = cms.publishedSections.find((s: any) => s.key === 'presentation');
              if (pres && pres.imageUrl && pres.imageUrl.includes('511795409834')) {
                pres.imageUrl = '';
              }
            }
            if (cms?.draftSections) {
              const presDraft = cms.draftSections.find((s: any) => s.key === 'presentation');
              if (presDraft && presDraft.imageUrl && presDraft.imageUrl.includes('511795409834')) {
                presDraft.imageUrl = '';
              }
            }
            return cms;
          })(),
          auditLogs: parsed.auditLogs || INITIAL_AUDIT_LOGS,
          backups: parsed.backups || INITIAL_BACKUPS,
          prayerRequests: parsed.prayerRequests || INITIAL_PRAYER_REQUESTS,
          associatedChurches: parsed.associatedChurches || INITIAL_ASSOCIATED_CHURCHES,
          homeCells: parsed.homeCells || INITIAL_HOME_CELLS,
          ministryAdhesions: parsed.ministryAdhesions || INITIAL_MINISTRY_ADHESIONS,
          carouselSlides: (() => {
            if (!parsed.carouselSlides || parsed.carouselSlides.length === 0) return INITIAL_CAROUSEL_SLIDES;
            // Upgrade slides 4 & 5 if they still point to generic old links
            return parsed.carouselSlides.map((s: any) => {
              if (s.id === 'slide-4' && s.primaryButtonLink === '#about') {
                return {
                  ...s,
                  title: 'Cellules de Prière dans vos Quartiers',
                  primaryButtonText: 'Cellules de Prière',
                  primaryButtonLink: '/home-cells',
                  secondaryButtonText: 'Guides & Ressources',
                  secondaryButtonLink: '/resources?cat=PRIERE',
                };
              }
              if (s.id === 'slide-5' && s.primaryButtonLink === '#services') {
                return {
                  ...s,
                  badge: 'Formation Biblique & Leadership',
                  title: 'Institut Biblique Parakletos d’Akon',
                  primaryButtonText: 'S’inscrire à l’Institut',
                  primaryButtonLink: '/parakletos#adhesion',
                  secondaryButtonText: 'Ressources & Études',
                  secondaryButtonLink: '/resources',
                };
              }
              return s;
            });
          })(),
          latestServiceMedia: parsed.latestServiceMedia || INITIAL_LATEST_SERVICE_MEDIA,
          notifications: parsed.notifications && parsed.notifications.length > 0 ? parsed.notifications : INITIAL_NOTIFICATIONS,
          resources: parsed.resources && parsed.resources.length > 0 ? parsed.resources : INITIAL_RESOURCES,
          weeklyPrograms: parsed.weeklyPrograms && parsed.weeklyPrograms.length > 0 ? parsed.weeklyPrograms : INITIAL_WEEKLY_PROGRAMS,
        };
      }
    } catch (e) {
      console.error('Error loading database from storage:', e);
    }
  }

  return {
    settings: INITIAL_SETTINGS,
    users: INITIAL_USERS,
    members: INITIAL_MEMBERS,
    families: INITIAL_FAMILIES,
    ministries: INITIAL_MINISTRIES,
    departments: INITIAL_DEPARTMENTS,
    attendanceSessions: INITIAL_SESSIONS,
    attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
    transactions: INITIAL_TRANSACTIONS,
    transactionCategories: INITIAL_CATEGORIES,
    events: INITIAL_EVENTS,
    eventParticipants: [],
    announcements: INITIAL_ANNOUNCEMENTS,
    testimonials: INITIAL_TESTIMONIALS,
    forumCategories: INITIAL_FORUM_CATEGORIES,
    forumTopics: INITIAL_FORUM_TOPICS,
    forumPosts: INITIAL_FORUM_POSTS,
    forumReports: [],
    bibleVerses: INITIAL_BIBLE_VERSES,
    media: INITIAL_MEDIA,
    parakletosYears: INITIAL_PARAKLETOS_YEARS,
    parakletosClasses: INITIAL_PARAKLETOS_CLASSES,
    parakletosSubjects: INITIAL_PARAKLETOS_SUBJECTS,
    parakletosStudents: INITIAL_PARAKLETOS_STUDENTS,
    parakletosGrades: INITIAL_PARAKLETOS_GRADES,
    parakletosInfo: INITIAL_PARAKLETOS_INFO,
    parakletosTeachers: INITIAL_PARAKLETOS_TEACHERS,
    parakletosAdmissions: INITIAL_PARAKLETOS_ADMISSIONS,
    cmsState: INITIAL_CMS_STATE,
    auditLogs: INITIAL_AUDIT_LOGS,
    backups: INITIAL_BACKUPS,
    prayerRequests: INITIAL_PRAYER_REQUESTS,
    associatedChurches: INITIAL_ASSOCIATED_CHURCHES,
    homeCells: INITIAL_HOME_CELLS,
    ministryAdhesions: INITIAL_MINISTRY_ADHESIONS,
    carouselSlides: INITIAL_CAROUSEL_SLIDES,
    latestServiceMedia: INITIAL_LATEST_SERVICE_MEDIA,
    notifications: INITIAL_NOTIFICATIONS,
    resources: INITIAL_RESOURCES,
    weeklyPrograms: INITIAL_WEEKLY_PROGRAMS,
  };
}

let db: DatabaseState = loadInitialDatabase();

function persistDatabase() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to persist database state:', e);
    }
  }
}

export const Storage = {
  // Database State Snapshot
  getSnapshot(): DatabaseState {
    return db;
  },

  resetDatabase(): DatabaseState {
    db = {
      settings: INITIAL_SETTINGS,
      users: INITIAL_USERS,
      members: INITIAL_MEMBERS,
      families: INITIAL_FAMILIES,
      ministries: INITIAL_MINISTRIES,
      departments: INITIAL_DEPARTMENTS,
      attendanceSessions: INITIAL_SESSIONS,
      attendanceRecords: INITIAL_ATTENDANCE_RECORDS,
      transactions: INITIAL_TRANSACTIONS,
      transactionCategories: INITIAL_CATEGORIES,
      events: INITIAL_EVENTS,
      eventParticipants: [],
      announcements: INITIAL_ANNOUNCEMENTS,
      testimonials: INITIAL_TESTIMONIALS,
      forumCategories: INITIAL_FORUM_CATEGORIES,
      forumTopics: INITIAL_FORUM_TOPICS,
      forumPosts: INITIAL_FORUM_POSTS,
      forumReports: [],
      bibleVerses: INITIAL_BIBLE_VERSES,
      media: INITIAL_MEDIA,
      parakletosYears: INITIAL_PARAKLETOS_YEARS,
      parakletosClasses: INITIAL_PARAKLETOS_CLASSES,
      parakletosSubjects: INITIAL_PARAKLETOS_SUBJECTS,
      parakletosStudents: INITIAL_PARAKLETOS_STUDENTS,
      parakletosGrades: INITIAL_PARAKLETOS_GRADES,
      parakletosInfo: { ...INITIAL_PARAKLETOS_INFO },
      parakletosTeachers: [...INITIAL_PARAKLETOS_TEACHERS],
      parakletosAdmissions: [...INITIAL_PARAKLETOS_ADMISSIONS],
      cmsState: INITIAL_CMS_STATE,
      auditLogs: INITIAL_AUDIT_LOGS,
      backups: INITIAL_BACKUPS,
      prayerRequests: INITIAL_PRAYER_REQUESTS,
      associatedChurches: INITIAL_ASSOCIATED_CHURCHES,
      homeCells: INITIAL_HOME_CELLS,
      ministryAdhesions: INITIAL_MINISTRY_ADHESIONS,
      carouselSlides: [...INITIAL_CAROUSEL_SLIDES],
      latestServiceMedia: JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
      resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
      weeklyPrograms: JSON.parse(JSON.stringify(INITIAL_WEEKLY_PROGRAMS)),
    };
    persistDatabase();
    return db;
  },

  // Audit Logs
  logAudit(
    action: string,
    module: string,
    objectType: string,
    details: string,
    user?: { id: string; name: string; role: Role },
    objectId?: string
  ) {
    const log: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: user?.id || 'sys',
      userName: user?.name || 'Système',
      userRole: user?.role || 'ADMIN',
      action,
      module,
      objectType,
      objectId,
      details,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.unshift(log);
    persistDatabase();
  },

  getAuditLogs(): AuditLog[] {
    return db.auditLogs;
  },

  // Settings
  getSettings(): SystemSettings {
    return db.settings;
  },

  updateSettings(newSettings: Partial<SystemSettings>, currentUser?: User): SystemSettings {
    db.settings = {
      ...db.settings,
      ...newSettings,
      socials: {
        ...(db.settings.socials || INITIAL_SETTINGS.socials),
        ...(newSettings.socials || {}),
      },
      theme: {
        ...(db.settings.theme || INITIAL_SETTINGS.theme),
        ...(newSettings.theme || {}),
      },
      modules: {
        ...(db.settings.modules || INITIAL_SETTINGS.modules),
        ...(newSettings.modules || {}),
      },
      integrations: {
        ...(db.settings.integrations || INITIAL_SETTINGS.integrations),
        ...(newSettings.integrations || {}),
      },
      treasury: {
        ...(db.settings.treasury || INITIAL_SETTINGS.treasury),
        ...(newSettings.treasury || {}),
      } as TreasurySettings,
    };
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_PARAMÈTRES',
        'Paramètres',
        'SystemSettings',
        'Mise à jour des paramètres du système',
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }
    return db.settings;
  },

  // Treasury Settings (Orange Money, MTN MoMo, Virement Bancaire)
  getTreasurySettings(): TreasurySettings {
    if (!db.settings.treasury) {
      db.settings.treasury = JSON.parse(JSON.stringify(INITIAL_SETTINGS.treasury));
      persistDatabase();
    }
    return (db.settings.treasury || INITIAL_SETTINGS.treasury) as TreasurySettings;
  },

  updateTreasurySettings(treasury: TreasurySettings, currentUser?: User): TreasurySettings {
    db.settings.treasury = { ...treasury };
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_TRÉSORERIE',
        'Finances & Trésorerie',
        'TreasurySettings',
        `Mise à jour des coordonnées bancaires (${treasury.bankTransfer.bankName}), Orange Money (${treasury.orangeMoney.accountNumber}) et MTN MoMo (${treasury.mobileMoney.accountNumber})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }
    return db.settings.treasury;
  },

  // Users & Auth
  getUsers(): User[] {
    return db.users.map((u) => {
      const { passwordHash, ...rest } = u;
      return rest as User;
    });
  },

  getUsersWithCredentials(): (User & { currentPassword?: string })[] {
    return db.users.map((u) => {
      return {
        ...u,
        currentPassword: u.passwordHash,
      };
    });
  },

  updateUserPassword(
    userId: string,
    newPassword: string,
    newEmail?: string,
    currentUser?: User
  ): { success: boolean; user?: User; error?: string } {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Utilisateur introuvable' };

    if (newPassword && newPassword.trim()) {
      user.passwordHash = newPassword.trim();
    }
    if (newEmail && newEmail.trim()) {
      // Check for email collision
      const existing = db.users.find(
        (u) => u.email.toLowerCase() === newEmail.trim().toLowerCase() && u.id !== userId
      );
      if (existing) {
        return { success: false, error: 'Cette adresse email est déjà utilisée par un autre compte.' };
      }
      user.email = newEmail.trim().toLowerCase();
    }
    user.updatedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_MOT_DE_PASSE',
        'Sécurité & Comptes',
        'User',
        `Mise à jour des identifiants/mot de passe pour ${user.firstName} ${user.lastName} (${user.role})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        user.id
      );
    }

    const { passwordHash, ...safeUser } = user;
    return { success: true, user: safeUser as User };
  },

  getKeyOfficers(): (User & { currentPassword?: string })[] {
    const roles: Role[] = ['PASTEUR', 'SECRÉTAIRE', 'TRÉSORIER'];
    const officers = db.users
      .filter((u) => roles.includes(u.role))
      .map((u) => ({
        ...u,
        currentPassword: u.passwordHash,
      }));
    const orderMap: Record<string, number> = { PASTEUR: 1, SECRÉTAIRE: 2, TRÉSORIER: 3 };
    return officers.sort((a, b) => (orderMap[a.role] || 99) - (orderMap[b.role] || 99));
  },

  updateKeyOfficer(
    userId: string,
    data: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      password?: string;
      status?: 'ACTIF' | 'INACTIF';
    },
    currentUser?: User
  ): { success: boolean; user?: User & { currentPassword?: string }; error?: string } {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Responsable paroissial introuvable' };

    if (data.email && data.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const emailCollision = db.users.find(
        (u) => u.email.toLowerCase() === data.email.trim().toLowerCase() && u.id !== userId
      );
      if (emailCollision) {
        return { success: false, error: 'Cette adresse email est déjà attribuée à un autre compte.' };
      }
      user.email = data.email.trim().toLowerCase();
    }

    if (data.firstName !== undefined) user.firstName = data.firstName.trim();
    if (data.lastName !== undefined) user.lastName = data.lastName.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.status !== undefined) user.status = data.status;
    if (data.password && data.password.trim()) {
      user.passwordHash = data.password.trim();
    }
    user.updatedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MISE_A_JOUR_OFFICIER_CLE',
        'Administration & Direction',
        'User',
        `Mise à jour des coordonnées & accès de l'officier ${user.role} : ${user.firstName} ${user.lastName} (Tél: ${user.phone}, Email: ${user.email})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        user.id
      );
    }

    return {
      success: true,
      user: {
        ...user,
        currentPassword: user.passwordHash,
      },
    };
  },

  findUserByEmail(email: string): User | undefined {
    const cleanEmail = email.trim().toLowerCase();
    return db.users.find((u) => {
      if (u.email.toLowerCase() === cleanEmail) return true;
      if ((cleanEmail === 'cyrilleoyono6@gmail.com' || cleanEmail === 'admin@emf-sangmelima.org') && u.role === 'ADMIN') {
        return true;
      }
      return false;
    });
  },

  authenticateUser(email: string, passwordAttempt: string): User | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => {
      const uEmail = u.email.toLowerCase();
      if (uEmail === cleanEmail) return true;
      if ((cleanEmail === 'cyrilleoyono6@gmail.com' || cleanEmail === 'admin@emf-sangmelima.org') && u.role === 'ADMIN') {
        return true;
      }
      return false;
    });
    if (!user) return null;
    if (user.passwordHash !== passwordAttempt) return null;
    user.lastLoginAt = new Date().toISOString();
    persistDatabase();
    Storage.logAudit(
      'CONNEXION',
      'Authentification',
      'User',
      `Connexion réussie de ${user.firstName} ${user.lastName} (${user.role})`,
      { id: user.id, name: `${user.firstName} ${user.lastName}`, role: user.role }
    );
    const { passwordHash, ...safeUser } = user;
    return safeUser as User;
  },

  registerUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: Role;
  }): { success: boolean; user?: User; error?: string } {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Une adresse email valide est requise.' };
    }
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        error: 'Cette adresse email est déjà enregistrée. Veuillez vous connecter avec votre mot de passe.',
      };
    }
    if (!data.password || data.password.length < 6) {
      return {
        success: false,
        error: 'Le mot de passe doit comporter au moins 6 caractères.',
      };
    }

    const assignedRole = data.role === 'VISITEUR' ? 'VISITEUR' : 'MEMBRE';
    const permissions: Permission[] =
      assignedRole === 'VISITEUR'
        ? ['EVENT_READ', 'COMMUNICATION_READ', 'BIBLE_VERSE_READ', 'MEDIA_READ']
        : [
            'EVENT_READ',
            'COMMUNICATION_READ',
            'MEDIA_READ',
            'TESTIMONIAL_SUBMIT',
            'FORUM_CREATE_TOPIC',
            'FORUM_CREATE_POST',
            'BIBLE_VERSE_READ',
          ];

    const newUser: User = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      passwordHash: data.password,
      firstName: (data.firstName || '').trim(),
      lastName: (data.lastName || '').trim(),
      role: assignedRole,
      permissions,
      phone: (data.phone || '').trim(),
      status: 'ACTIF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    persistDatabase();

    Storage.logAudit(
      'INSCRIPTION',
      'Authentification',
      'User',
      `Inscription d'un nouveau compte : ${newUser.firstName} ${newUser.lastName} (${newUser.role})`,
      { id: newUser.id, name: `${newUser.firstName} ${newUser.lastName}`, role: newUser.role },
      newUser.id
    );

    const { passwordHash, ...safeUser } = newUser;
    return { success: true, user: safeUser as User };
  },

  createUser(userData: Partial<User>, currentUser?: User): User {
    const id = 'usr-' + Date.now();
    const newUser: User = {
      id,
      email: userData.email || '',
      passwordHash: userData.passwordHash || 'ChangeMe2026!',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      role: userData.role || 'MEMBRE',
      permissions: userData.permissions || ['EVENT_READ', 'COMMUNICATION_READ'],
      phone: userData.phone,
      status: userData.status || 'ACTIF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_UTILISATEUR',
        'Utilisateurs',
        'User',
        `Création de l'utilisateur ${newUser.email} (${newUser.role})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newUser.id
      );
    }
    const { passwordHash, ...safe } = newUser;
    return safe as User;
  },

  updateUser(id: string, updates: Partial<User>, currentUser?: User): User | null {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    const old = db.users[index];
    db.users[index] = { ...old, ...updates, updatedAt: new Date().toISOString() };
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_UTILISATEUR',
        'Utilisateurs',
        'User',
        `Modification de l'utilisateur ${old.email}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    const { passwordHash, ...safe } = db.users[index];
    return safe as User;
  },

  // Members
  getMembers(): Member[] {
    return db.members;
  },

  getMemberById(id: string): Member | undefined {
    return db.members.find((m) => m.id === id);
  },

  createMember(data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'memberNumber'>, currentUser?: User): Member {
    const count = db.members.length + 1;
    const memberNumber = `EMF-2026-${count.toString().padStart(3, '0')}`;
    const newMember: Member = {
      ...data,
      id: 'mbr-' + Date.now(),
      memberNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.members.push(newMember);

    // Update family count if associated
    if (newMember.familyId) {
      const fam = db.families.find((f) => f.id === newMember.familyId);
      if (fam) {
        fam.memberCount = (fam.memberCount || 0) + 1;
      }
    }

    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_MEMBRE',
        'Membres',
        'Member',
        `Création du membre ${newMember.firstName} ${newMember.lastName} (${newMember.memberNumber})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newMember.id
      );
    }
    return newMember;
  },

  updateMember(id: string, updates: Partial<Member>, currentUser?: User): Member | null {
    const index = db.members.findIndex((m) => m.id === id);
    if (index === -1) return null;
    const prev = db.members[index];
    db.members[index] = { ...prev, ...updates, updatedAt: new Date().toISOString() };
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_MEMBRE',
        'Membres',
        'Member',
        `Mise à jour du membre ${prev.firstName} ${prev.lastName}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.members[index];
  },

  submitCommunityAdhesion(data: {
    firstName: string;
    lastName: string;
    sex: 'M' | 'F';
    phone: string;
    whatsapp?: string;
    email?: string;
    address: string;
    profession?: string;
    maritalStatus?: 'CELIBATAIRE' | 'MARIE' | 'VEUF' | 'DIVORCE';
    spiritualStatus?: string;
    ministryPreference?: string;
    homeCellPreference?: string;
    wantsPastoralVisit?: boolean;
    observations?: string;
  }): { success: boolean; member: Member; message: string } {
    const count = db.members.length + 1;
    const memberNumber = `EMF-ADH-${count.toString().padStart(3, '0')}`;
    const newMember: Member = {
      id: 'mbr-adh-' + Date.now(),
      memberNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      sex: data.sex,
      birthDate: '2000-01-01',
      birthPlace: 'Sangmelima',
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || data.phone.trim(),
      email: data.email?.trim() || '',
      address: data.address.trim(),
      profession: data.profession?.trim() || 'Fidèle',
      maritalStatus: data.maritalStatus || 'CELIBATAIRE',
      joinDate: new Date().toISOString().substring(0, 10),
      ministryIds: [],
      department: data.ministryPreference || '',
      status: 'VISITEUR',
      spiritualStatus: data.spiritualStatus || 'En recherche spirituelle',
      wantsPastoralVisit: data.wantsPastoralVisit ?? true,
      homeCellPreference: data.homeCellPreference || '',
      observations: data.observations
        ? `[Adhésion en ligne] ${data.observations}`
        : `[Adhésion en ligne] Demande d'intégration à l'Église Missionnaire de la Foi de Sangmelima.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.members.unshift(newMember);
    persistDatabase();

    Storage.logAudit(
      'NOUVELLE_ADHESION_COMMUNAUTE',
      'Portail Public',
      'Member',
      `Nouvelle adhésion à la communauté : ${newMember.firstName} ${newMember.lastName} (${newMember.phone})`,
      { id: 'public-visitor', name: `${newMember.firstName} ${newMember.lastName}`, role: 'MEMBRE' },
      newMember.id
    );

    return {
      success: true,
      member: newMember,
      message: `Votre demande d'adhésion a été enregistrée avec succès. Bienvenue dans la famille chrétienne de l'Église Missionnaire de la Foi de Sangmelima !`,
    };
  },

  deleteMember(id: string, currentUser?: User): boolean {
    const member = db.members.find((m) => m.id === id);
    if (!member) return false;
    db.members = db.members.filter((m) => m.id !== id);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_MEMBRE',
        'Membres',
        'Member',
        `Suppression du membre ${member.firstName} ${member.lastName} (${member.memberNumber})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  // Families
  getFamilies(): Family[] {
    return db.families.map((f) => ({
      ...f,
      memberCount: db.members.filter((m) => m.familyId === f.id).length,
    }));
  },

  createFamily(data: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>, currentUser?: User): Family {
    const newFam: Family = {
      ...data,
      id: 'fam-' + Date.now(),
      memberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.families.push(newFam);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_FAMILLE',
        'Familles',
        'Family',
        `Création de la ${newFam.name}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newFam.id
      );
    }
    return newFam;
  },

  updateFamily(id: string, updates: Partial<Family>, currentUser?: User): Family | null {
    const index = db.families.findIndex((f) => f.id === id);
    if (index === -1) return null;
    db.families[index] = { ...db.families[index], ...updates, updatedAt: new Date().toISOString() };
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_FAMILLE',
        'Familles',
        'Family',
        `Modification de la famille ${db.families[index].name}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.families[index];
  },

  deleteFamily(id: string, currentUser?: User): boolean {
    const fam = db.families.find((f) => f.id === id);
    if (!fam) return false;
    db.families = db.families.filter((f) => f.id !== id);
    // Remove familyId link from members
    db.members.forEach((m) => {
      if (m.familyId === id) m.familyId = undefined;
    });
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_FAMILLE',
        'Familles',
        'Family',
        `Suppression de la famille ${fam.name}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  // Ministries
  getMinistries(): Ministry[] {
    return db.ministries;
  },

  createMinistry(data: Omit<Ministry, 'id' | 'createdAt'>, currentUser?: User): Ministry {
    const min: Ministry = {
      ...data,
      id: 'min-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    db.ministries.push(min);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_MINISTÈRE',
        'Ministères',
        'Ministry',
        `Création du ministère ${min.name}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        min.id
      );
    }
    return min;
  },

  updateMinistry(id: string, updates: Partial<Ministry>, currentUser?: User): Ministry | null {
    const idx = db.ministries.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    db.ministries[idx] = { ...db.ministries[idx], ...updates };
    persistDatabase();
    return db.ministries[idx];
  },

  deleteMinistry(id: string, currentUser?: User): boolean {
    db.ministries = db.ministries.filter((m) => m.id !== id);
    persistDatabase();
    return true;
  },

  // Attendance
  getAttendanceSessions(): AttendanceSession[] {
    return db.attendanceSessions;
  },

  createAttendanceSession(data: Omit<AttendanceSession, 'id' | 'createdAt'>, currentUser?: User): AttendanceSession {
    const sess: AttendanceSession = {
      ...data,
      id: 'att-sess-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    db.attendanceSessions.unshift(sess);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_SESSION_PRESENCE',
        'Présences',
        'AttendanceSession',
        `Session de présence : ${sess.title} (${sess.date})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        sess.id
      );
    }
    return sess;
  },

  getAttendanceRecords(sessionId: string): AttendanceRecord[] {
    return db.attendanceRecords.filter((r) => r.sessionId === sessionId);
  },

  saveAttendanceRecords(sessionId: string, records: AttendanceRecord[], currentUser?: User): void {
    // Remove existing for this session then append
    db.attendanceRecords = db.attendanceRecords.filter((r) => r.sessionId !== sessionId);
    db.attendanceRecords.push(...records);
    persistDatabase();
    if (currentUser) {
      const presents = records.filter((r) => r.status === 'PRÉSENT').length;
      Storage.logAudit(
        'ENREGISTREMENT_PRESENCES',
        'Présences',
        'AttendanceRecord',
        `Pointage session ${sessionId}: ${presents} présent(s) sur ${records.length} membres enregistrés`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        sessionId
      );
    }
  },

  getAllAttendanceRecords(): AttendanceRecord[] {
    return db.attendanceRecords;
  },

  // Finances
  getTransactions(): Transaction[] {
    return db.transactions;
  },

  getTransactionCategories(): TransactionCategory[] {
    return db.transactionCategories;
  },

  createTransaction(
    data: Omit<Transaction, 'id' | 'number' | 'createdAt' | 'updatedAt'>,
    currentUser?: User
  ): Transaction {
    const count = db.transactions.length + 1;
    const prefix = data.type === 'RECETTE' ? 'REC' : 'DEP';
    const number = `${prefix}-2026-${count.toString().padStart(4, '0')}`;
    const tx: Transaction = {
      ...data,
      id: 'tx-' + Date.now(),
      number,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'TRANSACTION_FINANCIÈRE',
        'Finances',
        'Transaction',
        `${data.type} ${tx.number} de ${tx.amount} FCFA (${tx.description})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        tx.id
      );
    }
    return tx;
  },

  deleteTransaction(id: string, currentUser?: User): boolean {
    const tx = db.transactions.find((t) => t.id === id);
    if (!tx) return false;
    db.transactions = db.transactions.filter((t) => t.id !== id);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'ANNULATION_TRANSACTION',
        'Finances',
        'Transaction',
        `Annulation de la transaction ${tx.number} (${tx.amount} FCFA)`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  getFinancialsSummary() {
    const totalRecettes = db.transactions
      .filter((t) => t.type === 'RECETTE')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDepenses = db.transactions
      .filter((t) => t.type === 'DÉPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const solde = totalRecettes - totalDepenses;

    // Monthly breakdown
    const monthlyStats: Record<string, { recettes: number; depenses: number }> = {};
    db.transactions.forEach((t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = { recettes: 0, depenses: 0 };
      }
      if (t.type === 'RECETTE') {
        monthlyStats[month].recettes += t.amount;
      } else {
        monthlyStats[month].depenses += t.amount;
      }
    });

    return {
      totalRecettes,
      totalDepenses,
      solde,
      transactionCount: db.transactions.length,
      monthlyStats,
    };
  },

  // Events
  getEvents(): Event[] {
    return db.events;
  },

  createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>, currentUser?: User): Event {
    const evt: Event = {
      ...data,
      id: 'evt-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.events.unshift(evt);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_EVENEMENT',
        'Événements',
        'Event',
        `Événement créé : ${evt.title}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        evt.id
      );
    }
    return evt;
  },

  updateEvent(id: string, updates: Partial<Event>, currentUser?: User): Event | null {
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    db.events[idx] = { ...db.events[idx], ...updates, updatedAt: new Date().toISOString() };
    persistDatabase();
    return db.events[idx];
  },

  deleteEvent(id: string, currentUser?: User): boolean {
    db.events = db.events.filter((e) => e.id !== id);
    persistDatabase();
    return true;
  },

  // Communications
  getAnnouncements(): Announcement[] {
    return db.announcements;
  },

  createAnnouncement(data: Omit<Announcement, 'id' | 'createdAt'>, currentUser?: User): Announcement {
    const ann: Announcement = {
      ...data,
      id: 'ann-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    db.announcements.unshift(ann);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'PUBLICATION_ANNONCE',
        'Communication',
        'Announcement',
        `Annonce publiée : ${ann.title}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        ann.id
      );
    }
    return ann;
  },

  setAnnouncements(list: Announcement[]): void {
    db.announcements = list;
  },

  updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
    const idx = db.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    db.announcements[idx] = { ...db.announcements[idx], ...updates };
    return db.announcements[idx];
  },

  deleteAnnouncement(id: string, currentUser?: User): boolean {
    db.announcements = db.announcements.filter((a) => a.id !== id);
    persistDatabase();
    return true;
  },

  // Testimonials
  getTestimonials(onlyValidated = false): Testimonial[] {
    if (onlyValidated) {
      return db.testimonials.filter((t) => t.status === 'VALIDÉ');
    }
    return db.testimonials;
  },

  submitTestimonial(data: Omit<Testimonial, 'id' | 'status' | 'createdAt'>, currentUser?: User): Testimonial {
    const tst: Testimonial = {
      ...data,
      id: 'tst-' + Date.now(),
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
    };
    db.testimonials.unshift(tst);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'SOUMISSION_TEMOIGNAGE',
        'Témoignages',
        'Testimonial',
        `Nouveau témoignage soumis : "${tst.title}" par ${tst.authorName}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        tst.id
      );
    }
    return tst;
  },

  moderateTestimonial(
    id: string,
    status: 'VALIDÉ' | 'REJETÉ' | 'MASQUÉ',
    reason?: string,
    currentUser?: User
  ): Testimonial | null {
    const tst = db.testimonials.find((t) => t.id === id);
    if (!tst) return null;
    tst.status = status;
    tst.rejectionReason = reason;
    if (currentUser) {
      tst.moderatorId = currentUser.id;
      tst.moderatorName = `${currentUser.firstName} ${currentUser.lastName}`;
    }
    if (status === 'VALIDÉ') {
      tst.validatedAt = new Date().toISOString();
      tst.publishedAt = new Date().toISOString();
    }
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MODERATION_TEMOIGNAGE',
        'Témoignages',
        'Testimonial',
        `Témoignage "${tst.title}" passé au statut ${status}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return tst;
  },

  // Forum
  getForumCategories(): ForumCategory[] {
    return db.forumCategories;
  },

  getForumTopics(categoryId?: string): ForumTopic[] {
    let topics = db.forumTopics.filter((t) => !t.isHidden);
    if (categoryId) {
      topics = topics.filter((t) => t.categoryId === categoryId);
    }
    return topics.map((t) => ({
      ...t,
      replyCount: db.forumPosts.filter((p) => p.topicId === t.id).length,
    }));
  },

  getForumPosts(topicId: string): ForumPost[] {
    return db.forumPosts.filter((p) => p.topicId === topicId);
  },

  createForumTopic(
    categoryId: string,
    title: string,
    content: string,
    currentUser: User
  ): { topic: ForumTopic; post: ForumPost } {
    const topicId = 'top-' + Date.now();
    const topic: ForumTopic = {
      id: topicId,
      categoryId,
      title,
      authorUserId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      authorRole: currentUser.role,
      isPinned: false,
      isLocked: false,
      isHidden: false,
      viewCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.forumTopics.unshift(topic);

    const post: ForumPost = {
      id: 'pst-' + Date.now(),
      topicId,
      authorUserId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      authorRole: currentUser.role,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.forumPosts.push(post);

    persistDatabase();
    Storage.logAudit(
      'CREATION_SUJET_FORUM',
      'Forum',
      'ForumTopic',
      `Nouveau sujet créé : "${title}"`,
      { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
      topicId
    );
    return { topic, post };
  },

  createForumPost(topicId: string, content: string, currentUser: User): ForumPost {
    const post: ForumPost = {
      id: 'pst-' + Date.now(),
      topicId,
      authorUserId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      authorRole: currentUser.role,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.forumPosts.push(post);
    // Touch topic updatedAt
    const t = db.forumTopics.find((top) => top.id === topicId);
    if (t) {
      t.updatedAt = new Date().toISOString();
      t.viewCount += 1;
    }
    persistDatabase();
    return post;
  },

  reportForumPost(postId: string, reason: string, currentUser: User): ForumReport {
    const post = db.forumPosts.find((p) => p.id === postId);
    const report: ForumReport = {
      id: 'rep-' + Date.now(),
      postId,
      topicId: post?.topicId || '',
      postSnippet: post ? post.content.substring(0, 100) : '',
      reporterUserId: currentUser.id,
      reporterName: `${currentUser.firstName} ${currentUser.lastName}`,
      reason,
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
    };
    db.forumReports.unshift(report);
    persistDatabase();
    return report;
  },

  getForumReports(): ForumReport[] {
    return db.forumReports;
  },

  // Daily Bible Verses
  getDailyVerses(): DailyBibleVerse[] {
    return db.bibleVerses;
  },

  getTodayVerse(): DailyBibleVerse | undefined {
    // Current date in Africa/Douala
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const exact = db.bibleVerses.find((v) => v.date === today && v.status === 'PUBLIÉ');
    if (exact) return exact;

    // Return the latest published
    return db.bibleVerses.find((v) => v.status === 'PUBLIÉ') || db.bibleVerses[0];
  },

  createDailyVerse(data: Omit<DailyBibleVerse, 'id' | 'createdAt'>, currentUser?: User): DailyBibleVerse {
    const verse: DailyBibleVerse = {
      ...data,
      id: 'vrs-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    db.bibleVerses.unshift(verse);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'PROGRAMMATION_VERSET',
        'Versets',
        'DailyBibleVerse',
        `Verset programmé pour le ${verse.date} (${verse.reference})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        verse.id
      );
    }
    return verse;
  },

  // Media
  getMediaItems(): MediaItem[] {
    return db.media;
  },

  createMediaItem(data: Omit<MediaItem, 'id' | 'createdAt'>, currentUser?: User): MediaItem {
    const med: MediaItem = {
      ...data,
      id: 'med-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    db.media.unshift(med);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'AJOUT_MEDIA',
        'Médiathèque',
        'MediaItem',
        `Ajout média : ${med.title} (${med.type})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        med.id
      );
    }
    return med;
  },

  deleteMediaItem(id: string, currentUser?: User): boolean {
    db.media = db.media.filter((m) => m.id !== id);
    persistDatabase();
    return true;
  },

  // Institut Biblique Parakletos
  getParakletosState() {
    if (!db.parakletosInfo) db.parakletosInfo = { ...INITIAL_PARAKLETOS_INFO };
    if (!db.parakletosTeachers) db.parakletosTeachers = [...INITIAL_PARAKLETOS_TEACHERS];
    if (!db.parakletosAdmissions) db.parakletosAdmissions = [...INITIAL_PARAKLETOS_ADMISSIONS];
    if (!db.parakletosClasses) db.parakletosClasses = [...INITIAL_PARAKLETOS_CLASSES];
    if (!db.parakletosSubjects) db.parakletosSubjects = [...INITIAL_PARAKLETOS_SUBJECTS];
    if (!db.parakletosStudents) db.parakletosStudents = [...INITIAL_PARAKLETOS_STUDENTS];
    if (!db.parakletosGrades) db.parakletosGrades = [...INITIAL_PARAKLETOS_GRADES];
    if (!db.parakletosYears) db.parakletosYears = [...INITIAL_PARAKLETOS_YEARS];

    return {
      years: db.parakletosYears,
      classes: db.parakletosClasses,
      subjects: db.parakletosSubjects,
      students: db.parakletosStudents,
      grades: db.parakletosGrades,
      info: db.parakletosInfo,
      teachers: db.parakletosTeachers,
      admissions: db.parakletosAdmissions,
    };
  },

  updateParakletosInfo(infoUpdates: Partial<ParakletosInstituteInfo>, currentUser?: User): ParakletosInstituteInfo {
    if (!db.parakletosInfo) db.parakletosInfo = { ...INITIAL_PARAKLETOS_INFO };
    db.parakletosInfo = { ...db.parakletosInfo, ...infoUpdates };
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'MAJ_INFOS_PARAKLETOS',
        'Institut Biblique',
        'ParakletosInstituteInfo',
        'Mise à jour des renseignements de l’Institut Biblique Parakletos',
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }
    return db.parakletosInfo;
  },

  createParakletosClass(data: Omit<ParakletosClass, 'id'>, currentUser?: User): ParakletosClass {
    if (!db.parakletosClasses) db.parakletosClasses = [...INITIAL_PARAKLETOS_CLASSES];
    const newClass: ParakletosClass = {
      ...data,
      id: 'cls-' + Date.now(),
    };
    db.parakletosClasses.push(newClass);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_CLASSE_PARAKLETOS',
        'Institut Biblique',
        'ParakletosClass',
        `Création de la filière/classe : ${newClass.name}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newClass.id
      );
    }
    return newClass;
  },

  updateParakletosClass(id: string, updates: Partial<ParakletosClass>, currentUser?: User): ParakletosClass | null {
    if (!db.parakletosClasses) db.parakletosClasses = [...INITIAL_PARAKLETOS_CLASSES];
    const idx = db.parakletosClasses.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    db.parakletosClasses[idx] = { ...db.parakletosClasses[idx], ...updates };
    persistDatabase();
    return db.parakletosClasses[idx];
  },

  deleteParakletosClass(id: string, currentUser?: User): boolean {
    if (!db.parakletosClasses) db.parakletosClasses = [...INITIAL_PARAKLETOS_CLASSES];
    db.parakletosClasses = db.parakletosClasses.filter((c) => c.id !== id);
    persistDatabase();
    return true;
  },

  createParakletosSubject(data: Omit<ParakletosSubject, 'id'>, currentUser?: User): ParakletosSubject {
    if (!db.parakletosSubjects) db.parakletosSubjects = [...INITIAL_PARAKLETOS_SUBJECTS];
    const newSubj: ParakletosSubject = {
      ...data,
      id: 'sbj-' + Date.now(),
    };
    db.parakletosSubjects.push(newSubj);
    persistDatabase();
    return newSubj;
  },

  updateParakletosSubject(id: string, updates: Partial<ParakletosSubject>, currentUser?: User): ParakletosSubject | null {
    if (!db.parakletosSubjects) db.parakletosSubjects = [...INITIAL_PARAKLETOS_SUBJECTS];
    const idx = db.parakletosSubjects.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    db.parakletosSubjects[idx] = { ...db.parakletosSubjects[idx], ...updates };
    persistDatabase();
    return db.parakletosSubjects[idx];
  },

  deleteParakletosSubject(id: string, currentUser?: User): boolean {
    if (!db.parakletosSubjects) db.parakletosSubjects = [...INITIAL_PARAKLETOS_SUBJECTS];
    db.parakletosSubjects = db.parakletosSubjects.filter((s) => s.id !== id);
    persistDatabase();
    return true;
  },

  createParakletosTeacher(data: Omit<ParakletosTeacher, 'id' | 'createdAt'>, currentUser?: User): ParakletosTeacher {
    if (!db.parakletosTeachers) db.parakletosTeachers = [...INITIAL_PARAKLETOS_TEACHERS];
    const code = data.accessCode?.trim() || `PARAK-ENS-${Math.floor(1000 + Math.random() * 9000)}`;
    const teacher: ParakletosTeacher = {
      ...data,
      id: 'tch-' + Date.now(),
      accessCode: code,
      createdAt: new Date().toISOString(),
    };
    db.parakletosTeachers.push(teacher);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'CREATION_ENSEIGNANT_PARAKLETOS',
        'Institut Biblique',
        'ParakletosTeacher',
        `Création enseignant ${teacher.name} avec code ${teacher.accessCode}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        teacher.id
      );
    }
    return teacher;
  },

  updateParakletosTeacher(id: string, updates: Partial<ParakletosTeacher>, currentUser?: User): ParakletosTeacher | null {
    if (!db.parakletosTeachers) db.parakletosTeachers = [...INITIAL_PARAKLETOS_TEACHERS];
    const idx = db.parakletosTeachers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    db.parakletosTeachers[idx] = { ...db.parakletosTeachers[idx], ...updates };
    persistDatabase();
    return db.parakletosTeachers[idx];
  },

  deleteParakletosTeacher(id: string, currentUser?: User): boolean {
    if (!db.parakletosTeachers) db.parakletosTeachers = [...INITIAL_PARAKLETOS_TEACHERS];
    db.parakletosTeachers = db.parakletosTeachers.filter((t) => t.id !== id);
    persistDatabase();
    return true;
  },

  createParakletosAdmission(
    data: Omit<ParakletosAdmissionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    currentUser?: User
  ): ParakletosAdmissionRequest {
    if (!db.parakletosAdmissions) db.parakletosAdmissions = [...INITIAL_PARAKLETOS_ADMISSIONS];
    const admission: ParakletosAdmissionRequest = {
      ...data,
      id: 'adm-' + Date.now(),
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.parakletosAdmissions.unshift(admission);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'DEMANDE_ADHESION_PARAKLETOS',
        'Institut Biblique',
        'ParakletosAdmissionRequest',
        `Candidature déposée par ${admission.applicantName} pour ${admission.className}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        admission.id
      );
    }
    return admission;
  },

  updateParakletosAdmissionStatus(
    id: string,
    status: ParakletosAdmissionRequest['status'],
    reviewNotes?: string,
    currentUser?: User
  ): { admission: ParakletosAdmissionRequest | null; generatedStudent?: ParakletosStudent } {
    if (!db.parakletosAdmissions) db.parakletosAdmissions = [...INITIAL_PARAKLETOS_ADMISSIONS];
    const idx = db.parakletosAdmissions.findIndex((a) => a.id === id);
    if (idx === -1) return { admission: null };

    const adm = db.parakletosAdmissions[idx];
    adm.status = status;
    if (reviewNotes !== undefined) adm.reviewNotes = reviewNotes;
    adm.reviewedBy = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Direction de l’Institut';
    adm.updatedAt = new Date().toISOString();

    let createdStudent: ParakletosStudent | undefined;

    if (status === 'VALIDEE') {
      const generatedCode = `PARAK-ETU-${Math.floor(1000 + Math.random() * 9000)}`;
      adm.generatedAccessCode = generatedCode;
      adm.validatedAt = new Date().toISOString();

      if (!db.parakletosStudents) db.parakletosStudents = [...INITIAL_PARAKLETOS_STUDENTS];
      const count = db.parakletosStudents.length + 1;
      const matricule = `IBP-2026-${count.toString().padStart(3, '0')}`;

      const nameParts = adm.applicantName.trim().split(' ');
      const firstName = nameParts[0] || 'Étudiant';
      const lastName = nameParts.slice(1).join(' ') || '';

      createdStudent = {
        id: 'std-' + Date.now(),
        matricule,
        accessCode: generatedCode,
        memberId: adm.memberId,
        firstName,
        lastName,
        phone: adm.phone,
        email: adm.email,
        classId: adm.classId,
        yearId: 'year-2025-2026',
        enrollmentDate: new Date().toISOString().substring(0, 10),
        status: 'ACTIF',
      };
      db.parakletosStudents.push(createdStudent);
    }

    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'STATUT_CANDIDATURE_PARAKLETOS',
        'Institut Biblique',
        'ParakletosAdmissionRequest',
        `Candidature de ${adm.applicantName} passée à: ${status}${createdStudent ? ` (Code: ${createdStudent.accessCode})` : ''}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        adm.id
      );
    }

    return { admission: adm, generatedStudent: createdStudent };
  },

  verifyParakletosAccessCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return { success: false, message: 'Veuillez saisir un code d’accès.' };

    if (!db.parakletosStudents) db.parakletosStudents = [...INITIAL_PARAKLETOS_STUDENTS];
    if (!db.parakletosTeachers) db.parakletosTeachers = [...INITIAL_PARAKLETOS_TEACHERS];

    const student = db.parakletosStudents.find(
      (s) => s.accessCode && s.accessCode.trim().toUpperCase() === code
    );
    if (student) {
      const cls = (db.parakletosClasses || []).find((c) => c.id === student.classId);
      const studentGrades = (db.parakletosGrades || []).filter((g) => g.studentId === student.id);
      const classSubjects = (db.parakletosSubjects || []).filter((s) => s.classId === student.classId);
      return {
        success: true,
        type: 'ETUDIANT' as const,
        student,
        class: cls,
        grades: studentGrades,
        subjects: classSubjects,
      };
    }

    const teacher = db.parakletosTeachers.find(
      (t) => t.accessCode && t.accessCode.trim().toUpperCase() === code
    );
    if (teacher) {
      const teacherSubjects = (db.parakletosSubjects || []).filter(
        (s) => s.teacherId === teacher.id || s.teacherName.toLowerCase().includes(teacher.name.toLowerCase().split(' ')[0])
      );
      return {
        success: true,
        type: 'ENSEIGNANT' as const,
        teacher,
        subjects: teacherSubjects,
        classes: db.parakletosClasses || [],
        students: db.parakletosStudents || [],
      };
    }

    return {
      success: false,
      message: 'Code d’accès invalide ou non reconnu. Veuillez vérifier le code fourni par l’administration (ex: PARAK-ETU-XXXX ou PARAK-ENS-XXXX).',
    };
  },

  createParakletosStudent(
    data: Omit<ParakletosStudent, 'id' | 'matricule'>,
    currentUser?: User
  ): ParakletosStudent {
    if (!db.parakletosStudents) db.parakletosStudents = [...INITIAL_PARAKLETOS_STUDENTS];
    const count = db.parakletosStudents.length + 1;
    const matricule = `IBP-2026-${count.toString().padStart(3, '0')}`;
    const accessCode = data.accessCode?.trim() || `PARAK-ETU-${Math.floor(1000 + Math.random() * 9000)}`;
    const student: ParakletosStudent = {
      ...data,
      id: 'std-' + Date.now(),
      matricule,
      accessCode,
    };
    db.parakletosStudents.push(student);
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'INSCRIPTION_ETUDIANT_PARAKLETOS',
        'Institut Biblique',
        'ParakletosStudent',
        `Nouvel étudiant inscrit : ${student.firstName} ${student.lastName} (${student.matricule})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        student.id
      );
    }
    return student;
  },

  recordParakletosGrade(data: Omit<ParakletosGrade, 'id'>, currentUser?: User): ParakletosGrade {
    if (!db.parakletosGrades) db.parakletosGrades = [...INITIAL_PARAKLETOS_GRADES];
    const grade: ParakletosGrade = {
      ...data,
      id: 'grd-' + Date.now(),
    };
    // replace if exists for same student/subject/term
    const existingIdx = db.parakletosGrades.findIndex(
      (g) => g.studentId === data.studentId && g.subjectId === data.subjectId && g.term === data.term
    );
    if (existingIdx !== -1) {
      db.parakletosGrades[existingIdx] = grade;
    } else {
      db.parakletosGrades.push(grade);
    }
    persistDatabase();
    return grade;
  },

  // CMS Homepage Management (Sections 30-35)
  getCMSState(): HomepageCMSState {
    if (!db.cmsState || !Array.isArray(db.cmsState.publishedSections)) {
      db.cmsState = JSON.parse(JSON.stringify(INITIAL_CMS_STATE));
      persistDatabase();
    }
    return db.cmsState;
  },

  getPublicHomepageSections(): HomepageSection[] {
    const list = db.cmsState?.publishedSections;
    if (!Array.isArray(list) || list.length === 0) {
      return INITIAL_HOMEPAGE_SECTIONS;
    }
    return list
      .filter((s) => s && s.isVisible)
      .sort((a, b) => (a?.position || 0) - (b?.position || 0));
  },

  saveDraftSections(sections: HomepageSection[], currentUser?: User): HomepageCMSState {
    db.cmsState.draftSections = sections;
    db.cmsState.lastDraftSavedAt = new Date().toISOString();
    persistDatabase();
    if (currentUser) {
      Storage.logAudit(
        'ENREGISTREMENT_BROUILLON_CMS',
        'CMS Page Accueil',
        'HomepageCMS',
        'Enregistrement d’une version brouillon des sections d’accueil',
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }
    return db.cmsState;
  },

  publishCMS(currentUser: User): HomepageCMSState {
    const nextVersion = (db.cmsState.revisions.length || 0) + 1;
    const published = JSON.parse(JSON.stringify(db.cmsState.draftSections));
    db.cmsState.publishedSections = published;
    db.cmsState.lastPublishedAt = new Date().toISOString();

    const revision: HomepageRevision = {
      id: 'rev-' + Date.now(),
      version: nextVersion,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'PUBLICATION',
      createdAt: new Date().toISOString(),
      sectionsSnapshot: JSON.parse(JSON.stringify(published)),
    };
    db.cmsState.revisions.unshift(revision);
    persistDatabase();

    Storage.logAudit(
      'PUBLICATION_PAGE_ACCUEIL',
      'CMS Page Accueil',
      'HomepageCMS',
      `Publication en direct de la version ${nextVersion} du portail d’accueil`,
      { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
    );

    return db.cmsState;
  },

  restoreCMSRevision(revisionId: string, currentUser: User): HomepageCMSState | null {
    const rev = db.cmsState.revisions.find((r) => r.id === revisionId);
    if (!rev) return null;
    const restored = JSON.parse(JSON.stringify(rev.sectionsSnapshot));
    db.cmsState.draftSections = restored;
    db.cmsState.publishedSections = restored;
    db.cmsState.lastPublishedAt = new Date().toISOString();

    const newRev: HomepageRevision = {
      id: 'rev-' + Date.now(),
      version: db.cmsState.revisions.length + 1,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      action: 'RESTAURATION',
      createdAt: new Date().toISOString(),
      sectionsSnapshot: JSON.parse(JSON.stringify(restored)),
    };
    db.cmsState.revisions.unshift(newRev);
    persistDatabase();

    Storage.logAudit(
      'RESTAURATION_PAGE_ACCUEIL',
      'CMS Page Accueil',
      'HomepageCMS',
      `Restauration de la révision v${rev.version}`,
      { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
    );

    return db.cmsState;
  },

  quickUpdateHomepage(
    updates: {
      heroTitle?: string;
      heroSubtitle?: string;
      presentationTitle?: string;
      presentationContent?: string;
      presentationImageUrl?: string;
      churchAddress?: string;
      churchPhone?: string;
      visibleSections?: Record<string, boolean>;
    },
    currentUser?: User
  ): HomepageCMSState {
    const sections = db.cmsState.publishedSections || [];

    // 1. Update hero
    const hero = sections.find((s) => s.key === 'hero');
    if (hero) {
      if (updates.heroTitle !== undefined) hero.title = updates.heroTitle;
      if (updates.heroSubtitle !== undefined) hero.subtitle = updates.heroSubtitle;
    }

    // 2. Update presentation
    const pres = sections.find((s) => s.key === 'presentation');
    if (pres) {
      if (updates.presentationTitle !== undefined) pres.title = updates.presentationTitle;
      if (updates.presentationContent !== undefined) pres.content = updates.presentationContent;
      if (updates.presentationImageUrl !== undefined) pres.imageUrl = updates.presentationImageUrl;
    }

    // 3. Update visibility if provided
    if (updates.visibleSections) {
      sections.forEach((s) => {
        if (updates.visibleSections && updates.visibleSections[s.key] !== undefined) {
          s.isVisible = updates.visibleSections[s.key];
        }
      });
    }

    // 4. Update settings contacts if needed
    if (updates.churchPhone) db.settings.phone = updates.churchPhone;
    if (updates.churchAddress) db.settings.address = updates.churchAddress;

    db.cmsState.publishedSections = sections;
    db.cmsState.draftSections = JSON.parse(JSON.stringify(sections));
    db.cmsState.lastPublishedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_RAPIDE_ACCUEIL',
        'Tableau de Bord Admin',
        'HomepageCMS',
        'Mise à jour rapide des éléments de la page d’accueil depuis le tableau de bord',
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }

    return db.cmsState;
  },

  updatePresentationImage(imageUrl: string, currentUser?: User): HomepageCMSState {
    const sections = db.cmsState.publishedSections || [];
    const pres = sections.find((s) => s.key === 'presentation');
    if (pres) {
      pres.imageUrl = imageUrl;
    }
    const draft = db.cmsState.draftSections || [];
    const draftPres = draft.find((s) => s.key === 'presentation');
    if (draftPres) {
      draftPres.imageUrl = imageUrl;
    }
    db.cmsState.publishedSections = sections;
    db.cmsState.draftSections = draft;
    db.cmsState.lastPublishedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_IMAGE_PRESENTATION',
        'Accueil - Qui Sommes-Nous',
        'HomepageCMS',
        imageUrl
          ? 'Mise à jour de la photo de présentation de l’église depuis le téléphone'
          : 'Suppression de la photo de présentation de l’église',
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }

    return db.cmsState;
  },

  setCMSState(cmsState: HomepageCMSState): void {
    if (cmsState && typeof cmsState === 'object') {
      const safePublished =
        Array.isArray(cmsState.publishedSections) && cmsState.publishedSections.length > 0
          ? cmsState.publishedSections
          : (db.cmsState?.publishedSections || INITIAL_HOMEPAGE_SECTIONS);
      const safeDraft =
        Array.isArray(cmsState.draftSections) && cmsState.draftSections.length > 0
          ? cmsState.draftSections
          : (db.cmsState?.draftSections || safePublished);
      db.cmsState = {
        ...INITIAL_CMS_STATE,
        ...cmsState,
        publishedSections: safePublished,
        draftSections: safeDraft,
        revisions: Array.isArray(cmsState.revisions) ? cmsState.revisions : (db.cmsState?.revisions || []),
      };
      persistDatabase();
    }
  },

  setCarouselSlides(slides: HomepageCarouselSlide[]): void {
    if (slides && Array.isArray(slides)) {
      db.carouselSlides = slides;
      persistDatabase();
    }
  },

  setWeeklyPrograms(programs: WeeklyProgram[]): void {
    if (programs && Array.isArray(programs)) {
      db.weeklyPrograms = programs;
      persistDatabase();
    }
  },

  // Backups
  getBackups(): BackupRecord[] {
    return db.backups;
  },

  createBackup(type: 'MANUELLE' | 'AUTOMATIQUE', currentUser?: User): BackupRecord {
    const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const filename = `emf_smart_backup_${dateStr}_${type.toLowerCase()}.json`;
    const jsonContent = JSON.stringify(db, null, 2);
    const sizeKb = Math.round(new Blob([jsonContent]).size / 1024);

    const record: BackupRecord = {
      id: 'bkp-' + Date.now(),
      filename,
      date: new Date().toISOString(),
      type,
      sizeKb,
      status: 'SUCCES',
      location: `data/backups/${filename}`,
      notes: type === 'MANUELLE' ? `Sauvegarde initiée par ${currentUser?.firstName || 'Admin'}` : 'Sauvegarde programmée',
    };
    db.backups.unshift(record);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_SAUVEGARDE',
        'Sauvegardes',
        'BackupRecord',
        `Création de la sauvegarde ${filename} (${sizeKb} Ko)`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        record.id
      );
    }
    return record;
  },

  // Prayer Requests
  getPrayerRequests(includeConfidential = false, userRole?: Role): PrayerRequest[] {
    if (!db.prayerRequests) {
      db.prayerRequests = [...INITIAL_PRAYER_REQUESTS];
    }
    const isLeadership = userRole === 'ADMIN' || userRole === 'PASTEUR';
    return db.prayerRequests
      .filter((pr) => {
        if (!pr.isConfidentialPastoralOnly) return true;
        return isLeadership || includeConfidential;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getPrayerRequestById(id: string): PrayerRequest | undefined {
    return (db.prayerRequests || []).find((pr) => pr.id === id);
  },

  createPrayerRequest(
    data: {
      title: string;
      description: string;
      category: PrayerRequest['category'];
      authorName?: string;
      isAnonymous?: boolean;
      phone?: string;
      isConfidentialPastoralOnly?: boolean;
      status?: PrayerRequest['status'];
    },
    currentUser?: User
  ): PrayerRequest {
    if (!db.prayerRequests) {
      db.prayerRequests = [...INITIAL_PRAYER_REQUESTS];
    }

    const isAnon = !!data.isAnonymous;
    const author = isAnon
      ? 'Fidèle Anonyme'
      : data.authorName?.trim() || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Membre EMF');

    const newPrayer: PrayerRequest = {
      id: 'pr-' + Date.now(),
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category || 'Santé & Guérison',
      authorName: author,
      isAnonymous: isAnon,
      userId: isAnon ? undefined : currentUser?.id,
      phone: isAnon ? undefined : data.phone,
      isConfidentialPastoralOnly: !!data.isConfidentialPastoralOnly,
      status: data.status || 'EN_PRIERE',
      prayerCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.prayerRequests.unshift(newPrayer);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SOUMISSION_PRIERE',
        'Requêtes de prière',
        'PrayerRequest',
        `Nouvelle requête de prière: "${newPrayer.title}" ${isAnon ? '(Anonyme)' : `par ${newPrayer.authorName}`}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newPrayer.id
      );
    }

    // Auto-create Church App Notification
    try {
      if (!newPrayer.isConfidentialPastoralOnly) {
        Storage.createNotification(
          {
            title: `Nouvelle requête : ${newPrayer.title}`,
            message: isAnon
              ? `Un fidèle a déposé une requête de prière (${newPrayer.category}). Unissons-nous pour intercéder.`
              : `${newPrayer.authorName} sollicite la prière du corps de Christ (${newPrayer.category}).`,
            category: 'PRIERE',
            priority: 'HAUTE',
            targetAudience: 'TOUS',
            actionPage: 'priere',
            actionLabel: 'Intercéder maintenant',
            actionUrl: '/prayer-requests',
            authorName: isAnon ? 'Autel d’Intercession' : newPrayer.authorName,
            authorRole: currentUser?.role || 'MEMBRE',
          },
          currentUser
        );
      } else {
        Storage.createNotification(
          {
            title: `[Confidentiel Pasteur] Requête : ${newPrayer.title}`,
            message: isAnon
              ? `Un fidèle a déposé une requête confidentielle réservée à l'équipe pastorale.`
              : `${newPrayer.authorName} a déposé une requête confidentielle pour l'équipe pastorale.`,
            category: 'PASTORAL',
            priority: 'URGENTE',
            targetAudience: 'LEADERSHIP',
            actionPage: 'priere',
            actionLabel: 'Consulter (Confidentiel)',
            actionUrl: '/prayer-requests',
            authorName: isAnon ? 'Fidèle Anonyme' : newPrayer.authorName,
            authorRole: currentUser?.role || 'MEMBRE',
          },
          currentUser
        );
      }
    } catch (e) {
      // Non-blocking notification creation
    }

    return newPrayer;
  },

  updatePrayerRequestStatus(
    id: string,
    status: PrayerRequest['status'],
    currentUser?: User
  ): PrayerRequest | null {
    if (!db.prayerRequests) db.prayerRequests = [...INITIAL_PRAYER_REQUESTS];
    const index = db.prayerRequests.findIndex((pr) => pr.id === id);
    if (index === -1) return null;

    db.prayerRequests[index] = {
      ...db.prayerRequests[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'STATUT_PRIERE_MAJ',
        'Requêtes de prière',
        'PrayerRequest',
        `Statut de la requête #${id} passé à: ${status}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }

    return db.prayerRequests[index];
  },

  incrementPrayerCount(id: string): PrayerRequest | null {
    if (!db.prayerRequests) db.prayerRequests = [...INITIAL_PRAYER_REQUESTS];
    const index = db.prayerRequests.findIndex((pr) => pr.id === id);
    if (index === -1) return null;

    db.prayerRequests[index] = {
      ...db.prayerRequests[index],
      prayerCount: (db.prayerRequests[index].prayerCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();
    return db.prayerRequests[index];
  },

  addPrayerTestimony(
    id: string,
    testimony: string,
    currentUser?: User
  ): PrayerRequest | null {
    if (!db.prayerRequests) db.prayerRequests = [...INITIAL_PRAYER_REQUESTS];
    const index = db.prayerRequests.findIndex((pr) => pr.id === id);
    if (index === -1) return null;

    db.prayerRequests[index] = {
      ...db.prayerRequests[index],
      testimony: testimony.trim(),
      status: 'EXAUCE',
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'TEMOIGNAGE_PRIERE_AJOUTE',
        'Requêtes de prière',
        'PrayerRequest',
        `Témoignage d'exaucement ajouté pour la requête #${id}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }

    return db.prayerRequests[index];
  },

  deletePrayerRequest(id: string, currentUser?: User): boolean {
    if (!db.prayerRequests) db.prayerRequests = [...INITIAL_PRAYER_REQUESTS];
    const initialLen = db.prayerRequests.length;
    db.prayerRequests = db.prayerRequests.filter((pr) => pr.id !== id);
    if (db.prayerRequests.length < initialLen) {
      persistDatabase();
      if (currentUser) {
        Storage.logAudit(
          'SUPPRESSION_PRIERE',
          'Requêtes de prière',
          'PrayerRequest',
          `Suppression de la requête #${id}`,
          { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
          id
        );
      }
      return true;
    }
    return false;
  },

  // Associated Churches
  getAssociatedChurches(): AssociatedChurch[] {
    if (!db.associatedChurches) {
      db.associatedChurches = [...INITIAL_ASSOCIATED_CHURCHES];
    }
    return db.associatedChurches;
  },

  createAssociatedChurch(
    data: Omit<AssociatedChurch, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser?: User
  ): AssociatedChurch {
    if (!db.associatedChurches) db.associatedChurches = [...INITIAL_ASSOCIATED_CHURCHES];
    const church: AssociatedChurch = {
      ...data,
      id: 'ach-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.associatedChurches.push(church);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_EGLISE_ASSOCIEE',
        'Églises Associées',
        'AssociatedChurch',
        `Ajout de l'église associée "${church.name}" à ${church.city} (Pasteur: ${church.pastorName})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        church.id
      );
    }
    return church;
  },

  updateAssociatedChurch(
    id: string,
    updates: Partial<AssociatedChurch>,
    currentUser?: User
  ): AssociatedChurch | null {
    if (!db.associatedChurches) db.associatedChurches = [...INITIAL_ASSOCIATED_CHURCHES];
    const idx = db.associatedChurches.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    db.associatedChurches[idx] = {
      ...db.associatedChurches[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MAJ_EGLISE_ASSOCIEE',
        'Églises Associées',
        'AssociatedChurch',
        `Mise à jour de l'église associée "${db.associatedChurches[idx].name}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.associatedChurches[idx];
  },

  deleteAssociatedChurch(id: string, currentUser?: User): boolean {
    if (!db.associatedChurches) db.associatedChurches = [...INITIAL_ASSOCIATED_CHURCHES];
    const church = db.associatedChurches.find((c) => c.id === id);
    if (!church) return false;

    db.associatedChurches = db.associatedChurches.filter((c) => c.id !== id);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_EGLISE_ASSOCIEE',
        'Églises Associées',
        'AssociatedChurch',
        `Suppression de l'église associée "${church.name}" (${church.city})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  // Home Cells
  getHomeCells(): HomeCell[] {
    if (!db.homeCells) {
      db.homeCells = [...INITIAL_HOME_CELLS];
    }
    return db.homeCells;
  },

  createHomeCell(
    data: Omit<HomeCell, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser?: User
  ): HomeCell {
    if (!db.homeCells) db.homeCells = [...INITIAL_HOME_CELLS];
    const cell: HomeCell = {
      ...data,
      id: 'cell-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.homeCells.push(cell);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_CELLULE_MAISON',
        'Cellules de Maison',
        'HomeCell',
        `Création de la cellule "${cell.name}" au quartier ${cell.neighborhood} (Resp: ${cell.leaderName})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        cell.id
      );
    }
    return cell;
  },

  updateHomeCell(
    id: string,
    updates: Partial<HomeCell>,
    currentUser?: User
  ): HomeCell | null {
    if (!db.homeCells) db.homeCells = [...INITIAL_HOME_CELLS];
    const idx = db.homeCells.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    db.homeCells[idx] = {
      ...db.homeCells[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MAJ_CELLULE_MAISON',
        'Cellules de Maison',
        'HomeCell',
        `Mise à jour de la cellule "${db.homeCells[idx].name}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.homeCells[idx];
  },

  deleteHomeCell(id: string, currentUser?: User): boolean {
    if (!db.homeCells) db.homeCells = [...INITIAL_HOME_CELLS];
    const cell = db.homeCells.find((c) => c.id === id);
    if (!cell) return false;

    db.homeCells = db.homeCells.filter((c) => c.id !== id);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_CELLULE_MAISON',
        'Cellules de Maison',
        'HomeCell',
        `Suppression de la cellule "${cell.name}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  // Departments
  getDepartments(ministryId?: string): Department[] {
    if (!db.departments || db.departments.length === 0) {
      db.departments = [...INITIAL_DEPARTMENTS];
    }
    if (ministryId) {
      return db.departments.filter((d) => d.ministryId === ministryId);
    }
    return db.departments;
  },

  createDepartment(
    data: Omit<Department, 'id' | 'createdAt'>,
    currentUser?: User
  ): Department {
    if (!db.departments) db.departments = [...INITIAL_DEPARTMENTS];
    const dept: Department = {
      ...data,
      id: 'dept-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    db.departments.push(dept);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_DEPARTEMENT',
        'Ministères & Départements',
        'Department',
        `Création du département "${dept.name}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        dept.id
      );
    }
    return dept;
  },

  updateDepartment(
    id: string,
    updates: Partial<Department>,
    currentUser?: User
  ): Department | null {
    if (!db.departments) db.departments = [...INITIAL_DEPARTMENTS];
    const idx = db.departments.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    db.departments[idx] = { ...db.departments[idx], ...updates };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MAJ_DEPARTEMENT',
        'Ministères & Départements',
        'Department',
        `Mise à jour du département "${db.departments[idx].name}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.departments[idx];
  },

  deleteDepartment(id: string, currentUser?: User): boolean {
    if (!db.departments) db.departments = [...INITIAL_DEPARTMENTS];
    const dept = db.departments.find((d) => d.id === id);
    if (!dept) return false;

    db.departments = db.departments.filter((d) => d.id !== id);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_DEPARTEMENT',
        'Ministères & Départements',
        'Department',
        `Suppression du département "${dept.name}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  // Ministry Adhesion Requests
  getMinistryAdhesions(ministryId?: string): MinistryAdhesionRequest[] {
    if (!db.ministryAdhesions) {
      db.ministryAdhesions = [...INITIAL_MINISTRY_ADHESIONS];
    }
    if (ministryId) {
      return db.ministryAdhesions.filter((a) => a.ministryId === ministryId);
    }
    return db.ministryAdhesions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  createMinistryAdhesion(
    data: Omit<MinistryAdhesionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    currentUser?: User
  ): MinistryAdhesionRequest {
    if (!db.ministryAdhesions) db.ministryAdhesions = [...INITIAL_MINISTRY_ADHESIONS];
    const req: MinistryAdhesionRequest = {
      ...data,
      id: 'adh-' + Date.now(),
      status: 'EN_ATTENTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.ministryAdhesions.unshift(req);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'DEMANDE_ADHESION_MINISTERE',
        'Ministères & Départements',
        'MinistryAdhesionRequest',
        `Nouvelle demande d'adhésion de ${req.memberName} pour le ministère "${req.ministryName}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        req.id
      );
    }
    return req;
  },

  updateMinistryAdhesionStatus(
    id: string,
    status: MinistryAdhesionRequest['status'],
    reviewNotes?: string,
    currentUser?: User
  ): MinistryAdhesionRequest | null {
    if (!db.ministryAdhesions) db.ministryAdhesions = [...INITIAL_MINISTRY_ADHESIONS];
    const idx = db.ministryAdhesions.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const adhesion = db.ministryAdhesions[idx];
    adhesion.status = status;
    adhesion.updatedAt = new Date().toISOString();
    if (reviewNotes) adhesion.reviewNotes = reviewNotes;
    if (currentUser) {
      adhesion.reviewedBy = `${currentUser.firstName} ${currentUser.lastName}`;
    }

    // If approved and memberId exists, automatically add ministryId to member's ministryIds!
    if (status === 'APPROUVEE' && adhesion.memberId) {
      const memberIdx = db.members.findIndex((m) => m.id === adhesion.memberId);
      if (memberIdx !== -1) {
        const currentMins = db.members[memberIdx].ministryIds || [];
        if (!currentMins.includes(adhesion.ministryId)) {
          db.members[memberIdx].ministryIds = [...currentMins, adhesion.ministryId];
        }
      }
    }

    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'STATUT_ADHESION_MAJ',
        'Ministères & Départements',
        'MinistryAdhesionRequest',
        `Demande d'adhésion #${id} de ${adhesion.memberName} pour "${adhesion.ministryName}" passée à: ${status}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return adhesion;
  },

  deleteMinistryAdhesion(id: string, currentUser?: User): boolean {
    if (!db.ministryAdhesions) db.ministryAdhesions = [...INITIAL_MINISTRY_ADHESIONS];
    const initialLen = db.ministryAdhesions.length;
    db.ministryAdhesions = db.ministryAdhesions.filter((a) => a.id !== id);
    if (db.ministryAdhesions.length < initialLen) {
      persistDatabase();
      if (currentUser) {
        Storage.logAudit(
          'SUPPRESSION_DEMANDE_ADHESION',
          'Ministères & Départements',
          'MinistryAdhesionRequest',
          `Suppression de la demande d'adhésion #${id}`,
          { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
          id
        );
      }
      return true;
    }
    return false;
  },

  // Homepage Carousel Slides
  getCarouselSlides(): HomepageCarouselSlide[] {
    if (!Array.isArray(db.carouselSlides) || db.carouselSlides.length === 0) {
      db.carouselSlides = [...INITIAL_CAROUSEL_SLIDES];
      persistDatabase();
    }
    return [...db.carouselSlides].sort((a, b) => (a?.order || 0) - (b?.order || 0));
  },

  createCarouselSlide(slideData: Omit<HomepageCarouselSlide, 'id'>, currentUser?: User): HomepageCarouselSlide {
    if (!db.carouselSlides) db.carouselSlides = [...INITIAL_CAROUSEL_SLIDES];
    const newSlide: HomepageCarouselSlide = {
      ...slideData,
      id: `slide-${Date.now()}`,
    };
    db.carouselSlides.push(newSlide);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_SLIDE_CARROUSEL',
        'CMS Accueil',
        'HomepageCarouselSlide',
        `Création de la diapositive carrousel: "${newSlide.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newSlide.id
      );
    }
    return newSlide;
  },

  updateCarouselSlide(id: string, updates: Partial<HomepageCarouselSlide>, currentUser?: User): HomepageCarouselSlide | null {
    if (!db.carouselSlides) db.carouselSlides = [...INITIAL_CAROUSEL_SLIDES];
    const idx = db.carouselSlides.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    db.carouselSlides[idx] = {
      ...db.carouselSlides[idx],
      ...updates,
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_SLIDE_CARROUSEL',
        'CMS Accueil',
        'HomepageCarouselSlide',
        `Mise à jour de la diapositive carrousel #${id}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.carouselSlides[idx];
  },

  deleteCarouselSlide(id: string, currentUser?: User): boolean {
    if (!db.carouselSlides) db.carouselSlides = [...INITIAL_CAROUSEL_SLIDES];
    const initialLen = db.carouselSlides.length;
    db.carouselSlides = db.carouselSlides.filter((s) => s.id !== id);
    if (db.carouselSlides.length < initialLen) {
      persistDatabase();
      if (currentUser) {
        Storage.logAudit(
          'SUPPRESSION_SLIDE_CARROUSEL',
          'CMS Accueil',
          'HomepageCarouselSlide',
          `Suppression de la diapositive carrousel #${id}`,
          { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
          id
        );
      }
      return true;
    }
    return false;
  },

  // Latest Service Media (Photos & Videos)
  getLatestServiceMedia(): LatestServiceMedia {
    if (
      !db.latestServiceMedia ||
      !Array.isArray(db.latestServiceMedia.photos) ||
      !Array.isArray(db.latestServiceMedia.videos)
    ) {
      db.latestServiceMedia = JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA));
      persistDatabase();
    }
    return db.latestServiceMedia;
  },

  updateLatestServiceMedia(updates: Partial<LatestServiceMedia>, currentUser?: User): LatestServiceMedia {
    if (!db.latestServiceMedia) {
      db.latestServiceMedia = JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA));
    }
    db.latestServiceMedia = {
      ...db.latestServiceMedia,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_DERNIER_CULTE_MEDIA',
        'Médiathèque',
        'LatestServiceMedia',
        `Mise à jour des informations du dernier culte: "${db.latestServiceMedia.serviceTitle}" (${db.latestServiceMedia.serviceDate})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        db.latestServiceMedia.id
      );
    }
    return db.latestServiceMedia;
  },

  addServicePhoto(photoData: Omit<ServiceMediaPhoto, 'id' | 'createdAt'>, currentUser?: User): LatestServiceMedia {
    if (!db.latestServiceMedia) {
      db.latestServiceMedia = JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA));
    }
    const newPhoto: ServiceMediaPhoto = {
      ...photoData,
      id: `photo-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.latestServiceMedia.photos.unshift(newPhoto);
    db.latestServiceMedia.updatedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'AJOUT_PHOTO_DERNIER_CULTE',
        'Médiathèque',
        'ServiceMediaPhoto',
        `Ajout d'une photo au dernier culte: "${newPhoto.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newPhoto.id
      );
    }
    return db.latestServiceMedia;
  },

  deleteServicePhoto(photoId: string, currentUser?: User): LatestServiceMedia {
    if (!db.latestServiceMedia) {
      db.latestServiceMedia = JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA));
    }
    db.latestServiceMedia.photos = db.latestServiceMedia.photos.filter((p) => p.id !== photoId);
    db.latestServiceMedia.updatedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_PHOTO_DERNIER_CULTE',
        'Médiathèque',
        'ServiceMediaPhoto',
        `Suppression d'une photo du dernier culte #${photoId}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        photoId
      );
    }
    return db.latestServiceMedia;
  },

  addServiceVideo(videoData: Omit<ServiceMediaVideo, 'id' | 'createdAt'>, currentUser?: User): LatestServiceMedia {
    if (!db.latestServiceMedia) {
      db.latestServiceMedia = JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA));
    }
    const newVideo: ServiceMediaVideo = {
      ...videoData,
      id: `vid-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.latestServiceMedia.videos.unshift(newVideo);
    db.latestServiceMedia.updatedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'AJOUT_VIDEO_DERNIER_CULTE',
        'Médiathèque',
        'ServiceMediaVideo',
        `Ajout d'une vidéo au dernier culte: "${newVideo.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newVideo.id
      );
    }
    return db.latestServiceMedia;
  },

  deleteServiceVideo(videoId: string, currentUser?: User): LatestServiceMedia {
    if (!db.latestServiceMedia) {
      db.latestServiceMedia = JSON.parse(JSON.stringify(INITIAL_LATEST_SERVICE_MEDIA));
    }
    db.latestServiceMedia.videos = db.latestServiceMedia.videos.filter((v) => v.id !== videoId);
    db.latestServiceMedia.updatedAt = new Date().toISOString();
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_VIDEO_DERNIER_CULTE',
        'Médiathèque',
        'ServiceMediaVideo',
        `Suppression d'une vidéo du dernier culte #${videoId}`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        videoId
      );
    }
    return db.latestServiceMedia;
  },

  // Church Notifications System
  getNotifications(userId?: string): (AppNotification & { isRead?: boolean })[] {
    if (!db.notifications) {
      db.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    const currentUserId = userId || 'visitor';
    return db.notifications
      .map((n) => {
        const readList = n.readByUserIds || [];
        return {
          ...n,
          isRead: readList.includes(currentUserId),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationAsRead(id: string, userId?: string): boolean {
    if (!db.notifications) return false;
    const currentUserId = userId || 'visitor';
    const notif = db.notifications.find((n) => n.id === id);
    if (!notif) return false;
    if (!notif.readByUserIds) notif.readByUserIds = [];
    if (!notif.readByUserIds.includes(currentUserId)) {
      notif.readByUserIds.push(currentUserId);
      persistDatabase();
    }
    return true;
  },

  markAllNotificationsAsRead(userId?: string): boolean {
    if (!db.notifications) return false;
    const currentUserId = userId || 'visitor';
    db.notifications.forEach((n) => {
      if (!n.readByUserIds) n.readByUserIds = [];
      if (!n.readByUserIds.includes(currentUserId)) {
        n.readByUserIds.push(currentUserId);
      }
    });
    persistDatabase();
    return true;
  },

  createNotification(
    data: Omit<AppNotification, 'id' | 'createdAt' | 'readByUserIds'>,
    currentUser?: User
  ): AppNotification {
    if (!db.notifications) {
      db.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    const newNotif: AppNotification = {
      ...data,
      id: 'notif-' + Date.now(),
      createdAt: new Date().toISOString(),
      readByUserIds: currentUser ? [currentUser.id] : [],
      authorName:
        data.authorName || (currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Administration'),
      authorRole: data.authorRole || currentUser?.role || 'ADMIN',
    };
    db.notifications.unshift(newNotif);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'DIFFUSION_NOTIFICATION',
        'Communications',
        'AppNotification',
        `Diffusion d'une notification [${newNotif.category}] : "${newNotif.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newNotif.id
      );
    }
    return newNotif;
  },

  deleteNotification(id: string, currentUser?: User): boolean {
    if (!db.notifications) return false;
    const index = db.notifications.findIndex((n) => n.id === id);
    if (index === -1) return false;
    const removed = db.notifications.splice(index, 1)[0];
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_NOTIFICATION',
        'Communications',
        'AppNotification',
        `Suppression de la notification "${removed.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  // Church Resources (Enseignements, Prières, Études bibliques, Guides)
  getResources(): ChurchResource[] {
    if (!db.resources) {
      db.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
      persistDatabase();
    }
    return db.resources;
  },

  createResource(
    data: Omit<ChurchResource, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>,
    currentUser?: User
  ): ChurchResource {
    if (!db.resources) {
      db.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    }
    const newResource: ChurchResource = {
      ...data,
      id: 'res-' + Date.now(),
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.resources.unshift(newResource);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_RESSOURCE',
        'Ressources & Documents',
        'ChurchResource',
        `Ajout d'une ressource paroissiale [${newResource.category}] : "${newResource.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newResource.id
      );
    }
    return newResource;
  },

  updateResource(
    id: string,
    data: Partial<ChurchResource>,
    currentUser?: User
  ): ChurchResource | null {
    if (!db.resources) return null;
    const index = db.resources.findIndex((r) => r.id === id);
    if (index === -1) return null;

    db.resources[index] = {
      ...db.resources[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_RESSOURCE',
        'Ressources & Documents',
        'ChurchResource',
        `Modification de la ressource : "${db.resources[index].title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.resources[index];
  },

  deleteResource(id: string, currentUser?: User): boolean {
    if (!db.resources) return false;
    const index = db.resources.findIndex((r) => r.id === id);
    if (index === -1) return false;
    const removed = db.resources.splice(index, 1)[0];
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_RESSOURCE',
        'Ressources & Documents',
        'ChurchResource',
        `Suppression de la ressource "${removed.title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  incrementResourceDownload(id: string): ChurchResource | null {
    if (!db.resources) return null;
    const res = db.resources.find((r) => r.id === id);
    if (!res) return null;
    res.downloadCount = (res.downloadCount || 0) + 1;
    persistDatabase();
    return res;
  },

  // Weekly Programs (Programmes Hebdomadaires)
  getWeeklyPrograms(): WeeklyProgram[] {
    if (!Array.isArray(db.weeklyPrograms) || db.weeklyPrograms.length === 0) {
      db.weeklyPrograms = JSON.parse(JSON.stringify(INITIAL_WEEKLY_PROGRAMS));
      persistDatabase();
    }
    return [...db.weeklyPrograms].sort((a, b) => (a?.order || 0) - (b?.order || 0));
  },

  createWeeklyProgram(
    data: Omit<WeeklyProgram, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser?: User
  ): WeeklyProgram {
    if (!db.weeklyPrograms) {
      db.weeklyPrograms = JSON.parse(JSON.stringify(INITIAL_WEEKLY_PROGRAMS));
    }
    const maxOrder = db.weeklyPrograms.reduce((max, p) => Math.max(max, p.order || 0), 0);
    const newProgram: WeeklyProgram = {
      ...data,
      id: `prog-${Date.now()}`,
      order: data.order ?? maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.weeklyPrograms.push(newProgram);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'CREATION_PROGRAMME_HEBDOMADAIRE',
        'Accueil & Cultes',
        'WeeklyProgram',
        `Création du programme hebdomadaire "${newProgram.title}" (${newProgram.dayOfWeek})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        newProgram.id
      );
    }
    return newProgram;
  },

  updateWeeklyProgram(
    id: string,
    updates: Partial<WeeklyProgram>,
    currentUser?: User
  ): WeeklyProgram | null {
    if (!db.weeklyPrograms) {
      db.weeklyPrograms = JSON.parse(JSON.stringify(INITIAL_WEEKLY_PROGRAMS));
    }
    const idx = db.weeklyPrograms.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    db.weeklyPrograms[idx] = {
      ...db.weeklyPrograms[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'MODIFICATION_PROGRAMME_HEBDOMADAIRE',
        'Accueil & Cultes',
        'WeeklyProgram',
        `Mise à jour du programme "${db.weeklyPrograms[idx].title}"`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return db.weeklyPrograms[idx];
  },

  deleteWeeklyProgram(id: string, currentUser?: User): boolean {
    if (!db.weeklyPrograms) {
      db.weeklyPrograms = JSON.parse(JSON.stringify(INITIAL_WEEKLY_PROGRAMS));
    }
    const prev = db.weeklyPrograms.find((p) => p.id === id);
    if (!prev) return false;

    db.weeklyPrograms = db.weeklyPrograms.filter((p) => p.id !== id);
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'SUPPRESSION_PROGRAMME_HEBDOMADAIRE',
        'Accueil & Cultes',
        'WeeklyProgram',
        `Suppression du programme hebdomadaire "${prev.title}" (${prev.dayOfWeek})`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role },
        id
      );
    }
    return true;
  },

  reorderWeeklyPrograms(orderedIds: string[], currentUser?: User): WeeklyProgram[] {
    if (!db.weeklyPrograms) {
      db.weeklyPrograms = JSON.parse(JSON.stringify(INITIAL_WEEKLY_PROGRAMS));
    }
    const map = new Map(db.weeklyPrograms.map((p) => [p.id, p]));
    const reordered: WeeklyProgram[] = [];

    orderedIds.forEach((id, index) => {
      const item = map.get(id);
      if (item) {
        item.order = index + 1;
        item.updatedAt = new Date().toISOString();
        reordered.push(item);
        map.delete(id);
      }
    });

    // Add remaining items
    map.forEach((item) => {
      item.order = reordered.length + 1;
      reordered.push(item);
    });

    db.weeklyPrograms = reordered;
    persistDatabase();

    if (currentUser) {
      Storage.logAudit(
        'REORGANISATION_PROGRAMMES_HEBDOMADAIRES',
        'Accueil & Cultes',
        'WeeklyProgram',
        `Réorganisation de l'ordre d'affichage des programmes hebdomadaires`,
        { id: currentUser.id, name: `${currentUser.firstName} ${currentUser.lastName}`, role: currentUser.role }
      );
    }
    return [...db.weeklyPrograms].sort((a, b) => a.order - b.order);
  },
};
