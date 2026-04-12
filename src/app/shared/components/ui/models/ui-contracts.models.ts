export interface QuickTabVm {
  count?: number | string;
  icon?: string;
  attention?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface FilterFieldVm {
  id: string;
  type: 'text' | 'select' | 'date' | 'number' | 'toggle';
  label: string;
  placeholder?: string;
  value?: unknown;
  options?: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export interface MetricCardVm {
  label: string;
  value: string | number;
  hint?: string;
  hintParams?: Record<string, unknown>;
  translateLabel?: boolean;
  translateHint?: boolean;
  customClass?: string;
}

export interface EmptyStateVm {
  title: string;
  subtitle?: string;
  translateTitle?: boolean;
  translateSubtitle?: boolean;
  compact?: boolean;
  dashed?: boolean;
  customClass?: string;
}

export type StatusChipTone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';

export interface StatusChipVm {
  label: string;
  tone?: StatusChipTone;
  translateLabel?: boolean;
  dot?: boolean;
  rounded?: 'full' | 'lg';
  size?: 'sm' | 'md' | 'lg';
  customClass?: string;
}

export interface RowActionVm {
  id: string;
  label: string;
  icon?: string;
  ariaLabel?: string;
  disabled?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
}
