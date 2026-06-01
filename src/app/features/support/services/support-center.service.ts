import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateSupportTicketInput,
  LocalizedTextVm,
  SupportMessageVm,
  SupportReferenceArticleVm,
  SupportSummaryVm,
  SupportTicketStatus,
  VendorSupportTicketVm,
  cloneSupportReferenceArticle,
  cloneSupportReferenceArticles,
  cloneSupportTicket,
  cloneSupportTickets
} from '../models/support-center.models';

interface VendorSupportTicketsListResponseApi {
  items: VendorSupportTicketVm[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupportCenterService {
  private readonly apiUrl = `${environment.apiUrl}/vendor/support/tickets`;
  private readonly ticketsSubject = new BehaviorSubject<VendorSupportTicketVm[]>([]);
  private readonly referenceArticles = this.buildReferenceArticles();

  constructor(private readonly http: HttpClient) {
    this.loadTickets();
  }

  getTickets(): Observable<VendorSupportTicketVm[]> {
    return this.ticketsSubject.pipe(map((tickets) => cloneSupportTickets(tickets)));
  }

  getSummary(): Observable<SupportSummaryVm> {
    return this.ticketsSubject.pipe(map((tickets) => this.buildSummary(tickets)));
  }

  getReferenceArticles(): Observable<SupportReferenceArticleVm[]> {
    return of(cloneSupportReferenceArticles(this.referenceArticles));
  }

  getTicketById(ticketId: string): Observable<VendorSupportTicketVm | null> {
    return this.http.get<VendorSupportTicketVm>(`${this.apiUrl}/${ticketId}`).pipe(
      map((ticket) => this.normalizeTicket(ticket)),
      tap((ticket) => this.upsertTicket(ticket)),
      map((ticket) => cloneSupportTicket(ticket)),
      catchError(() => of(null))
    );
  }

  getReferenceArticleById(articleId: string): Observable<SupportReferenceArticleVm | null> {
    const article = this.referenceArticles.find((item) => item.id === articleId);
    return of(article ? cloneSupportReferenceArticle(article) : null);
  }

  createTicket(input: CreateSupportTicketInput): Observable<VendorSupportTicketVm> {
    const body = {
      subject: this.resolveText(input.subject),
      category: input.category,
      priority: input.priority,
      message: this.resolveText(input.initialMessage),
      orderId: input.orderId?.trim() || null
    };

    return this.http.post<VendorSupportTicketVm>(this.apiUrl, body).pipe(
      map((ticket) => this.normalizeTicket(ticket)),
      tap((ticket) => this.upsertTicket(ticket)),
      map((ticket) => cloneSupportTicket(ticket))
    );
  }

  addVendorMessage(ticketId: string, message: LocalizedTextVm, _authorName: string): Observable<VendorSupportTicketVm> {
    const normalizedMessage = this.resolveText(message);
    if (!normalizedMessage) {
      return this.getTicketById(ticketId).pipe(
        map((ticket) => ticket as VendorSupportTicketVm)
      );
    }

    return this.http.post<VendorSupportTicketVm>(`${this.apiUrl}/${ticketId}/messages`, {
      message: normalizedMessage
    }).pipe(
      map((ticket) => this.normalizeTicket(ticket)),
      tap((ticket) => this.upsertTicket(ticket)),
      map((ticket) => cloneSupportTicket(ticket))
    );
  }

  resetSeedState(): void {
    this.loadTickets();
  }

  refresh(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.http.get<VendorSupportTicketsListResponseApi>(this.apiUrl, {
      params: new HttpParams()
        .set('page', '1')
        .set('pageSize', '100')
    }).pipe(
      map((response) => (response.items || []).map((ticket) => this.normalizeTicket(ticket))),
      catchError(() => of([]))
    ).subscribe((tickets) => this.ticketsSubject.next(tickets));
  }

  private buildSummary(tickets: VendorSupportTicketVm[]): SupportSummaryVm {
    const activeTickets = tickets.filter((ticket) => ticket.status !== 'resolved');
    const respondedTickets = tickets.filter((ticket) => ticket.firstResponseHours > 0);
    const averageResponseHours = respondedTickets.length
      ? Number((respondedTickets.reduce((sum, ticket) => sum + ticket.firstResponseHours, 0) / respondedTickets.length).toFixed(1))
      : 0;

    return {
      openTickets: activeTickets.length,
      pendingFollowUps: tickets.filter((ticket) => ticket.status === 'waiting_vendor').length,
      averageResponseHours,
      referenceCount: this.referenceArticles.length
    };
  }

  private buildReferenceArticles(): SupportReferenceArticleVm[] {
    return [];
  }

  private upsertTicket(ticket: VendorSupportTicketVm): void {
    const existing = this.ticketsSubject.value.filter((item) => item.id !== ticket.id);
    this.ticketsSubject.next([ticket, ...existing].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }

  private normalizeTicket(ticket: VendorSupportTicketVm): VendorSupportTicketVm {
    const category = ticket.category || 'general';
    const status = this.normalizeStatus(ticket.status);
    const priority = ticket.priority || 'medium';
    const summary = ticket.summary ?? ticket.subject ?? { ar: '', en: '' };

    return {
      ...ticket,
      category,
      status,
      priority,
      subject: { ...(ticket.subject ?? { ar: '', en: '' }) },
      summary: { ...summary },
      firstResponseHours: Number(ticket.firstResponseHours || 0),
      assignedAgentName: ticket.assignedAgentName || 'Zadana Support',
      assignedAgentRole: { ...(ticket.assignedAgentRole ?? { ar: 'Vendor Support Specialist', en: 'Vendor Support Specialist' }) },
      assignedAgentOnline: ticket.assignedAgentOnline ?? true,
      tags: (ticket.tags || []).map((tag) => ({ ...tag })),
      messages: (ticket.messages || []).map((message) => this.normalizeMessage(message)),
      orderId: ticket.orderId ?? null,
      orderNumber: ticket.orderNumber ?? null,
      linkedRoute: ticket.linkedRoute ?? (ticket.orderId ? `/orders/${ticket.orderId}` : undefined)
    };
  }

  private normalizeMessage(message: SupportMessageVm): SupportMessageVm {
    return {
      ...message,
      role: { ...(message.role ?? { ar: '', en: '' }) },
      message: { ...(message.message ?? { ar: '', en: '' }) }
    };
  }

  private normalizeStatus(value: string): SupportTicketStatus {
    switch ((value || '').trim().toLowerCase()) {
      case 'inprogress':
      case 'in_progress':
        return 'in_progress';
      case 'waitingvendor':
      case 'waiting_vendor':
        return 'waiting_vendor';
      case 'resolved':
        return 'resolved';
      default:
        return 'open';
    }
  }

  private resolveText(value: LocalizedTextVm): string {
    return (value.en || value.ar || '').trim();
  }
}
