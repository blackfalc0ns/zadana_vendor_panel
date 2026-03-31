import { Component, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Zadna Vendor Panel';
  currentLang = 'ar';

  constructor(
    private readonly translate: TranslateService,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly renderer: Renderer2
  ) {
    const savedLang = localStorage.getItem('lang') || 'ar';

    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('ar');
    this.currentLang = savedLang;
    this.translate.use(savedLang);
    this.setDocumentDirection(savedLang);

    this.translate.onLangChange.subscribe((event) => {
      this.currentLang = event.lang;
      this.setDocumentDirection(event.lang);
      localStorage.setItem('lang', event.lang);
    });
  }

  switchLanguage(lang: 'ar' | 'en'): void {
    if (lang !== this.currentLang) {
      this.translate.use(lang);
    }
  }

  private setDocumentDirection(lang: string): void {
    const htmlTag = this.document.documentElement;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';

    this.renderer.setAttribute(htmlTag, 'dir', dir);
    this.renderer.setAttribute(htmlTag, 'lang', lang);
  }
}
