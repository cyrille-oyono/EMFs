import { Storage } from '../server/storage';
import {
  User,
  Member,
  Family,
  Ministry,
  AttendanceSession,
  AttendanceRecord,
  Transaction,
  Event,
  Announcement,
  Testimonial,
  ForumTopic,
  ForumPost,
  DailyBibleVerse,
  MediaItem,
  SystemSettings,
  HomepageSection,
  HomepageCMSState,
  AuditLog,
  BackupRecord,
  PrayerRequest,
  Role,
  Department,
  AssociatedChurch,
  HomeCell,
  MinistryAdhesionRequest,
  HomepageCarouselSlide,
  LatestServiceMedia,
  ServiceMediaPhoto,
  ServiceMediaVideo,
  AppNotification,
  NotificationCategory,
  TreasurySettings,
  ChurchResource,
  WeeklyProgram,
  DynamicPost,
  AppContentRecord,
} from '../types';
import { churchSyncService } from './churchSyncService';
import {
  isSupabaseConfigured,
  getChurchSettingsFromSupabase,
  saveChurchSettingsToSupabase,
  getLatestServiceMediaFromSupabase,
  saveLatestServiceMediaToSupabase,
  getCMSStateFromSupabase,
  saveCMSStateToSupabase,
  subscribeToCMSState,
  SupabaseCMSPayload,
  getRandomVerseFromSupabase,
  getVersesFromSupabase,
  addVerseToSupabase,
  seedDefaultVersesToSupabase,
  SupabaseVerse,
  saveAppContent,
  getAppContent,
  getAllAppContent,
  subscribeToAppContent,
  getDynamicPosts,
  createDynamicPost,
  updateDynamicPost,
  deleteDynamicPost,
  subscribeToDynamicPosts,
  APP_CONTENT_TABLE,
  DYNAMIC_POSTS_TABLE,
} from './supabase';

