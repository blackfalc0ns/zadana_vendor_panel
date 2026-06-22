import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { buildLocalizedPageTitle } from '../utils/page-title-i18n.util';
import { resolveVendorPageTitleKey } from '../utils/vendor-page-title.config';

@Injectable({ providedIn: 'root' })
export class VendorPageTitleService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  private customTitleKey: string | null = null;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.customTitleKey = null;
        this.applyTitle();
      });

    this.translate.onLangChange.subscribe(() => this.applyTitle());
    this.translate.onTranslationChange.subscribe(() => this.applyTitle());
  }

  /** Override the tab title until the next navigation. */
  setTitleKey(titleKey: string | null): void {
    this.customTitleKey = titleKey;
    this.applyTitle();
  }

  private applyTitle(): void {
    const titleKey =
      this.customTitleKey ??
      this.resolveRouteTitleKey() ??
      resolveVendorPageTitleKey(this.router.url);

    this.translate
      .get([titleKey, 'PAGE_TITLES.BRAND', 'PAGE_TITLES.DEFAULT'])
      .subscribe((translations) => {
        const resolvedTitle = buildLocalizedPageTitle(titleKey, translations);
        if (!resolvedTitle) {
          return;
        }

        this.title.setTitle(resolvedTitle);
      });
  }

  private resolveRouteTitleKey(): string | null {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let titleKey: string | null = null;

    while (route?.firstChild) {
      route = route.firstChild;
      const routeTitleKey = route.data['titleKey'];
      if (typeof routeTitleKey === 'string' && routeTitleKey.trim()) {
        titleKey = routeTitleKey.trim();
      }
    }

    return titleKey;
  }
}
