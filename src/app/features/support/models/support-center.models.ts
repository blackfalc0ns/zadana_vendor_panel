export type SupportCenterView = 'support' | 'reference';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_vendor' | 'resolved';
export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportCategory = 'orders' | 'products' | 'finance' | 'offers' | 'staff' | 'profile' | 'technical' | 'general';
export type SupportArticleType = 'guide' | 'policy' | 'checklist';
export type SupportMessageDirection = 'vendor' | 'support';
export type SupportTagTone = 'default' | 'warning' | 'success' | 'info';

export interface LocalizedTextVm {
  ar: string;
  en: string;
}

export interface SupportMessageVm {
  id: string;
  direction: SupportMessageDirection;
  author: string;
  role: LocalizedTextVm;
  message: LocalizedTextVm;
  createdAt: string;
}

export interface SupportTagVm {
  id: string;
  labelKey: string;
  tone: SupportTagTone;
}

export interface VendorSupportTicketVm {
  id: string;
  reference: string;
  subject: LocalizedTextVm;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  firstResponseHours: number;
  summary: LocalizedTextVm;
  assignedAgentName: string;
  assignedAgentRole: LocalizedTextVm;
  assignedAgentOnline: boolean;
  tags: SupportTagVm[];
  messages: SupportMessageVm[];
  linkedRoute?: string;
}

export interface SupportReferenceSectionVm {
  title: LocalizedTextVm;
  points: LocalizedTextVm[];
}

export interface SupportReferenceLinkVm {
  labelKey: string;
  route: string;
}

export interface SupportReferenceArticleVm {
  id: string;
  title: LocalizedTextVm;
  summary: LocalizedTextVm;
  category: SupportCategory;
  type: SupportArticleType;
  readTimeMinutes: number;
  updatedAt: string;
  sections: SupportReferenceSectionVm[];
  relatedLinks: SupportReferenceLinkVm[];
  escalationNote: LocalizedTextVm;
}

export interface SupportSummaryVm {
  openTickets: number;
  pendingFollowUps: number;
  averageResponseHours: number;
  referenceCount: number;
}

export interface CreateSupportTicketInput {
  subject: LocalizedTextVm;
  category: SupportCategory;
  priority: SupportPriority;
  summary: LocalizedTextVm;
  initialMessage: LocalizedTextVm;
  authorName: string;
}

export function cloneLocalizedText(value: LocalizedTextVm): LocalizedTextVm {
  return { ...value };
}

export function cloneSupportMessage(message: SupportMessageVm): SupportMessageVm {
  return {
    ...message,
    role: cloneLocalizedText(message.role),
    message: cloneLocalizedText(message.message)
  };
}

export function cloneSupportTicket(ticket: VendorSupportTicketVm): VendorSupportTicketVm {
  return {
    ...ticket,
    subject: cloneLocalizedText(ticket.subject),
    summary: cloneLocalizedText(ticket.summary),
    assignedAgentRole: cloneLocalizedText(ticket.assignedAgentRole),
    tags: ticket.tags.map((tag) => ({ ...tag })),
    messages: ticket.messages.map((message) => cloneSupportMessage(message))
  };
}

export function cloneSupportTickets(tickets: VendorSupportTicketVm[]): VendorSupportTicketVm[] {
  return tickets.map((ticket) => cloneSupportTicket(ticket));
}

export function cloneSupportReferenceArticle(article: SupportReferenceArticleVm): SupportReferenceArticleVm {
  return {
    ...article,
    title: cloneLocalizedText(article.title),
    summary: cloneLocalizedText(article.summary),
    escalationNote: cloneLocalizedText(article.escalationNote),
    sections: article.sections.map((section) => ({
      title: cloneLocalizedText(section.title),
      points: section.points.map((point) => cloneLocalizedText(point))
    })),
    relatedLinks: article.relatedLinks.map((link) => ({ ...link }))
  };
}

export function cloneSupportReferenceArticles(articles: SupportReferenceArticleVm[]): SupportReferenceArticleVm[] {
  return articles.map((article) => cloneSupportReferenceArticle(article));
}
