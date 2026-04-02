import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
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
  private readonly storageKey = 'vendor_support_workspace';
  private readonly ticketsSubject = new BehaviorSubject<VendorSupportTicketVm[]>(this.loadTickets());
  private readonly referenceArticles = this.buildReferenceArticles();

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
    localStorage.removeItem(this.storageKey);
    this.ticketsSubject.next(this.buildSeedTickets());
  }

  private loadTickets(): VendorSupportTicketVm[] {
    const stored = localStorage.getItem(this.storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as VendorSupportTicketVm[];
        return parsed.map((ticket) => ({
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
        }));
      } catch {
        return this.buildSeedTickets();
      }
    }

    return this.buildSeedTickets();
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
    const tickets: VendorSupportTicketVm[] = [
      {
        id: 'ticket-orders-1',
        reference: 'SUP-2401',
        subject: {
          ar: 'اعتراض على طلب متأخر وعميل يطلب تعويض',
          en: 'Delayed order dispute and customer compensation request'
        },
        category: 'orders',
        priority: 'high',
        status: 'open',
        createdAt: '2026-04-01T08:30:00.000Z',
        updatedAt: '2026-04-02T09:10:00.000Z',
        firstResponseHours: 0.7,
        summary: {
          ar: 'العميل اشتكى من تأخر الطلب رقم 1007 ويريد توثيق الإجراء قبل إغلاق الحالة.',
          en: 'The customer reported a delay on order 1007 and needs the resolution documented before closure.'
        },
        assignedAgentName: 'Mariam Saleh',
        assignedAgentRole: {
          ar: 'أخصائي دعم الموردين',
          en: 'Vendor Support Specialist'
        },
        assignedAgentOnline: true,
        tags: [
          { id: 'escalated', labelKey: 'SUPPORT_CENTER.TAGS.ESCALATED', tone: 'warning' },
          { id: 'sla', labelKey: 'SUPPORT_CENTER.TAGS.SLA_ACTIVE', tone: 'info' }
        ],
        linkedRoute: '/orders/ord_7',
        messages: [
          {
            id: 'msg-1',
            direction: 'support',
            author: 'Mariam Saleh',
            role: {
              ar: 'أخصائي دعم الموردين',
              en: 'Vendor Support Specialist'
            },
            message: {
              ar: 'راجعنا الطلب 1007 ونحتاج منك تأكيد ما إذا تم التواصل مع العميل وتقديم بديل أو قسيمة.',
              en: 'We reviewed order 1007 and need confirmation on whether the customer was contacted and offered a replacement or voucher.'
            },
            createdAt: '2026-04-02T08:00:00.000Z'
          },
          {
            id: 'msg-2',
            direction: 'vendor',
            author: 'Zadana Vendor Team',
            role: {
              ar: 'مسؤول المتجر',
              en: 'Store Admin'
            },
            message: {
              ar: 'تم الاتصال بالعميل وتم عرض خصم على الطلب القادم، ونحتاج فقط توثيق ذلك داخل الحالة.',
              en: 'The customer was contacted and a discount on the next order was offered. We only need this documented in the case.'
            },
            createdAt: '2026-04-02T09:10:00.000Z'
          }
        ]
      },
      {
        id: 'ticket-finance-1',
        reference: 'SUP-2388',
        subject: {
          ar: 'مراجعة فرق تسوية على تحويل الأسبوع',
          en: 'Settlement difference review for the weekly payout'
        },
        category: 'finance',
        priority: 'medium',
        status: 'in_progress',
        createdAt: '2026-03-30T10:20:00.000Z',
        updatedAt: '2026-04-01T13:25:00.000Z',
        firstResponseHours: 1.3,
        summary: {
          ar: 'هناك سؤال حول خصم عنصر مرتجع ضمن تسوية الأسبوع الحالي ومطلوب كشف أوضح.',
          en: 'There is a question about a returned item deduction in this week payout and a clearer statement is needed.'
        },
        assignedAgentName: 'Omar Nader',
        assignedAgentRole: {
          ar: 'منسق دعم مالي',
          en: 'Finance Support Coordinator'
        },
        assignedAgentOnline: false,
        tags: [
          { id: 'finance', labelKey: 'SUPPORT_CENTER.TAGS.FINANCE_REVIEW', tone: 'default' }
        ],
        linkedRoute: '/finance',
        messages: [
          {
            id: 'msg-3',
            direction: 'support',
            author: 'Omar Nader',
            role: {
              ar: 'منسق دعم مالي',
              en: 'Finance Support Coordinator'
            },
            message: {
              ar: 'أرسلنا ملخصًا أوليًا ونراجع الآن حركة الطلب المرجعي قبل إغلاق التذكرة.',
              en: 'An initial summary was sent and we are now reviewing the reference order movement before closing the ticket.'
            },
            createdAt: '2026-04-01T13:25:00.000Z'
          }
        ]
      },
      {
        id: 'ticket-products-1',
        reference: 'SUP-2369',
        subject: {
          ar: 'منتج موقوف ويحتاج مستند مطابقة',
          en: 'A paused product needs a compliance document'
        },
        category: 'products',
        priority: 'medium',
        status: 'waiting_vendor',
        createdAt: '2026-03-28T11:40:00.000Z',
        updatedAt: '2026-03-31T16:00:00.000Z',
        firstResponseHours: 0.9,
        summary: {
          ar: 'فريق المراجعة طلب مستندًا إضافيًا لإعادة تفعيل المنتج قبل عودته للعرض.',
          en: 'The review team requested an extra document to reactivate the product before it goes live again.'
        },
        assignedAgentName: 'Hadeer Adel',
        assignedAgentRole: {
          ar: 'منسق اعتماد المنتجات',
          en: 'Product Compliance Coordinator'
        },
        assignedAgentOnline: true,
        tags: [
          { id: 'waiting', labelKey: 'SUPPORT_CENTER.TAGS.WAITING_VENDOR', tone: 'warning' },
          { id: 'docs', labelKey: 'SUPPORT_CENTER.TAGS.DOCS_REQUIRED', tone: 'info' }
        ],
        linkedRoute: '/products/v2',
        messages: [
          {
            id: 'msg-4',
            direction: 'support',
            author: 'Hadeer Adel',
            role: {
              ar: 'منسق اعتماد المنتجات',
              en: 'Product Compliance Coordinator'
            },
            message: {
              ar: 'نحتاج نسخة أوضح من المستند أو صورة العبوة النهائية قبل رفع التجميد عن المنتج.',
              en: 'We need a clearer document copy or the final package image before the product freeze can be lifted.'
            },
            createdAt: '2026-03-31T16:00:00.000Z'
          }
        ]
      },
      {
        id: 'ticket-tech-1',
        reference: 'SUP-2331',
        subject: {
          ar: 'مشكلة دخول تم حلها وإغلاقها',
          en: 'Login issue resolved and closed'
        },
        category: 'technical',
        priority: 'low',
        status: 'resolved',
        createdAt: '2026-03-20T08:05:00.000Z',
        updatedAt: '2026-03-20T12:30:00.000Z',
        firstResponseHours: 0.5,
        summary: {
          ar: 'تمت معالجة مشكلة الجلسة وتأكيد الدخول من جديد بدون إجراءات إضافية.',
          en: 'The session issue was fixed and login was confirmed without further action.'
        },
        assignedAgentName: 'Youssef Samir',
        assignedAgentRole: {
          ar: 'مهندس دعم تقني',
          en: 'Technical Support Engineer'
        },
        assignedAgentOnline: false,
        tags: [
          { id: 'resolved', labelKey: 'SUPPORT_CENTER.TAGS.RESOLVED', tone: 'success' }
        ],
        linkedRoute: '/profile',
        messages: [
          {
            id: 'msg-5',
            direction: 'support',
            author: 'Youssef Samir',
            role: {
              ar: 'مهندس دعم تقني',
              en: 'Technical Support Engineer'
            },
            message: {
              ar: 'تم تحديث الجلسة وإعادة تسجيل الدخول بنجاح. يمكن إغلاق التذكرة الآن.',
              en: 'The session was refreshed and login worked successfully again. The ticket can now be closed.'
            },
            createdAt: '2026-03-20T12:30:00.000Z'
          }
        ]
      }
    ];

    this.persistTickets(tickets);
    return tickets;
  }

  private buildReferenceArticles(): SupportReferenceArticleVm[] {
    return [
      {
        id: 'article-orders-delay',
        title: {
          ar: 'دليل التعامل مع الطلبات المتأخرة',
          en: 'Delayed order handling guide'
        },
        summary: {
          ar: 'خطوات عملية لمراجعة الطلب المتأخر، وتوثيق التواصل مع العميل، وربط الحالة بالدعم عند الحاجة.',
          en: 'Practical steps to review a delayed order, document customer communication, and escalate to support when needed.'
        },
        category: 'orders',
        type: 'guide',
        readTimeMinutes: 5,
        updatedAt: '2026-03-30T09:00:00.000Z',
        sections: [
          {
            title: {
              ar: 'قبل التصعيد',
              en: 'Before escalation'
            },
            points: [
              {
                ar: 'راجع حالة الطلب، آخر تحديث في الجدول الزمني، وهل تم تعيين السائق أو ما زال داخل الفرع.',
                en: 'Review the order state, last timeline update, and whether the driver was assigned or the order is still inside the branch.'
              },
              {
                ar: 'وثّق محاولة التواصل مع العميل وأي تعويض أو بديل تم عرضه.',
                en: 'Document the customer contact attempt and any compensation or alternative that was offered.'
              }
            ]
          },
          {
            title: {
              ar: 'متى تفتح تذكرة دعم',
              en: 'When to open a support ticket'
            },
            points: [
              {
                ar: 'إذا كانت الحالة مرتبطة بنزاع مالي أو اعتراض عميل أو تأخير ممتد لا يمكن حله من الفرع.',
                en: 'When the case involves a financial dispute, a customer objection, or a prolonged delay that the branch cannot resolve.'
              }
            ]
          }
        ],
        relatedLinks: [
          { labelKey: 'SIDEBAR.ORDERS', route: '/orders' },
          { labelKey: 'SIDEBAR.REVIEWS', route: '/reviews' }
        ],
        escalationNote: {
          ar: 'إذا تكرر نفس النمط على أكثر من طلب خلال اليوم، افتح تذكرة دعم بدل معالجة كل حالة بمعزل.',
          en: 'If the same pattern repeats across multiple orders in one day, open a support ticket instead of handling each case in isolation.'
        }
      },
      {
        id: 'article-finance-settlement',
        title: {
          ar: 'مرجع تسويات المورد والتحويلات',
          en: 'Vendor settlement and payout reference'
        },
        summary: {
          ar: 'مرجع سريع لمراجعة الفروقات المالية، التسويات المعلقة، ومتى يتم توجيه الحالة إلى دعم المالية.',
          en: 'A quick reference for reviewing payout differences, pending settlements, and when a case should be routed to finance support.'
        },
        category: 'finance',
        type: 'checklist',
        readTimeMinutes: 6,
        updatedAt: '2026-03-27T13:00:00.000Z',
        sections: [
          {
            title: {
              ar: 'قائمة التحقق',
              en: 'Checklist'
            },
            points: [
              {
                ar: 'طابق المبلغ محل السؤال مع الطلبات المرجعية أو المرتجعات خلال نفس الدورة.',
                en: 'Match the questioned amount against the related orders or returns within the same cycle.'
              },
              {
                ar: 'راجع ما إذا كان الفرق مرتبطًا برسوم منصة أو عنصر تم استرجاعه لاحقًا.',
                en: 'Check whether the difference is tied to platform fees or an item that was returned later.'
              }
            ]
          }
        ],
        relatedLinks: [
          { labelKey: 'SIDEBAR.FINANCE', route: '/finance' },
          { labelKey: 'SIDEBAR.ORDERS', route: '/orders' }
        ],
        escalationNote: {
          ar: 'إذا كان الفرق المالي لا يمكن ربطه بطلبات واضحة، افتح تذكرة دعم مالية وأرفق المرجع الزمني للدورة.',
          en: 'If the payout difference cannot be tied to clear orders, open a finance support ticket and include the cycle reference.'
        }
      },
      {
        id: 'article-products-activation',
        title: {
          ar: 'دليل إعادة تفعيل المنتجات الموقوفة',
          en: 'Reactivating paused products'
        },
        summary: {
          ar: 'خطوات مراجعة سبب الإيقاف، تجهيز المستندات، وربط الحالة بصفحة المنتجات قبل طلب الدعم.',
          en: 'Steps to review the pause reason, prepare the required documents, and connect the case to the product page before contacting support.'
        },
        category: 'products',
        type: 'guide',
        readTimeMinutes: 4,
        updatedAt: '2026-03-25T11:15:00.000Z',
        sections: [
          {
            title: {
              ar: 'ما الذي تراجعه أولاً',
              en: 'What to review first'
            },
            points: [
              {
                ar: 'تحقق من الاسم، السعر، الفئة، والصور وهل هناك نقص في البيانات الأساسية.',
                en: 'Check the name, price, category, and images to confirm whether core product data is missing.'
              },
              {
                ar: 'راجع أي مستند أو توضيح طُلب مسبقًا من فريق المراجعة.',
                en: 'Review any document or clarification previously requested by the review team.'
              }
            ]
          }
        ],
        relatedLinks: [
          { labelKey: 'SIDEBAR.PRODUCTS', route: '/products' }
        ],
        escalationNote: {
          ar: 'لا تفتح تذكرة جديدة إذا كانت هناك تذكرة مفتوحة بنفس المنتج؛ أضف الرد داخل الحالة الحالية.',
          en: 'Do not open a new ticket if an active ticket already exists for the same product; reply inside the current case instead.'
        }
      },
      {
        id: 'article-offers-policy',
        title: {
          ar: 'سياسة العروض والخصومات قبل النشر',
          en: 'Offers and discount policy before publishing'
        },
        summary: {
          ar: 'مرجع سريع لفحص صلاحية العرض، السعر قبل الخصم، وتوافق مدة الحملة مع المخزون المتاح.',
          en: 'A quick reference to validate the offer, compare-at price, and campaign duration against available stock.'
        },
        category: 'offers',
        type: 'policy',
        readTimeMinutes: 3,
        updatedAt: '2026-03-21T10:05:00.000Z',
        sections: [
          {
            title: {
              ar: 'أهم قواعد النشر',
              en: 'Core publishing rules'
            },
            points: [
              {
                ar: 'احرص أن يكون السعر قبل الخصم حقيقيًا ومستخدمًا فعلاً قبل تفعيل العرض.',
                en: 'Make sure the compare-at price is genuine and was actually used before enabling the offer.'
              },
              {
                ar: 'لا تنشر عرضًا ممتدًا إذا كان المخزون منخفضًا أو الفرع المخصص غير جاهز للتنفيذ.',
                en: 'Do not publish a long-running offer when stock is low or the assigned branch is not operationally ready.'
              }
            ]
          }
        ],
        relatedLinks: [
          { labelKey: 'SIDEBAR.OFFERS', route: '/offers' },
          { labelKey: 'SIDEBAR.PRODUCTS', route: '/products' }
        ],
        escalationNote: {
          ar: 'إذا تم رفض العرض بسبب سياسة أو تسعير، راجع المرجع أولاً ثم افتح دعمًا إذا ظل سبب الرفض غير واضح.',
          en: 'If an offer is blocked by policy or pricing, review the reference first and contact support only if the rejection reason remains unclear.'
        }
      },
      {
        id: 'article-staff-branches',
        title: {
          ar: 'مرجع صلاحيات الفروع والموظفين',
          en: 'Branches and staff permissions reference'
        },
        summary: {
          ar: 'يفسر متى تستخدم مدير فرع أو موظف طلبات أو موظف مخزون، وكيف تراجع الوصول قبل إرسال الدعوة.',
          en: 'Explains when to use a branch manager, orders clerk, or inventory clerk, and how to review access before sending the invitation.'
        },
        category: 'staff',
        type: 'checklist',
        readTimeMinutes: 5,
        updatedAt: '2026-03-24T12:40:00.000Z',
        sections: [
          {
            title: {
              ar: 'قبل إرسال الدعوة',
              en: 'Before sending an invitation'
            },
            points: [
              {
                ar: 'حدد الفروع التي يحتاج الموظف الوصول إليها فعلًا ولا تمنح صلاحيات أوسع من اللازم.',
                en: 'Choose only the branches the employee truly needs and avoid broader access than required.'
              },
              {
                ar: 'ابدأ بقالب جاهز ثم فعّل التخصيص فقط إذا كانت الحالة التشغيلية تستدعي ذلك.',
                en: 'Start from a ready template and enable customization only when the operating case really needs it.'
              }
            ]
          }
        ],
        relatedLinks: [
          { labelKey: 'SIDEBAR.STAFF_BRANCHES', route: '/staff' }
        ],
        escalationNote: {
          ar: 'إذا ظهر تعارض في الصلاحيات أو الدعوات، افتح تذكرة دعم مع ذكر الفروع المعنية والموظف المستهدف.',
          en: 'If permissions or invitation conflicts appear, open a support ticket and mention the affected branches and target employee.'
        }
      },
      {
        id: 'article-profile-readiness',
        title: {
          ar: 'مرجع جاهزية الملف التجاري',
          en: 'Store profile readiness reference'
        },
        summary: {
          ar: 'مرجع يجمع أهم ما يجب مراجعته في الملف التجاري والبيانات القانونية والتحويلات قبل طلب المساعدة.',
          en: 'A reference for what to review in the store profile, legal data, and payouts before asking for help.'
        },
        category: 'profile',
        type: 'guide',
        readTimeMinutes: 4,
        updatedAt: '2026-03-18T09:50:00.000Z',
        sections: [
          {
            title: {
              ar: 'العناصر الحساسة',
              en: 'Sensitive items'
            },
            points: [
              {
                ar: 'راجع السجل التجاري والرقم الضريبي وتاريخ الانتهاء قبل أي متابعة دعم.',
                en: 'Review the commercial registration, tax number, and expiry date before escalating any support request.'
              },
              {
                ar: 'تأكد من بيانات البنك وIBAN قبل الاستفسار عن التحويلات أو التأخير المالي.',
                en: 'Confirm the bank details and IBAN before asking about payouts or financial delays.'
              }
            ]
          }
        ],
        relatedLinks: [
          { labelKey: 'SIDEBAR.SETTINGS', route: '/profile' },
          { labelKey: 'SIDEBAR.FINANCE', route: '/finance' }
        ],
        escalationNote: {
          ar: 'كلما كانت البيانات مكتملة داخل الملف، كانت معالجة الدعم أسرع وأكثر دقة.',
          en: 'The more complete the profile data is, the faster and more accurate support handling becomes.'
        }
      }
    ];
  }

  private setTickets(projector: (tickets: VendorSupportTicketVm[]) => VendorSupportTicketVm[]): void {
    const nextTickets = projector(this.ticketsSubject.value);
    this.persistTickets(nextTickets);
    this.ticketsSubject.next(nextTickets);
  }

  private persistTickets(tickets: VendorSupportTicketVm[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(tickets));
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
