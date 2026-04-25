import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorDashboardSnapshot } from '../models/vendor-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class VendorDashboardService {
  private readonly baseUrl = `${environment.apiUrl}/vendor/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getSnapshot(): Observable<VendorDashboardSnapshot> {
    return this.http.get<VendorDashboardSnapshot>(this.baseUrl);
  }
}
