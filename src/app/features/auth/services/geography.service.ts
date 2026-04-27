import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SaudiRegionDto {
  code: string;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  mapZoom: number;
  sortOrder: number;
}

export interface SaudiCityDto extends SaudiRegionDto {
  regionCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeographyService {
  private readonly apiUrl = `${environment.apiUrl}/geography`;
  private readonly skipAuthHeaders = new HttpHeaders({ 'X-Skip-Auth': 'true' });
  private regionsRequest$?: Observable<SaudiRegionDto[]>;
  private readonly citiesRequests = new Map<string, Observable<SaudiCityDto[]>>();

  constructor(private readonly http: HttpClient) {}

  getRegions(): Observable<SaudiRegionDto[]> {
    if (!this.regionsRequest$) {
      this.regionsRequest$ = this.http.get<SaudiRegionDto[]>(
        `${this.apiUrl}/regions`,
        { headers: this.skipAuthHeaders }
      ).pipe(shareReplay(1));
    }

    return this.regionsRequest$;
  }

  getCities(regionCode: string): Observable<SaudiCityDto[]> {
    const normalizedCode = regionCode.trim().toUpperCase();

    if (!this.citiesRequests.has(normalizedCode)) {
      this.citiesRequests.set(
        normalizedCode,
        this.http.get<SaudiCityDto[]>(
          `${this.apiUrl}/regions/${encodeURIComponent(normalizedCode)}/cities`,
          { headers: this.skipAuthHeaders }
        ).pipe(shareReplay(1))
      );
    }

    return this.citiesRequests.get(normalizedCode)!;
  }
}
