import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, of, take } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface PublicLegalDocumentDto {
  documentType?: string;
  contentAr?: string | null;
  contentEn?: string | null;
  version?: string | null;
  effectiveAtUtc?: string | null;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-vendor-terms',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="min-h-[100dvh] bg-slate-50" [attr.dir]="isRTL ? 'rtl' : 'ltr'">
      <header class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div class="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div class="min-w-0">
            <p class="text-[11px] font-black uppercase tracking-widest text-zadna-primary">{{ 'LEGAL.TERMS.BADGE' | translate }}</p>
            <h1 class="truncate text-lg font-black text-slate-900 sm:text-xl">{{ 'LEGAL.TERMS.TITLE' | translate }}</h1>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              (click)="switchLanguage(isRTL ? 'en' : 'ar')"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600 transition hover:border-zadna-primary/30 hover:text-zadna-primary">
              {{ isRTL ? ('COMMON.ENGLISH' | translate) : ('COMMON.ARABIC' | translate) }}
            </button>
            <button
              type="button"
              (click)="goBack()"
              class="rounded-xl bg-zadna-primary px-3 py-2 text-[11px] font-black text-white shadow-sm transition hover:opacity-90">
              {{ 'LEGAL.TERMS.BACK' | translate }}
            </button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p class="text-[13px] font-bold leading-relaxed text-slate-600">{{ 'LEGAL.TERMS.INTRO' | translate }}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-[11px] font-black">
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">{{ 'LEGAL.TERMS.VERSION' | translate }}: {{ versionLabel }}</span>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">{{ 'LEGAL.TERMS.EFFECTIVE' | translate }}: {{ effectiveLabel }}</span>
          </div>
        </div>

        <article
          *ngIf="!loadError && htmlContent"
          class="legal-doc rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          [innerHTML]="htmlContent">
        </article>

        <div *ngIf="isLoading" class="space-y-3 rounded-[28px] border border-slate-200 bg-white p-6">
          <div *ngFor="let _ of [1,2,3,4,5]" class="h-4 animate-pulse rounded bg-slate-100"></div>
        </div>

        <div *ngIf="loadError" class="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-[13px] font-bold text-rose-700">
          {{ 'LEGAL.TERMS.LOAD_ERROR' | translate }}
        </div>

        <p class="mt-6 text-center text-[11px] font-bold text-slate-400">{{ 'LEGAL.TERMS.FOOTER' | translate }}</p>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .legal-doc :where(h1) {
      font-size: 1.35rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 1rem;
      line-height: 1.35;
    }
    .legal-doc :where(h2) {
      font-size: 1.05rem;
      font-weight: 900;
      color: #0f172a;
      margin: 1.75rem 0 0.75rem;
      padding-top: 0.25rem;
      border-top: 1px solid #f1f5f9;
    }
    .legal-doc :where(h2:first-child) { border-top: 0; padding-top: 0; }
    .legal-doc :where(p),
    .legal-doc :where(li) {
      font-size: 0.86rem;
      font-weight: 600;
      color: #334155;
      line-height: 1.75;
    }
    .legal-doc :where(p) { margin: 0.65rem 0; }
    .legal-doc :where(ul),
    .legal-doc :where(ol) {
      margin: 0.5rem 0 0.75rem;
      padding-inline-start: 1.25rem;
    }
    .legal-doc :where(li) { margin: 0.35rem 0; }
    .legal-doc :where(strong) { color: #0f172a; font-weight: 800; }
    .legal-doc :where(blockquote) {
      margin: 1rem 0;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 600;
      line-height: 1.7;
    }
    .legal-doc :where(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.8rem;
      overflow: hidden;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
    }
    .legal-doc :where(th),
    .legal-doc :where(td) {
      border: 1px solid #e2e8f0;
      padding: 0.65rem 0.75rem;
      text-align: start;
      vertical-align: top;
      font-weight: 650;
      color: #334155;
    }
    .legal-doc :where(th) {
      background: #f8fafc;
      font-weight: 900;
      color: #0f172a;
    }
    .legal-doc :where(hr) {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 1.5rem 0;
    }
  `]
})
export class VendorTermsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  htmlContent: SafeHtml | null = null;
  isLoading = true;
  loadError = false;
  versionLabel = '1.0';
  effectiveLabel = '2026-07-24';

  get isRTL(): boolean {
    return (this.translate.currentLang || 'ar').startsWith('ar');
  }

  ngOnInit(): void {
    this.translate.onLangChange.subscribe(() => this.loadTerms());
    this.loadTerms();
  }

  switchLanguage(lang: 'ar' | 'en'): void {
    this.translate.use(lang);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/login');
  }

  private loadTerms(): void {
    const lang = (this.translate.currentLang || 'ar').startsWith('ar') ? 'ar' : 'en';
    this.isLoading = true;
    this.loadError = false;
    this.htmlContent = null;
    this.cdr.markForCheck();

    this.http
      .get<PublicLegalDocumentDto>(`${environment.apiUrl}/public/legal/VendorTerms`)
      .pipe(
        take(1),
        catchError(() => of(null))
      )
      .subscribe({
        next: (document) => {
          const markdown = lang === 'ar'
            ? (document?.contentAr ?? '').trim()
            : (document?.contentEn ?? '').trim();

          if (markdown) {
            this.applyMarkdown(
              markdown,
              document?.version,
              document?.effectiveAtUtc
            );
            return;
          }

          this.loadLocalFallback(lang);
        }
      });
  }

  private loadLocalFallback(lang: 'ar' | 'en'): void {
    this.http.get(`assets/legal/vendor_terms_${lang}.md`, { responseType: 'text' }).pipe(take(1)).subscribe({
      next: (markdown) => {
        this.applyMarkdown(markdown, '1.0', '2026-07-24');
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
        this.cdr.markForCheck();
      }
    });
  }

  private applyMarkdown(markdown: string, version?: string | null, effectiveAtUtc?: string | null): void {
    this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(this.renderMarkdown(markdown));
    this.versionLabel = (version ?? '').trim() || '1.0';
    this.effectiveLabel = this.formatEffectiveDate(effectiveAtUtc) || '2026-07-24';
    this.isLoading = false;
    this.loadError = false;
    this.cdr.markForCheck();
  }

  private formatEffectiveDate(value?: string | null): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  }

  private renderMarkdown(source: string): string {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const html: string[] = [];
    let inUl = false;
    let inOl = false;
    let inTable = false;
    let inBlockquote = false;

    const closeLists = () => {
      if (inUl) { html.push('</ul>'); inUl = false; }
      if (inOl) { html.push('</ol>'); inOl = false; }
    };
    const closeTable = () => {
      if (inTable) { html.push('</tbody></table>'); inTable = false; }
    };
    const closeQuote = () => {
      if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false; }
    };

    for (const raw of lines) {
      const line = raw.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        closeLists();
        closeQuote();
        continue;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        closeLists();
        closeQuote();
        const cells = trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
        if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
          continue;
        }
        if (!inTable) {
          html.push('<table><tbody>');
          inTable = true;
          html.push(`<tr>${cells.map((cell) => `<th>${this.inline(cell)}</th>`).join('')}</tr>`);
        } else {
          html.push(`<tr>${cells.map((cell) => `<td>${this.inline(cell)}</td>`).join('')}</tr>`);
        }
        continue;
      } else {
        closeTable();
      }

      if (trimmed.startsWith('> ')) {
        closeLists();
        if (!inBlockquote) {
          html.push('<blockquote>');
          inBlockquote = true;
        }
        html.push(`<p>${this.inline(trimmed.slice(2))}</p>`);
        continue;
      } else {
        closeQuote();
      }

      if (trimmed === '---') {
        closeLists();
        html.push('<hr />');
        continue;
      }

      if (trimmed.startsWith('### ')) {
        closeLists();
        html.push(`<h3>${this.inline(trimmed.slice(4))}</h3>`);
        continue;
      }
      if (trimmed.startsWith('## ')) {
        closeLists();
        html.push(`<h2>${this.inline(trimmed.slice(3))}</h2>`);
        continue;
      }
      if (trimmed.startsWith('# ')) {
        closeLists();
        html.push(`<h1>${this.inline(trimmed.slice(2))}</h1>`);
        continue;
      }

      const ulMatch = trimmed.match(/^[-*] (.+)$/);
      if (ulMatch) {
        closeTable();
        if (inOl) { html.push('</ol>'); inOl = false; }
        if (!inUl) { html.push('<ul>'); inUl = true; }
        html.push(`<li>${this.inline(ulMatch[1])}</li>`);
        continue;
      }

      const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        closeTable();
        if (inUl) { html.push('</ul>'); inUl = false; }
        if (!inOl) { html.push('<ol>'); inOl = true; }
        html.push(`<li>${this.inline(olMatch[1])}</li>`);
        continue;
      }

      closeLists();
      html.push(`<p>${this.inline(trimmed)}</p>`);
    }

    closeLists();
    closeTable();
    closeQuote();
    return html.join('\n');
  }

  private inline(text: string): string {
    return this.escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
