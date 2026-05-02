import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorDashboardOverview } from '../models/vendor-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class VendorDashboardService {
  private readonly baseUrl = `${environment.apiUrl}/vendor/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getOverview(period: string = '7d'): Observable<VendorDashboardOverview> {
    return this.http.get<VendorDashboardOverview>(`${this.baseUrl}/overview`, {
      params: { period }
    });
  }
}
