export type VendorDashboardQuickActionAccent = 'warm' | 'soft' | 'dark';

export interface VendorDashboardMetric {
  value: string;
  labelKey: string;
  noteKey: string;
  isCurrency: boolean;
}

export interface VendorDashboardChecklistItem {
  titleKey: string;
  bodyKey: string;
}

export interface VendorDashboardQuickAction {
  titleKey: string;
  bodyKey: string;
  accent: VendorDashboardQuickActionAccent;
}

export interface VendorDashboardTimelineItem {
  time: string;
  titleKey: string;
}

export interface VendorDashboardSnapshot {
  metrics: VendorDashboardMetric[];
  checklist: VendorDashboardChecklistItem[];
  quickActions: VendorDashboardQuickAction[];
  timeline: VendorDashboardTimelineItem[];
}
