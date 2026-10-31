import {
  User,
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
  ChurchResource,
  WeeklyProgram,
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  churchName: 'Église Missionnaire de la Foi de Sangmelima',
  slogan: 'Une église vivante au cœur du Sud, enracinée dans la Parole et tournée vers les nations',
  city: 'Sangmelima',
  country: 'Cameroun',
  address: 'Quartier Akon, Route Principale, Sangmelima',
  phone: '+237 699 00 11 22',
  email: 'contact@emf-sangmelima.org',
  website: 'https://emf-sangmelima.org',
  socials: {
    facebook: 'https://facebook.com/emfsangmelima',
    youtube: 'https://youtube.com/@emfsangmelima',
    whatsapp: 'https://wa.me/237699001122',
    instagram: 'https://instagram.com/emfsangmelima',
    telegram: 'https://t.me/emfsangmelima',
    tiktok: 'https://tiktok.com/@emfsangmelima',
  },
  timezone: 'Africa/Douala',
  currency: 'FCFA',
  theme: {
    primaryColor: '#6E1325',
    secondaryColor: '#4A0E17',
    goldColor: '#C99B2E',
    backgroundColor: '#FAF0F2',
    whiteColor: '#FFFFFF',
  },
  logoUrl: '/logo.png',
  faviconUrl: '/logo.png',
  modules: {
    parakletosEnabled: true,
    forumEnabled: true,
    mediaEnabled: true,
    testimonialsEnabled: true,
    dailyVersesEnabled: true,
    prayerRequestsEnabled: true,
  },
  integrations: {
    emailConfigured: false,
    smsConfigured: false,
    whatsappConfigured: false,
    backupStorageConfigured: true,
  },
  treasury: {
    orangeMoney: {
      accountNumber: '+237 699 00 11 22',
      merchantCode: '#150*47*74892# (Code Marchand : 74892)',
      accountName: 'Église Missionnaire de la Foi (Paroisse Sangmelima)',
      isActive: true,
    },
    mobileMoney: {
      accountNumber: '+237 677 33 44 55',
      merchantCode: '*126*4*39210# (Code Marchand MoMo Pay : 39210)',
      accountName: 'EMF Sangmelima Trésorerie Paroissiale',
      isActive: true,
    },
    bankTransfer: {
      bankName: 'Afriland First Bank — Agence de Sangmelima',
      agency: 'Agence de Sangmelima (Sud Cameroun)',
      accountName: 'Église Missionnaire de la Foi du Cameroun (Paroisse Sangmelima)',
      accountNumber: '10005 00012 34567890123 45',
      ibanOrRib: 'CM21 1000 5000 1234 5678 9012 345',
      swiftBic: 'AFRICMCX',
      isActive: true,
    },
  },
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    email: 'cyrilleoyono6@gmail.com',
    passwordHash: 'AdminEMF2026!',
    firstName: 'Cyrille',
    lastName: 'Oyono',
    role: 'ADMIN',
    permissions: [
      'MEMBER_READ', 'MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_DELETE',
      'FAMILY_READ', 'FAMILY_CREATE', 'FAMILY_UPDATE', 'FAMILY_DELETE',
      'ATTENDANCE_READ', 'ATTENDANCE_CREATE', 'ATTENDANCE_UPDATE', 'ATTENDANCE_DELETE',
      'FINANCE_READ', 'FINANCE_CREATE', 'FINANCE_UPDATE', 'FINANCE_DELETE',
      'EVENT_READ', 'EVENT_CREATE', 'EVENT_UPDATE', 'EVENT_DELETE',
      'MINISTRY_READ', 'MINISTRY_MANAGE',
      'COMMUNICATION_READ', 'COMMUNICATION_MANAGE',
      'TESTIMONIAL_SUBMIT', 'TESTIMONIAL_MODERATE', 'TESTIMONIAL_PUBLISH',
      'FORUM_CREATE_TOPIC', 'FORUM_CREATE_POST', 'FORUM_MODERATE', 'FORUM_REPORT',
      'BIBLE_VERSE_READ', 'BIBLE_VERSE_MANAGE',
      'MEDIA_READ', 'MEDIA_MANAGE',
      'PARAKLETOS_READ', 'PARAKLETOS_MANAGE',
      'REPORT_READ', 'REPORT_EXPORT',
      'USER_MANAGE', 'SETTINGS_MANAGE', 'AUDIT_READ', 'BACKUP_MANAGE',
      'HOMEPAGE_READ', 'HOMEPAGE_UPDATE', 'HOMEPAGE_PUBLISH', 'HOMEPAGE_DELETE',
    ],
    phone: '+237 670 12 34 56',
    status: 'ACTIF',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-admin-cyril-930',
    email: 'cyriloyono930@gmail.com',
    passwordHash: 'AdminEMF2026!',
    firstName: 'Cyril',
    lastName: 'Oyono',
    role: 'ADMIN',
    permissions: [
      'MEMBER_READ', 'MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_DELETE',
      'FAMILY_READ', 'FAMILY_CREATE', 'FAMILY_UPDATE', 'FAMILY_DELETE',
      'ATTENDANCE_READ', 'ATTENDANCE_CREATE', 'ATTENDANCE_UPDATE', 'ATTENDANCE_DELETE',
      'FINANCE_READ', 'FINANCE_CREATE', 'FINANCE_UPDATE', 'FINANCE_DELETE',
      'EVENT_READ', 'EVENT_CREATE', 'EVENT_UPDATE', 'EVENT_DELETE',
      'MINISTRY_READ', 'MINISTRY_MANAGE',
      'COMMUNICATION_READ', 'COMMUNICATION_MANAGE',
      'TESTIMONIAL_SUBMIT', 'TESTIMONIAL_MODERATE', 'TESTIMONIAL_PUBLISH',
      'FORUM_CREATE_TOPIC', 'FORUM_CREATE_POST', 'FORUM_MODERATE', 'FORUM_REPORT',
      'BIBLE_VERSE_READ', 'BIBLE_VERSE_MANAGE',
      'MEDIA_READ', 'MEDIA_MANAGE',
      'PARAKLETOS_READ', 'PARAKLETOS_MANAGE',
      'REPORT_READ', 'REPORT_EXPORT',
      'USER_MANAGE', 'SETTINGS_MANAGE', 'AUDIT_READ', 'BACKUP_MANAGE',
      'HOMEPAGE_READ', 'HOMEPAGE_UPDATE', 'HOMEPAGE_PUBLISH', 'HOMEPAGE_DELETE',
    ],
    phone: '+237 699 00 11 22',
    status: 'ACTIF',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-pastor-1',
    email: 'pasteur@emf-sangmelima.org',
    passwordHash: 'Pasteur2026!',
    firstName: 'Samuel',
    lastName: 'Ondoa',
    role: 'PASTEUR',
    permissions: [
      'MEMBER_READ', 'MEMBER_CREATE', 'MEMBER_UPDATE',
      'FAMILY_READ', 'FAMILY_CREATE', 'FAMILY_UPDATE',
      'ATTENDANCE_READ', 'ATTENDANCE_CREATE',
      'EVENT_READ', 'EVENT_CREATE', 'EVENT_UPDATE',
      'MINISTRY_READ',
      'COMMUNICATION_READ', 'COMMUNICATION_MANAGE',
      'TESTIMONIAL_SUBMIT', 'TESTIMONIAL_MODERATE', 'TESTIMONIAL_PUBLISH',
      'FORUM_CREATE_TOPIC', 'FORUM_CREATE_POST', 'FORUM_MODERATE',
      'BIBLE_VERSE_READ', 'BIBLE_VERSE_MANAGE',
      'MEDIA_READ', 'MEDIA_MANAGE',
      'PARAKLETOS_READ', 'REPORT_READ', 'HOMEPAGE_READ',
    ],
    phone: '+237 699 11 22 33',
    status: 'ACTIF',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-secretaire-1',
    email: 'secretaire@emf-sangmelima.org',
    passwordHash: 'Secretaire2026!',
    firstName: 'Chantal',
    lastName: 'Mengue',
    role: 'SECRÉTAIRE',
    permissions: [
      'MEMBER_READ', 'MEMBER_CREATE', 'MEMBER_UPDATE',
      'FAMILY_READ', 'FAMILY_CREATE', 'FAMILY_UPDATE',
      'ATTENDANCE_READ', 'ATTENDANCE_CREATE', 'ATTENDANCE_UPDATE',
      'EVENT_READ', 'EVENT_CREATE', 'EVENT_UPDATE',
      'COMMUNICATION_READ', 'COMMUNICATION_MANAGE',
      'TESTIMONIAL_SUBMIT', 'FORUM_CREATE_TOPIC', 'FORUM_CREATE_POST',
      'BIBLE_VERSE_READ', 'REPORT_READ',
    ],
    phone: '+237 677 33 44 55',
    status: 'ACTIF',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-tresorier-1',
    email: 'tresorier@emf-sangmelima.org',
    passwordHash: 'Tresorier2026!',
    firstName: 'Emmanuel',
    lastName: 'Mvondo',
    role: 'TRÉSORIER',
    permissions: [
      'FINANCE_READ', 'FINANCE_CREATE', 'FINANCE_UPDATE',
      'REPORT_READ', 'REPORT_EXPORT',
    ],
    phone: '+237 694 55 66 77',
    status: 'ACTIF',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
];

