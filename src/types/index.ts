export type Role =
  | 'ADMIN'
  | 'PASTEUR'
  | 'SECRÉTAIRE'
  | 'TRÉSORIER'
  | 'RESPONSABLE_MINISTÈRE'
  | 'MEMBRE'
  | 'VISITEUR';

export type Permission =
  | 'MEMBER_READ'
  | 'MEMBER_CREATE'
  | 'MEMBER_UPDATE'
  | 'MEMBER_DELETE'
  | 'FAMILY_READ'
  | 'FAMILY_CREATE'
  | 'FAMILY_UPDATE'
  | 'FAMILY_DELETE'
  | 'ATTENDANCE_READ'
  | 'ATTENDANCE_CREATE'
  | 'ATTENDANCE_UPDATE'
  | 'ATTENDANCE_DELETE'
  | 'FINANCE_READ'
  | 'FINANCE_CREATE'
  | 'FINANCE_UPDATE'
  | 'FINANCE_DELETE'
  | 'EVENT_READ'
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'EVENT_DELETE'
  | 'MINISTRY_READ'
  | 'MINISTRY_MANAGE'
  | 'COMMUNICATION_READ'
  | 'COMMUNICATION_MANAGE'
  | 'TESTIMONIAL_SUBMIT'
  | 'TESTIMONIAL_MODERATE'
  | 'TESTIMONIAL_PUBLISH'
  | 'FORUM_CREATE_TOPIC'
  | 'FORUM_CREATE_POST'
  | 'FORUM_MODERATE'
  | 'FORUM_REPORT'
  | 'BIBLE_VERSE_READ'
  | 'BIBLE_VERSE_MANAGE'
  | 'MEDIA_READ'
  | 'MEDIA_MANAGE'
  | 'PARAKLETOS_READ'
  | 'PARAKLETOS_MANAGE'
  | 'REPORT_READ'
  | 'REPORT_EXPORT'
  | 'USER_MANAGE'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_READ'
  | 'BACKUP_MANAGE'
  | 'HOMEPAGE_READ'
  | 'HOMEPAGE_UPDATE'
  | 'HOMEPAGE_PUBLISH'
  | 'HOMEPAGE_DELETE'
  | 'PRAYER_REQUEST_MANAGE';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: Role;
  permissions: Permission[];
  phone?: string;
  avatarUrl?: string;
  ministryId?: string;
  memberId?: string;
  status: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  sex: 'M' | 'F';
  birthDate: string;
  birthPlace: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  profession: string;
  maritalStatus: 'CELIBATAIRE' | 'MARIE' | 'VEUF' | 'DIVORCE';
  joinDate: string;
  baptismDate?: string;
  familyId?: string;
  ministryIds: string[];
  department?: string;
  status: 'ACTIF' | 'INACTIF' | 'VISITEUR' | 'EN_TRANSFERT';
  photoUrl?: string;
  observations?: string;
  spiritualStatus?: string;
  wantsPastoralVisit?: boolean;
  homeCellPreference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Family {
  id: string;
  name: string;
  address: string;
  phone: string;
  headMemberId?: string;
  notes?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ministry {
  id: string;
  name: string;
  category: string;
  description: string;
  leaderMemberId?: string;
  leaderName?: string;
  meetingSchedule?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  ministryId: string;
  name: string;
  description: string;
  leaderMemberId?: string;
  leaderName?: string;
  leaderPhone?: string;
  meetingSchedule?: string;
  createdAt?: string;
}

export interface MinistryAdhesionRequest {
  id: string;
  ministryId: string;
  ministryName: string;
  departmentId?: string;
  departmentName?: string;
  memberId?: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  motivation: string;
  spiritualGifts?: string;
  availability?: string;
  status: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssociatedChurch {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  pastorName: string;
  pastorPhone?: string;
  pastorEmail?: string;
  serviceSchedule?: string;
  memberCount?: number;
  affiliationYear?: number;
  imageUrl?: string;
  notes?: string;
  status: 'ACTIVE' | 'EN_IMPLANTATION' | 'PARTENAIRE';
  createdAt: string;
  updatedAt: string;
}

export interface HomeCell {
  id: string;
  name: string; // e.g., Cellule Béthel - Akon
  neighborhood: string; // Quartier in Sangmelima
  address: string;
  leaderName: string;
  leaderPhone: string;
  leaderMemberId?: string;
  assistantName?: string;
  assistantPhone?: string;
  hostFamilyName?: string;
  meetingDay: string; // e.g. Mercredi
  meetingTime: string; // e.g. 18h30 - 20h00
  memberCount: number;
  targetAudience?: string; // Tous, Familles, Jeunesse
  description?: string;
  status: 'ACTIVE' | 'EN_PAUSE';
  createdAt: string;
  updatedAt: string;
}

export type AttendanceType =
  | 'culte'
  | 'priere'
  | 'etude_biblique'
  | 'reunion'
  | 'formation'
  | 'evenement';

export interface AttendanceSession {
  id: string;
  date: string;
  time: string;
  location: string;
  title: string;
  type: AttendanceType;
  leaderMemberId?: string;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  memberId: string;
  status: 'PRÉSENT' | 'ABSENT' | 'EXCUSÉ';
  checkInTime?: string;
  notes?: string;
}

export type TransactionType = 'RECETTE' | 'DÉPENSE';
export type PaymentMethod = 'ESPÈCES' | 'VIREMENT' | 'MOBILE_MONEY' | 'CHÈQUE' | 'AUTRE';

export interface TransactionCategory {
  id: string;
  type: TransactionType;
  name: string;
  description?: string;
}

export interface Transaction {
  id: string;
  number: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  categoryName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  counterparty: string; // Bénéficiaire ou donateur
  description: string;
  receiptNumber?: string;
  memberId?: string;
  justificatifUrl?: string;
  isAnonymous?: boolean;
  phoneNumber?: string;
  prayerNote?: string;
  projectName?: string;
  userId: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | 'culte'
  | 'conference'
  | 'convention'
  | 'seminaire'
  | 'croisade'
  | 'formation'
  | 'reunion'
  | 'priere'
  | 'etude_biblique'
  | 'mariage'
  | 'bapteme'
  | 'jeunesse'
  | 'enfants'
  | 'autre';

export type EventStatus =
  | 'BROUILLON'
  | 'PROGRAMMÉ'
  | 'EN_COURS'
  | 'TERMINÉ'
  | 'ANNULÉ'
  | 'ARCHIVÉ';

export interface Event {
  id: string;
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  bannerUrl?: string;
  maxParticipants?: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  memberId?: string;
  name: string;
  phone: string;
  email?: string;
  status: 'INSCRIT' | 'CONFIRMÉ' | 'PRÉSENT' | 'ABSENT' | 'ANNULÉ';
  registeredAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  imageUrl?: string;
  isPublicWeb?: boolean;
  targetAudience: 'TOUS' | 'FAMILLES' | 'MINISTERE' | 'DEPARTEMENT' | 'ROLE' | 'GROUPE';
  ministryId?: string;
  roleTarget?: Role;
  status: 'BROUILLON' | 'PROGRAMMÉ' | 'PUBLIÉ' | 'EXPIRÉ' | 'ARCHIVÉ';
  publishDate: string;
  expireDate?: string;
  createdAt: string;
  authorName?: string;
  viewCount?: number;
  shareCount?: number;
}

export type NotificationCategory =
  | 'ENSEIGNEMENT'
  | 'MESSAGE_ADMIN'
  | 'EVENEMENT'
  | 'PASTORAL'
  | 'URGENT'
  | 'PRIERE';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetAudience?: 'TOUS' | 'MEMBRES' | 'LEADERSHIP';
  actionPage?: string;
  actionLabel?: string;
  actionUrl?: string;
  authorName?: string;
  authorRole?: Role;
  priority?: 'NORMALE' | 'HAUTE' | 'URGENTE';
  createdAt: string;
  readByUserIds?: string[];
}

export interface Testimonial {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorEmail?: string;
  authorPhone?: string;
  memberId?: string;
  isIdentityVisible: boolean;
  status: 'EN_ATTENTE' | 'VALIDÉ' | 'REJETÉ' | 'MASQUÉ';
  rejectionReason?: string;
  moderatorId?: string;
  moderatorName?: string;
  validatedAt?: string;
  publishedAt?: string;
  createdAt: string;
}

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  order: number;
  topicCount?: number;
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  authorUserId: string;
  authorName: string;
  authorRole: Role;
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  viewCount: number;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumPost {
  id: string;
  topicId: string;
  authorUserId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReport {
  id: string;
  postId: string;
  topicId: string;
  postSnippet: string;
  reporterUserId: string;
  reporterName: string;
  reason: string;
  status: 'EN_ATTENTE' | 'TRAITÉ' | 'REJETÉ';
  createdAt: string;
}

export interface DailyBibleVerse {
  id: string;
  date: string;
  reference: string;
  text: string;
  translation: string;
  meditation: string;
  prayer: string;
  type: 'MÉDITATION' | 'PRIÈRE' | 'MÉDITATION_ET_PRIÈRE';
  status: 'BROUILLON' | 'PUBLIÉ' | 'ARCHIVÉ';
  scheduledFor: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'photos' | 'videos' | 'audios' | 'documents' | 'predications' | 'enseignements' | 'brochures';
  url: string;
  fileSizeMb: number;
  mimeType: string;
  description: string;
  preacherOrAuthor?: string;
  date: string;
  category: string;
  createdAt: string;
}

export interface ParakletosInstituteInfo {
  name: string;
  slogan: string;
  deanName: string;
  academicSecretary: string;
  address: string;
  phone: string;
  email: string;
  annualTuition: string;
  scheduleInfo: string;
  presentation: string;
  requirements: string[];
}

export interface ParakletosYear {
  id: string;
  name: string; // e.g. 2025-2026
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface ParakletosClass {
  id: string;
  yearId: string;
  name: string; // e.g. 1ère Année Fondements, 2ème Année Leadership
  level: string; // Certificat, Diplôme, etc.
  description: string;
  code?: string;
  durationMonths?: number;
  objective?: string;
}

export interface ParakletosTeacher {
  id: string;
  name: string;
  title: string;
  specialty: string;
  phone: string;
  email: string;
  accessCode: string;
  status: 'ACTIF' | 'INACTIF';
  assignedSubjectIds?: string[];
  createdAt?: string;
}

export interface ParakletosSubject {
  id: string;
  classId: string;
  name: string;
  coefficient: number;
  teacherName: string;
  teacherId?: string;
  code?: string;
  description?: string;
  hoursPerWeek?: number;
}

export interface ParakletosStudent {
  id: string;
  matricule: string;
  accessCode: string;
  memberId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  classId: string;
  yearId: string;
  enrollmentDate: string;
  status: 'ACTIF' | 'DIPLOME' | 'ABANDON';
}

export interface ParakletosAdmissionRequest {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  memberId?: string;
  classId: string;
  className: string;
  profession?: string;
  baptismDate?: string;
  testimony: string;
  motivation: string;
  availability: string;
  status: 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';
  generatedAccessCode?: string;
  validatedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParakletosGrade {
  id: string;
  studentId: string;
  subjectId: string;
  grade: number; // sur 20
  term: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  comments?: string;
}


export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  module: string;
  objectType: string;
  objectId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  date: string;
  type: 'MANUELLE' | 'AUTOMATIQUE';
  sizeKb: number;
  status: 'SUCCES' | 'ECHEC';
  location: string;
  notes?: string;
}

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category:
    | 'Santé & Guérison'
    | 'Famille & Foyer'
    | 'Travail & Finances'
    | 'Combat Spirituel'
    | 'Salut & Délivrance'
    | 'Études & Concours'
    | 'Autre';
  authorName: string;
  isAnonymous: boolean;
  userId?: string;
  phone?: string;
  isConfidentialPastoralOnly: boolean;
  status: 'EN_ATTENTE' | 'EN_PRIERE' | 'EXAUCE' | 'ARCHIVE';
  prayerCount: number;
  testimony?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TreasuryAccountOM {
  accountNumber: string;
  merchantCode: string;
  accountName: string;
  isActive: boolean;
}

export interface TreasuryAccountMoMo {
  accountNumber: string;
  merchantCode: string;
  accountName: string;
  isActive: boolean;
}

export interface TreasuryAccountBank {
  bankName: string;
  agency: string;
  accountName: string;
  accountNumber: string;
  ibanOrRib: string;
  swiftBic: string;
  instructions?: string;
  isActive: boolean;
}

export interface TreasurySettings {
  orangeMoney: TreasuryAccountOM;
  mobileMoney: TreasuryAccountMoMo;
  bankTransfer: TreasuryAccountBank;
}

export interface SystemSettings {
  churchName: string;
  slogan: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  socials: {
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
    instagram?: string;
    tiktok?: string;
    telegram?: string;
  };
  timezone: string;
  currency: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    goldColor: string;
    backgroundColor: string;
    whiteColor: string;
  };
  logoUrl?: string;
  faviconUrl?: string;
  modules: {
    parakletosEnabled: boolean;
    forumEnabled: boolean;
    mediaEnabled: boolean;
    testimonialsEnabled: boolean;
    dailyVersesEnabled: boolean;
    prayerRequestsEnabled: boolean;
  };
  integrations: {
    emailConfigured: boolean;
    smsConfigured: boolean;
    whatsappConfigured: boolean;
    backupStorageConfigured: boolean;
  };
  treasury?: TreasurySettings;
}

export interface HomepageCarouselSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description?: string;
  imageUrl: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  isActive: boolean;
  order: number;
}

export type WeeklyProgramDay =
  | 'Lundi'
  | 'Mardi'
  | 'Mercredi'
  | 'Jeudi'
  | 'Vendredi'
  | 'Samedi'
  | 'Dimanche'
  | 'Tous les jours';

export type WeeklyProgramCategory =
  | 'CULTE'
  | 'ETUDE_BIBLIQUE'
  | 'PRIERE_INTERCESSION'
  | 'JEUNESSE'
  | 'FEMMES'
  | 'HOMMES'
  | 'ENFANTS'
  | 'EVANGELISATION'
  | 'FORMATION'
  | 'SPECIAL';

export interface WeeklyProgram {
  id: string;
  title: string;
  dayOfWeek: WeeklyProgramDay;
  time: string;
  description: string;
  location: string;
  category: WeeklyProgramCategory;
  leaderOrMinister?: string;
  targetAudience?: string;
  iconName?: string;
  colorTheme?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceMediaPhoto {
  id: string;
  title: string;
  url: string;
  caption?: string;
  photographer?: string;
  date?: string;
  category?: string;
  sourceType?: 'PHONE' | 'DRIVE' | 'WEB';
  driveFileId?: string;
  fileSizeMb?: number;
  fileName?: string;
  createdAt: string;
}

export interface ServiceMediaVideo {
  id: string;
  title: string;
  url: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  duration?: string;
  preacher?: string;
  description?: string;
  isFullService?: boolean;
  date?: string;
  category?: string;
  sourceType?: 'PHONE' | 'DRIVE' | 'WEB' | 'YOUTUBE';
  driveFileId?: string;
  fileSizeMb?: number;
  fileName?: string;
  createdAt: string;
}

export interface LatestServiceMedia {
  id: string;
  serviceDate: string;
  serviceTitle: string;
  preacherName: string;
  themePassage: string;
  summary: string;
  attendanceCount?: number;
  photos: ServiceMediaPhoto[];
  videos: ServiceMediaVideo[];
  updatedAt: string;
}

export interface HomepageSection {
  id: string;
  key:
    | 'header'
    | 'hero'
    | 'carousel'
    | 'presentation'
    | 'services'
    | 'events'
    | 'verse'
    | 'testimonials'
    | 'media'
    | 'dernier-culte'
    | 'cta'
    | 'socials'
    | 'footer';
  name: string;
  position: number;
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  content?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  imageUrl?: string;
  backgroundUrl?: string;
  altText?: string;
  items?: any[];
}

export interface HomepageRevision {
  id: string;
  version: number;
  authorName: string;
  action: 'BROUILLON' | 'PUBLICATION' | 'RESTAURATION';
  createdAt: string;
  sectionsSnapshot: HomepageSection[];
}

export interface HomepageCMSState {
  draftSections: HomepageSection[];
  publishedSections: HomepageSection[];
  revisions: HomepageRevision[];
  lastPublishedAt?: string;
  lastDraftSavedAt?: string;
}

export type ResourceCategory =
  | 'ENSEIGNEMENT'
  | 'PRIERE'
  | 'ETUDE_BIBLIQUE'
  | 'CONFESSION_DE_FOI'
  | 'GUIDE_SPIRITUEL';

export interface ChurchResource {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  authorOrPreacher: string;
  documentUrl: string; // URL, Google Drive link, or Data URI
  fileName: string;
  fileFormat: 'PDF' | 'DOCX' | 'EPUB' | 'TXT';
  fileSizeMb: number;
  downloadCount: number;
  date: string;
  tags: string[];
  isFeatured?: boolean;
  contentSnippet?: string; // Rich prayer or teaching text for online reading / preview
  sourceType?: 'PHONE' | 'DRIVE' | 'WEB';
  createdAt: string;
  updatedAt: string;
}

export interface DynamicPost {
  id: string;
  category: 'ENSEIGNEMENT' | 'ANNONCE' | 'ACTUALITE' | 'PUBLICATION' | 'CULTE' | string;
  title: string;
  body: string | null;
  media_url: string | null;
  author: string;
  is_published: boolean;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface AppContentRecord {
  section_key: string;
  content_data: any;
  updated_at: string;
}

