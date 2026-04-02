export type AlertSource =
  | 'orders'
  | 'products'
  | 'offers'
  | 'finance'
  | 'support'
  | 'staff'
  | 'reviews'
  | 'profile';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertState = 'unread' | 'read' | 'archived';
export type AlertQuickView = 'all' | 'unread' | 'critical' | 'archived';

export interface LocalizedAlertText {
  ar: string;
  en: string;
}

export interface AlertCenterItemVm {
  id: string;
  source: AlertSource;
  severity: AlertSeverity;
  title: LocalizedAlertText;
  summary: LocalizedAlertText;
  createdAt: string;
  route: string;
  routeQuery?: Record<string, string>;
  count?: number;
  entityId?: string;
  state: AlertState;
}

export interface AlertSummaryVm {
  unreadCount: number;
  criticalCount: number;
  needsActionCount: number;
  archivedCount: number;
  totalCount: number;
}

export interface AlertFiltersVm {
  search: string;
  source: 'all' | AlertSource;
  severity: 'all' | AlertSeverity;
  state: 'all' | AlertState;
}

export interface AlertWorkspaceSnapshotVm extends Omit<AlertCenterItemVm, 'state'> {}

export interface AlertWorkspaceState {
  readMap: Record<string, true>;
  archivedMap: Record<string, true>;
  archivedSnapshots: Record<string, AlertWorkspaceSnapshotVm>;
}

export function cloneLocalizedAlertText(text: LocalizedAlertText): LocalizedAlertText {
  return { ...text };
}

export function cloneAlert(alert: AlertCenterItemVm): AlertCenterItemVm {
  return {
    ...alert,
    title: cloneLocalizedAlertText(alert.title),
    summary: cloneLocalizedAlertText(alert.summary),
    routeQuery: alert.routeQuery ? { ...alert.routeQuery } : undefined
  };
}

export function cloneAlerts(alerts: AlertCenterItemVm[]): AlertCenterItemVm[] {
  return alerts.map((alert) => cloneAlert(alert));
}