// Données vides au démarrage pour éviter toute écriture accidentelle de données factices
export const INITIAL_FAMILIES: Family[] = [];
export const INITIAL_MINISTRIES: Ministry[] = [];
export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_CATEGORIES: TransactionCategory[] = [
  { id: 'cat-1', name: 'Dîmes', type: 'RECETTE', description: 'Dîmes des fidèles' },
  { id: 'cat-2', name: 'Offrandes dominicales', type: 'RECETTE', description: 'Offrandes des cultes' },
  { id: 'cat-3', name: 'Dons & Libéralités', type: 'RECETTE', description: 'Dons spéciaux et soutiens' },
  { id: 'cat-4', name: 'Travaux & Construction', type: 'RECETTE', description: 'Fonds de construction du temple' },
  { id: 'cat-5', name: 'Dépenses courantes', type: 'DÉPENSE', description: 'Factures d’eau, électricité et entretien' },
  { id: 'cat-6', name: 'Aides sociales & Entraide', type: 'DÉPENSE', description: 'Soutien aux nécessiteux' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_SESSIONS: AttendanceSession[] = [];
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
export const INITIAL_EVENTS: Event[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_TESTIMONIALS: Testimonial[] = [];

export const INITIAL_BIBLE_VERSES: DailyBibleVerse[] = [
  {
    id: 'vrs-1',
    date: '2026-03-01',
    reference: 'Jérémie 29:11',
    text: 'Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance.',
    translation: 'Louis Segond 1910',
    meditation: 'Quelles que soient les incertitudes qui pèsent sur votre quotidien à Sangmelima ou ailleurs, le dessein de Dieu pour votre vie est immuable. Il veille sur chaque étape de votre marche.',
    prayer: 'Seigneur Dieu Tout-Puissant, je dépose mes craintes entre Tes mains bienveillantes. Fais triompher Tes desseins de paix et d’espérance dans ma famille, dans mon travail et au sein de notre communauté EMF. Au Nom de Jésus, Amen !',
    type: 'MÉDITATION_ET_PRIÈRE',
    status: 'PUBLIÉ',
    scheduledFor: '2026-03-01',
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'vrs-2',
    date: '2026-03-02',
    reference: 'Psaumes 23:1',
    text: 'L’Éternel est mon berger : je ne manquerai de rien.',
    translation: 'Louis Segond 1910',
    meditation: 'Le bon Berger conduit Ses brebis près des eaux paisibles. Même dans la vallée de l’ombre de la mort, Sa houlette et Son bâton nous rassurent.',
    prayer: 'Éternel mon berger, conduis mes pas en ce jour. Éloigne de mon cœur toute inquiétude du lendemain et remplis ma coupe de Ta grâce débordante. Amen.',
    type: 'MÉDITATION_ET_PRIÈRE',
    status: 'PUBLIÉ',
    scheduledFor: '2026-03-02',
    createdAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'vrs-3',
    date: '2026-03-03',
    reference: 'Ésaïe 40:31',
    text: 'Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent le vol comme les aigles ; ils courent, et ne se lassent point ; ils marchent, et ne se fatiguent point.',
    translation: 'Louis Segond 1910',
    meditation: 'La force humaine s’épuise, mais la force qui découle de la communion avec l’Esprit de Dieu est inépuisable.',
    prayer: 'Père Céleste, donne du repos à mon âme fatiguée et ranime en moi l’ardeur de Ton Esprit Saint. Au Nom de Jésus-Christ, Amen !',
    type: 'MÉDITATION_ET_PRIÈRE',
    status: 'PUBLIÉ',
    scheduledFor: '2026-03-03',
    createdAt: '2026-02-20T10:00:00Z',
  },
];

export const INITIAL_FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: 'cat-f-1',
    title: 'Édification spirituelle & Méditations',
    description: 'Partageons la Parole, nos réflexions bibliques et nos versets inspirants.',
    iconName: 'BookOpen',
    order: 1,
    topicCount: 0,
  },
  {
    id: 'cat-f-2',
    title: 'Vie de l’Église & Activités locales',
    description: 'Échanges fraternels sur la marche de la communauté EMF à Sangmelima.',
    iconName: 'Church',
    order: 2,
    topicCount: 0,
  },
  {
    id: 'cat-f-3',
    title: 'Questions bibliques & Doctrines',
    description: 'Posons des questions constructives sur les textes sacrés et la marche chrétienne.',
    iconName: 'HelpCircle',
    order: 3,
    topicCount: 0,
  },
  {
    id: 'cat-f-4',
    title: 'Sujets de prière & Intercession mutuelle',
    description: 'Portons les fardeaux les uns des autres dans la prière fraternelle.',
    iconName: 'HeartHandshake',
    order: 4,
    topicCount: 0,
  },
];

export const INITIAL_FORUM_TOPICS: ForumTopic[] = [];
export const INITIAL_FORUM_POSTS: ForumPost[] = [];
export const INITIAL_MEDIA: MediaItem[] = [];

export const INITIAL_PARAKLETOS_YEARS: ParakletosYear[] = [
  {
    id: 'year-2025-2026',
    name: 'Année Académique 2025-2026',
    isCurrent: true,
    startDate: '2025-10-01',
    endDate: '2026-06-30',
  },
];

export const INITIAL_PARAKLETOS_CLASSES: ParakletosClass[] = [
  {
    id: 'cls-1',
    yearId: 'year-2025-2026',
    name: 'Niveau 1 : Fondements Théologiques & Vie Chrétienne',
    level: 'Certificat',
    description: 'Initiation à la doctrine biblique, survol de l’Ancien et du Nouveau Testament.',
  },
  {
    id: 'cls-2',
    yearId: 'year-2025-2026',
    name: 'Niveau 2 : Leadership Pastoral & Homilétique',
    level: 'Diplôme',
    description: 'Préparation au ministère, prédication textuelle, relation d’aide pastorale.',
  },
];

export const INITIAL_PARAKLETOS_SUBJECTS: ParakletosSubject[] = [
  { id: 'sbj-1', classId: 'cls-1', name: 'Théologie Systématique I', coefficient: 3, teacherName: 'Pasteur Samuel Ondoa' },
  { id: 'sbj-2', classId: 'cls-1', name: 'Herméneutique Biblique', coefficient: 2, teacherName: 'Ancien David Essomba' },
  { id: 'sbj-3', classId: 'cls-1', name: 'Histoire de l’Église au Cameroun', coefficient: 2, teacherName: 'Cyrille Oyono' },
  { id: 'sbj-4', classId: 'cls-2', name: 'Homilétique & Prédication', coefficient: 3, teacherName: 'Pasteur Samuel Ondoa' },
  { id: 'sbj-5', classId: 'cls-2', name: 'Éthique & Gestion d’Église', coefficient: 2, teacherName: 'Emmanuel Mvondo' },
];

export const INITIAL_PARAKLETOS_STUDENTS: ParakletosStudent[] = [];
export const INITIAL_PARAKLETOS_GRADES: ParakletosGrade[] = [];

export const INITIAL_PARAKLETOS_INFO: ParakletosInstituteInfo = {
  name: 'Institut Biblique Parakletos (IBP)',
  slogan: 'Former des ouvriers qualifiés, enracinés dans la Parole et remplis de l’Esprit',
  deanName: 'Pasteur Samuel Ondoa',
  academicSecretary: 'Ancien David Essomba',
  address: 'Quartier Akon & Bitom, Sangmelima, Région du Sud, Cameroun',
  phone: '+237 699 00 11 22',
  email: 'institut.parakletos@emf-sangmelima.org',
  annualTuition: 'Formation subventionnée par l’église (Contribution symbolique de 25 000 FCFA / an pour les supports de cours)',
  scheduleInfo: 'Cours du soir : Mardi et Jeudi de 18h00 à 20h30 • Samedi matin de 09h00 à 13h00',
  presentation: 'L’Institut Biblique Parakletos est l’école théologique et pastorale de l’Église Missionnaire de la Foi de Sangmelima. Fondé pour répondre au besoin d’enracinement doctrinal, d’éthique ministérielle et d’affirmation du leadership chrétien, l’institut offre des parcours certifiants et diplômants adaptés aux laïcs engagés, aux responsables de cellules, aux diacres et aux futurs serviteurs.',
  requirements: [
    'Être membre engagé et baptisé par immersion',
    'Avoir la recommandation d’un pasteur ou responsable de cellule',
    'Faire preuve d’un témoignage chrétien authentique et d’une soif de la Parole',
    'S’engager à suivre avec assiduité les cours et les travaux dirigés',
  ],
};

export const INITIAL_PARAKLETOS_TEACHERS: ParakletosTeacher[] = [];
export const INITIAL_PARAKLETOS_ADMISSIONS: ParakletosAdmissionRequest[] = [];

export const INITIAL_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: 'sec-header',
    key: 'header',
    name: 'En-tête & Barre de navigation',
    position: 1,
    isVisible: true,
    title: 'EMF SMART',
    subtitle: 'Église Missionnaire de la Foi — Sangmelima',
    primaryButtonText: 'Espace Membre',
    primaryButtonLink: '/login',
    secondaryButtonText: 'Nous contacter',
    secondaryButtonLink: '#contact',
  },
  {
    id: 'sec-hero',
    key: 'hero',
    name: 'Section Hero (Bannière Principale)',
    position: 2,
    isVisible: true,
    title: 'Bienvenue à l’Église Missionnaire de la Foi de Sangmelima',
    subtitle: 'Une communauté vibrante d’amour, de louange et de transformation spirituelle au Cameroun.',
    content: 'Rejoignez-nous chaque dimanche pour vivre la puissance de l’Évangile, dans un esprit de fraternité sincère et de foi agissante.',
    primaryButtonText: 'Découvrir nos cultes',
    primaryButtonLink: '#services',
    secondaryButtonText: 'Événements & Actualités',
    secondaryButtonLink: '#events-and-news',
  },
  {
    id: 'sec-presentation',
    key: 'presentation',
    name: 'Présentation de l’Église',
    position: 3,
    isVisible: true,
    title: 'Qui Sommes-Nous ?',
    subtitle: 'Une église enracinée dans la Parole de Dieu à Sangmelima',
    content: 'Fondée avec la mission sacrée de proclamer la Bonne Nouvelle de Jésus-Christ sans compromis, l’Église Missionnaire de la Foi de Sangmelima rassemble des fidèles unis par un même amour pour le Seigneur. Nous croyons à la prière persévérante, au discipulat pratique et à l’impact social positif dans notre ville et dans la région du Sud Cameroun.',
    primaryButtonText: 'En savoir plus',
    primaryButtonLink: '#about',
    items: [],
  },
  {
    id: 'sec-services',
    key: 'services',
    name: 'Nos Cultes & Rendez-vous Hebdomadaires',
    position: 4,
    isVisible: true,
    title: 'Nos Rendez-vous Spirituels',
    subtitle: 'Venez célébrer, louer et grandir dans la présence du Seigneur',
    items: [],
  },
  {
    id: 'sec-verse',
    key: 'verse',
    name: 'Verset du Jour & Parole Inspirée',
    position: 5,
    isVisible: true,
    title: 'La Parole Vivante d’Aujourd’hui',
    subtitle: 'Une nourriture spirituelle quotidienne calculée selon l’heure de Sangmelima (Africa/Douala)',
  },
  {
    id: 'sec-testimonials',
    key: 'testimonials',
    name: 'Témoignages & Actions de Grâce',
    position: 6,
    isVisible: true,
    title: 'Ce que le Seigneur a Fait',
    subtitle: 'Des miracles réels et des vies transformées au milieu de nous',
    primaryButtonText: 'Déposer mon témoignage',
    primaryButtonLink: '/testimonials/new',
  },
  {
    id: 'sec-media',
    key: 'media',
    name: 'Médiathèque & Ressources Gratuites',
    position: 7,
    isVisible: true,
    title: 'Médiathèque Spirituelle',
    subtitle: 'Photos et vidéos des cultes et moments forts',
    primaryButtonText: 'Accéder à la médiathèque',
    primaryButtonLink: '/media-gallery',
  },
  {
    id: 'sec-cta',
    key: 'cta',
    name: 'Appel à l’Action (Rejoignez-nous)',
    position: 8,
    isVisible: true,
    title: 'Vous cherchez une famille spirituelle à Sangmelima ?',
    subtitle: 'Les portes de l’Église Missionnaire de la Foi vous sont grandes ouvertes.',
    content: 'Que vous soyez de passage, nouvellement installé à Sangmelima ou en quête de paix intérieure, vous trouverez chez nous une chaleureuse bienvenue fraternelle.',
    primaryButtonText: 'Rejoindre la communauté',
    primaryButtonLink: '/register',
    secondaryButtonText: 'Parler à un pasteur',
    secondaryButtonLink: 'tel:+237699112233',
  },
  {
    id: 'sec-footer',
    key: 'footer',
    name: 'Pied de page (Footer)',
    position: 9,
    isVisible: true,
    title: 'EMF SMART — Église Missionnaire de la Foi de Sangmelima',
    subtitle: 'Quartier Akon, Sangmelima, Région du Sud, Cameroun',
    content: '© 2026 Église Missionnaire de la Foi de Sangmelima. Tous droits réservés.',
  },
];

