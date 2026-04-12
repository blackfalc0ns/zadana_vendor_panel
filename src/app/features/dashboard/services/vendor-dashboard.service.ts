import { Injectable } from '@angular/core';
import { VendorDashboardSnapshot } from '../models/vendor-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class VendorDashboardService {
  getSnapshot(): VendorDashboardSnapshot {
    return {
      metrics: [
        { value: '128,000', labelKey: 'DASHBOARD.TOTAL_SALES', noteKey: 'DASHBOARD.TOTAL_SALES_NOTE', isCurrency: true },
        { value: '18', labelKey: 'DASHBOARD.ACTIVE_OFFERS', noteKey: 'DASHBOARD.ACTIVE_OFFERS_NOTE', isCurrency: false },
        { value: '24', labelKey: 'DASHBOARD.PENDING_ORDERS', noteKey: 'DASHBOARD.PENDING_ORDERS_NOTE', isCurrency: false }
      ],
      checklist: [
        {
          titleKey: 'DASHBOARD.CHECKLIST.CONFIRM_ORDERS_TITLE',
          bodyKey: 'DASHBOARD.CHECKLIST.CONFIRM_ORDERS_BODY'
        },
        {
          titleKey: 'DASHBOARD.CHECKLIST.LOW_STOCK_TITLE',
          bodyKey: 'DASHBOARD.CHECKLIST.LOW_STOCK_BODY'
        },
        {
          titleKey: 'DASHBOARD.CHECKLIST.REFRESH_OFFERS_TITLE',
          bodyKey: 'DASHBOARD.CHECKLIST.REFRESH_OFFERS_BODY'
        }
      ],
      quickActions: [
        {
          titleKey: 'DASHBOARD.ADD_PRODUCTS',
          bodyKey: 'DASHBOARD.ADD_PRODUCTS_DESC',
          accent: 'warm'
        },
        {
          titleKey: 'DASHBOARD.TRACK_SHIPMENTS',
          bodyKey: 'DASHBOARD.TRACK_SHIPMENTS_DESC',
          accent: 'soft'
        },
        {
          titleKey: 'DASHBOARD.ADJUST_HOURS',
          bodyKey: 'DASHBOARD.ADJUST_HOURS_DESC',
          accent: 'dark'
        }
      ],
      timeline: [
        {
          time: '09:15',
          titleKey: 'DASHBOARD.TIMELINE.RAMADAN_CAMPAIGN'
        },
        {
          time: '10:00',
          titleKey: 'DASHBOARD.TIMELINE.NEW_ORDERS'
        },
        {
          time: '11:30',
          titleKey: 'DASHBOARD.TIMELINE.LOW_INVENTORY'
        }
      ]
    };
  }
}
