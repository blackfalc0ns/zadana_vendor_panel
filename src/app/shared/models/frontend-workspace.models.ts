export type FeaturePersistenceMode = 'seed-only' | 'session-only' | 'localStorage-persisted' | 'server-persisted';

export interface FeatureWorkspaceState {
  updatedAt: string;
  version: number;
  persistenceMode: FeaturePersistenceMode;
}

export interface FeatureFilterState {
  [key: string]: unknown;
}

export interface FeatureViewState {
  activeView: string;
  isFiltersExpanded: boolean;
}

export interface FeaturePaginationState {
  pageNumber: number;
  pageSize: number;
}
