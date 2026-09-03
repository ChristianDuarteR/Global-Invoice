import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone, PLATFORM_ID, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { InvoiceType, MetricsSnapshot, TypeMetric } from '../models/invoice.model';
import { toNumber } from '../money';

const EMPTY: MetricsSnapshot = {
  by_type: [
    { invoice_type: 'NACIONAL', total: '0', count: 0 },
    { invoice_type: 'EXPORTACION', total: '0', count: 0 },
    { invoice_type: 'GUBERNAMENTAL', total: '0', count: 0 },
  ],
  grand_total: '0',
  invoice_count: 0,
};

@Injectable({ providedIn: 'root' })
export class MetricsStore {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  readonly snapshot = signal<MetricsSnapshot>(EMPTY);
  readonly connected = signal(false);
  readonly livePulse = signal(0);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly socketError = signal<string | null>(null);

  private socket: WebSocket | null = null;
  private started = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  ensureStarted(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.started = true;
    this.hydrateOnce();
    this.connectSocket();
  }

  stop(): void {
    this.started = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.connected.set(false);
  }

  private hydrateOnce(): void {
    this.http.get<MetricsSnapshot>(`${environment.pythonApi}/api/v1/metrics/by-type`).subscribe({
      next: (data) => {
        this.snapshot.set(normalizeSnapshot(data));
        this.loaded.set(true);
        this.error.set(null);
      },
      error: () => {
        this.loaded.set(true);
        this.error.set('No se pudieron cargar las métricas iniciales.');
      },
    });
  }

  private connectSocket(): void {
    if (!this.started || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }
    const token = this.auth.token();
    if (!token) {
      this.socketError.set('No hay token de sesión para abrir el canal en vivo.');
      this.scheduleReconnect();
      return;
    }
    const url = `${environment.metricsWsUrl}?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(url);
    } catch {
      this.connected.set(false);
      this.socketError.set('No se pudo crear el canal WebSocket.');
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      console.info('[metrics-ws] Conectado', url);
      this.zone.run(() => {
        this.connected.set(true);
        this.socketError.set(null);
      });
    };
    this.socket.onclose = () => {
      console.warn('[metrics-ws] Conexión cerrada');
      this.zone.run(() => {
        this.connected.set(false);
        if (this.started) {
          this.socketError.set('El canal WebSocket se cerró; intentando reconectar.');
          this.scheduleReconnect();
        }
      });
    };
    this.socket.onerror = () => {
      console.error('[metrics-ws] Error de conexión');
      this.zone.run(() => {
        this.connected.set(false);
        this.socketError.set('No se pudo conectar a /ws/metrics. Verifica el backend Python y su proxy.');
      });
    };
    this.socket.onmessage = (ev) => {
      const next = parseSnapshot(ev.data);
      if (!next) {
        console.warn('[metrics-ws] Mensaje ignorado: formato inesperado', ev.data);
        return;
      }
      console.info('[metrics-ws] Evento metrics_updated recibido', next);
      this.zone.run(() => {
        this.snapshot.set(normalizeSnapshot(next));
        this.livePulse.update((n) => n + 1);
        this.error.set(null);
      });
    };
  }

  private scheduleReconnect(): void {
    if (!this.started || this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectSocket();
    }, 2500);
  }
}

function parseSnapshot(raw: unknown): MetricsSnapshot | null {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') {
      return null;
    }
    const obj = data as Record<string, unknown>;
    if (obj['by_type']) {
      return data as MetricsSnapshot;
    }
    if (obj['data'] && typeof obj['data'] === 'object') {
      return obj['data'] as MetricsSnapshot;
    }
    if (obj['payload'] && typeof obj['payload'] === 'object') {
      return obj['payload'] as MetricsSnapshot;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeSnapshot(data: MetricsSnapshot): MetricsSnapshot {
  const order: InvoiceType[] = ['NACIONAL', 'EXPORTACION', 'GUBERNAMENTAL'];
  const map = new Map<InvoiceType, TypeMetric>();
  for (const row of data.by_type ?? []) {
    map.set(row.invoice_type, row);
  }
  const by_type = order.map(
    (invoice_type) =>
      map.get(invoice_type) ?? { invoice_type, total: '0', count: 0 },
  );
  const invoice_count =
    data.invoice_count ??
    by_type.reduce((acc, row) => acc + (row.count ?? 0), 0);
  const grand =
    data.grand_total ??
    by_type.reduce((acc, row) => acc + toNumber(row.total), 0);
  return { by_type, grand_total: grand, invoice_count };
}
