import { inject, Injectable, signal } from '@angular/core';
import { LocalEvent } from '../models/event';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private http = inject(HttpClient);

  public events = signal<LocalEvent[]>([]);
  public selectedEvent = signal<LocalEvent | undefined>(undefined);
  public favorites = signal<string[]>([]);

  constructor() {
    this.favorites.set(this.loadFavorites());
  }

  public async toggleFavorite(eventId: string) {
    const current = this.favorites();
    const exists = current.includes(eventId);
    const updated = exists ? current.filter((id) => id !== eventId) : [...current, eventId];

    this.favorites.set(updated);
    localStorage.setItem('neo_favs', JSON.stringify(updated));

    if (!exists) {
      const registration = await navigator.serviceWorker.getRegistration();
      const event = this.events().find((e) => e.id === eventId);

      if (registration && Notification.permission === 'granted') {
        registration.showNotification('⭐ Guardado en NeoEvents', {
          body: `No te pierdas: ${event?.title}`,
          icon: 'assets/icons/icon-192x192.png',
          badge: 'assets/icons/icon-72x72.png',
          vibrate: [100, 50, 100],
          data: { url: window.location.href },
        } as any);
      }
    }
  }

  private loadFavorites(): string[] {
    const saved = localStorage.getItem('neo_favs');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  public async requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  // ✅ Ahora llama al proxy en /api/events, sin exponer la apiKey
  public async fetchRealEvents(lat: number, lng: number) {
    const latlng = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const url = `${environment.apiUrl}?latlong=${latlng}&radius=50&unit=km&sort=date,asc`;

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