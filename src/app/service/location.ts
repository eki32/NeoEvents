// src/app/services/location.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // Signal para almacenar la ubicación [lat, lng]
  userLocation = signal<[number, number] | undefined>(undefined);

  constructor() {
    this.getUserLocation();
  }

  async searchCity(query: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return [lat, lon];
    }
    return null;
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    return null;
  }
}

  public getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const location: [number, number] = [coords.latitude, coords.longitude];
          this.userLocation.set(location);
          resolve(location);
        },
        (err) => {
          alert('No se pudo obtener la geolocalización');
          console.error(err);
          reject();
        }
      );
    });
  }
}