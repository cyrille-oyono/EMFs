import { SystemSettings, WeeklyProgram, Event } from '../types';

export type ChurchSyncEventType =
  | 'church:settings_updated'
  | 'church:agenda_updated'
  | 'church:cms_updated'
  | 'church:media_updated';

export interface ChurchSyncEvent {
  type: ChurchSyncEventType;
  payload?: any;
  timestamp: string;
  senderId: string;
}

type SyncListener = (event: ChurchSyncEvent) => void;

class ChurchSyncService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners = new Set<SyncListener>();
  private instanceId: string;
  private socket: WebSocket | null = null;
  private reconnectTimer: any = null;

  constructor() {
    this.instanceId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Cross-tab BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('emf_church_sync_channel');
        this.broadcastChannel.onmessage = (e) => {
          if (e.data && e.data.type) {
            this.notifyListeners(e.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel error in ChurchSyncService:', err);
      }
    }

    // Connect WebSocket to stay in sync with server & remote clients
    if (typeof window !== 'undefined') {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    try {
      const loc = window.location;
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${loc.host}/ws`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && (data.type === 'church:settings_updated' || data.type === 'church:agenda_updated' || data.type === 'church:cms_updated')) {
            // Check if not sent by ourselves
            if (data.payload?.senderId !== this.instanceId) {
              this.notifyListeners({
                type: data.type,
                payload: data.payload,
                timestamp: data.timestamp || new Date().toISOString(),
                senderId: data.payload?.senderId || 'remote',
              });
            }
          }
        } catch {
          // ignore non-json
        }
      };

      this.socket.onclose = () => {
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        // silently handled
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.initWebSocket();
    }, 5000);
  }

  private notifyListeners(event: ChurchSyncEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.warn('Notice in ChurchSyncService listener:', err);
      }
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public broadcast(type: ChurchSyncEventType, payload?: any) {
    const event: ChurchSyncEvent = {
      type,
      payload: { ...payload, senderId: this.instanceId },
      timestamp: new Date().toISOString(),
      senderId: this.instanceId,
    };

    // 1. Notify local in-memory listeners
    this.notifyListeners(event);

    // 2. Notify cross-tab via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (e) {
        console.warn('Failed to postMessage on BroadcastChannel:', e);
      }
    }

    // 3. Send over WebSocket if connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(event));
      } catch (e) {
        console.warn('Failed to send event over WebSocket:', e);
      }
    }

    // Pas de stockage purement local (localStorage) conformément aux consignes.
  }

  public broadcastSettingsUpdated(settings: SystemSettings) {
    this.broadcast('church:settings_updated', { settings });
  }

  public broadcastAgendaUpdated(details?: { weeklyPrograms?: WeeklyProgram[]; events?: Event[]; message?: string }) {
    this.broadcast('church:agenda_updated', details);
  }

  public broadcastCmsUpdated() {
    this.broadcast('church:cms_updated');
  }

  public broadcastMediaUpdated(media?: any) {
    this.broadcast('church:media_updated', { media });
  }
}

export const churchSyncService = new ChurchSyncService();
