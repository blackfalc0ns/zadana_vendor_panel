import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateSupportTicketInput,
  LocalizedTextVm,
  SupportCategory,
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
@Injectable({
  providedIn: 'root'
})
export class SupportCenterService {
  private readonly stateUrl = `${environment.apiUrl}/vendor/workspace-state/support`;
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
    return this.ticketsSubject.pipe(
      map((tickets) => {
        const ticket = tickets.find((item) => item.id === ticketId);
        return ticket ? cloneSupportTicket(ticket) : null;
      })
    );
  }

  getReferenceArticleById(articleId: string): Observable<SupportReferenceArticleVm | null> {
    const article = this.referenceArticles.find((item) => item.id === articleId);
    return of(article ? cloneSupportReferenceArticle(article) : null);
  }

  createTicket(input: CreateSupportTicketInput): VendorSupportTicketVm {
    const timestamp = new Date().toISOString();
    const ticket: VendorSupportTicketVm = {
      id: this.generateId('ticket'),
      reference: this.generateReference(),
      subject: { ...input.subject },
      category: input.category,
      priority: input.priority,
      status: 'open',
      createdAt: timestamp,
      updatedAt: timestamp,
      firstResponseHours: 0.8,
      summary: { ...input.summary },
      assignedAgentName: 'Mariam Saleh',
      assignedAgentRole: {
        ar: 'أخصائي دعم الموردين',
        en: 'Vendor Support Specialist'
      },
      assignedAgentOnline: true,
      tags: [
        { id: 'new', labelKey: 'SUPPORT_CENTER.TAGS.NEW_CASE', tone: 'info' },
        { id: 'sla', labelKey: 'SUPPORT_CENTER.TAGS.SLA_ACTIVE', tone: 'warning' }
      ],
      messages: [
        {
          id: this.generateId('message'),
          direction: 'vendor',
          author: input.authorName,
          role: {
            ar: 'مسؤول المتجر',
            en: 'Store Admin'
          },
          message: { ...input.initialMessage },
          createdAt: timestamp
        }
      ]
    };

    this.setTickets((tickets) => [ticket, ...tickets]);
    return ticket;
  }

  addVendorMessage(ticketId: string, message: LocalizedTextVm, authorName: string): void {
    const normalizedAr = message.ar.trim();
    const normalizedEn = message.en.trim();

    if (!normalizedAr && !normalizedEn) {
      return;
    }

    const timestamp = new Date().toISOString();

    this.setTickets((tickets) => tickets.map((ticket) => {
      if (ticket.id !== ticketId) {
        return ticket;
      }

      const nextMessage: SupportMessageVm = {
        id: this.generateId('message'),
        direction: 'vendor',
        author: authorName,
        role: {
          ar: 'مسؤول المتجر',
          en: 'Store Admin'
        },
        message: {
          ar: normalizedAr || normalizedEn,
          en: normalizedEn || normalizedAr
        },
        createdAt: timestamp
      };

      const nextStatus: SupportTicketStatus = ticket.status === 'resolved' ? 'in_progress' : 'in_progress';

      return {
        ...ticket,
        status: nextStatus,
        updatedAt: timestamp,
        messages: [...ticket.messages, nextMessage]
      };
    }));
  }

  resetSeedState(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.http.get<VendorSupportTicketVm[]>(this.stateUrl).subscribe({
      next: (tickets) => this.ticketsSubject.next((tickets || []).map((ticket) => this.normalizeTicket(ticket))),
      error: () => this.ticketsSubject.next([])
    });
  }

  private buildSummary(tickets: VendorSupportTicketVm[]): SupportSummaryVm {
    const activeTickets = tickets.filter((ticket) => ticket.status !== 'resolved');
    const averageResponseHours = tickets.length
      ? Number((tickets.reduce((sum, ticket) => sum + ticket.firstResponseHours, 0) / tickets.length).toFixed(1))
      : 0;

    return {
      openTickets: activeTickets.length,
      pendingFollowUps: tickets.filter((ticket) => ticket.status === 'waiting_vendor').length,
      averageResponseHours,
      referenceCount: this.referenceArticles.length
    };
  }

  private buildSeedTickets(): VendorSupportTicketVm[] {
    this.persistTickets([]);
    return [];
  }

  private buildReferenceArticles(): SupportReferenceArticleVm[] {
    return [];
  }

  private setTickets(projector: (tickets: VendorSupportTicketVm[]) => VendorSupportTicketVm[]): void {
    const nextTickets = projector(this.ticketsSubject.value);
    this.persistTickets(nextTickets);
    this.ticketsSubject.next(nextTickets);
  }

  private persistTickets(tickets: VendorSupportTicketVm[]): void {
    this.http.put(this.stateUrl, tickets).subscribe();
  }

  private normalizeTicket(ticket: VendorSupportTicketVm): VendorSupportTicketVm {
    return {
      ...ticket,
      subject: { ...ticket.subject },
      summary: { ...ticket.summary },
      assignedAgentRole: { ...ticket.assignedAgentRole },
      tags: ticket.tags.map((tag) => ({ ...tag })),
      messages: ticket.messages.map((message) => ({
        ...message,
        role: { ...message.role },
        message: { ...message.message }
      }))
    };
  }

  private generateReference(): string {
    return `SUP-${Math.floor(2400 + Math.random() * 400)}`;
  }

  private generateId(prefix: string): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
