import { PrayerRequest } from '../types';

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';

export interface PrayerAlertEvent {
  id: string;
  prayer: PrayerRequest;
  timestamp: string;
  source: 'websocket' | 'broadcast_channel' | 'local';
}

type NewPrayerListener = (event: PrayerAlertEvent) => void;
type IntercessionListener = (data: { prayerId: string; count: number }) => void;
type StatusListener = (status: RealtimeStatus) => void;

class PrayerRealtimeService {
  private socket: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private newPrayerListeners = new Set<NewPrayerListener>();
  private intercessionListeners = new Set<IntercessionListener>();
  private statusListeners = new Set<StatusListener>();

  private processedEventIds = new Set<string>();
  private status: RealtimeStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private isDestroyed = false;

  private soundEnabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Load sound preference from localStorage
    try {
      const stored = localStorage.getItem('emf_prayer_sound_enabled');
      this.soundEnabled = stored !== null ? stored === 'true' : true;
    } catch {
      this.soundEnabled = true;
    }

    // Initialize cross-tab BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('emf_prayer_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingRawEvent(event.data, 'broadcast_channel');
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      this.connectWebSocket();
    }
  }

  // --- WebSocket Connection Handling ---

  private connectWebSocket() {
    if (this.isDestroyed || typeof window === 'undefined') return;

    this.setStatus('connecting');

    try {
      const loc = window.location;
      const isHttps = loc.protocol === 'https:';
      const proto = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${loc.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startPing();
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.handleIncomingRawEvent(parsed, 'websocket');
        } catch (e) {
          console.warn('Failed to parse WebSocket message:', e);
        }
      };

      this.socket.onerror = (err) => {
        // Silently handle websocket transport errors (reconnect logic will take over)
      };

      this.socket.onclose = () => {
        this.stopPing();
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    } catch (err) {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 12000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private setStatus(newStatus: RealtimeStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => listener(newStatus));
    }
  }

  // --- Raw Event Handler & Deduplication ---

  private handleIncomingRawEvent(data: any, source: 'websocket' | 'broadcast_channel' | 'local') {
    if (!data || !data.type) return;

    if (data.type === 'prayer:new' && data.payload) {
      const prayer = data.payload as PrayerRequest;
      const eventKey = `prayer_new_${prayer.id}`;

      // Deduplication guard: ignore if already handled
      if (this.processedEventIds.has(eventKey)) return;
      this.processedEventIds.add(eventKey);

      // Keep set bounded
      if (this.processedEventIds.size > 200) {
        const first = this.processedEventIds.values().next().value;
        if (first) this.processedEventIds.delete(first);
      }

      const alertEvent: PrayerAlertEvent = {
        id: eventKey,
        prayer,
        timestamp: data.timestamp || new Date().toISOString(),
        source,
      };

      // Play soft spiritual chime
      this.playPrayerAlertSound();

      // Show native desktop notification if user allowed
      this.showDesktopNotification(prayer);

      // Notify all active in-page listeners
      this.newPrayerListeners.forEach((fn) => fn(alertEvent));

      // Also forward to other browser tabs if received from websocket
      if (source === 'websocket' && this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(data);
        } catch {}
      }
    } else if (data.type === 'prayer:interceded' && data.payload) {
      const { prayerId, count } = data.payload;
      this.intercessionListeners.forEach((fn) => fn({ prayerId, count }));
    }
  }

  // --- Public Broadcasting Methods ---

  public broadcastPrayerCreated(prayer: PrayerRequest): void {
    const eventKey = `prayer_new_${prayer.id}`;
    this.processedEventIds.add(eventKey);

    const message = {
      type: 'prayer:new',
      payload: prayer,
      timestamp: new Date().toISOString(),
    };

    // 1. Send via WebSocket if open
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (err) {
        console.warn('Failed to send via WebSocket:', err);
      }
    }

    // 2. Broadcast to other browser tabs instantly
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (err) {
        console.warn('Failed to broadcast via channel:', err);
      }
    }

    // 3. Fallback: post to server API if available
    try {
      fetch('/api/realtime/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }).catch(() => {});
    } catch {}
  }

  public broadcastIntercession(prayerId: string, count: number): void {
    const message = {
      type: 'prayer:interceded',
      payload: { prayerId, count },
      timestamp: new Date().toISOString(),
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch {}
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch {}
    }
  }

  // --- Subscriptions ---

  public onNewPrayer(listener: NewPrayerListener): () => void {
    this.newPrayerListeners.add(listener);
    return () => {
      this.newPrayerListeners.delete(listener);
    };
  }

  public onIntercession(listener: IntercessionListener): () => void {
    this.intercessionListeners.add(listener);
    return () => {
      this.intercessionListeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getStatus(): RealtimeStatus {
    return this.status;
  }

  // --- Sound & Audio Feedback (Spiritual Chime) ---

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('emf_prayer_sound_enabled', String(enabled));
    } catch {}
  }

  public playPrayerAlertSound(): void {
    if (!this.soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Play angelic 3-tone peaceful bell chime: E5 (659Hz) -> G#5 (830Hz) -> B5 (987Hz)
      const notes = [659.25, 830.61, 987.77];

      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        // Exponential decay envelope for celestial bell ring
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.25);
      });
    } catch (e) {
      // Audio playback fails gracefully if browser restricts autoplay
    }
  }

  // --- Browser Desktop Notifications ---

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  public showDesktopNotification(prayer: PrayerRequest): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const authorText = prayer.isAnonymous ? 'Fidèle Anonyme' : prayer.authorName;
      new Notification('Nouvelle Requête de Prière — EMF Sangmelima', {
        body: `${authorText} a déposé une requête [${prayer.category}] : « ${prayer.title} »`,
        icon: '/favicon.ico',
        tag: `prayer-${prayer.id}`,
      });
    } catch (e) {
      // Ignore notification display failures
    }
  }

  // --- Simulation / Demo Tool for Testing ---

  public triggerTestSimulation(): PrayerAlertEvent {
    const testPrayers: Partial<PrayerRequest>[] = [
      {
        id: 'test-pr-' + Date.now(),
        title: 'Action de grâce pour la guérison de notre fils Samuel',
        description:
          'Le Seigneur a opéré un miracle puissant à l’hôpital de district de Sangmelima. Prions ensemble en action de grâce pour sa restauration complète !',
        category: 'Santé & Guérison',
        authorName: 'Maman Christine (Quartier Monavebe)',
        isAnonymous: false,
        isConfidentialPastoralOnly: false,
        status: 'EN_PRIERE',
        prayerCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'test-pr-' + (Date.now() + 1),
        title: 'Intercession pour la jeunesse et les examens officiels',
        description:
          'Que la sagesse d’en haut remplisse nos élèves et étudiants pour les concours d’entrée aux grandes écoles et le Baccalauréat.',
        category: 'Études & Concours',
        authorName: 'Frère Emmanuel (JEMF)',
        isAnonymous: false,
        isConfidentialPastoralOnly: false,
        status: 'EN_PRIERE',
        prayerCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'test-pr-' + (Date.now() + 2),
        title: 'Besoin urgent de paix et réconciliation dans la belle-famille',
        description:
          'Situation tendue dans le foyer, nous demandons l’intervention de la grâce divine pour briser les divisions.',
        category: 'Famille & Foyer',
        authorName: 'Fidèle Anonyme',
        isAnonymous: true,
        isConfidentialPastoralOnly: false,
        status: 'EN_PRIERE',
        prayerCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const randomSample = testPrayers[Math.floor(Math.random() * testPrayers.length)] as PrayerRequest;

    const event: PrayerAlertEvent = {
      id: `prayer_new_${randomSample.id}`,
      prayer: randomSample,
      timestamp: new Date().toISOString(),
      source: 'local',
    };

    this.handleIncomingRawEvent(
      {
        type: 'prayer:new',
        payload: randomSample,
        timestamp: event.timestamp,
      },
      'local'
    );

    return event;
  }
}

export const prayerRealtimeService = new PrayerRealtimeService();