export const INITIAL_CMS_STATE: HomepageCMSState = {
  draftSections: JSON.parse(JSON.stringify(INITIAL_HOMEPAGE_SECTIONS)),
  publishedSections: JSON.parse(JSON.stringify(INITIAL_HOMEPAGE_SECTIONS)),
  revisions: [],
  lastPublishedAt: new Date().toISOString(),
  lastDraftSavedAt: new Date().toISOString(),
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_BACKUPS: BackupRecord[] = [];
export const INITIAL_PRAYER_REQUESTS: PrayerRequest[] = [];
export const INITIAL_DEPARTMENTS: Department[] = [];
export const INITIAL_ASSOCIATED_CHURCHES: AssociatedChurch[] = [];
export const INITIAL_HOME_CELLS: HomeCell[] = [];
export const INITIAL_MINISTRY_ADHESIONS: MinistryAdhesionRequest[] = [];
export const INITIAL_CAROUSEL_SLIDES: HomepageCarouselSlide[] = [];

export const INITIAL_LATEST_SERVICE_MEDIA: LatestServiceMedia = {
  id: 'media-latest-default',
  serviceTitle: '',
  serviceDate: '',
  preacherName: '',
  themePassage: '',
  summary: '',
  photos: [],
  videos: [],
  updatedAt: '2026-01-01T00:00:00Z',
};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_RESOURCES: ChurchResource[] = [];
export const INITIAL_WEEKLY_PROGRAMS: WeeklyProgram[] = [];
