import { inject, Injectable, signal } from '@angular/core';
import { LocalEvent } from '../models/event';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClient);

  // 1. Señales de estado
  public events = signal<LocalEvent[]>([]); // Público para el HTML
  public selectedEvent = signal<LocalEvent | undefined>(undefined);
  public favorites = signal<string[]>([]); // Inicializamos vacía primero

  private apiKey = environment.apiKey;

  constructor() {
    // 2. Cargamos favoritos al iniciar el servicio
    this.favorites.set(this.loadFavorites());
  }

  // 3. Lógica de Favoritos (Debe ser pública para el HTML)
  // En service/events.ts
  public async toggleFavorite(eventId: string) {
    const current = this.favorites();
    const exists = current.includes(eventId);
    const updated = exists ? current.filter((id) => id !== eventId) : [...current, eventId];

    this.favorites.set(updated);
    localStorage.setItem('neo_favs', JSON.stringify(updated));

    if (!exists) {
      // Usamos el Service Worker para la notificación si está disponible
      const registration = await navigator.serviceWorker.getRegistration();
      const event = this.events().find((e) => e.id === eventId);

      if (registration && Notification.permission === 'granted') {
        registration.showNotification('⭐ Guardado en NeoEvents', {
          body: `No te pierdas: ${event?.title}`,
          icon: 'assets/icons/icon-192x192.png',
          badge: 'assets/icons/icon-72x72.png', // Icono pequeño para la barra de estado
          vibrate: [100, 50, 100],
          data: { url: window.location.href },
        }as any);
      }
    }
  }

  private loadFavorites(): string[] {
    const saved = localStorage.getItem('neo_favs');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return []; // Por si el localStorage tiene datos corruptos
    }
  }

  public async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones de escritorio');
      return;
    }

    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  // 4. Conexión con Ticketmaster
  public async fetchRealEvents(lat: number, lng: number) {
    const latlng = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${this.apiKey}&latlong=${latlng}&radius=50&unit=km&sort=date,asc`;

    console.log('🚀 Buscando eventos en:', latlng);

    this.http.get<any>(url).subscribe({
      next: (data) => {
        const items = data._embedded?.events || [];
        const mapped: LocalEvent[] = items.map((e: any) => ({
          id: e.id,
          title: e.name,
          description: e.classifications?.[0]?.segment?.name || 'Evento',
          lat: parseFloat(e._embedded?.venues?.[0]?.location?.latitude || '0'),
          lng: parseFloat(e._embedded?.venues?.[0]?.location?.longitude || '0'),
          date: e.dates.start.localDate,
          category: e.classifications?.[0]?.genre?.name || 'General',
        }));

        this.events.set(mapped);
      },
      error: (err) => console.error('❌ Error API:', err),
    });
  }

  public selectEvent(event: LocalEvent) {
    this.selectedEvent.set(event);
  }
}
