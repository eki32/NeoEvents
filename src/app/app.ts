import { Component, inject, signal, effect, computed } from '@angular/core'; // 1. Añadido computed
import { MapViewComponent } from './components/map-view/map-view';
import { LocationService } from './service/location';
import { EventsService } from './service/events';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ MapViewComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // 2. Definimos el filtro como una señal para que 'filteredEvents' sea reactivo
  currentFilter = signal<string>('all'); 
  
  public eventsService = inject(EventsService);
  public locationService = inject(LocationService);

  // 3. SEÑAL COMPUTADA: Esta es la que debes usar en el *ngFor o @for del HTML
  filteredEvents = computed(() => {
    const allEvents = this.eventsService.events();
    const filter = this.currentFilter();
    const today = new Date();
    const favs = this.eventsService.favorites();
    today.setHours(0, 0, 0, 0);

    if (filter === 'all') return allEvents;

    // NUEVO: Filtro de favoritos
  if (filter === 'favs') {
    return allEvents.filter(event => favs.includes(event.id));
  }

    return allEvents.filter((event) => {
      // Asegúrate de que event.date sea un formato de fecha válido
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      if (filter === 'today') {
        return eventDate.getTime() === today.getTime();
      }

      if (filter === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return eventDate.getTime() === tomorrow.getTime();
      }

      if (filter === 'weekend') {
        const dayOfWeek = today.getDay(); 
        const sunday = new Date(today);
        const saturday = new Date(today);
        
        // Calculamos el próximo sábado y domingo
        saturday.setDate(today.getDate() + (6 - dayOfWeek));
        sunday.setDate(saturday.getDate() + 1);

        return eventDate >= saturday && eventDate <= sunday;
      }

      return true;
    });
  });

  constructor() {
    effect(() => {
      const coords = this.locationService.userLocation();
      if (coords) {
        this.eventsService.fetchRealEvents(coords[0], coords[1]);
      }
    });
  }

  // 4. Actualizamos la señal del filtro
  filterByDate(period: string) {
    this.currentFilter.set(period);
  }

  async onSearch(city: string) {
    if (!city) return;
    const coords = await this.locationService.searchCity(city);
    if (coords) {
      this.locationService.userLocation.set(coords);
      this.eventsService.fetchRealEvents(coords[0], coords[1]);
      this.currentFilter.set('all'); // Resetear filtro al buscar nueva ciudad
    }
  }

  // Corregido el nombre y la lógica de navegación
  openNavigation(event: any) {
    const userLoc = this.locationService.userLocation();
    if (userLoc) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLoc[0]},${userLoc[1]}&destination=${event.lat},${event.lng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  }

  // Función de la diana corregida
  resetToUserLocation(inputElement: HTMLInputElement) {
    inputElement.value = '';
    navigator.geolocation.getCurrentPosition((pos) => {
      const home: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      this.locationService.userLocation.set(home);
      this.eventsService.fetchRealEvents(home[0], home[1]);
      this.currentFilter.set('all');
    });
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      Rock: '#ef4444',
      Pop: '#ec4899',
      Metal: '#4b5563',
      Jazz: '#8b5cf6',
      Default: '#06b6d4',
    };
    return colors[category] || colors['Default'];
  }
}