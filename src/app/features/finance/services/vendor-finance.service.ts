import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  VendorFinanceBranchScope,
  VendorFinanceBranchSection,
  VendorFinanceLedgerPage,
  VendorFinancePeriod,
  VendorFinanceSnapshot
} from '../models/vendor-finance.models';

interface FinanceSnapshotApiResponse {
  availableBalance?: number;
  AvailableBalance?: number;
  pendingSettlement?: number;
  PendingSettlement?: number;
  nextPayoutDate?: string;
  NextPayoutDate?: string;
  payoutMethod?: string;
  PayoutMethod?: string;
  holdAmount?: number;
  HoldAmount?: number;
  financialLifecycleModeStr?: string;
  FinancialLifecycleModeStr?: string;
  kpis?: VendorFinanceSnapshot['kpis'];
  Kpis?: VendorFinanceSnapshot['kpis'];
  trend?: VendorFinanceSnapshot['trend'];
  Trend?: VendorFinanceSnapshot['trend'];
  settlements?: VendorFinanceSnapshot['settlements'];
  Settlements?: VendorFinanceSnapshot['settlements'];
  ledger?: VendorFinanceSnapshot['ledger'];
  Ledger?: VendorFinanceSnapshot['ledger'];
  alerts?: VendorFinanceSnapshot['alerts'];
  Alerts?: VendorFinanceSnapshot['alerts'];
  branchScope?: FinanceBranchScopeApiResponse;
  BranchScope?: FinanceBranchScopeApiResponse;
  branchSections?: FinanceBranchSectionApiResponse[];
  BranchSections?: FinanceBranchSectionApiResponse[];
}

interface FinanceBranchScopeApiResponse {
  canSelectBranch?: boolean;
  CanSelectBranch?: boolean;
  selectedBranchId?: string | null;
  SelectedBranchId?: string | null;
  branches?: FinanceBranchOptionApiResponse[];
  Branches?: FinanceBranchOptionApiResponse[];
}

interface FinanceBranchOptionApiResponse {
  id?: string;
  Id?: string;
  name?: string;
  Name?: string;
  isPrimary?: boolean;
  IsPrimary?: boolean;
}

interface FinanceBranchSectionApiResponse {
  branchId?: string;
  BranchId?: string;
  branchName?: string;
  BranchName?: string;
  isPrimary?: boolean;
  IsPrimary?: boolean;
  grossSales?: number;
  GrossSales?: number;
  vendorProfit?: number;
  VendorProfit?: number;
  platformFees?: number;
  PlatformFees?: number;
  vendorNet?: number;
  VendorNet?: number;
  ordersCount?: number;
  OrdersCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VendorFinanceService {
  private readonly baseUrl = `${environment.apiUrl}/vendor/finance`;

  constructor(private readonly http: HttpClient) {}

  getSnapshot(period: VendorFinancePeriod, branchId?: string | null): Observable<VendorFinanceSnapshot> {
    let params = new HttpParams().set('period', period);
    if (branchId?.trim()) {
      params = params.set('branchId', branchId.trim());
    }

    return this.http.get<FinanceSnapshotApiResponse>(this.baseUrl, { params }).pipe(
      map((response) => this.normalizeSnapshot(response))
    );
  }

  getLedger(
    period: VendorFinancePeriod,
    page: number,
    pageSize: number,
    branchId?: string | null
  ): Observable<VendorFinanceLedgerPage> {
    let params = new HttpParams()
      .set('period', period)
      .set('page', page)
      .set('pageSize', pageSize);

    if (branchId?.trim()) {
      params = params.set('branchId', branchId.trim());
    }

    return this.http.get<VendorFinanceLedgerPage>(`${this.baseUrl}/ledger`, { params });
  }

  private normalizeSnapshot(response: FinanceSnapshotApiResponse | null | undefined): VendorFinanceSnapshot {
    const source = response ?? {};

    return {
      availableBalance: Number(source.availableBalance ?? source.AvailableBalance ?? 0),
      pendingSettlement: Number(source.pendingSettlement ?? source.PendingSettlement ?? 0),
      nextPayoutDate: String(source.nextPayoutDate ?? source.NextPayoutDate ?? ''),
      payoutMethod: String(source.payoutMethod ?? source.PayoutMethod ?? ''),
      holdAmount: Number(source.holdAmount ?? source.HoldAmount ?? 0),
      financialLifecycleModeStr: String(source.financialLifecycleModeStr ?? source.FinancialLifecycleModeStr ?? ''),
      kpis: source.kpis ?? source.Kpis ?? [],
      trend: source.trend ?? source.Trend ?? [],
      settlements: source.settlements ?? source.Settlements ?? [],
      ledger: source.ledger ?? source.Ledger ?? [],
      alerts: source.alerts ?? source.Alerts ?? [],
      branchScope: this.normalizeBranchScope(source.branchScope ?? source.BranchScope),
      branchSections: this.normalizeBranchSections(source.branchSections ?? source.BranchSections ?? [])
    };
  }

  private normalizeBranchScope(scope?: FinanceBranchScopeApiResponse): VendorFinanceBranchScope {
    const source = scope ?? {};

    return {
      canSelectBranch: !!(source.canSelectBranch ?? source.CanSelectBranch),
      selectedBranchId: source.selectedBranchId ?? source.SelectedBranchId ?? null,
      branches: (source.branches ?? source.Branches ?? []).map((branch) => ({
        id: String(branch.id ?? branch.Id ?? ''),
        name: String(branch.name ?? branch.Name ?? ''),
        isPrimary: !!(branch.isPrimary ?? branch.IsPrimary)
      }))
    };
  }

  private normalizeBranchSections(sections: FinanceBranchSectionApiResponse[]): VendorFinanceBranchSection[] {
    return sections.map((section) => ({
      branchId: String(section.branchId ?? section.BranchId ?? ''),
      branchName: String(section.branchName ?? section.BranchName ?? ''),
      isPrimary: !!(section.isPrimary ?? section.IsPrimary),
      grossSales: Number(section.grossSales ?? section.GrossSales ?? 0),
      vendorProfit: Number(section.vendorProfit ?? section.VendorProfit ?? 0),
      platformFees: Number(section.platformFees ?? section.PlatformFees ?? 0),
      vendorNet: Number(section.vendorNet ?? section.VendorNet ?? 0),
      ordersCount: Number(section.ordersCount ?? section.OrdersCount ?? 0)
    }));
  }
}
