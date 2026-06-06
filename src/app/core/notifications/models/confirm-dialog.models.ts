export type ConfirmDialogType = 'info' | 'success' | 'warning' | 'danger';

export interface ConfirmDialogData {
  title: string;
  message: string;
  type?: ConfirmDialogType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  direction?: 'rtl' | 'ltr';
  titleIsTranslationKey?: boolean;
  messageIsTranslationKey?: boolean;
  confirmTextIsTranslationKey?: boolean;
  cancelTextIsTranslationKey?: boolean;
}
