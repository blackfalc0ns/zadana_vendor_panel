import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { VendorFinanceDashboardComponent } from './vendor-finance-dashboard.component';
import { VendorFinanceService } from '../../services/vendor-finance.service';
import { VendorFinanceLedgerPage, VendorFinanceSnapshot } from '../../models/vendor-finance.models';

class FakeTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<any> {
    return of({
      COMMON: { CURRENCY: 'SAR', VIEW_ALL: 'View all', DATE: 'Date', AMOUNT: 'Amount', STATUS: 'Status', TOTAL: 'Total' },
      VENDOR_FINANCE: {
        PERIODS: { TODAY: 'Today', WEEK: 'This Week', MONTH: 'This Month', QUARTER: 'This Quarter' },
        CHART: {
          TITLE: 'Sales vs payouts',
          SALES: 'Sales',
          PAYOUTS: 'Payouts',
          DETAILS: 'Detailed View',
          PEAK_SALES: 'Top sales window',
          PEAK_PAYOUTS: 'Top payout window',
          AVG_SALES: 'Average sales',
          AVG_PAYOUTS: 'Average payouts',
          BREAKDOWN: 'Period breakdown'
        },
        SETTLEMENTS: { TITLE: 'Settlements', PAID: 'Paid', PROCESSING: 'Processing', SCHEDULED: 'Scheduled' },
        LEDGER: { TITLE: 'Period Transactions', DESCRIPTION: 'Description', PAGE_STATUS: 'Page {{page}} of {{totalPages}}' },
        ALERTS: { TITLE: 'Alerts', EMPTY: 'No alerts' },
        OVERVIEW: {
          AVAILABLE_BALANCE: 'Available Balance',
          PENDING_SETTLEMENT: 'Pending Settlement',
          NEXT_PAYOUT: 'Next Payout',
          HOLD_AMOUNT: 'Hold Amount'
        },
        ACTIONS: { VIEW_REPORTS: 'View Reports', DOWNLOAD_STATEMENT: 'Download Statement' }
      }
    });
  }
}

describe('VendorFinanceDashboardComponent', () => {
  let service: jasmine.SpyObj<VendorFinanceService>;

  const quarterSnapshot: VendorFinanceSnapshot = {
    availableBalance: 0,
    pendingSettlement: 0,
    nextPayoutDate: '2026-05-10',
    payoutMethod: 'Bank Transfer',
    holdAmount: 0,
    financialLifecycleModeStr: 'Weekly',
    kpis: [
      { id: 'vendor-profit', labelKey: 'VENDOR_FINANCE.KPIS.VENDOR_PROFIT', value: 10, delta: 0, trend: 'up', tone: 'success' }
    ],
    trend: [
      { label: 'Mar', sales: 10, payout: 5 },
      { label: 'Apr', sales: 20, payout: 10 },
      { label: 'May', sales: 30, payout: 15 }
    ],
    settlements: [],
    ledger: [],
    alerts: []
  };

  const ledgerPage: VendorFinanceLedgerPage = {
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<VendorFinanceService>('VendorFinanceService', ['getSnapshot', 'getLedger']);
    service.getSnapshot.and.returnValue(of(quarterSnapshot));
    service.getLedger.and.returnValue(of(ledgerPage));

    await TestBed.configureTestingModule({
      imports: [
        VendorFinanceDashboardComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeTranslateLoader }
        })
      ],
      providers: [
        { provide: VendorFinanceService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ period: 'quarter' }) }
          }
        }
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.use('en');
  });

  it('loads the period from the route and requests the matching snapshot', () => {
    const fixture = TestBed.createComponent(VendorFinanceDashboardComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.currentPeriod).toBe('quarter');
    expect(service.getSnapshot).toHaveBeenCalledWith('quarter');
    expect(service.getLedger).toHaveBeenCalledWith('quarter', 1, 10);
    expect(component.barChartData.labels).toEqual(['Mar', 'Apr', 'May']);
  });

  it('requests a new snapshot when the user changes the period', () => {
    const fixture = TestBed.createComponent(VendorFinanceDashboardComponent);
    fixture.detectChanges();

    service.getSnapshot.calls.reset();
    service.getLedger.calls.reset();

    fixture.componentInstance.setPeriod('today');

    expect(service.getSnapshot).toHaveBeenCalledWith('today');
    expect(service.getLedger).toHaveBeenCalledWith('today', 1, 10);
  });

  it('formats week labels and vendor profit labels without assuming months only', () => {
    const fixture = TestBed.createComponent(VendorFinanceDashboardComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.currentPeriod = 'week';

    expect(component.formatTrendLabel('Mon')).toBe('Mon');
    expect(component.getKpiLabel(quarterSnapshot.kpis[0])).toBe('Vendor profit');
  });
});
