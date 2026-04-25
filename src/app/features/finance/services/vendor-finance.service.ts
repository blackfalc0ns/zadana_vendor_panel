import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VendorFinancePeriod, VendorFinanceSnapshot } from '../models/vendor-finance.models';

@Injectable({
  providedIn: 'root'
})
export class VendorFinanceService {
  private readonly baseUrl = `${environment.apiUrl}/vendor/finance`;

  constructor(private readonly http: HttpClient) {}

  getSnapshot(period: VendorFinancePeriod): Observable<VendorFinanceSnapshot> {
    const params = new HttpParams().set('period', period);
    return this.http.get<VendorFinanceSnapshot>(this.baseUrl, { params });
  }
}
