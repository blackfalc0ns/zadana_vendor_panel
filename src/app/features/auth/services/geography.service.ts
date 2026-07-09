import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';
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
  private static readonly operationalRegionCodes = new Set<string>(['EASTERN']);
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

  getOperationalRegions(): Observable<SaudiRegionDto[]> {
    return this.getRegions().pipe(
      map((regions) => regions.filter((region) => this.isOperationalRegionCode(region.code)))
    );
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

  getOperationalCities(regionCode: string): Observable<SaudiCityDto[]> {
    const normalizedCode = regionCode.trim().toUpperCase();

    if (!this.isOperationalRegionCode(normalizedCode)) {
      return of([]);
    }

    return this.getCities(normalizedCode).pipe(
      map((cities) => cities.filter((city) => this.isOperationalRegionCode(city.regionCode)))
    );
  }

  private isOperationalRegionCode(regionCode?: string | null): boolean {
    return GeographyService.operationalRegionCodes.has((regionCode || '').trim().toUpperCase());
  }
}
