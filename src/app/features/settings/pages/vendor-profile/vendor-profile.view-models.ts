export interface ProfileSectionNavItem {
  id: string;
  labelKey: string;
  fields?: string[];
  kind?: 'hours';
}

export type ProfileWorkspaceWindowId = 'basics' | 'review' | 'operations' | 'timeline';

export interface ProfileWorkspaceWindow {
  id: ProfileWorkspaceWindowId;
  icon: string;
  labelAr: string;
  labelEn: string;
  summaryAr: string;
  summaryEn: string;
}
