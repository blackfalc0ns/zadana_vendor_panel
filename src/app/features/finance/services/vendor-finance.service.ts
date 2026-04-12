import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { VendorFinancePeriod, VendorFinanceSnapshot } from '../models/vendor-finance.models';

@Injectable({
  providedIn: 'root'
})
export class VendorFinanceService {
  getSnapshot(period: VendorFinancePeriod): Observable<VendorFinanceSnapshot> {
    const multiplier = period === 'today' ? 0.2 : period === 'week' ? 0.65 : period === 'quarter' ? 2.7 : 1;

    return of({
      availableBalance: Number((24850 * multiplier).toFixed(2)),
      pendingSettlement: Number((13240 * multiplier).toFixed(2)),
      nextPayoutDate: '2026-04-04',
      payoutMethod: 'Bank Transfer - SNB',
      holdAmount: Number((1850 * (period === 'quarter' ? 1.6 : 1)).toFixed(2)),
      kpis: [
        { id: 'net-sales', labelKey: 'VENDOR_FINANCE.KPIS.NET_SALES', value: 96540 * multiplier, delta: 12.4, trend: 'up', tone: 'primary' },
        { id: 'vendor-payouts', labelKey: 'VENDOR_FINANCE.KPIS.PAYOUTS', value: 74120 * multiplier, delta: 8.1, trend: 'up', tone: 'success' },
        { id: 'fees', labelKey: 'VENDOR_FINANCE.KPIS.FEES', value: 11280 * multiplier, delta: -2.3, trend: 'down', tone: 'warning' },
        { id: 'refunds', labelKey: 'VENDOR_FINANCE.KPIS.REFUNDS', value: 3240 * multiplier, delta: 1.4, trend: 'up', tone: 'danger' }
      ],
      trend: [
        { label: 'Jan', sales: 42000 * multiplier, payout: 33000 * multiplier },
        { label: 'Feb', sales: 46800 * multiplier, payout: 35200 * multiplier },
        { label: 'Mar', sales: 51200 * multiplier, payout: 39150 * multiplier },
        { label: 'Apr', sales: 48800 * multiplier, payout: 37740 * multiplier },
        { label: 'May', sales: 53500 * multiplier, payout: 40800 * multiplier },
        { label: 'Jun', sales: 59100 * multiplier, payout: 44750 * multiplier }
      ],
      settlements: [
        { id: 'set-1', code: 'SET-2404', date: '2026-04-04', status: 'scheduled', amount: 13240 * multiplier, ordersCount: 84 },
        { id: 'set-2', code: 'SET-2003', date: '2026-03-20', status: 'processing', amount: 11890 * multiplier, ordersCount: 76 },
        { id: 'set-3', code: 'SET-1303', date: '2026-03-13', status: 'paid', amount: 14120 * multiplier, ordersCount: 91 }
      ],
      ledger: [
        { id: 'led-1', date: '2026-03-30', titleAr: 'مبيعات طلبات اليوم', titleEn: 'Today order sales', type: 'sale', amount: 6840 * multiplier, direction: 'in', reference: 'ORD-1294' },
        { id: 'led-2', date: '2026-03-29', titleAr: 'رسوم المنصة الأسبوعية', titleEn: 'Weekly platform fees', type: 'fee', amount: 940 * multiplier, direction: 'out', reference: 'FEE-8821' },
        { id: 'led-3', date: '2026-03-28', titleAr: 'تسوية مجدولة', titleEn: 'Scheduled settlement', type: 'payout', amount: 11890 * multiplier, direction: 'in', reference: 'SET-2003' },
        { id: 'led-4', date: '2026-03-27', titleAr: 'استرجاع طلب ملغي', titleEn: 'Canceled order refund', type: 'refund', amount: 320 * multiplier, direction: 'out', reference: 'REF-7712' }
      ],
      alerts: [
        {
          id: 'alt-1',
          severity: 'warning',
          titleKey: 'VENDOR_FINANCE.ALERTS.HOLD_TITLE',
          bodyKey: 'VENDOR_FINANCE.ALERTS.HOLD_BODY',
          actionLabelKey: 'VENDOR_FINANCE.ACTIONS.REVIEW_ORDERS'
        },
        {
          id: 'alt-2',
          severity: 'info',
          titleKey: 'VENDOR_FINANCE.ALERTS.PAYOUT_TITLE',
          bodyKey: 'VENDOR_FINANCE.ALERTS.PAYOUT_BODY',
          actionLabelKey: 'VENDOR_FINANCE.ACTIONS.DOWNLOAD_STATEMENT'
        }
      ]
    });
  }
}
