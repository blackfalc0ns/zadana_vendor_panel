import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { VendorAccessService } from '../../core/auth/services/vendor-access.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appVendorHasPermission]',
  standalone: true
})
export class VendorHasPermissionDirective implements OnInit, OnDestroy {
  @Input('appVendorHasPermission') permission!: string;
  private subscription?: Subscription;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private accessService: VendorAccessService
  ) {}

  ngOnInit(): void {
    this.subscription = this.accessService.hasPermission$(this.permission).subscribe(hasPerm => {
      if (hasPerm && !this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      } else if (!hasPerm && this.hasView) {
        this.viewContainer.clear();
        this.hasView = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
