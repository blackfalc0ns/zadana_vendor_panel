import { Injectable } from '@angular/core';
import { VendorAuthService } from './vendor-auth.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorAccessService {
  constructor(private authService: VendorAuthService) {}

  public get currentPermissions(): string[] {
    return this.authService.currentUserSnapshot?.access?.permissions || [];
  }

  public hasPermission(permission: string): boolean {
    const perms = this.currentPermissions;
    if (perms.includes('*')) return true;
    return perms.includes(permission);
  }

  public hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some(p => this.hasPermission(p));
  }

  public hasAllPermissions(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(p => this.hasPermission(p));
  }

  public hasScope(panelScope: string, scopeType?: string): boolean {
    const activeScope = this.authService.currentUserSnapshot?.access?.activeScope;
    if (!activeScope) return false;
    
    if (activeScope.panelScope !== panelScope) return false;
    if (scopeType && activeScope.scopeType !== scopeType) return false;
    
    return true;
  }
  
  public hasPermission$(permission: string): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      map(user => {
        const perms = user?.access?.permissions || [];
        if (perms.includes('*')) return true;
        return perms.includes(permission);
      })
    );
  }
}
