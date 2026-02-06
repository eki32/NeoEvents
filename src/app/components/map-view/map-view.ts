import { Component, AfterViewInit, inject, ElementRef, ViewChild, effect } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../../service/location';
import { EventsService } from '../../service/events';

// --- CONFIGURACIÓN DE ICONOS ---
const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-map-view',
  standalone: true,
  template: `<div #mapContainer class="map-container"></div>`,
  styles: `
    :host { display: block; width: 100%; height: 100%; }
    .map-container { 
      height: 100%; 
      width: 100%; 
      background: #f8fafc; /* Color claro de fondo */
    }
  `
})
export class MapViewComponent implements AfterViewInit {
  private locationService = inject(LocationService);
  private eventsService = inject(EventsService);
  
  @ViewChild('mapContainer') mapElement!: ElementRef;
  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private userMarker?: L.Marker;

  constructor() {
    // 1. Marcadores de eventos
    effect(() => {
      const events = this.eventsService.events();
      if (this.map) this.updateMarkers(events);
    });

    // 2. Volar al evento seleccionado
    effect(() => {
      const selected = this.eventsService.selectedEvent();
      if (selected && this.map) {
        this.map.flyTo([selected.lat, selected.lng], 15, { animate: true, duration: 1.5 });
        L.popup()
          .setLatLng([selected.lat, selected.lng])
          .setContent(`<b style="color: black">${selected.title}</b>`)
          .openOn(this.map);
      }
    });

    // 3. Reaccionar a la diana 🎯
    effect(() => {
      const coords = this.locationService.userLocation();
      if (coords && this.map) {
        this.map.flyTo(coords, 14, { animate: true, duration: 1.5 });
        if (this.userMarker) {
          this.userMarker.setLatLng(coords);
        } else {
          this.userMarker = L.marker(coords).addTo(this.map).bindPopup('<b>Estás aquí</b>');
        }
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  private initMap(): void {
    const coords = this.locationService.userLocation() || [43.3000, -3.0000];

    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false 
    }).setView(coords, 13);

    // Tiles originales (Claros)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    // Marcador inicial del usuario
    this.userMarker = L.marker(coords).addTo(this.map).bindPopup('Estás aquí');

    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private updateMarkers(events: any[]): void {
    this.markersLayer.clearLayers();
    events.forEach(event => {
      const marker = L.marker([event.lat, event.lng])
        .bindPopup(`
          <div style="color: #1e293b; font-family: sans-serif;">
            <strong style="font-size: 14px;">${event.title}</strong><br>
            <span style="font-size: 12px; opacity: 0.8;">${event.date}</span>
          </div>
        `);
      this.markersLayer.addLayer(marker);
    });
  }
}