export const apiClient = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const user = Storage.authenticateUser(email, password);
    if (!user) {
      return { success: false, error: 'Identifiants invalides. Veuillez vérifier votre adresse email et mot de passe.' };
    }
    return { success: true, user };
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: Role;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    return Storage.registerUser(data);
  },

  async getCurrentSettings(): Promise<SystemSettings> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await getChurchSettingsFromSupabase();
        if (remote) {
          Storage.updateSettings(remote);
          return remote;
        }
      } catch (err) {
        console.warn('Erreur de chargement des paramètres depuis Supabase:', err);
      }
    }
    return Storage.getSettings();
  },

  async updateSettings(settings: Partial<SystemSettings>, user?: User): Promise<SystemSettings> {
    const res = Storage.updateSettings(settings, user);
    
    // Synchronisation directe avec Supabase pour tous les utilisateurs
    if (isSupabaseConfigured()) {
      try {
        await saveChurchSettingsToSupabase(res);
      } catch (err) {
        console.error('Erreur lors de la sauvegarde dans Supabase:', err);
      }
    }

    churchSyncService.broadcastSettingsUpdated(res);
    return res;
  },

  // Members
  async getMembers(): Promise<Member[]> {
    return Storage.getMembers();
  },

  async createMember(data: any, user?: User): Promise<Member> {
    return Storage.createMember(data, user);
  },

  async submitCommunityAdhesion(data: any): Promise<{ success: boolean; member: Member; message: string }> {
    return Storage.submitCommunityAdhesion(data);
  },

  async updateMember(id: string, data: Partial<Member>, user?: User): Promise<Member | null> {
    return Storage.updateMember(id, data, user);
  },

  async deleteMember(id: string, user?: User): Promise<boolean> {
    return Storage.deleteMember(id, user);
  },

  // Families
  async getFamilies(): Promise<Family[]> {
    return Storage.getFamilies();
  },

  async createFamily(data: any, user?: User): Promise<Family> {
    return Storage.createFamily(data, user);
  },

  async updateFamily(id: string, data: Partial<Family>, user?: User): Promise<Family | null> {
    return Storage.updateFamily(id, data, user);
  },

  async deleteFamily(id: string, user?: User): Promise<boolean> {
    return Storage.deleteFamily(id, user);
  },

  // Ministries
  async getMinistries(): Promise<Ministry[]> {
    return Storage.getMinistries();
  },

  async createMinistry(data: any, user?: User): Promise<Ministry> {
    return Storage.createMinistry(data, user);
  },

  async updateMinistry(id: string, data: Partial<Ministry>, user?: User): Promise<Ministry | null> {
    return Storage.updateMinistry(id, data, user);
  },

  async deleteMinistry(id: string, user?: User): Promise<boolean> {
    return Storage.deleteMinistry(id, user);
  },

  // Attendance
  async getAttendanceSessions(): Promise<AttendanceSession[]> {
    return Storage.getAttendanceSessions();
  },

  async createAttendanceSession(data: any, user?: User): Promise<AttendanceSession> {
    return Storage.createAttendanceSession(data, user);
  },

  async getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    return Storage.getAttendanceRecords(sessionId);
  },

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return Storage.getAllAttendanceRecords();
  },

  async saveAttendanceRecords(sessionId: string, records: AttendanceRecord[], user?: User): Promise<void> {
    return Storage.saveAttendanceRecords(sessionId, records, user);
  },

  // Finances
  async getTransactions(): Promise<Transaction[]> {
    return Storage.getTransactions();
  },

  async getTransactionCategories() {
    return Storage.getTransactionCategories();
  },

  async createTransaction(data: any, user?: User): Promise<Transaction> {
    return Storage.createTransaction(data, user);
  },

  async deleteTransaction(id: string, user?: User): Promise<boolean> {
    return Storage.deleteTransaction(id, user);
  },

  async getFinancialsSummary() {
    return Storage.getFinancialsSummary();
  },

  // Events
  async getEvents(): Promise<Event[]> {
    return Storage.getEvents();
  },

  async createEvent(data: any, user?: User): Promise<Event> {
    const res = Storage.createEvent(data, user);
    churchSyncService.broadcastAgendaUpdated({ message: `Événement créé : ${res.title}` });
    return res;
  },

  async updateEvent(id: string, data: Partial<Event>, user?: User): Promise<Event | null> {
    const res = Storage.updateEvent(id, data, user);
    churchSyncService.broadcastAgendaUpdated({ message: 'Événement mis à jour' });
    return res;
  },

  async deleteEvent(id: string, user?: User): Promise<boolean> {
    const res = Storage.deleteEvent(id, user);
    churchSyncService.broadcastAgendaUpdated({ message: 'Événement supprimé' });
    return res;
  },

  // Communications & Publications Dynamiques (Table Supabase dynamic_posts)
  async getAnnouncements(): Promise<Announcement[]> {
    if (isSupabaseConfigured()) {
      try {
        const posts = await getDynamicPosts({ publishedOnly: false });
        if (posts && posts.length > 0) {
          const converted: Announcement[] = posts.map((p) => ({
            id: p.id,
            title: p.title,
            content: p.body || '',
            summary: p.metadata?.summary || (p.body ? p.body.substring(0, 160) + '...' : ''),
            category: p.category,
            imageUrl: p.media_url || undefined,
            isPublicWeb: p.is_published,
            targetAudience: p.metadata?.targetAudience || 'TOUS',
            status: p.is_published ? 'PUBLIÉ' : 'BROUILLON',
            publishDate: p.created_at ? p.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
            createdAt: p.created_at || new Date().toISOString(),
            authorName: p.author || 'Bureau Pastoral',
            viewCount: p.metadata?.viewCount || 1,
          }));
          Storage.setAnnouncements(converted);
          return converted;
        }
      } catch (err) {
        console.warn('Erreur chargement dynamic_posts depuis Supabase:', err);
      }
    }
    return Storage.getAnnouncements();
  },

  async createAnnouncement(data: any, user?: User): Promise<Announcement> {
    const local = Storage.createAnnouncement(data, user);
    if (isSupabaseConfigured()) {
      try {
        const author = user ? `${user.firstName} ${user.lastName}` : (data.authorName || 'Bureau Pastoral');
        const res = await createDynamicPost({
          category: data.category || 'ANNONCE',
          title: data.title,
          body: data.content || data.body || '',
          media_url: data.imageUrl || data.media_url || null,
          author,
          is_published: data.status !== 'BROUILLON',
          metadata: {
            summary: data.summary,
            targetAudience: data.targetAudience || 'TOUS',
            isPublicWeb: data.isPublicWeb !== false,
            localId: local.id,
          },
        });
        if (res.data) {
          const ann: Announcement = {
            id: res.data.id,
            title: res.data.title,
            content: res.data.body || '',
            summary: res.data.metadata?.summary || data.summary,
            category: res.data.category,
            imageUrl: res.data.media_url || undefined,
            isPublicWeb: res.data.is_published,
            targetAudience: res.data.metadata?.targetAudience || 'TOUS',
            status: res.data.is_published ? 'PUBLIÉ' : 'BROUILLON',
            publishDate: res.data.created_at ? res.data.created_at.substring(0, 10) : new Date().toISOString().substring(0, 10),
            createdAt: res.data.created_at || new Date().toISOString(),
            authorName: res.data.author || author,
            viewCount: 1,
          };
          Storage.updateAnnouncement(local.id, ann);
          churchSyncService.broadcastAgendaUpdated({ message: `Nouvelle publication : ${data.title}` });
          return ann;
        }
      } catch (err) {
        console.error('Erreur createAnnouncement dans dynamic_posts:', err);
      }
    }
    churchSyncService.broadcastAgendaUpdated({ message: `Nouvelle publication : ${data.title}` });
    return local;
  },

  async deleteAnnouncement(id: string, user?: User): Promise<boolean> {
    const res = Storage.deleteAnnouncement(id, user);
    if (isSupabaseConfigured()) {
      try {
        await deleteDynamicPost(id);
      } catch (err) {
        console.error('Erreur deleteAnnouncement dans dynamic_posts:', err);
      }
    }
    churchSyncService.broadcastAgendaUpdated({ message: 'Publication supprimée' });
    return res;
  },

  // Dynamic Posts (Méthodes directes pour la table dynamic_posts)
  async getDynamicPosts(options?: { category?: string; publishedOnly?: boolean; limit?: number }): Promise<DynamicPost[]> {
    return getDynamicPosts(options);
  },

  async createDynamicPost(post: {
    category: string;
    title: string;
    body?: string | null;
    media_url?: string | null;
    author?: string;
    is_published?: boolean;
    metadata?: any;
  }): Promise<{ success: boolean; data?: DynamicPost; error?: string }> {
    return createDynamicPost(post);
  },

  async updateDynamicPost(id: string, updates: Partial<DynamicPost>): Promise<{ success: boolean; data?: DynamicPost; error?: string }> {
    return updateDynamicPost(id, updates);
  },

  async deleteDynamicPost(id: string): Promise<{ success: boolean; error?: string }> {
    return deleteDynamicPost(id);
  },

  // App Content (Méthodes directes pour la table app_content)
  async saveAppContent(sectionKey: string, contentData: any): Promise<{ success: boolean; error?: string }> {
    return saveAppContent(sectionKey, contentData);
  },

  async getAppContent<T = any>(sectionKey: string): Promise<T | null> {
    return getAppContent<T>(sectionKey);
  },

  async getAllAppContent(): Promise<Record<string, any>> {
    return getAllAppContent();
  },

  // Testimonials
  async getTestimonials(onlyValidated = false): Promise<Testimonial[]> {
    return Storage.getTestimonials(onlyValidated);
  },

  async submitTestimonial(data: any, user?: User): Promise<Testimonial> {
    return Storage.submitTestimonial(data, user);
  },

  async moderateTestimonial(
    id: string,
    status: 'VALIDÉ' | 'REJETÉ' | 'MASQUÉ',
    reason?: string,
    user?: User
  ): Promise<Testimonial | null> {
    return Storage.moderateTestimonial(id, status, reason, user);
  },

  // Forum
  async getForumCategories() {
    return Storage.getForumCategories();
  },

  async getForumTopics(categoryId?: string): Promise<ForumTopic[]> {
    return Storage.getForumTopics(categoryId);
  },

  async getForumPosts(topicId: string): Promise<ForumPost[]> {
    return Storage.getForumPosts(topicId);
  },

  async createForumTopic(categoryId: string, title: string, content: string, user: User) {
    return Storage.createForumTopic(categoryId, title, content, user);
  },

  async createForumPost(topicId: string, content: string, user: User) {
    return Storage.createForumPost(topicId, content, user);
  },

  async reportForumPost(postId: string, reason: string, user: User) {
    return Storage.reportForumPost(postId, reason, user);
  },

  async getForumReports() {
    return Storage.getForumReports();
  },

  // Verses
  async getDailyVerses(): Promise<DailyBibleVerse[]> {
    return Storage.getDailyVerses();
  },

  async getTodayVerse(): Promise<DailyBibleVerse | undefined> {
    return Storage.getTodayVerse();
  },

  async getRandomSupabaseVerse(): Promise<SupabaseVerse> {
    return getRandomVerseFromSupabase();
  },

  async getSupabaseVerses(): Promise<SupabaseVerse[]> {
    return getVersesFromSupabase();
  },

  async addSupabaseVerse(verse: {
    reference: string;
    text: string;
    translation?: string;
    theme?: string;
    meditation?: string;
    prayer?: string;
  }): Promise<{ success: boolean; data?: SupabaseVerse; error?: string }> {
    return addVerseToSupabase(verse);
  },

  async seedSupabaseVerses(): Promise<{ success: boolean; count: number; error?: string }> {
    return seedDefaultVersesToSupabase();
  },

  async createDailyVerse(data: any, user?: User): Promise<DailyBibleVerse> {
    return Storage.createDailyVerse(data, user);
  },

  // Media
  async getMediaItems(): Promise<MediaItem[]> {
    return Storage.getMediaItems();
  },

  async createMediaItem(data: any, user?: User): Promise<MediaItem> {
    return Storage.createMediaItem(data, user);
  },

  async deleteMediaItem(id: string, user?: User): Promise<boolean> {
    return Storage.deleteMediaItem(id, user);
  },

  // Parakletos
  async getParakletosState() {
    return Storage.getParakletosState();
  },

  async updateParakletosInfo(infoUpdates: any, user?: User) {
    return Storage.updateParakletosInfo(infoUpdates, user);
  },

  async createParakletosClass(data: any, user?: User) {
    return Storage.createParakletosClass(data, user);
  },

  async updateParakletosClass(id: string, updates: any, user?: User) {
    return Storage.updateParakletosClass(id, updates, user);
  },

  async deleteParakletosClass(id: string, user?: User) {
    return Storage.deleteParakletosClass(id, user);
  },

  async createParakletosSubject(data: any, user?: User) {
    return Storage.createParakletosSubject(data, user);
  },

  async updateParakletosSubject(id: string, updates: any, user?: User) {
    return Storage.updateParakletosSubject(id, updates, user);
  },

  async deleteParakletosSubject(id: string, user?: User) {
    return Storage.deleteParakletosSubject(id, user);
  },

  async createParakletosTeacher(data: any, user?: User) {
    return Storage.createParakletosTeacher(data, user);
  },

  async updateParakletosTeacher(id: string, updates: any, user?: User) {
    return Storage.updateParakletosTeacher(id, updates, user);
  },

  async deleteParakletosTeacher(id: string, user?: User) {
    return Storage.deleteParakletosTeacher(id, user);
  },

  async createParakletosAdmission(data: any, user?: User) {
    return Storage.createParakletosAdmission(data, user);
  },

  async updateParakletosAdmissionStatus(id: string, status: any, reviewNotes?: string, user?: User) {
    return Storage.updateParakletosAdmissionStatus(id, status, reviewNotes, user);
  },

  async verifyParakletosAccessCode(code: string) {
    return Storage.verifyParakletosAccessCode(code);
  },

  async createParakletosStudent(data: any, user?: User) {
    return Storage.createParakletosStudent(data, user);
  },

  async recordParakletosGrade(data: any, user?: User) {
    return Storage.recordParakletosGrade(data, user);
  },

  // CMS & Page Content Synchronizer
  async syncFullCMSToSupabase(currentUser?: User): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase n’est pas configuré' };
    }
    try {
      const cmsState = Storage.getCMSState();
      const carouselSlides = Storage.getCarouselSlides();
      const weeklyPrograms = Storage.getWeeklyPrograms();
      const payload: SupabaseCMSPayload = {
        cmsState,
        carouselSlides,
        weeklyPrograms,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : undefined,
      };
      const res = await saveCMSStateToSupabase(payload);
      churchSyncService.broadcastCmsUpdated();
      return res;
    } catch (err: any) {
      console.error('Erreur syncFullCMSToSupabase:', err);
      return { success: false, error: err?.message || 'Erreur lors de la synchronisation' };
    }
  },

  async getCMSState(): Promise<HomepageCMSState> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await getCMSStateFromSupabase();
        if (remote?.cmsState) {
          Storage.setCMSState(remote.cmsState);
          if (remote.carouselSlides) Storage.setCarouselSlides(remote.carouselSlides);
          if (remote.weeklyPrograms) Storage.setWeeklyPrograms(remote.weeklyPrograms);
          return Storage.getCMSState();
        }
      } catch (err) {
        console.warn('Erreur chargement CMS depuis Supabase:', err);
      }
    }
    return Storage.getCMSState();
  },

  async getPublicHomepageSections(): Promise<HomepageSection[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await getCMSStateFromSupabase();
        if (remote?.cmsState?.publishedSections) {
          Storage.setCMSState(remote.cmsState);
          if (remote.carouselSlides) Storage.setCarouselSlides(remote.carouselSlides);
          if (remote.weeklyPrograms) Storage.setWeeklyPrograms(remote.weeklyPrograms);
          return Storage.getPublicHomepageSections();
        }
      } catch (err) {
        console.warn('Erreur chargement sections publiques depuis Supabase:', err);
      }
    }
    return Storage.getPublicHomepageSections();
  },

  async saveDraftSections(sections: HomepageSection[], user?: User): Promise<HomepageCMSState> {
    const res = Storage.saveDraftSections(sections, user);
    if (isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur sauvegarde brouillon dans Supabase:', err);
      }
    }
    return res;
  },

  async publishCMS(user: User): Promise<HomepageCMSState> {
    const res = Storage.publishCMS(user);
    if (isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.error('Erreur publication CMS dans Supabase:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    return res;
  },

  async restoreCMSRevision(revisionId: string, user: User): Promise<HomepageCMSState | null> {
    const res = Storage.restoreCMSRevision(revisionId, user);
    if (res && isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.error('Erreur restauration CMS dans Supabase:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    return res;
  },

  async quickUpdateHomepage(updates: any, user?: User): Promise<HomepageCMSState> {
    const res = Storage.quickUpdateHomepage(updates, user);
    if (isSupabaseConfigured()) {
      try {
        await Promise.all([
          saveChurchSettingsToSupabase(Storage.getSettings()),
          apiClient.syncFullCMSToSupabase(user),
        ]);
      } catch (err) {
        console.error('Erreur Supabase homepage settings:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    churchSyncService.broadcastSettingsUpdated(Storage.getSettings());
    return res;
  },

  async updatePresentationImage(imageUrl: string, user?: User): Promise<HomepageCMSState> {
    const res = Storage.updatePresentationImage(imageUrl, user);
    if (isSupabaseConfigured()) {
      try {
        await Promise.all([
          saveChurchSettingsToSupabase(Storage.getSettings()),
          apiClient.syncFullCMSToSupabase(user),
        ]);
      } catch (err) {
        console.error('Erreur Supabase presentation image:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    return res;
  },

  // Users
  async getUsers(): Promise<User[]> {
    return Storage.getUsers();
  },

  async getUsersWithCredentials(): Promise<(User & { currentPassword?: string })[]> {
    return Storage.getUsersWithCredentials();
  },

  async updateUserPassword(
    userId: string,
    newPassword: string,
    newEmail?: string,
    user?: User
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    return Storage.updateUserPassword(userId, newPassword, newEmail, user);
  },

  async createUser(data: Partial<User>, user?: User): Promise<User> {
    return Storage.createUser(data, user);
  },

  async updateUser(id: string, data: Partial<User>, user?: User): Promise<User | null> {
    return Storage.updateUser(id, data, user);
  },

  // Audits
  async getAuditLogs(): Promise<AuditLog[]> {
    return Storage.getAuditLogs();
  },

  // Backups
  async getBackups(): Promise<BackupRecord[]> {
    return Storage.getBackups();
  },

  async createBackup(type: 'MANUELLE' | 'AUTOMATIQUE', user?: User): Promise<BackupRecord> {
    return Storage.createBackup(type, user);
  },

  async downloadBackupJson(): Promise<string> {
    return JSON.stringify(Storage.getSnapshot(), null, 2);
  },

  // Prayer Requests
  async getPrayerRequests(includeConfidential = false, userRole?: Role): Promise<PrayerRequest[]> {
    return Storage.getPrayerRequests(includeConfidential, userRole);
  },

  async createPrayerRequest(
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
    user?: User
  ): Promise<PrayerRequest> {
    return Storage.createPrayerRequest(data, user);
  },

  async updatePrayerRequestStatus(
    id: string,
    status: PrayerRequest['status'],
    user?: User
  ): Promise<PrayerRequest | null> {
    return Storage.updatePrayerRequestStatus(id, status, user);
  },

  async incrementPrayerCount(id: string): Promise<PrayerRequest | null> {
    return Storage.incrementPrayerCount(id);
  },

  async addPrayerTestimony(id: string, testimony: string, user?: User): Promise<PrayerRequest | null> {
    return Storage.addPrayerTestimony(id, testimony, user);
  },

  async deletePrayerRequest(id: string, user?: User): Promise<boolean> {
    return Storage.deletePrayerRequest(id, user);
  },

  // Associated Churches
  async getAssociatedChurches(): Promise<AssociatedChurch[]> {
    return Storage.getAssociatedChurches();
  },

  async createAssociatedChurch(
    data: Omit<AssociatedChurch, 'id' | 'createdAt' | 'updatedAt'>,
    user?: User
  ): Promise<AssociatedChurch> {
    return Storage.createAssociatedChurch(data, user);
  },

  async updateAssociatedChurch(
    id: string,
    updates: Partial<AssociatedChurch>,
    user?: User
  ): Promise<AssociatedChurch | null> {
    return Storage.updateAssociatedChurch(id, updates, user);
  },

  async deleteAssociatedChurch(id: string, user?: User): Promise<boolean> {
    return Storage.deleteAssociatedChurch(id, user);
  },

  // Home Cells
  async getHomeCells(): Promise<HomeCell[]> {
    return Storage.getHomeCells();
  },

  async createHomeCell(
    data: Omit<HomeCell, 'id' | 'createdAt' | 'updatedAt'>,
    user?: User
  ): Promise<HomeCell> {
    return Storage.createHomeCell(data, user);
  },

  async updateHomeCell(
    id: string,
    updates: Partial<HomeCell>,
    user?: User
  ): Promise<HomeCell | null> {
    return Storage.updateHomeCell(id, updates, user);
  },

  async deleteHomeCell(id: string, user?: User): Promise<boolean> {
    return Storage.deleteHomeCell(id, user);
  },

  // Departments
  async getDepartments(ministryId?: string): Promise<Department[]> {
    return Storage.getDepartments(ministryId);
  },

  async createDepartment(
    data: Omit<Department, 'id' | 'createdAt'>,
    user?: User
  ): Promise<Department> {
    return Storage.createDepartment(data, user);
  },

  async updateDepartment(
    id: string,
    updates: Partial<Department>,
    user?: User
  ): Promise<Department | null> {
    return Storage.updateDepartment(id, updates, user);
  },

  async deleteDepartment(id: string, user?: User): Promise<boolean> {
    return Storage.deleteDepartment(id, user);
  },

  // Ministry Adhesions
  async getMinistryAdhesions(ministryId?: string): Promise<MinistryAdhesionRequest[]> {
    return Storage.getMinistryAdhesions(ministryId);
  },

  async createMinistryAdhesion(
    data: Omit<MinistryAdhesionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
    user?: User
  ): Promise<MinistryAdhesionRequest> {
    return Storage.createMinistryAdhesion(data, user);
  },

  async updateMinistryAdhesionStatus(
    id: string,
    status: MinistryAdhesionRequest['status'],
    reviewNotes?: string,
    user?: User
  ): Promise<MinistryAdhesionRequest | null> {
    return Storage.updateMinistryAdhesionStatus(id, status, reviewNotes, user);
  },

  async deleteMinistryAdhesion(id: string, user?: User): Promise<boolean> {
    return Storage.deleteMinistryAdhesion(id, user);
  },

  // Carousel
  async getCarouselSlides(): Promise<HomepageCarouselSlide[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await getCMSStateFromSupabase();
        if (remote?.carouselSlides && remote.carouselSlides.length > 0) {
          Storage.setCarouselSlides(remote.carouselSlides);
          return Storage.getCarouselSlides();
        }
      } catch (err) {
        // ignore
      }
    }
    return Storage.getCarouselSlides();
  },

  async createCarouselSlide(
    data: Omit<HomepageCarouselSlide, 'id'>,
    user?: User
  ): Promise<HomepageCarouselSlide> {
    const res = Storage.createCarouselSlide(data, user);
    if (isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase createCarouselSlide:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    return res;
  },

  async updateCarouselSlide(
    id: string,
    updates: Partial<HomepageCarouselSlide>,
    user?: User
  ): Promise<HomepageCarouselSlide | null> {
    const res = Storage.updateCarouselSlide(id, updates, user);
    if (res && isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase updateCarouselSlide:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    return res;
  },

  async deleteCarouselSlide(id: string, user?: User): Promise<boolean> {
    const res = Storage.deleteCarouselSlide(id, user);
    if (res && isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase deleteCarouselSlide:', err);
      }
    }
    churchSyncService.broadcastCmsUpdated();
    return res;
  },

  // Latest Service Media (Photos & Videos)
  async getLatestServiceMedia(): Promise<LatestServiceMedia> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await getLatestServiceMediaFromSupabase();
        if (remote) {
          Storage.updateLatestServiceMedia(remote);
          return remote;
        }
      } catch (err) {
        console.warn('Erreur lecture média Supabase:', err);
      }
    }
    return Storage.getLatestServiceMedia();
  },

  async updateLatestServiceMedia(
    updates: Partial<LatestServiceMedia>,
    user?: User
  ): Promise<LatestServiceMedia> {
    const res = Storage.updateLatestServiceMedia(updates, user);
    if (isSupabaseConfigured()) {
      try {
        await saveLatestServiceMediaToSupabase(Storage.getLatestServiceMedia());
      } catch (err) {
        console.warn('Erreur synchro média Supabase:', err);
      }
    }
    churchSyncService.broadcastMediaUpdated(res);
    return res;
  },

  async addServicePhoto(
    photo: Omit<ServiceMediaPhoto, 'id' | 'createdAt'>,
    user?: User
  ): Promise<LatestServiceMedia> {
    const res = Storage.addServicePhoto(photo, user);
    if (isSupabaseConfigured()) {
      try {
        await saveLatestServiceMediaToSupabase(Storage.getLatestServiceMedia());
      } catch (err) {
        console.warn('Erreur synchro photo Supabase:', err);
      }
    }
    churchSyncService.broadcastMediaUpdated(res);
    return res;
  },

  async deleteServicePhoto(photoId: string, user?: User): Promise<LatestServiceMedia> {
    const res = Storage.deleteServicePhoto(photoId, user);
    if (isSupabaseConfigured()) {
      try {
        await saveLatestServiceMediaToSupabase(Storage.getLatestServiceMedia());
      } catch (err) {
        console.warn('Erreur synchro suppression photo Supabase:', err);
      }
    }
    churchSyncService.broadcastMediaUpdated(res);
    return res;
  },

  async addServiceVideo(
    video: Omit<ServiceMediaVideo, 'id' | 'createdAt'>,
    user?: User
  ): Promise<LatestServiceMedia> {
    const res = Storage.addServiceVideo(video, user);
    if (isSupabaseConfigured()) {
      try {
        await saveLatestServiceMediaToSupabase(Storage.getLatestServiceMedia());
      } catch (err) {
        console.warn('Erreur synchro vidéo Supabase:', err);
      }
    }
    churchSyncService.broadcastMediaUpdated(res);
    return res;
  },

  async deleteServiceVideo(videoId: string, user?: User): Promise<LatestServiceMedia> {
    const res = Storage.deleteServiceVideo(videoId, user);
    if (isSupabaseConfigured()) {
      try {
        await saveLatestServiceMediaToSupabase(Storage.getLatestServiceMedia());
      } catch (err) {
        console.warn('Erreur synchro suppression vidéo Supabase:', err);
      }
    }
    churchSyncService.broadcastMediaUpdated(res);
    return res;
  },

  // Notifications
  async getNotifications(userId?: string): Promise<(AppNotification & { isRead?: boolean })[]> {
    return Storage.getNotifications(userId);
  },

  async markNotificationAsRead(id: string, userId?: string): Promise<boolean> {
    return Storage.markNotificationAsRead(id, userId);
  },

  async markAllNotificationsAsRead(userId?: string): Promise<boolean> {
    return Storage.markAllNotificationsAsRead(userId);
  },

  async createNotification(data: any, user?: User): Promise<AppNotification> {
    return Storage.createNotification(data, user);
  },

  async deleteNotification(id: string, user?: User): Promise<boolean> {
    return Storage.deleteNotification(id, user);
  },

  // Treasury & Mobile Money / Banking Settings
  async getTreasurySettings(): Promise<TreasurySettings> {
    return Storage.getTreasurySettings();
  },

  async updateTreasurySettings(treasury: TreasurySettings, user?: User): Promise<TreasurySettings> {
    const updated = Storage.updateTreasurySettings(treasury, user);
    if (isSupabaseConfigured()) {
      try {
        const full = Storage.getSettings();
        await saveChurchSettingsToSupabase(full);
      } catch (err) {
        console.error('Erreur Supabase treasury:', err);
      }
    }
    churchSyncService.broadcastSettingsUpdated(Storage.getSettings());
    return updated;
  },

  // Key Leadership Officers (Pasteur, Secrétaire, Trésorier)
  async getKeyOfficers(): Promise<(User & { currentPassword?: string })[]> {
    return Storage.getKeyOfficers();
  },

  async updateKeyOfficer(
    userId: string,
    data: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      password?: string;
      status?: 'ACTIF' | 'INACTIF';
    },
    user?: User
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    return Storage.updateKeyOfficer(userId, data, user);
  },

  // Church Resources (Enseignements & Prières)
  async getResources(): Promise<ChurchResource[]> {
    return Storage.getResources();
  },

  async createResource(
    data: Omit<ChurchResource, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>,
    user?: User
  ): Promise<ChurchResource> {
    return Storage.createResource(data, user);
  },

  async updateResource(
    id: string,
    data: Partial<ChurchResource>,
    user?: User
  ): Promise<ChurchResource | null> {
    return Storage.updateResource(id, data, user);
  },

  async deleteResource(id: string, user?: User): Promise<boolean> {
    return Storage.deleteResource(id, user);
  },

  async incrementResourceDownload(id: string): Promise<ChurchResource | null> {
    return Storage.incrementResourceDownload(id);
  },

  // Weekly Programs (Programmes Hebdomadaires)
  async getWeeklyPrograms(): Promise<WeeklyProgram[]> {
    if (isSupabaseConfigured()) {
      try {
        const remote = await getCMSStateFromSupabase();
        if (remote?.weeklyPrograms && remote.weeklyPrograms.length > 0) {
          Storage.setWeeklyPrograms(remote.weeklyPrograms);
          return Storage.getWeeklyPrograms();
        }
      } catch (err) {
        // ignore
      }
    }
    return Storage.getWeeklyPrograms();
  },

  async createWeeklyProgram(
    data: Omit<WeeklyProgram, 'id' | 'createdAt' | 'updatedAt'>,
    user?: User
  ): Promise<WeeklyProgram> {
    const res = Storage.createWeeklyProgram(data, user);
    if (isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase createWeeklyProgram:', err);
      }
    }
    churchSyncService.broadcastAgendaUpdated({ message: `Programme hebdomadaire créé : ${res.title}` });
    return res;
  },

  async updateWeeklyProgram(
    id: string,
    updates: Partial<WeeklyProgram>,
    user?: User
  ): Promise<WeeklyProgram | null> {
    const res = Storage.updateWeeklyProgram(id, updates, user);
    if (res && isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase updateWeeklyProgram:', err);
      }
    }
    churchSyncService.broadcastAgendaUpdated({ message: 'Programme hebdomadaire mis à jour' });
    return res;
  },

  async deleteWeeklyProgram(id: string, user?: User): Promise<boolean> {
    const res = Storage.deleteWeeklyProgram(id, user);
    if (res && isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase deleteWeeklyProgram:', err);
      }
    }
    churchSyncService.broadcastAgendaUpdated({ message: 'Programme hebdomadaire supprimé' });
    return res;
  },

  async reorderWeeklyPrograms(orderedIds: string[], user?: User): Promise<WeeklyProgram[]> {
    const res = Storage.reorderWeeklyPrograms(orderedIds, user);
    if (res && isSupabaseConfigured()) {
      try {
        await apiClient.syncFullCMSToSupabase(user);
      } catch (err) {
        console.warn('Erreur Supabase reorderWeeklyPrograms:', err);
      }
    }
    churchSyncService.broadcastAgendaUpdated({ message: 'Programmes réorganisés' });
    return res;
  },
};

