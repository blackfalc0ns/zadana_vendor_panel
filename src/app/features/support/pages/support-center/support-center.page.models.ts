import { SupportArticleType, SupportCategory, SupportPriority, SupportTicketStatus } from '../../models/support-center.models';

export interface SupportFilters {
  search: string;
  status: 'all' | SupportTicketStatus;
  priority: 'all' | SupportPriority;
  category: 'all' | SupportCategory;
}

export interface ReferenceFilters {
  search: string;
  category: 'all' | SupportCategory;
  type: 'all' | SupportArticleType;
}

export interface CreateTicketDraft {
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  message: string;
}
