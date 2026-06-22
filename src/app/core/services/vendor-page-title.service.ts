import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, startWith, take } from 'rxjs';
import { resolveVendorPageTitleKey } from '../utils/vendor-page-title.config';

@Injectable({ providedIn: 'root' })
export class VendorPageTitleService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  private customTitleKey: string | null = null;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null)
      )
      .subscribe(() => {
        this.customTitleKey = null;
        this.applyTitle();
      });

    this.translate.onLangChange.subscribe(() => this.applyTitle());
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
      .pipe(take(1))
      .subscribe((translations) => {
        const pageTitle = translations[titleKey];
        const brand = translations['PAGE_TITLES.BRAND'];
        const fallback = translations['PAGE_TITLES.DEFAULT'];
        const resolvedPageTitle =
          pageTitle && pageTitle !== titleKey ? pageTitle : fallback;

        this.title.setTitle(`${resolvedPageTitle} | ${brand}`);
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
