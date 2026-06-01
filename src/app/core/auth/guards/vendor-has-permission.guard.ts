import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { VendorAccessService } from '../services/vendor-access.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorHasPermissionGuard {
  constructor(private accessService: VendorAccessService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const requiredPermission = route.data['permission'] as string | string[] | undefined;
    const matchMode = (route.data['permissionMatch'] as 'all' | 'any' | undefined) ?? 'any';

    if (!requiredPermission || (Array.isArray(requiredPermission) && requiredPermission.length === 0)) {
      return true;
    }

    const hasAccess = Array.isArray(requiredPermission)
      ? (matchMode === 'all'
          ? this.accessService.hasAllPermissions(requiredPermission)
          : this.accessService.hasAnyPermission(requiredPermission))
      : this.accessService.hasPermission(requiredPermission);

    if (hasAccess) {
      return true;
    }

    return this.router.createUrlTree(
      ['/profile'],
      {
        queryParams: {
          denied: '1',
          returnUrl: state.url
        }
      }
    );
  }
}
