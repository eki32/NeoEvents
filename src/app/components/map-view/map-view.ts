import { Component, AfterViewInit, inject, ElementRef, ViewChild, effect } from '@angular/core';
import * as L from 'leaflet';
import { LocationService } from '../../service/location';
import { EventsService } from '../../service/events';

const categoryColors: Record<string, string> = {
  Rock: '#ef4444',
  Pop: '#ec4899',
  Metal: '#6b7280',
  Jazz: '#8b5cf6',
  Sports: '#f59e0b',
  Theatre: '#10b981',
  Comedy: '#f97316',
  Default: '#06b6d4',
};

function createEventIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
        width:14px;height:14px;
        background:${color};
        border:2px solid rgba(255,255,255,0.9);
        border-radius:50%;
        box-shadow:0 0 8px ${color},0 0 18px ${color}66;
      "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

const userIcon = L.divIcon({
  className: '',
  html: `<div style="
      width:16px;height:16px;
      background:#38bdf8;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 10px #38bdf8,0 0 22px #38bdf866;
    "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

@Component({
  selector: 'app-map-view',
  standalone: true,
  template: `<div #mapContainer class="map-container"></div>`,
  styles: `
    :host { display: block; width: 100%; height: 100%; }
    .map-container {
      height: 100%;
      width: 100%;
      background: #0f172a;
    }
   
    :host ::ng-deep .leaflet-popup-content-wrapper {
      filter: invert(100%) hue-rotate(180deg);
    }
    :host ::ng-deep .leaflet-popup-tip {
      filter: invert(100%) hue-rotate(180deg);
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
    effect(() => {
      const events = this.eventsService.events();
      if (this.map) this.updateMarkers(events);
    });

    effect(() => {
      const selected = this.eventsService.selectedEvent();
      if (selected && this.map) {
        this.map.flyTo([selected.lat, selected.lng], 15, { animate: true, duration: 1.5 });
        L.popup()
          .setLatLng([selected.lat, selected.lng])
          .setContent(`<b style="color:black">${selected.title}</b>`)
          .openOn(this.map);
      }
    });

    effect(() => {
      const coords = this.locationService.userLocation();
      if (coords && this.map) {
        this.map.flyTo(coords, 14, { animate: true, duration: 1.5 });
        if (this.userMarker) {
          this.userMarker.setLatLng(coords);
        } else {
          this.userMarker = L.marker(coords, { icon: userIcon }).addTo(this.map).bindPopup('<b>Estás aquí</b>');
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    this.userMarker = L.marker(coords, { icon: userIcon }).addTo(this.map).bindPopup('Estás aquí');

    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private updateMarkers(events: any[]): void {
    this.markersLayer.clearLayers();
    events.forEach(event => {
      if (!event.lat || !event.lng) return;
      const color = categoryColors[event.category] ?? categoryColors['Default'];
      const marker = L.marker([event.lat, event.lng], { icon: createEventIcon(color) })
        .bindPopup(`
          <div style="color:#1e293b;font-family:sans-serif;">
            <strong style="font-size:14px;">${event.title}</strong><br>
            <span style="font-size:12px;opacity:0.8;">${event.date}</span>
          </div>
        `);
      this.markersLayer.addLayer(marker);
    });
  }
}